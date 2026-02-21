<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Models\ShsStudentPayment;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class CollegePaymentController extends Controller
{
    /**
     * Display college students payment dashboard.
     */
    public function index(): Response
    {
        // Get current academic year and semester
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        // Get filter parameters from request, defaulting to current values
        $filterAcademicYear = request('academic_year', $currentAcademicYear);
        $filterSemester = request('semester', $currentSemester);
        $filterStudentType = request('student_type', 'all');

        $query = StudentSemesterPayment::with(['student.user', 'student.program'])
            ->whereHas('student', function ($q) use ($filterStudentType) {
                $q->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $q->where('student_type', $filterStudentType);
                }
            })
            ->where('academic_year', $filterAcademicYear)
            ->where('semester', $filterSemester);

        $paymentService = app(\App\Services\StudentPaymentService::class);

        $payments = $query->get()
            ->map(function ($payment) use ($paymentService) {
                // Get the enrollment for this payment period to find section
                // Prefer enrollments that have sections (section_id is not null)
                $enrollment = StudentEnrollment::with(['section.program'])
                    ->where('student_id', $payment->student_id)
                    ->where('academic_year', $payment->academic_year)
                    ->where('semester', $payment->semester)
                    ->where('status', 'active')
                    ->orderByRaw('section_id IS NULL ASC')
                    ->first();

                $payment->section = $enrollment?->section;

                // if student is irregular or a transferee, make sure the stored
                // calculated total is up-to-date so the index can show it
                $student = $payment->student;
                $hasCreditTransfers = $student->creditTransfers()->exists() || (bool) $student->previous_school;

                if (($student->student_type === 'irregular' || $hasCreditTransfers) && ! $payment->is_balance_calculated) {
                    try {
                        $calc = $paymentService->calculateIrregularBalance($payment);
                        $payment->calculated_total_amount = $calc['calculated_balance'] ?? $payment->total_semester_fee;

                        // Apply calculated total as the effective semester fee, then
                        // recompute totals from transactions so the displayed balance
                        // reflects already-recorded payments.
                        $payment->total_semester_fee = $payment->calculated_total_amount;
                        $payment->total_paid = $payment->calculateTotalPaid();
                        $payment->balance = max(0, $payment->total_semester_fee - $payment->total_paid);
                    } catch (\Exception $e) {
                        // leave original values if calculation fails
                    }
                }

                // if we already have a calculated amount, use it for display and
                // ensure we deduct any completed transactions from the balance
                if ($payment->calculated_total_amount) {
                    $payment->total_semester_fee = $payment->calculated_total_amount;
                    $payment->total_paid = $payment->calculateTotalPaid();
                    $payment->balance = max(0, $payment->total_semester_fee - $payment->total_paid);
                }

                return $payment;
            });

        // Convert back to paginated format
        $perPage = 15;
        $currentPage = request()->get('page', 1);
        $currentPageItems = $payments->slice(($currentPage - 1) * $perPage, $perPage);
        $paginatedPayments = new \Illuminate\Pagination\LengthAwarePaginator(
            $currentPageItems->values(), // Convert to array and reindex
            $payments->count(),
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => 'page']
        );

        // Compute stats. Use the in-memory $payments collection for balance-related
        // statistics so any calculated totals for irregular/transferee students
        // (which are applied to the collection but not persisted) are reflected
        // accurately when viewing filtered results.
        $studentsWithBalanceCount = $payments->filter(function ($p) {
            return (float) ($p->balance ?? 0) > 0;
        })->count();

        $totalOutstandingBalance = $payments->reduce(function ($carry, $p) {
            return $carry + (float) ($p->balance ?? 0);
        }, 0);

        $stats = [
            'total_students' => Student::where('education_level', 'college')
                ->when($filterStudentType !== 'all', function ($query) use ($filterStudentType) {
                    $query->where('student_type', $filterStudentType);
                })
                ->count(),
            'students_not_enrolled' => Student::where('education_level', 'college')
                ->when($filterStudentType !== 'all', function ($query) use ($filterStudentType) {
                    $query->where('student_type', $filterStudentType);
                })
                ->whereDoesntHave('enrollments', function ($query) use ($filterAcademicYear, $filterSemester) {
                    $query->where('academic_year', $filterAcademicYear)
                        ->where('semester', $filterSemester)
                        ->where('status', 'active')
                        ->whereNotNull('section_id');
                })
                ->count(),
            'students_with_balance' => $studentsWithBalanceCount,
            'total_outstanding_balance' => $totalOutstandingBalance,
        ];

        // Generate academic years list (current and archived years only)
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $academicYears = StudentSemesterPayment::whereHas('student', function ($query) {
            $query->where('education_level', 'college');
        })
            ->distinct()
            ->pluck('academic_year')
            ->sort()
            ->values()
            ->toArray();

        // Ensure current academic year is included even if no payments exist yet
        if (! in_array($currentAcademicYear, $academicYears)) {
            $academicYears[] = $currentAcademicYear;
            sort($academicYears);
        }

        return Inertia::render('Registrar/Payments/College/Index', [
            'payments' => $paginatedPayments->toArray(),
            'stats' => $stats,
            'filters' => [
                'academic_year' => $filterAcademicYear,
                'semester' => $filterSemester,
                'student_type' => $filterStudentType,
            ],
            'currentAcademicYear' => $currentAcademicYear,
            'currentSemester' => $currentSemester,
            'academicYears' => $academicYears,
        ]);
    }

    /**
     * Show specific student's payment details.
     */
    public function show(Student $student): Response
    {
        $student->load(['user', 'program', 'creditTransfers']);

        if ($student->education_level === 'college') {
            $payments = StudentSemesterPayment::where('student_id', $student->id)
                ->with(['paymentTransactions' => function ($query) {
                    $query->orderBy('payment_date', 'desc');
                }])
                ->orderBy('created_at', 'desc')
                ->get();
        } elseif ($student->education_level === 'senior_high') {
            $payments = ShsStudentPayment::where('student_id', $student->id)
                ->orderBy('created_at', 'desc')
                ->get();
        } else {
            abort(404, 'Student education level not supported.');
        }

        // Pre-calculate irregular/transferee balances for display when applicable
        $hasCreditTransfers = $student->creditTransfers()->exists() || (bool) $student->previous_school;
        if ($student->student_type === 'irregular' || $hasCreditTransfers) {
            $paymentService = app(\App\Services\StudentPaymentService::class);
            foreach ($payments as $payment) {
                try {
                    $calc = $paymentService->calculateIrregularBalance($payment);
                    $payment->calculated_total_amount = $calc['calculated_balance'] ?? $payment->total_semester_fee;
                } catch (\Exception $e) {
                    $payment->calculated_total_amount = $payment->total_semester_fee;
                }
            }
        }

        return Inertia::render('Registrar/Payments/College/Show', [
            'student' => $student,
            'payments' => $payments,
        ]);
    }

    /**
     * Create new payment record for college student.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
            'payment_items' => 'required|array|min:1',
            'payment_items.*.item_name' => 'required|string',
            'payment_items.*.amount' => 'required|numeric|min:0',
            'payment_items.*.description' => 'nullable|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        if ($student->education_level !== 'college') {
            return back()->withErrors(['student_id' => 'Student must be enrolled in college.']);
        }

        // Calculate total due from payment items instead of manual input
        $totalDue = collect($validated['payment_items'])->sum('amount');

        $payment = StudentSemesterPayment::create([
            'student_id' => $validated['student_id'],
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'enrollment_fee' => 0, // Will be set based on payment items
            'total_semester_fee' => $totalDue,
            'total_paid' => 0,
            'balance' => $totalDue,
            'status' => 'pending',
            'payment_plan' => 'full',
        ]);

        // Remove PaymentItem creation as it doesn't exist in StudentSemesterPayment
        // $totalAmount = 0;
        // foreach ($validated['payment_items'] as $item) {
        //     PaymentItem::create([
        //         'payment_id' => $payment->id,
        //         'item_name' => $item['item_name'],
        //         'amount' => $item['amount'],
        //         'description' => $item['description'] ?? null,
        //     ]);
        //     $totalAmount += $item['amount'];
        // })

        return redirect()->route('registrar.payments.college.show', $student)
            ->with('success', 'Payment record created successfully.');
    }

    /**
     * Record payment for student.
     */
    public function recordPayment(Request $request, StudentSemesterPayment $payment)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'term' => 'required|string',
            'or_number' => 'required|string|max:50',
            'notes' => 'nullable|string',
        ]);

        // Check if payment is already fully paid (0 balance)
        if ($payment->balance <= 0) {
            return back()->withErrors(['amount_paid' => 'This student has already fully paid. No additional payment can be recorded.']);
        }

        if ($validated['amount_paid'] > $payment->balance) {
            return back()->withErrors(['amount_paid' => 'Payment amount cannot exceed remaining balance.']);
        }

        // Determine term fields
        $termPaidField = $validated['term'].'_paid';

        // Determine fee field for the term (enrollment uses 'enrollment_fee')
        $termFeeField = $validated['term'].'_amount';
        if ($validated['term'] === 'enrollment') {
            $termFeeField = 'enrollment_fee';
        }

        // Recalculate total paid for this term from transactions to avoid relying
        // on a potentially stale boolean flag. This ensures we compare against
        // the current term fee (which may have been recalculated for irregulars).
        $termTotalPaid = \App\Models\PaymentTransaction::where('payable_id', $payment->id)
            ->where('payable_type', \App\Models\StudentSemesterPayment::class)
            ->where('payment_type', $validated['term'] === 'enrollment' ? 'enrollment_fee' : ($validated['term'].'_payment'))
            ->where('status', 'completed')
            ->sum('amount');

        // Determine the nominal fee for this term. If the per-term fee field
        // is not defined (common for irregular/custom plans), fall back to
        // using the remaining balance as the effective term fee so checks
        // reflect actual outstanding amounts.
        $termFee = $payment->{$termFeeField} ?? 0;
        if ($termFee <= 0) {
            $effectiveTotal = $payment->calculated_total_amount ?? $payment->total_semester_fee;
            $alreadyPaid = $payment->paymentTransactions()->where('status', 'completed')->sum('amount');
            $termFee = max(0, $effectiveTotal - $alreadyPaid);
        }

        if ($termTotalPaid >= $termFee && $termFee > 0) {
            return back()->withErrors(['term' => 'This term has already been fully paid.']);
        }

        // Map term to payment_type enum value
        $paymentTypeMap = [
            'enrollment' => 'enrollment_fee',
            'prelim' => 'prelim_payment',
            'midterm' => 'midterm_payment',
            'prefinal' => 'prefinal_payment',
            'final' => 'final_payment',
        ];

        $paymentType = $paymentTypeMap[$validated['term']] ?? 'enrollment_fee';

        // Create PaymentTransaction record
        \App\Models\PaymentTransaction::create([
            'student_id' => $payment->student_id,
            'payable_type' => \App\Models\StudentSemesterPayment::class,
            'payable_id' => $payment->id,
            'amount' => $validated['amount_paid'],
            'payment_type' => $paymentType,
            'payment_method' => 'cash',
            'reference_number' => $validated['or_number'],
            'description' => ucfirst($validated['term']).' payment',
            'payment_date' => $validated['payment_date'],
            'status' => 'completed',
            'processed_by' => \Illuminate\Support\Facades\Auth::id(),
            'notes' => $validated['notes'],
        ]);

        // Update the corresponding term payment flag
        $termField = $validated['term'].'_paid';
        $termDateField = $validated['term'].'_payment_date';

        // Refresh and recalculate totals
        $payment->refresh();
        $payment->{$termDateField} = $validated['payment_date'];

        // Check if this term is now fully paid
        $termFeeField = $validated['term'].'_amount';
        if ($validated['term'] === 'enrollment') {
            $termFeeField = 'enrollment_fee';
        }

        // Get total paid for this specific term from transactions
        $termTotalPaid = \App\Models\PaymentTransaction::where('payable_id', $payment->id)
            ->where('payable_type', \App\Models\StudentSemesterPayment::class)
            ->where('payment_type', $paymentType)
            ->where('status', 'completed')
            ->sum('amount');

        // Only mark the specific term paid when that term has a defined fee
        // and the transactions for that term meet or exceed it. For custom
        ///irregular plans where per-term amounts are not defined, avoid
        // forcing term flags; overall balance/status will still be updated.
        $termFee = $payment->{$termFeeField} ?? 0;
        if ($termFee > 0 && $termTotalPaid >= $termFee) {
            $payment->{$termField} = true;
        }

        // update running totals and balance
        $payment->total_paid = ($payment->total_paid ?? 0) + $validated['amount_paid'];
        $payment->balance = max(0, ($payment->balance ?? 0) - $validated['amount_paid']);

        // adjust status based on remaining balance
        if ($payment->balance <= 0) {
            $payment->status = 'paid';
        } else {
            $payment->status = 'partial';
        }

        $payment->save();

        return back()->with('success', 'Payment of ₱'.number_format($validated['amount_paid'], 2).' recorded successfully. OR#: '.$validated['or_number']);
    }

    /**
     * Calculate irregular student balance with detailed breakdown.
     */
    public function calculateIrregularBalance(StudentSemesterPayment $payment)
    {
        try {
            $paymentService = app(\App\Services\StudentPaymentService::class);
            $calculation = $paymentService->calculateIrregularBalance($payment);

            // Update the payment record with calculated balance
            $payment->update([
                'total_semester_fee' => $calculation['calculated_balance'],
                'balance' => $calculation['calculated_balance'],
                'irregular_subject_fee' => 300.00,
                'irregular_subjects_count' => $calculation['past_year_subjects_count'],
            ]);

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
            Log::error('Error calculating irregular student balance: '.$e->getMessage(), [
                'payment_id' => $payment->id,
                'student_id' => $payment->student_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while calculating the balance: '.$e->getMessage(),
            ], 500);
        }
    }
}
