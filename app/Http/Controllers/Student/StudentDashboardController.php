<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Ensure student relationship is loaded
        if (! $user->student) {
            abort(404, 'Student profile not found');
        }

        $student = $user->student;

        // Get current academic year and semester from active enrollments
        $currentEnrollment = $student->studentEnrollments()
            ->where('status', 'active')
            ->whereNotNull('section_id')
            ->first();

        $currentYear = $currentEnrollment?->academic_year ?? '2025-2026';
        $currentSemester = $currentEnrollment?->semester ?? '1st';

        // Get current enrollments with grades and schedules - filter by current semester
        $enrollments = $student->studentEnrollments()
            ->with([
                'section.program',
                'section.subjects',
                'section.sectionSubjects.teacher.user' => function ($query) {
                    $query->select('id', 'name');
                },
                'section.sectionSubjects.subject',
            ])
            ->where('status', 'active')
            ->whereNotNull('section_id') // Only get enrollments with assigned sections
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->get();

        // Get subjects with grades (including incomplete ones) to determine which subjects the student is actually taking
        // For irregular students, only show current semester grades
        $studentGrades = $student->studentGrades()
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user', 'studentEnrollment.section.program'])
            ->whereHas('studentEnrollment', function ($query) use ($student, $currentYear, $currentSemester) {
                $query->where('student_id', $student->id)
                    ->where('status', 'active')
                    ->where('academic_year', $currentYear)
                    ->where('semester', $currentSemester);
            })
            ->get();

        // Group grades by subject to avoid duplicates
        $subjectGradesMap = [];
        foreach ($studentGrades as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subjectCode = $grade->sectionSubject->subject->subject_code;
                if (! isset($subjectGradesMap[$subjectCode])) {
                    $subjectGradesMap[$subjectCode] = $grade;
                }
            }
        }

        // Get today's schedule - different logic for regular vs irregular students
        $today = strtolower(now()->format('l')); // Get day name in lowercase (monday, tuesday, etc.)
        $todaySchedule = collect();

        if ($student->student_type === 'irregular') {
            // For irregular students: only show subjects where they have grades
            foreach ($subjectGradesMap as $subjectCode => $grade) {
                $sectionSubject = $grade->sectionSubject;
                $subject = $sectionSubject->subject;
                $enrollment = $grade->studentEnrollment;

                // Check if this subject is scheduled for today
                $scheduleDays = $sectionSubject->schedule_days;
                if ($scheduleDays && is_array($scheduleDays) && in_array($today, $scheduleDays)) {
                    $todaySchedule->push([
                        'id' => $sectionSubject->id,
                        'subject_name' => $subject->subject_name ?? 'Unknown Subject',
                        'subject_code' => $subject->subject_code ?? '',
                        'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                        'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                        'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                        'room' => $sectionSubject->room ?? 'TBA',
                        'section_name' => $enrollment->section->section_name ?? 'Unknown Section',
                    ]);
                }
            }
        } else {
            // For regular students: show all subjects in their enrolled sections
            foreach ($enrollments as $enrollment) {
                if ($enrollment->section && $enrollment->section->sectionSubjects) {
                    foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                        // Check if this subject is scheduled for today
                        $scheduleDays = $sectionSubject->schedule_days;
                        if ($scheduleDays && is_array($scheduleDays) && in_array($today, $scheduleDays)) {
                            $todaySchedule->push([
                                'id' => $sectionSubject->id,
                                'subject_name' => $sectionSubject->subject->subject_name ?? 'Unknown Subject',
                                'subject_code' => $sectionSubject->subject->subject_code ?? '',
                                'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                                'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                                'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                                'room' => $sectionSubject->room ?? 'TBA',
                                'section_name' => $enrollment->section->section_name,
                            ]);
                        }
                    }
                }
            }
        }

        // Sort today's schedule by start time
        $todaySchedule = $todaySchedule->sortBy('start_time');

        // Get current subjects - different logic for regular vs irregular students
        $currentSubjects = collect();

        if ($student->student_type === 'irregular') {
            // For irregular students: only show subjects where they have grades
            foreach ($subjectGradesMap as $subjectCode => $grade) {
                $sectionSubject = $grade->sectionSubject;
                $subject = $sectionSubject->subject;
                $enrollment = $grade->studentEnrollment;

                $currentSubjects->push([
                    'id' => $sectionSubject->id,
                    'subject_name' => $subject->subject_name ?? 'Unknown Subject',
                    'subject_code' => $subject->subject_code ?? '',
                    'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                    'room' => $sectionSubject->room ?? 'TBA',
                    'schedule_days' => $sectionSubject->schedule_days ?? [],
                    'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                    'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                    'section_name' => $enrollment->section->section_name ?? 'Unknown Section',
                    'program_name' => $enrollment->section->program->program_name ?? 'Unknown Program',
                    'section' => $enrollment->section,
                ]);
            }
        } else {
            // For regular students: show all subjects in their enrolled sections
            foreach ($enrollments as $enrollment) {
                if ($enrollment->section && $enrollment->section->sectionSubjects) {
                    foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                        $currentSubjects->push([
                            'id' => $sectionSubject->id,
                            'subject_name' => $sectionSubject->subject->subject_name ?? 'Unknown Subject',
                            'subject_code' => $sectionSubject->subject->subject_code ?? '',
                            'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                            'room' => $sectionSubject->room ?? 'TBA',
                            'schedule_days' => $sectionSubject->schedule_days ?? [],
                            'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                            'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                            'section_name' => $enrollment->section->section_name,
                            'program_name' => $enrollment->section->program->program_name ?? 'Unknown Program',
                            'section' => $enrollment->section,
                        ]);
                    }
                }
            }
        }
        $recentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program'])
            ->whereHas('studentEnrollment', function ($query) use ($student, $currentYear, $currentSemester) {
                $query->where('student_id', $student->id)
                    ->where('academic_year', $currentYear)
                    ->where('semester', $currentSemester);
            })
            ->latest()
            ->limit(5)
            ->get();

        // Get current academic year and semester from the first enrollment
        $currentYear = $enrollments->first()?->academic_year ?? '2025-2026';
        $currentSemester = $enrollments->first()?->semester ?? '1st';

        $paymentStatus = $student->studentSemesterPayments()
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->first();

        // Get payment transactions
        $paymentTransactions = $student->paymentTransactions()
            ->with(['processedBy'])
            ->latest()
            ->limit(10)
            ->get();

        // Calculate academic completion stats properly
        $curriculumSubjects = [];
        if ($student->curriculum_id) {
            $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                ->whereIn('semester', ['1st', '2nd'])
                ->get();
        }

        // Get all subject grades with details (completed and incomplete) - same logic as AcademicHistoryController
        $subjectGradesMap = [];
        $completedSubjects = [];

        // Get subjects with grades (including incomplete ones)
        $gradesQuery = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
            $query->where('student_id', $student->id);
        })
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
            ->get();

        foreach ($gradesQuery as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subject = $grade->sectionSubject->subject;
                $teacher = $grade->sectionSubject->teacher;

                // Skip if we already have this subject (keep the first/latest entry)
                if (isset($subjectGradesMap[$subject->subject_code])) {
                    continue;
                }

                $gradeInfo = [
                    'subject_id' => $subject->id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'type' => 'graded',
                    'final_grade' => $grade->final_grade,
                    'is_complete' => ! empty($grade->final_grade),
                ];

                $subjectGradesMap[$subject->subject_code] = $gradeInfo;

                // Add to completed if final grade exists
                if ($grade->final_grade) {
                    $completedSubjects[] = [
                        'subject_id' => $subject->id,
                        'subject_code' => $subject->subject_code,
                        'subject_name' => $subject->subject_name,
                        'type' => 'graded',
                    ];
                }
            }
        }

        // Get credited subjects (for transferees/shiftees) - from StudentSubjectCredit
        $creditedSubjects = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject', 'studentCreditTransfer'])
            ->get();

        foreach ($creditedSubjects as $credited) {
            if ($credited->subject) {
                // Skip if we already have this subject
                if (isset($subjectGradesMap[$credited->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $credited->subject->id,
                    'subject_code' => $credited->subject->subject_code,
                    'subject_name' => $credited->subject->subject_name,
                    'type' => 'credited',
                    'final_grade' => $credited->final_grade,
                    'credited_from' => $credited->studentCreditTransfer ? $credited->studentCreditTransfer->previous_school : null,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$credited->subject->subject_code] = $creditInfo;

                $completedSubjects[] = [
                    'subject_id' => $credited->subject->id,
                    'subject_code' => $credited->subject->subject_code,
                    'subject_name' => $credited->subject->subject_name,
                    'type' => 'credited',
                ];
            }
        }

        // Get credited subjects from StudentCreditTransfer (for credit transfers)
        $creditTransfers = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject'])
            ->get();

        foreach ($creditTransfers as $transfer) {
            if ($transfer->subject) {
                // Skip if we already have this subject
                if (isset($subjectGradesMap[$transfer->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $transfer->subject->id,
                    'subject_code' => $transfer->subject->subject_code,
                    'subject_name' => $transfer->subject->subject_name,
                    'type' => 'credited',
                    'final_grade' => $transfer->verified_semester_grade,
                    'credited_from' => $transfer->previous_school,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$transfer->subject->subject_code] = $creditInfo;

                $completedSubjects[] = [
                    'subject_id' => $transfer->subject->id,
                    'subject_code' => $transfer->subject->subject_code,
                    'subject_name' => $transfer->subject->subject_name,
                    'type' => 'credited',
                ];
            }
        }

        // Get enrolled subjects without grades (for current semester) - for irregular students
        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        $enrolledSubjects = \App\Models\StudentEnrollment::where('student_id', $student->id)
            ->where('status', 'active')
            ->whereHas('section', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester);
            })
            ->with(['section.sectionSubjects.subject'])
            ->get();

        foreach ($enrolledSubjects as $enrollment) {
            if ($enrollment->section && $enrollment->section->sectionSubjects) {
                foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                    if ($sectionSubject->subject) {
                        $subject = $sectionSubject->subject;

                        // Skip if we already have this subject in subjectGradesMap
                        if (isset($subjectGradesMap[$subject->subject_code])) {
                            continue;
                        }

                        // This is an enrolled subject without grades
                        $gradeInfo = [
                            'subject_id' => $subject->id,
                            'subject_code' => $subject->subject_code,
                            'subject_name' => $subject->subject_name,
                            'type' => 'enrolled',
                            'is_complete' => false,
                        ];

                        $subjectGradesMap[$subject->subject_code] = $gradeInfo;
                    }
                }
            }
        }

        // Calculate completion statistics properly
        // Use curriculum-based calculation for all students (same as AcademicHistoryController)
        $totalSubjects = count($curriculumSubjects);
        $completedCurriculumSubjects = 0;

        foreach ($curriculumSubjects as $curriculumSubject) {
            $subjectCode = $curriculumSubject->subject_code;
            $isCompleted = false;

            // Check if completed through grading
            foreach ($completedSubjects as $completed) {
                if ($completed['type'] === 'graded' &&
                    ($completed['subject_code'] === $subjectCode || $completed['subject_id'] == $curriculumSubject->subject_id)) {
                    $isCompleted = true;
                    break;
                }
            }

            // Check if completed through crediting (GPA 1.00-3.00 or percentage >= 75 or CR)
            if (! $isCompleted) {
                foreach ($subjectGradesMap as $grade) {
                    if ($grade['subject_code'] === $subjectCode && $grade['type'] === 'credited') {
                        $gradeValue = $grade['final_grade'];
                        $isTransfereeCredit = ! is_null($grade['credited_from']);
                        if (is_null($gradeValue) || $gradeValue === 'CR') {
                            // No grade = CR = passing
                            $isCompleted = true;
                        } elseif (is_numeric($gradeValue)) {
                            $numericGrade = (float) $gradeValue;
                            if ($isTransfereeCredit) {
                                // Transferee credits use GPA: 1.00-3.00 are passing
                                $isCompleted = $numericGrade <= 3.0;
                            } else {
                                // Regular credits use percentage: >= 75 is passing
                                $isCompleted = $numericGrade >= 75;
                            }
                        }
                        if ($isCompleted) {
                            break;
                        }
                    }
                }
            }

            if ($isCompleted) {
                $completedCurriculumSubjects++;
            }
        }

        $completionRate = $totalSubjects > 0 ? round(($completedCurriculumSubjects / $totalSubjects) * 100) : 0;

        return Inertia::render('Student/Dashboard', [
            'student' => $student->load(['user', 'program']),
            'enrollments' => $enrollments,
            'currentSubjects' => $currentSubjects,
            'recentGrades' => $recentGrades,
            'paymentStatus' => $paymentStatus,
            'paymentTransactions' => $paymentTransactions,
            'todaySchedule' => $todaySchedule,
            'currentSection' => $enrollments->first()?->section,
            'stats' => [
                'completedSubjects' => $completedCurriculumSubjects,
                'totalCurriculumSubjects' => $totalSubjects,
                'completionRate' => $completionRate,
                'totalPaid' => $paymentStatus?->total_paid ?? 0,
                'balance' => $paymentStatus?->balance ?? 0,
                'studentType' => $student->student_type,
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
                'today' => $today,
            ],
        ]);
    }
}
