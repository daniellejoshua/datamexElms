<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Models\StudentSemesterPayment;
use App\Services\StudentPaymentService;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaymentsController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $student = $request->user()->student;

        // Get current semester payment status
        $currentYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $currentPayment = $student->studentSemesterPayments()
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->first();

        // Get payment history
        $paymentHistory = $student->studentSemesterPayments()
            ->with('paymentTransactions')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        // Calculate proper total amounts for irregular students
        $paymentHistory->transform(function ($payment) use ($student) {
            if ($student->student_type === 'irregular') {
                try {
                    $paymentService = app(StudentPaymentService::class);
                    $calculation = $paymentService->calculateIrregularBalance($payment);
                    $payment->calculated_total_amount = $calculation['calculated_balance'] ?? $payment->total_amount;
                } catch (\Exception $e) {
                    $payment->calculated_total_amount = $payment->total_amount;
                }
            } else {
                $payment->calculated_total_amount = $payment->total_amount;
            }
            return $payment;
        });

        return \Inertia\Inertia::render('Student/Payments/Index', [
            'currentPayment' => $currentPayment,
            'paymentHistory' => $paymentHistory,
            'stats' => [
                'totalPaid' => $currentPayment?->total_paid ?? 0,
                'balance' => $currentPayment?->balance ?? 0,
                'totalTransactions' => 0,
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
            ],
            'student' => $student->load('user', 'program'),
        ]);
    }

    public function calculateIrregularBalance(Request $request, StudentSemesterPayment $payment)
    {
        // Ensure the payment belongs to the authenticated student
        if ($payment->student_id !== $request->user()->student->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized access to payment calculation.',
            ], 403);
        }

        // Check if student is irregular
        if ($payment->student->student_type !== 'irregular') {
            return response()->json([
                'success' => false,
                'message' => 'This calculation is only for irregular students.',
            ], 400);
        }

        try {
            $paymentService = app(StudentPaymentService::class);
            $calculation = $paymentService->calculateIrregularBalance($payment);

            return response()->json([
                'success' => true,
                'calculated_balance' => $calculation['calculated_balance'],
                'breakdown' => $calculation['breakdown'],
                'details' => [
                    'past_year_subjects' => $calculation['past_year_subjects'],
                    'past_year_subjects_count' => $calculation['past_year_subjects_count'],
                    'past_year_subjects_fee' => $calculation['past_year_subjects_fee'],
                    'base_fee' => $calculation['base_fee'],
                    'credited_subjects' => $calculation['credited_subjects'],
                    'credited_subjects_count' => $calculation['credited_subjects_count'],
                    'credited_subjects_deduction' => $calculation['credited_subjects_deduction'],
                    'current_year_level' => $calculation['current_year_level'],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while calculating the balance: '.$e->getMessage(),
            ], 500);
        }
    }
}
