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

        // Get current enrollments with grades
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
            ->get();

        // Get recent grades
        $recentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program'])
            ->latest()
            ->limit(5)
            ->get();

        // Get payment status for current semester
        $currentYear = '2024-2025';
        $currentSemester = '1st';

        $paymentStatus = $student->studentSemesterPayments()
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->first();

        return Inertia::render('Student/Dashboard', [
            'student' => $student->load('user'),
            'enrollments' => $enrollments,
            'recentGrades' => $recentGrades,
            'paymentStatus' => $paymentStatus,
            'stats' => [
                'totalSubjects' => $enrollments->count(),
                'averageGrade' => $recentGrades->avg('semester_grade') ?? 0,
                'totalPaid' => $paymentStatus?->total_paid ?? 0,
                'balance' => $paymentStatus?->balance ?? 0,
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
            ],
        ]);
    }
}
