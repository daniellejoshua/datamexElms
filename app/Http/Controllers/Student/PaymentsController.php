<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentsController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        // Get current semester payment status
        $currentYear = '2024-2025';
        $currentSemester = '1st';

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

        // Get all payment transactions
        $transactions = $student->paymentTransactions()
            ->with('payment')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('Student/Payments/Index', [
            'currentPayment' => $currentPayment,
            'paymentHistory' => $paymentHistory,
            'transactions' => $transactions,
            'stats' => [
                'totalPaid' => $currentPayment?->total_paid ?? 0,
                'balance' => $currentPayment?->balance ?? 0,
                'totalTransactions' => $transactions->total(),
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
            ],
        ]);
    }
}
