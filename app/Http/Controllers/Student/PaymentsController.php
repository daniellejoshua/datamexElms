<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Models\StudentSemesterPayment;
use App\Models\ShsStudentPayment;
use App\Services\StudentPaymentService;
use Illuminate\Http\Request;

class PaymentsController extends Controller
{
    public function index(Request $request): \Inertia\Response
    {
        $student = $request->user()->student;

        // Get current semester payment status
        $currentYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        if ($student->education_level === 'senior_high') {
            // Use SHS payments model for Senior High students (annual payments)
            $currentPayment = ShsStudentPayment::where('student_id', $student->id)
                ->where('academic_year', $currentYear)
                ->when($currentSemester !== '', function ($q) use ($currentSemester) {
                    // only apply semester when provided; SHS often uses 'annual'
                    return $q->where('semester', $currentSemester);
                })
                ->with('paymentTransactions')
                ->first();

            $paymentHistory = ShsStudentPayment::where('student_id', $student->id)
                ->with('paymentTransactions')
                ->orderBy('academic_year', 'desc')
                ->orderBy('semester', 'desc')
                ->get();
        } else {
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
        }

        // Calculate proper total amounts for irregular students
        $hasCreditTransfers = $student->creditTransfers()->exists() || (bool) $student->previous_school;

        $paymentHistory->transform(function ($payment) use ($student, $hasCreditTransfers) {
            // Compute a calculated total amount for irregular payments only when the
            // payment model matches `StudentSemesterPayment` — the service expects
            // that type. SHS uses `ShsStudentPayment` (annual) so skip the
            // irregular balance calculation for SHS payments.
            if ($payment instanceof StudentSemesterPayment && ($student->student_type === 'irregular' || $hasCreditTransfers)) {
                // Check if balance has already been calculated and stored
                if ($payment->is_balance_calculated && $payment->calculated_total_amount) {
                    // Use stored calculated amount
                    $payment->calculated_total_amount = $payment->calculated_total_amount;
                } else {
                    // Calculate balance and store it
                    try {
                        $paymentService = app(StudentPaymentService::class);
                        $calculation = $paymentService->calculateIrregularBalance($payment);
                        $payment->calculated_total_amount = $calculation['calculated_balance'] ?? $payment->total_semester_fee;
                    } catch (\Exception $e) {
                        $payment->calculated_total_amount = $payment->total_semester_fee;
                    }
                }
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

        try {
            // Check if balance has already been calculated and stored
            if ($payment->is_balance_calculated && $payment->irregular_balance_breakdown) {
                $breakdown = $payment->irregular_balance_breakdown;

                return response()->json([
                    'success' => true,
                    'calculated_balance' => $payment->calculated_total_amount,
                    'breakdown' => $breakdown['breakdown'] ?? '',
                    'details' => [
                        'past_year_subjects' => $breakdown['past_year_subjects'] ?? [],
                        'past_year_subjects_count' => $breakdown['past_year_subjects_count'] ?? 0,
                        'past_year_subjects_fee' => $breakdown['past_year_subjects_fee'] ?? 0,
                        'base_fee' => $breakdown['base_fee'] ?? 0,
                        'credited_subjects' => $breakdown['credited_subjects'] ?? [],
                        'credited_subjects_count' => $breakdown['credited_subjects_count'] ?? 0,
                        'credited_subjects_deduction' => $breakdown['credited_subjects_deduction'] ?? 0,
                        'current_year_level' => $breakdown['current_year_level'] ?? 0,
                    ],
                ]);
            }

            // Calculate balance if not stored
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
