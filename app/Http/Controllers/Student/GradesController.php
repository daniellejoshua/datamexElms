<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\StudentSemesterPayment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradesController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        // Get current payment status for the student
        $currentAcademicYear = \App\Helpers\AcademicHelper::getCurrentAcademicYear();
        $currentSemester = \App\Helpers\AcademicHelper::getCurrentSemester();

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

        return Inertia::render('Student/Grades/Index', [
            'currentGrades' => $currentGrades,
            'paymentStatus' => $paymentStatus,
            'stats' => [
                'totalSubjects' => $uniqueSubjects,
                'averageGrade' => $averageGrade,
                'gradedSubjects' => $gradedSubjects,
            ],
        ]);
    }
}
