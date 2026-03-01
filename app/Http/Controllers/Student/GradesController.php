<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentSemesterPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;use PDF; // dompdf facade

class GradesController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        // Get current payment status for the student
        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        $paymentStatus = StudentSemesterPayment::where('student_id', $student->id)
            ->where('academic_year', $currentAcademicYear)
            ->where('semester', $currentSemester)
            ->first();

        // Get current College grades from active enrollments
        $collegeGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program', 'sectionSubject.subject'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active')
                    ->whereHas('section', function ($sectionQuery) {
                        $sectionQuery->where('year_level', '<=', 4);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Get current SHS grades from active enrollments
        $shsGrades = $student->shsStudentGrades()
            ->with(['studentEnrollment.section.program', 'sectionSubject.subject'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active')
                    ->whereHas('section', function ($sectionQuery) {
                        $sectionQuery->whereIn('year_level', [11, 12]);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        // Combine and paginate grades
        $allGrades = collect();

        // Transform College grades
        foreach ($collegeGrades as $grade) {
            $allGrades->push([
                'id' => $grade->id,
                'type' => 'college',
                'student_enrollment_id' => $grade->student_enrollment_id,
                'section_subject_id' => $grade->section_subject_id,
                'prelim_grade' => $grade->prelim_grade,
                'midterm_grade' => $grade->midterm_grade,
                'prefinal_grade' => $grade->prefinal_grade,
                'final_grade' => $grade->final_grade,
                'semester_grade' => $grade->semester_grade,
                'overall_status' => $grade->overall_status,
                'studentEnrollment' => $grade->studentEnrollment,
                'sectionSubject' => $grade->sectionSubject,
            ]);
        }

        // Transform SHS grades
        foreach ($shsGrades as $grade) {
            $allGrades->push([
                'id' => $grade->id,
                'type' => 'shs',
                'student_enrollment_id' => $grade->student_enrollment_id,
                'section_subject_id' => $grade->section_subject_id,
                'q1_grade' => $grade->first_quarter_grade,
                'q2_grade' => $grade->second_quarter_grade,
                'final_grade' => $grade->final_grade,
                'completion_status' => $grade->completion_status,
                'studentEnrollment' => $grade->studentEnrollment,
                'sectionSubject' => $grade->sectionSubject,
            ]);
        }

        // Sort by creation date
        $currentGrades = $allGrades->sortByDesc('created_at');

        // Calculate stats based on unique subjects
        $uniqueSubjects = $allGrades->unique('section_subject_id')->count();
        $gradedSubjects = $allGrades->filter(function ($grade) {
            if ($grade['type'] === 'college') {
                return $grade['semester_grade'] || $grade['prelim_grade'] || $grade['midterm_grade'] || $grade['prefinal_grade'] || $grade['final_grade'];
            } elseif ($grade['type'] === 'shs') {
                return $grade['final_grade'] || $grade['q1_grade'] || $grade['q2_grade'];
            }

            return false;
        })->unique('section_subject_id')->count();

        // Calculate average grade from all available grades
        $allGradesArray = [];
        foreach ($allGrades as $grade) {
            if ($grade['type'] === 'college') {
                if ($grade['semester_grade'] && is_numeric($grade['semester_grade'])) {
                    $allGradesArray[] = (float) $grade['semester_grade'];
                }
                if ($grade['prelim_grade'] && is_numeric($grade['prelim_grade'])) {
                    $allGradesArray[] = (float) $grade['prelim_grade'];
                }
                if ($grade['midterm_grade'] && is_numeric($grade['midterm_grade'])) {
                    $allGradesArray[] = (float) $grade['midterm_grade'];
                }
                if ($grade['prefinal_grade'] && is_numeric($grade['prefinal_grade'])) {
                    $allGradesArray[] = (float) $grade['prefinal_grade'];
                }
                if ($grade['final_grade'] && is_numeric($grade['final_grade'])) {
                    $allGradesArray[] = (float) $grade['final_grade'];
                }
            } elseif ($grade['type'] === 'shs') {
                if ($grade['final_grade'] && is_numeric($grade['final_grade'])) {
                    $allGradesArray[] = (float) $grade['final_grade'];
                }
                if ($grade['q1_grade'] && is_numeric($grade['q1_grade'])) {
                    $allGradesArray[] = (float) $grade['q1_grade'];
                }
                if ($grade['q2_grade'] && is_numeric($grade['q2_grade'])) {
                    $allGradesArray[] = (float) $grade['q2_grade'];
                }
            }
        }
        $averageGrade = count($allGradesArray) > 0 ? array_sum($allGradesArray) / count($allGradesArray) : null;

        // Determine visible grade periods server-side (used by the frontend)
        $visiblePeriods = [
            'prelim' => false,
            'midterm' => false,
            'prefinal' => false,
            'final' => false,
            'semester' => false,
        ];

        if ($paymentStatus) {
            // Use flags to determine visibility; balance only affects semester when fully paid
            $prelim = (bool) $paymentStatus->prelim_paid;
            $midterm = (bool) $paymentStatus->midterm_paid;
            $prefinal = (bool) $paymentStatus->prefinal_paid;
            $final = (bool) $paymentStatus->final_paid;
            $balanceZero = (float) $paymentStatus->balance <= 0;

            // If balance is 0, show all grades including semester grade
            if ($balanceZero) {
                $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => true, 'semester' => true];
            } else {
                // precedence: a later paid term unlocks earlier ones
                if ($final) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => true, 'semester' => false];
                } elseif ($prefinal) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => false, 'semester' => false];
                } elseif ($midterm) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => false, 'final' => false, 'semester' => false];
                } elseif ($prelim) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => false, 'prefinal' => false, 'final' => false, 'semester' => false];
                }
            }
        }


        return Inertia::render('Student/Grades/Index', [
            'currentGrades' => $currentGrades,
            'paymentStatus' => $paymentStatus,
            'visibleGradePeriods' => $visiblePeriods,
            'stats' => [
                'totalSubjects' => $uniqueSubjects,
                'averageGrade' => $averageGrade,
                'gradedSubjects' => $gradedSubjects,
            ],
            // send academic period for header
            'academicYear' => $currentAcademicYear,
            'semester' => $currentSemester,
        ]);
    }

    public function exportPdf(Request $request)
    {
        $student = $request->user()->student;

        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        // reuse the same grade retrieval logic from index
        $collegeGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program', 'sectionSubject.subject'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active')
                    ->whereHas('section', function ($sectionQuery) {
                        $sectionQuery->where('year_level', '<=', 4);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $shsGrades = $student->shsStudentGrades()
            ->with(['studentEnrollment.section.program', 'sectionSubject.subject'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active')
                    ->whereHas('section', function ($sectionQuery) {
                        $sectionQuery->whereIn('year_level', [11, 12]);
                    });
            })
            ->orderBy('created_at', 'desc')
            ->get();

        $allGrades = collect();
        foreach ($collegeGrades as $grade) {
            $allGrades->push([
                'id' => $grade->id,
                'type' => 'college',
                'student_enrollment_id' => $grade->student_enrollment_id,
                'section_subject_id' => $grade->section_subject_id,
                'prelim_grade' => $grade->prelim_grade,
                'midterm_grade' => $grade->midterm_grade,
                'prefinal_grade' => $grade->prefinal_grade,
                'final_grade' => $grade->final_grade,
                'semester_grade' => $grade->semester_grade,
                'overall_status' => $grade->overall_status,
                'studentEnrollment' => $grade->studentEnrollment,
                'sectionSubject' => $grade->sectionSubject,
            ]);
        }
        foreach ($shsGrades as $grade) {
            $allGrades->push([
                'id' => $grade->id,
                'type' => 'shs',
                'student_enrollment_id' => $grade->student_enrollment_id,
                'section_subject_id' => $grade->section_subject_id,
                'q1_grade' => $grade->first_quarter_grade,
                'q2_grade' => $grade->second_quarter_grade,
                'final_grade' => $grade->final_grade,
                'completion_status' => $grade->completion_status,
                'studentEnrollment' => $grade->studentEnrollment,
                'sectionSubject' => $grade->sectionSubject,
            ]);
        }
        $currentGrades = $allGrades->sortByDesc('created_at');

        // determine visible periods based on payment status (same algorithm used in index)
        $visiblePeriods = [
            'prelim' => false,
            'midterm' => false,
            'prefinal' => false,
            'final' => false,
            'semester' => false,
        ];

        if ($paymentStatus = StudentSemesterPayment::where('student_id', $student->id)
            ->where('academic_year', $currentAcademicYear)
            ->where('semester', $currentSemester)
            ->first()) {
            $prelim = (bool) $paymentStatus->prelim_paid;
            $midterm = (bool) $paymentStatus->midterm_paid;
            $prefinal = (bool) $paymentStatus->prefinal_paid;
            $final = (bool) $paymentStatus->final_paid;

            if ($final) {
                $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => true, 'semester' => false];
            } elseif ($prefinal) {
                $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => false, 'semester' => false];
            } elseif ($midterm) {
                $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => false, 'final' => false, 'semester' => false];
            } elseif ($prelim) {
                $visiblePeriods = ['prelim' => true, 'midterm' => false, 'prefinal' => false, 'final' => false, 'semester' => false];
            }

            $allPaid = $prelim && $midterm && $prefinal && $final;
            $balanceZero = (float) $paymentStatus->balance <= 0;
            if ($allPaid && $balanceZero) {
                $visiblePeriods['semester'] = true;
            }
        }

        $data = [
            'grades' => $currentGrades,
            'student' => $student,
            'academicYear' => $currentAcademicYear,
            'semester' => $currentSemester,
            'generatedAt' => now('Asia/Manila')->format('F j, Y g:i A'),
            'visiblePeriods' => $visiblePeriods,
        ];

        $pdf = Pdf::loadView('pdf.student-grades', $data);

        return $pdf->download('grades-'.str_replace(' ', '-', $currentAcademicYear)."-{$currentSemester}-".now('Asia/Manila')->format('Y-m-d-H-i-s').'.pdf');
    }
}
