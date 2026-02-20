<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Inertia\Inertia;
use PDF;

class AcademicHistoryController extends Controller
{
    public function index()
    {
        $student = auth()->user()->student;

        if (! $student) {
            abort(404, 'Student record not found');
        }

        // Load student with necessary relationships
        $student->load(['user', 'program', 'curriculum']);

        // Get curriculum subjects
        $curriculumSubjects = [];
        if ($student->curriculum_id) {
            $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                ->orderBy('year_level')
                ->orderByRaw("FIELD(semester, '1st', '2nd', 'summer')")
                ->get();
        }

        // Get all subject grades with details (completed and incomplete)
        // Use associative array to prevent duplicates
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

                // Determine missing grades
                $missingGrades = [];
                if (is_null($grade->prelim_grade)) {
                    $missingGrades[] = 'Prelim';
                }
                if (is_null($grade->midterm_grade)) {
                    $missingGrades[] = 'Midterm';
                }
                if (is_null($grade->prefinal_grade)) {
                    $missingGrades[] = 'Prefinal';
                }
                if (is_null($grade->final_grade)) {
                    $missingGrades[] = 'Final';
                }

                $gradeInfo = [
                    'subject_id' => $subject->id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'type' => 'graded',
                    'teacher_name' => $teacher ? $teacher->user->name : null,
                    'prelim_grade' => $grade->prelim_grade,
                    'midterm_grade' => $grade->midterm_grade,
                    'prefinal_grade' => $grade->prefinal_grade,
                    'final_grade' => $grade->final_grade,
                    'semester_grade' => $grade->semester_grade,
                    'missing_grades' => $missingGrades,
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

        // Also get credited subjects from StudentCreditTransfer (for credit transfers)
        $creditTransfers = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject'])
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
                    'credit_type' => $credited->credit_type,
                    'final_grade' => $credited->final_grade,
                    'final_gpa' => \App\Helpers\AcademicHelper::convertToGPA($credited->final_grade),
                    'credited_from' => $credited->studentCreditTransfer ? $credited->studentCreditTransfer->previous_school : null,
                    'credited_at' => $credited->credited_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$credited->subject->subject_code] = $creditInfo;

                // Only add to completed subjects if grade is passing
                // GPA grades (1.00-3.00) for transferees, percentage (>=75) for regular students
                $gradeValue = $credited->final_grade;
                $isTransfereeCredit = $credited->studentCreditTransfer !== null;
                $isPassing = false;

                if (is_null($gradeValue) || $gradeValue === 'CR') {
                    // No grade = CR = passing
                    $isPassing = true;
                } elseif (is_numeric($gradeValue)) {
                    $numericGrade = (float) $gradeValue;
                    if ($isTransfereeCredit) {
                        // Transferee credits use GPA: 1.00-3.00 are passing
                        $isPassing = $numericGrade <= 3.0;
                    } else {
                        // Regular credits use percentage: >= 75 is passing
                        $isPassing = $numericGrade >= 75;
                    }
                }

                if ($isPassing) {
                    $completedSubjects[] = [
                        'subject_id' => $credited->subject->id,
                        'subject_code' => $credited->subject->subject_code,
                        'subject_name' => $credited->subject->subject_name,
                        'type' => 'credited',
                    ];
                }
            }
        }

        // Process credit transfers
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
                    'credit_type' => $transfer->transfer_type,
                    'final_grade' => $transfer->verified_semester_grade,
                    'final_gpa' => \App\Helpers\AcademicHelper::convertToGPA($transfer->verified_semester_grade),
                    'credited_from' => $transfer->previous_school,
                    'credited_at' => $transfer->approved_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$transfer->subject->subject_code] = $creditInfo;

                // Only add to completed subjects if grade is passing
                // Credit transfers are always from transferees, so use GPA logic (1.00-3.00 passing)
                $gradeValue = $transfer->verified_semester_grade;
                $isPassing = false;
                if (is_null($gradeValue) || $gradeValue === 'CR') {
                    // No grade = CR = passing
                    $isPassing = true;
                } elseif (is_numeric($gradeValue)) {
                    $numericGrade = (float) $gradeValue;
                    // GPA format: 1.00-3.00 are passing
                    $isPassing = $numericGrade <= 3.0;
                }

                if ($isPassing) {
                    $completedSubjects[] = [
                        'subject_id' => $transfer->subject->id,
                        'subject_code' => $transfer->subject->subject_code,
                        'subject_name' => $transfer->subject->subject_name,
                        'type' => 'credited',
                    ];
                }
            }
        }


        // Get enrolled subjects without grades (for current semester)
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
                        // Determine missing grades based on education level
                        $isSHS = $student->current_year_level >= 11 && $student->current_year_level <= 12;
                        $missingGrades = $isSHS ? ['Q1', 'Q2'] : ['Prelim', 'Midterm', 'Prefinal', 'Final'];

                        $gradeInfo = [
                            'subject_id' => $subject->id,
                            'subject_code' => $subject->subject_code,
                            'subject_name' => $subject->subject_name,
                            'type' => 'enrolled',
                            'teacher_name' => $sectionSubject->teacher ? $sectionSubject->teacher->user->name : null,
                            'missing_grades' => $missingGrades,
                            'is_complete' => false,
                        ];

                        $subjectGradesMap[$subject->subject_code] = $gradeInfo;
                    }
                }
            }
        }

        // Calculate completion statistics properly
        // Only count curriculum subjects that have been completed
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

        $completionPercentage = $totalSubjects > 0 ? round(($completedCurriculumSubjects / $totalSubjects) * 100) : 0;

        // Convert map to array
        $subjectGrades = array_values($subjectGradesMap);

        // Separate credited subjects for pagination
        $creditedSubjectsOnly = array_filter($subjectGrades, function ($grade) {
            return $grade['type'] === 'credited';
        });

        // Get archived enrollments and annotate missing grade components
        $archivedEnrollments = \App\Models\ArchivedStudentEnrollment::where('student_id', $student->id)
            ->with('archivedSection.program')
            ->orderBy('academic_year', 'desc')
            ->orderByRaw("FIELD(semester, 'second', 'first', 'summer')")
            ->get()
            ->map(function ($arch) {
                $finals = $arch->final_grades ?? [];
                $missing = [];
                foreach (['prelim', 'midterm', 'prefinals', 'finals'] as $p) {
                    if (empty($finals[$p])) {
                        $missing[] = ucfirst($p);
                    }
                }
                $arch->missing_grades = $missing;
                return $arch;
            });

        // add placeholder entries for enrollments with missing grades
        foreach ($archivedEnrollments as $arch) {
            if ($arch->final_status === 'completed') {
                $key = "archived_{$arch->id}";
                if (! isset($subjectGradesMap[$key])) {
                    $finals = $arch->final_grades ?? [];
                    $missing = [];
                    foreach (['prelim', 'midterm', 'prefinals', 'finals'] as $p) {
                        if (empty($finals[$p])) {
                            $missing[] = ucfirst($p);
                        }
                    }

                    $subjectGradesMap[$key] = [
                        'subject_code' => 'ARCHIVED',
                        'subject_name' => 'Archived Enrollment',
                        'type' => 'archived',
                        'final_grades' => $finals,
                        'final_semester_grade' => $arch->final_semester_grade,
                        'final_status' => $arch->final_status,
                        'missing_grades' => $missing,
                        'is_complete' => empty($missing),
                    ];
                }
            }
        }

        $inertiaData = [
            'student' => $student,
            'curriculumSubjects' => $curriculumSubjects,
            'completedSubjects' => $completedSubjects,
            'subjectGrades' => $subjectGrades,
            'creditedSubjects' => $creditedSubjectsOnly,
            'completionStats' => [
                'totalSubjects' => $totalSubjects,
                'completedSubjects' => $completedCurriculumSubjects,
                'completionPercentage' => $completionPercentage,
            ],
        ];

        // Return Inertia page
        $response = Inertia::render('Student/AcademicHistory', $inertiaData);

        // Also attach an export route for convenience (client-side link will hit this)
        $inertiaData['exportRoute'] = route('student.academic-history.export');

        // Keep returning the Inertia response (client will receive data)
        // but we'll also add a separate exportPdf() method below for PDF generation.
        return $response;
    }

    /**
     * Export the student's academic history as PDF.
     */
    public function exportPdf()
    {
        $student = auth()->user()->student;

        if (! $student) {
            abort(404, 'Student record not found');
        }

        // Reuse the same data-gathering logic from index()
        $student->load(['user', 'program', 'curriculum']);

        $curriculumSubjects = [];
        if ($student->curriculum_id) {
            $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                ->orderBy('year_level')
                ->orderByRaw("FIELD(semester, '1st', '2nd', 'summer')")
                ->get();
        }

        // Build subject grades map (same as index)
        $subjectGradesMap = [];
        $completedSubjects = [];

        $gradesQuery = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
            $query->where('student_id', $student->id);
        })
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
            ->get();

        foreach ($gradesQuery as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subject = $grade->sectionSubject->subject;
                $teacher = $grade->sectionSubject->teacher;

                if (isset($subjectGradesMap[$subject->subject_code])) {
                    continue;
                }

                $missingGrades = [];
                if (is_null($grade->prelim_grade)) { $missingGrades[] = 'Prelim'; }
                if (is_null($grade->midterm_grade)) { $missingGrades[] = 'Midterm'; }
                if (is_null($grade->prefinal_grade)) { $missingGrades[] = 'Prefinal'; }
                if (is_null($grade->final_grade)) { $missingGrades[] = 'Final'; }

                $gradeInfo = [
                    'subject_id' => $subject->id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'type' => 'graded',
                    'teacher_name' => $teacher ? $teacher->user->name : null,
                    'prelim_grade' => $grade->prelim_grade,
                    'midterm_grade' => $grade->midterm_grade,
                    'prefinal_grade' => $grade->prefinal_grade,
                    'final_grade' => $grade->final_grade,
                    'semester_grade' => $grade->semester_grade,
                    'missing_grades' => $missingGrades,
                    'is_complete' => ! empty($grade->final_grade),
                ];

                $subjectGradesMap[$subject->subject_code] = $gradeInfo;

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

        // Credited subjects (StudentSubjectCredit + StudentCreditTransfer)
        $creditedSubjects = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject', 'studentCreditTransfer'])
            ->get();

        $creditTransfers = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject'])
            ->get();

        foreach ($creditedSubjects as $credited) {
            if ($credited->subject) {
                if (isset($subjectGradesMap[$credited->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $credited->subject->id,
                    'subject_code' => $credited->subject->subject_code,
                    'subject_name' => $credited->subject->subject_name,
                    'type' => 'credited',
                    'credit_type' => $credited->credit_type,
                    'final_grade' => $credited->final_grade,
                    'final_gpa' => \App\Helpers\AcademicHelper::convertToGPA($credited->final_grade),
                    'credited_from' => $credited->studentCreditTransfer ? $credited->studentCreditTransfer->previous_school : null,
                    'credited_at' => $credited->credited_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$credited->subject->subject_code] = $creditInfo;
            }
        }

        foreach ($creditTransfers as $transfer) {
            if ($transfer->subject) {
                if (isset($subjectGradesMap[$transfer->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $transfer->subject->id,
                    'subject_code' => $transfer->subject->subject_code,
                    'subject_name' => $transfer->subject->subject_name,
                    'type' => 'credited',
                    'credit_type' => $transfer->transfer_type,
                    'final_grade' => $transfer->verified_semester_grade,
                    'final_gpa' => \App\Helpers\AcademicHelper::convertToGPA($transfer->verified_semester_grade),
                    'credited_from' => $transfer->previous_school,
                    'credited_at' => $transfer->approved_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$transfer->subject->subject_code] = $creditInfo;
            }
        }

        // Enrolled subjects without grades (current semester)
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
                        if (isset($subjectGradesMap[$subject->subject_code])) {
                            continue;
                        }

                        $isSHS = $student->current_year_level >= 11 && $student->current_year_level <= 12;
                        $missingGrades = $isSHS ? ['Q1', 'Q2'] : ['Prelim', 'Midterm', 'Prefinal', 'Final'];

                        $gradeInfo = [
                            'subject_id' => $subject->id,
                            'subject_code' => $subject->subject_code,
                            'subject_name' => $subject->subject_name,
                            'type' => 'enrolled',
                            'teacher_name' => $sectionSubject->teacher ? $sectionSubject->teacher->user->name : null,
                            'missing_grades' => $missingGrades,
                            'is_complete' => false,
                        ];

                        $subjectGradesMap[$subject->subject_code] = $gradeInfo;
                    }
                }
            }
        }

        $subjectGrades = array_values($subjectGradesMap);

        $totalSubjects = count($curriculumSubjects);
        $completedCurriculumSubjects = 0;
        foreach ($curriculumSubjects as $curriculumSubject) {
            $subjectCode = $curriculumSubject->subject_code;
            $isCompleted = false;

            foreach ($completedSubjects as $completed) {
                if ($completed['type'] === 'graded' && ($completed['subject_code'] === $subjectCode || $completed['subject_id'] == $curriculumSubject->subject_id)) {
                    $isCompleted = true;
                    break;
                }
            }

            if (! $isCompleted) {
                foreach ($subjectGradesMap as $grade) {
                    if ($grade['subject_code'] === $subjectCode && $grade['type'] === 'credited') {
                        $gradeValue = $grade['final_grade'];
                        $isTransfereeCredit = ! is_null($grade['credited_from']);
                        if (is_null($gradeValue) || $gradeValue === 'CR') {
                            $isCompleted = true;
                        } elseif (is_numeric($gradeValue)) {
                            $numericGrade = (float) $gradeValue;
                            if ($isTransfereeCredit) {
                                $isCompleted = $numericGrade <= 3.0;
                            } else {
                                $isCompleted = $numericGrade >= 75;
                            }
                        }
                        if ($isCompleted) break;
                    }
                }
            }

            if ($isCompleted) $completedCurriculumSubjects++;
        }

        $completionPercentage = $totalSubjects > 0 ? round(($completedCurriculumSubjects / $totalSubjects) * 100) : 0;

        $data = [
            'student' => $student,
            'curriculumSubjects' => $curriculumSubjects,
            'subjectGrades' => $subjectGrades,
            'creditedSubjects' => $creditedSubjects,
            'completionStats' => [
                'totalSubjects' => $totalSubjects,
                'completedSubjects' => $completedCurriculumSubjects,
                'completionPercentage' => $completionPercentage,
            ],
        ];

        $pdf = Pdf::loadView('pdf.academic-history', $data);

        return $pdf->download('academic-history-'.str_replace(' ', '-', $student->user->name).'-'.now('Asia/Manila')->format('Y-m-d-H-i-s').'.pdf');
    }
}

