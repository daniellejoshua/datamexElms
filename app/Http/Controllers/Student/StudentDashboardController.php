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
        $currentYear = '2024-2025';
        $currentSemester = '1st';

        // Get current enrollments with grades
        $enrollments = $student->studentEnrollments()
            ->with(['section.program', 'section.subjects', 'section.sectionSubjects.teacher.user'])
            ->where('status', 'active')
            ->get();

        // Get recent grades
        $recentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program'])
            ->latest()
            ->limit(5)
            ->get();

        // Get payment status for current semester
        $paymentStatus = null;
        $paymentSummary = [
            'total_due' => 0,
            'total_paid' => 0,
            'balance' => 0,
            'paid_periods' => [],
            'unpaid_periods' => [],
        ];

        if ($student->education_level === 'shs') {
            $paymentStatus = $student->shsPayments()
                ->where('academic_year', $currentYear)
                ->where('semester', $currentSemester)
                ->first();
        } else {
            $paymentStatus = $student->semesterPayments()
                ->where('academic_year', $currentYear)
                ->where('semester', $currentSemester)
                ->first();
        }

        if ($paymentStatus) {
            if ($student->education_level === 'shs') {
                $paymentSummary = [
                    'total_due' => $paymentStatus->total_semester_fee ?? 0,
                    'total_paid' => $paymentStatus->total_paid ?? 0,
                    'balance' => $paymentStatus->balance ?? 0,
                    'paid_periods' => [
                        $paymentStatus->first_quarter_paid ? '1st Quarter' : null,
                        $paymentStatus->second_quarter_paid ? '2nd Quarter' : null,
                        $paymentStatus->third_quarter_paid ? '3rd Quarter' : null,
                        $paymentStatus->fourth_quarter_paid ? '4th Quarter' : null,
                    ],
                    'unpaid_periods' => [
                        !$paymentStatus->first_quarter_paid ? '1st Quarter' : null,
                        !$paymentStatus->second_quarter_paid ? '2nd Quarter' : null,
                        !$paymentStatus->third_quarter_paid ? '3rd Quarter' : null,
                        !$paymentStatus->fourth_quarter_paid ? '4th Quarter' : null,
                    ],
                ];
            } else {
                $paymentSummary = [
                    'total_due' => $paymentStatus->total_semester_fee ?? 0,
                    'total_paid' => $paymentStatus->total_paid ?? 0,
                    'balance' => $paymentStatus->balance ?? 0,
                    'paid_periods' => [
                        $paymentStatus->prelim_paid ? 'Prelim' : null,
                        $paymentStatus->midterm_paid ? 'Midterm' : null,
                        $paymentStatus->prefinal_paid ? 'Prefinal' : null,
                        $paymentStatus->final_paid ? 'Final' : null,
                    ],
                    'unpaid_periods' => [
                        !$paymentStatus->prelim_paid ? 'Prelim' : null,
                        !$paymentStatus->midterm_paid ? 'Midterm' : null,
                        !$paymentStatus->prefinal_paid ? 'Prefinal' : null,
                        !$paymentStatus->final_paid ? 'Final' : null,
                    ],
                ];
            }
            
            // Filter out null values
            $paymentSummary['paid_periods'] = array_filter($paymentSummary['paid_periods']);
            $paymentSummary['unpaid_periods'] = array_filter($paymentSummary['unpaid_periods']);
        }

        return Inertia::render('Student/Dashboard', [
            'student' => $student->load('user'),
            'enrollments' => $enrollments,
            'recentGrades' => $recentGrades,
            'paymentSummary' => $paymentSummary,
            'stats' => [
                'totalSubjects' => $enrollments->count(),
                'averageGrade' => $recentGrades->avg('semester_grade') ?? 0,
                'totalPaid' => $paymentSummary['total_paid'] ?? 0,
                'balance' => $paymentSummary['balance'] ?? 0,
                'paidPeriods' => count($paymentSummary['paid_periods'] ?? []),
                'unpaidPeriods' => count($paymentSummary['unpaid_periods'] ?? []),
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
            ],
        ]);
    }
}
