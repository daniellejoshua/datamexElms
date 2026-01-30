<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class GradesController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        // Get current grades from active enrollments
        $currentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program', 'sectionSubject.subject'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(3);

        // Calculate stats based on unique subjects
        $uniqueSubjects = $currentGrades->unique('section_subject_id')->count();
        $gradedSubjects = $currentGrades->filter(function ($grade) {
            return $grade->semester_grade || $grade->prelim_grade || $grade->midterm_grade || $grade->prefinal_grade || $grade->final_grade;
        })->unique('section_subject_id')->count();

        // Calculate average grade from all available grades
        $allGrades = [];
        foreach ($currentGrades as $grade) {
            if ($grade->semester_grade && is_numeric($grade->semester_grade)) {
                $allGrades[] = (float) $grade->semester_grade;
            }
            if ($grade->prelim_grade && is_numeric($grade->prelim_grade)) {
                $allGrades[] = (float) $grade->prelim_grade;
            }
            if ($grade->midterm_grade && is_numeric($grade->midterm_grade)) {
                $allGrades[] = (float) $grade->midterm_grade;
            }
            if ($grade->prefinal_grade && is_numeric($grade->prefinal_grade)) {
                $allGrades[] = (float) $grade->prefinal_grade;
            }
            if ($grade->final_grade && is_numeric($grade->final_grade)) {
                $allGrades[] = (float) $grade->final_grade;
            }
        }
        $averageGrade = count($allGrades) > 0 ? array_sum($allGrades) / count($allGrades) : null;

        return Inertia::render('Student/Grades/Index', [
            'currentGrades' => $currentGrades,
            'stats' => [
                'totalSubjects' => $uniqueSubjects,
                'averageGrade' => $averageGrade,
                'gradedSubjects' => $gradedSubjects,
            ],
        ]);
    }
}
