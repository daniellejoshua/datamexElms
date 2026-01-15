<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ArchivedSection;
use App\Models\ArchivedStudent;
use App\Models\ArchivedStudentEnrollment;
use App\Models\PaymentTransaction;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSemesterPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(): Response
    {
        $archivedSections = ArchivedSection::query()
            ->with(['archivedBy:id,name'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->paginate(20);

        $academicYears = ArchivedSection::query()
            ->selectRaw('academic_year, COUNT(*) as sections_count')
            ->groupBy('academic_year')
            ->orderBy('academic_year', 'desc')
            ->get();

        // Compute unpaid students for the current academic period
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $semesterVariants = [
            $currentSemester,
            match ($currentSemester) {
                '1st' => 'first',
                '2nd' => 'second',
                default => $currentSemester,
            },
        ];

        $unpaidStudents = StudentSemesterPayment::with(['student.user'])
            ->where('academic_year', $currentAcademicYear)
            ->where(function ($q) use ($semesterVariants) {
                $q->whereIn('semester', $semesterVariants);
            })
            ->where('balance', '>', 0)
            ->get()
            ->map(function ($payment) {
                $transactions = PaymentTransaction::where('student_id', $payment->student_id)
                    ->where('payable_type', StudentSemesterPayment::class)
                    ->where('payable_id', $payment->id)
                    ->orderBy('payment_date', 'desc')
                    ->get();

                return [
                    'id' => $payment->student->id,
                    'name' => $payment->student->user->name,
                    'student_number' => $payment->student->student_number,
                    'academic_year' => $payment->academic_year,
                    'semester' => $payment->semester,
                    'balance' => $payment->balance,
                    'payments' => $transactions->map(function ($transaction) {
                        return [
                            'id' => $transaction->id,
                            'amount' => $transaction->amount,
                            'payment_date' => $transaction->payment_date,
                            'reference_number' => $transaction->reference_number,
                            'notes' => $transaction->notes,
                        ];
                    }),
                ];
            });

        $unpaidCount = $unpaidStudents->count();

        return Inertia::render('Admin/AcademicYear/Index', [
            'archivedSections' => $archivedSections,
            'academicYears' => $academicYears,
            'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
            'currentSemester' => SchoolSetting::getCurrentSemester(),
            'unpaid_count' => $unpaidCount,
            'unpaid_students' => $unpaidStudents,
        ]);
    }

    protected function getCurrentSemester(): string
    {
        return SchoolSetting::getCurrentSemester();
    }

    public function validateArchive(Request $request)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
        ]);

        $semesterToCheck = match ($validated['semester']) {
            '1st' => ['1st', 'first'],
            '2nd' => ['2nd', 'second'],
            default => [$validated['semester']],
        };

        // Check if already archived
        $alreadyArchived = ArchivedSection::where('academic_year', $validated['academic_year'])
            ->where('semester', match ($validated['semester']) {
                '1st' => 'first',
                '2nd' => 'second',
                'summer' => 'summer',
            })
            ->exists();

        // Get sections to be archived
        $sections = Section::with([
            'subjects',
            'studentEnrollments.student.user',
            'sectionSubjects.subject',
            'sectionSubjects.teacher.user',
            'program',
        ])
            ->where('academic_year', $validated['academic_year'])
            ->where(function ($q) use ($semesterToCheck) {
                $q->whereIn('semester', $semesterToCheck);
            })
            ->where('status', '!=', 'archived')
            ->get();

        $totalSections = $sections->count();
        $totalStudents = 0;
        $studentsWithIncompleteGrades = [];
        $sectionsWithIncompleteGrades = [];
        $studentsWithPaymentIssues = [];
        $sectionStats = [];

        foreach ($sections as $section) {
            $enrollments = $section->studentEnrollments;
            $sectionStudentCount = $enrollments->count();
            $totalStudents += $sectionStudentCount;

            $incompleteGradesCount = 0;
            $completedGradesCount = 0;
            $averageGrade = 0;
            $gradeSum = 0;
            $gradeCount = 0;

            foreach ($sections as $section) {
                $enrollments = $section->studentEnrollments;
                $sectionStudentCount = $enrollments->count();
                $totalStudents += $sectionStudentCount;

                $incompleteGradesCount = 0;
                $completedGradesCount = 0;
                $averageGrade = 0;
                $gradeSum = 0;
                $gradeCount = 0;
                $sectionIncompleteDetails = [];

                foreach ($enrollments as $enrollment) {
                    // Check grades for each subject in this section
                    $enrollmentIncompleteSubjects = [];

                    foreach ($section->sectionSubjects as $sectionSubject) {
                        $grade = StudentGrade::where('student_enrollment_id', $enrollment->id)
                            ->where('section_subject_id', $sectionSubject->id)
                            ->first();

                        $incompleteTerms = [];

                        if (! $grade) {
                            $incompleteTerms = ['prelim', 'midterm', 'prefinal', 'final'];
                        } else {
                            if ($grade->prelim_grade === null) {
                                $incompleteTerms[] = 'prelim';
                            }
                            if ($grade->midterm_grade === null) {
                                $incompleteTerms[] = 'midterm';
                            }
                            if ($grade->prefinal_grade === null) {
                                $incompleteTerms[] = 'prefinal';
                            }
                            if ($grade->final_grade === null) {
                                $incompleteTerms[] = 'final';
                            }
                        }

                        if (! empty($incompleteTerms)) {
                            $incompleteGradesCount++;
                            $enrollmentIncompleteSubjects[] = [
                                'subject_code' => $sectionSubject->subject->subject_code ?? 'Unknown',
                                'subject_name' => $sectionSubject->subject->subject_name ?? 'Unknown Subject',
                                'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'Unassigned',
                                'teacher_id' => $sectionSubject->teacher_id,
                                'incomplete_terms' => $incompleteTerms,
                            ];
                        } else {
                            $completedGradesCount++;
                            $gradeSum += $grade->final_grade ?? 0;
                            $gradeCount++;
                        }
                    }

                    // If this student has incomplete subjects, add to the lists
                    if (! empty($enrollmentIncompleteSubjects)) {
                        $studentsWithIncompleteGrades[] = [
                            'id' => $enrollment->student->id,
                            'name' => $enrollment->student->user->name,
                            'student_number' => $enrollment->student->student_number,
                            'section' => $section->formatted_name,
                            'year_level' => $section->year_level,
                            'incomplete_subjects' => $enrollmentIncompleteSubjects,
                        ];

                        $sectionIncompleteDetails[] = [
                            'student_id' => $enrollment->student->id,
                            'student_name' => $enrollment->student->user->name,
                            'student_number' => $enrollment->student->student_number,
                            'incomplete_subjects' => $enrollmentIncompleteSubjects,
                        ];
                    }
                }

                if ($incompleteGradesCount > 0) {
                    $sectionsWithIncompleteGrades[] = [
                        'id' => $section->id,
                        'name' => $section->formatted_name,
                        'year_level' => $section->year_level,
                        'incomplete_count' => $incompleteGradesCount,
                        'total_students' => $sectionStudentCount,
                        'incomplete_details' => $sectionIncompleteDetails,
                    ];
                }

                $sectionStats[] = [
                    'id' => $section->id,
                    'name' => $section->formatted_name,
                    'year_level' => $section->year_level,
                    'total_students' => $sectionStudentCount,
                    'completed_grades' => $completedGradesCount,
                    'incomplete_grades' => $incompleteGradesCount,
                    'average_grade' => $gradeCount > 0 ? round($gradeSum / $gradeCount, 2) : 0,
                ];
            }
        }

        // Get payment issues
        $unpaidPayments = StudentSemesterPayment::with('student.user')
            ->where('academic_year', $validated['academic_year'])
            ->where(function ($q) use ($semesterToCheck) {
                $q->whereIn('semester', $semesterToCheck);
            })
            ->where('balance', '>', 0)
            ->get();

        foreach ($unpaidPayments as $payment) {
            $studentsWithPaymentIssues[] = [
                'id' => $payment->student->id,
                'name' => $payment->student->user->name,
                'student_number' => $payment->student->student_number,
                'balance' => $payment->balance,
                'total_fee' => $payment->total_fee,
                'amount_paid' => $payment->amount_paid,
            ];
        }

        // Get irregular students who might be promoted
        $irregularStudents = Student::with('user')
            ->where('student_type', 'irregular')
            ->get();

        $eligibleForRegular = [];
        $regularityCheckService = new \App\Services\StudentRegularityCheckService;

        foreach ($irregularStudents as $student) {
            $details = $regularityCheckService->getIrregularityDetails($student);
            if ($details['can_become_regular']) {
                $eligibleForRegular[] = [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'student_number' => $student->student_number,
                    'year_level' => $student->year_level,
                    'reason' => $details['message'],
                ];
            }
        }

        // Compile validation summary
        $validation = [
            'is_valid' => ! $alreadyArchived && $totalSections > 0,
            'already_archived' => $alreadyArchived,
            'total_sections' => $totalSections,
            'total_students' => $totalStudents,
            'incomplete_grades_count' => count($studentsWithIncompleteGrades),
            'students_with_incomplete_grades' => array_slice($studentsWithIncompleteGrades, 0, 20), // Limit to 20 for UI
            'sections_with_incomplete_grades' => $sectionsWithIncompleteGrades,
            'payment_issues_count' => count($studentsWithPaymentIssues),
            'students_with_payment_issues' => $studentsWithPaymentIssues,
            'eligible_for_regular_count' => count($eligibleForRegular),
            'eligible_for_regular' => $eligibleForRegular,
            'section_statistics' => $sectionStats,
            'warnings' => [],
            'errors' => [],
        ];

        // Add warnings
        if ($alreadyArchived) {
            $validation['errors'][] = 'This semester has already been archived.';
        }

        if ($totalSections === 0) {
            $validation['errors'][] = 'No active sections found for this academic period.';
        }

        if (count($studentsWithIncompleteGrades) > 0) {
            $validation['warnings'][] = count($studentsWithIncompleteGrades).' students have incomplete grades. Their grades will be recorded as incomplete.';
        }

        if (count($studentsWithPaymentIssues) > 0) {
            $validation['warnings'][] = count($studentsWithPaymentIssues).' students have outstanding balances. They will be placed on hold.';
        }

        if (count($eligibleForRegular) > 0) {
            $validation['warnings'][] = count($eligibleForRegular).' irregular students will be automatically promoted to regular status.';
        }

        return response()->json($validation);
    }

    public function archiveSemester(Request $request)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
            'archive_notes' => 'nullable|string|max:1000',
            'force' => 'boolean',
            'password' => 'required|string',
        ]);

        // Password confirmation
        if (! Hash::check($validated['password'], $request->user()->password)) {
            return redirect()->back()->withErrors(['password' => 'Password confirmation failed.']);
        }

        // Check if semester is already archived
        $archivedSemester = match ($validated['semester']) {
            '1st' => 'first',
            '2nd' => 'second',
            'summer' => 'summer',
        };
        $existing = ArchivedSection::where('academic_year', $validated['academic_year'])
            ->where('semester', $archivedSemester)
            ->exists();

        if ($existing) {
            return redirect()->back()->withErrors(['error' => 'This semester has already been archived.']);
        }

        // Check for unpaid students for this academic period
        $semesterToCheck = match ($validated['semester']) {
            '1st' => ['1st', 'first'],
            '2nd' => ['2nd', 'second'],
            default => [$validated['semester']],
        };

        $unpaidCount = StudentSemesterPayment::where('academic_year', $validated['academic_year'])
            ->where(function ($q) use ($semesterToCheck) {
                $q->whereIn('semester', $semesterToCheck);
            })
            ->where('balance', '>', 0)
            ->count();

        if ($unpaidCount > 0 && empty($validated['force'])) {
            return redirect()->back()->withErrors(['error' => "There are {$unpaidCount} students with outstanding balances. Resolve them or check 'Force' to continue."]);
        }

        // Count active sections that will be archived
        $sectionsToArchive = Section::where('academic_year', $validated['academic_year'])
            ->where(function ($q) use ($semesterToCheck) {
                $q->whereIn('semester', $semesterToCheck);
            })
            ->where('status', '!=', 'archived')
            ->count();

        if ($sectionsToArchive === 0) {
            return redirect()->back()->withErrors(['error' => 'No active sections found for this academic period.']);
        }

        $archiveResults = [
            'sections_archived' => 0,
            'students_affected' => 0,
            'students_completed' => 0,
            'students_dropped' => 0,
            'incomplete_grades' => 0,
            'payment_holds_applied' => 0,
            'regularity_promotions' => 0,
            'average_section_grade' => 0,
            'archived_sections' => [],
            'promoted_students' => [],
            'held_students' => [],
        ];

        DB::transaction(function () use ($validated, $semesterToCheck, &$archiveResults) {
            // Archive sections/enrollments first (creates archive records)
            $archiveStats = $this->archiveSemesterSections(
                $validated['academic_year'],
                $validated['semester'],
                $validated['archive_notes'] ?? null
            );

            $archiveResults['sections_archived'] = $archiveStats['sections_count'];
            $archiveResults['students_affected'] = $archiveStats['students_count'];
            $archiveResults['students_completed'] = $archiveStats['completed_count'];
            $archiveResults['students_dropped'] = $archiveStats['dropped_count'];
            $archiveResults['incomplete_grades'] = $archiveStats['incomplete_grades'];
            $archiveResults['average_section_grade'] = $archiveStats['average_grade'];
            $archiveResults['archived_sections'] = $archiveStats['section_details'];

            // Mark students on hold based on outstanding balances
            $payments = StudentSemesterPayment::with('student.user')
                ->where('academic_year', $validated['academic_year'])
                ->where(function ($q) use ($semesterToCheck) {
                    $q->whereIn('semester', $semesterToCheck);
                })
                ->where('balance', '>', 0)
                ->get();

            foreach ($payments as $payment) {
                $student = Student::find($payment->student_id);
                if ($student) {
                    $student->update([
                        'is_on_hold' => true,
                        'hold_balance' => $payment->balance,
                        'hold_reason' => 'Outstanding balance for '.$validated['academic_year'].' '.$validated['semester'],
                    ]);

                    $archiveResults['held_students'][] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'student_number' => $student->student_number,
                        'balance' => $payment->balance,
                    ];
                }
            }

            $archiveResults['payment_holds_applied'] = count($archiveResults['held_students']);

            // IMPORTANT: We now keep the original data for historical reference
            // Only mark sections as archived instead of deleting them
            // This preserves the ability to query historical data without relying solely on archive tables

            // Mark sections as archived (non-destructive)
            Section::where('academic_year', $validated['academic_year'])
                ->where(function ($q) use ($semesterToCheck) {
                    $q->whereIn('semester', $semesterToCheck);
                })
                ->update(['status' => 'archived']);

            // Mark enrollments as completed (non-destructive)
            StudentEnrollment::where('academic_year', $validated['academic_year'])
                ->where(function ($q) use ($semesterToCheck) {
                    $q->whereIn('semester', $semesterToCheck);
                })
                ->where('status', 'active')
                ->update([
                    'status' => 'completed',
                    'completion_date' => now(),
                ]);
        });

        // Check all irregular students to see if they can become regular
        $regularityCheckService = new \App\Services\StudentRegularityCheckService;
        $regularityResults = $regularityCheckService->checkAllIrregularStudents();

        $archiveResults['regularity_promotions'] = $regularityResults['promoted_count'];
        $archiveResults['promoted_students'] = $regularityResults['promoted_students'] ?? [];

        // Advance to next semester/academic year
        $this->advanceAcademicPeriod($validated['academic_year'], $validated['semester']);

        return redirect()->route('admin.academic-years.index')->with([
            'success' => 'Semester archived successfully!',
            'archive_results' => $archiveResults,
        ]);
    }

    protected function archiveSemesterSections(string $academicYear, string $semester, ?string $notes): array
    {
        // Convert semester format for querying
        $semesterVariants = match ($semester) {
            '1st' => ['1st', 'first'],
            '2nd' => ['2nd', 'second'],
            'summer' => ['summer'],
            default => [$semester],
        };

        // Get all active sections for this academic period
        $sections = Section::with(['subjects', 'studentEnrollments.student.user', 'program', 'curriculum'])
            ->where('academic_year', $academicYear)
            ->where(function ($q) use ($semesterVariants) {
                $q->whereIn('semester', $semesterVariants);
            })
            ->where('status', '!=', 'archived')
            ->get();

        if ($sections->isEmpty()) {
            return [
                'sections_count' => 0,
                'students_count' => 0,
                'completed_count' => 0,
                'dropped_count' => 0,
                'incomplete_grades' => 0,
                'average_grade' => 0,
                'section_details' => [],
            ];
        }

        $archivedStudentIds = [];
        $archivedCount = 0;
        $totalCompletedStudents = 0;
        $totalDroppedStudents = 0;
        $totalIncompleteGrades = 0;
        $totalGradeSum = 0;
        $totalGradeCount = 0;
        $sectionDetails = [];

        foreach ($sections as $section) {
            $enrollments = $section->studentEnrollments;

            // Skip sections with no enrollments
            if ($enrollments->isEmpty()) {
                continue;
            }

            // Collect student IDs for tracking
            foreach ($enrollments as $enrollment) {
                $archivedStudentIds[] = $enrollment->student_id;
            }

            // Calculate section statistics
            $completedCount = $enrollments->where('status', 'active')->count();
            $droppedCount = $enrollments->where('status', 'dropped')->count();

            $totalCompletedStudents += $completedCount;
            $totalDroppedStudents += $droppedCount;

            // Calculate average grade
            $averageGrade = null;
            $gradeSum = 0;
            $gradeCount = 0;
            $incompleteGradeCount = 0;

            foreach ($enrollments as $enrollment) {
                $grade = StudentGrade::where('student_enrollment_id', $enrollment->id)->first();
                if ($grade && $grade->final_grade) {
                    $gradeSum += $grade->final_grade;
                    $gradeCount++;
                    $totalGradeSum += $grade->final_grade;
                    $totalGradeCount++;
                } else {
                    $incompleteGradeCount++;
                    $totalIncompleteGrades++;
                }
            }

            if ($gradeCount > 0) {
                $averageGrade = round($gradeSum / $gradeCount, 2);
            }

            $sectionDetails[] = [
                'section_name' => $section->section_name,
                'year_level' => $section->year_level,
                'total_students' => $enrollments->count(),
                'completed' => $completedCount,
                'dropped' => $droppedCount,
                'average_grade' => $averageGrade,
                'incomplete_grades' => $incompleteGradeCount,
            ];

            // Create archived section record
            $archivedSection = ArchivedSection::create([
                'original_section_id' => $section->id,
                'program_id' => $section->program_id,
                'curriculum_id' => $section->curriculum_id,
                'year_level' => $section->year_level,
                'section_name' => $section->section_name,
                'academic_year' => $academicYear,
                'semester' => match ($semester) {
                    '1st' => 'first',
                    '2nd' => 'second',
                    'summer' => 'summer',
                },
                'room' => ($section->subjects->first()?->pivot->room) ?? null,
                'status' => 'completed',
                'course_data' => $section->subjects->map(function ($subject) {
                    return [
                        'id' => $subject->id,
                        'course_code' => $subject->subject_code,
                        'subject_name' => $subject->subject_name,
                        'credits' => $subject->units,
                    ];
                })->toArray(),
                'total_enrolled_students' => $enrollments->count(),
                'completed_students' => $completedCount,
                'dropped_students' => $droppedCount,
                'section_average_grade' => $averageGrade,
                'archived_at' => now(),
                'archived_by' => Auth::id(),
                'archive_notes' => $notes,
            ]);

            // Archive each student enrollment
            foreach ($enrollments as $enrollment) {
                $finalGrade = StudentGrade::where('student_enrollment_id', $enrollment->id)->first();

                ArchivedStudentEnrollment::create([
                    'archived_section_id' => $archivedSection->id,
                    'student_id' => $enrollment->student_id,
                    'original_enrollment_id' => $enrollment->id,
                    'academic_year' => $academicYear,
                    'semester' => match ($semester) {
                        '1st' => 'first',
                        '2nd' => 'second',
                        'summer' => 'summer',
                    },
                    'enrolled_date' => $enrollment->enrollment_date,
                    'completion_date' => now()->toDateString(),
                    'final_status' => $enrollment->status === 'active' ? 'completed' : $enrollment->status,
                    'final_grades' => $finalGrade ? [
                        'midterm' => $finalGrade->midterm_grade,
                        'final' => $finalGrade->final_grade,
                        'overall' => $finalGrade->final_grade,
                    ] : null,
                    'final_semester_grade' => $finalGrade?->final_grade,
                    'letter_grade' => $this->calculateLetterGrade($finalGrade?->final_grade),
                    'student_data' => [
                        'name' => $enrollment->student->user->name,
                        'student_number' => $enrollment->student->student_number,
                        'email' => $enrollment->student->user->email,
                        'year_level_at_completion' => $enrollment->student->year_level,
                    ],
                ]);
            }

            $archivedCount++;
        }

        // Log the archiving summary
        Log::info("Archived {$archivedCount} sections for {$academicYear} {$semester}", [
            'student_count' => count(array_unique($archivedStudentIds)),
            'archived_by' => Auth::id(),
        ]);

        return [
            'sections_count' => $archivedCount,
            'students_count' => count(array_unique($archivedStudentIds)),
            'completed_count' => $totalCompletedStudents,
            'dropped_count' => $totalDroppedStudents,
            'incomplete_grades' => $totalIncompleteGrades,
            'average_grade' => $totalGradeCount > 0 ? round($totalGradeSum / $totalGradeCount, 2) : 0,
            'section_details' => $sectionDetails,
        ];
    }

    // protected function archiveSemesterStudents(array $studentIds, string $academicYear, string $semester, ?string $notes): void
    // {
    //     $students = \App\Models\Student::with('user', 'program')->whereIn('id', $studentIds)->get();

    //     foreach ($students as $student) {
    //         // Check if student is already archived for this period
    //         $existing = ArchivedStudent::where('original_student_id', $student->id)
    //             ->where('academic_year', $academicYear)
    //             ->where('semester', $semester)
    //             ->exists();

    //         if ($existing) {
    //             continue;
    //         }

    //         ArchivedStudent::create([
    //             'original_student_id' => $student->id,
    //             'user_id' => $student->user_id,
    //             'program_id' => $student->program_id,
    //             'student_number' => $student->student_number,
    //             'first_name' => $student->first_name,
    //             'last_name' => $student->last_name,
    //             'middle_name' => $student->middle_name,
    //             'birth_date' => $student->birth_date,
    //             'address' => $student->address,
    //             'phone' => $student->phone,
    //             'year_level' => $student->year_level,
    //             'program' => $student->program,
    //             'parent_contact' => $student->parent_contact,
    //             'student_type' => $student->student_type,
    //             'education_level' => $student->education_level,
    //             'track' => $student->track,
    //             'strand' => $student->strand,
    //             'status' => $student->status,
    //             'enrolled_date' => $student->enrolled_date,
    //             'academic_year' => $academicYear,
    //             'semester' => $semester,
    //             'archived_at' => now(),
    //             'archived_by' => Auth::id(),
    //             'archive_notes' => $notes,
    //             'student_data' => $student->toArray(),
    //         ]);

    //         // Delete the original student
    //         $student->delete();
    //     }
    // }

    protected function calculateLetterGrade(?float $grade): ?string
    {
        if ($grade === null) {
            return null;
        }

        if ($grade >= 97) {
            return 'A+';
        }
        if ($grade >= 93) {
            return 'A';
        }
        if ($grade >= 90) {
            return 'A-';
        }
        if ($grade >= 87) {
            return 'B+';
        }
        if ($grade >= 83) {
            return 'B';
        }
        if ($grade >= 80) {
            return 'B-';
        }
        if ($grade >= 77) {
            return 'C+';
        }
        if ($grade >= 73) {
            return 'C';
        }
        if ($grade >= 70) {
            return 'C-';
        }
        if ($grade >= 67) {
            return 'D+';
        }
        if ($grade >= 65) {
            return 'D';
        }

        return 'F';
    }

    protected function getCurrentAcademicYear(): string
    {
        $currentYear = date('Y');
        $currentMonth = date('n');

        // Academic year typically starts in June/July
        if ($currentMonth >= 6) {
            return $currentYear.'-'.($currentYear + 1);
        } else {
            return ($currentYear - 1).'-'.$currentYear;
        }
    }

    /**
     * Advance to the next academic period after archiving.
     */
    protected function advanceAcademicPeriod(string $academicYear, string $semester): void
    {
        $nextAcademicYear = $academicYear;
        $nextSemester = '';

        switch ($semester) {
            case '1st':
                $nextSemester = '2nd';
                break;
            case '2nd':
                // Move to next academic year, skip summer
                [$startYear, $endYear] = explode('-', $academicYear);
                $nextAcademicYear = $endYear.'-'.($endYear + 1);
                $nextSemester = '1st';
                break;
        }

        // Update the current academic period in settings
        SchoolSetting::setCurrentAcademicPeriod($nextAcademicYear, $nextSemester);
    }

    public function show(ArchivedSection $archivedSection): Response
    {
        $archivedSection->load([
            'archivedEnrollments.student.user',
            'archivedBy:id,name',
        ]);

        return Inertia::render('Admin/AcademicYear/Show', [
            'archivedSection' => $archivedSection,
        ]);
    }
}
