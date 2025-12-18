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
            ->with(['studentEnrollment.section.program', 'studentEnrollment.section.subjects'])
            ->whereHas('studentEnrollment', function ($query) {
                $query->where('status', 'active');
            })
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        // Get recent grades summary
        $recentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program'])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Student/Grades/Index', [
            'currentGrades' => $currentGrades,
            'recentGrades' => $recentGrades,
            'stats' => [
                'totalSubjects' => $currentGrades->count(),
                'averageGrade' => $recentGrades->avg('semester_grade') ?? 0,
            ],
        ]);
    }
}
