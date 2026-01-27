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

        $payments = $query->get()
            ->map(function ($payment) {
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
            'students_with_balance' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })
                ->where('academic_year', $filterAcademicYear)
                ->where('semester', $filterSemester)
                ->where('balance', '>', 0)
                ->count(),
            'total_outstanding_balance' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })
                ->where('academic_year', $filterAcademicYear)
                ->where('semester', $filterSemester)
                ->sum('balance'),
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
        $student->load(['user', 'program']);

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
            'payment_type' => 'required|string',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'total_due' => 'required|numeric|min:0',
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

        $payment = StudentSemesterPayment::create([
            'student_id' => $validated['student_id'],
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'enrollment_fee' => $validated['payment_type'] === 'enrollment' ? $validated['total_due'] : 0,
            'total_semester_fee' => $validated['total_due'],
            'total_paid' => 0,
            'balance' => $validated['total_due'],
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

        // Check if the term is already fully paid
        $termPaidField = $validated['term'].'_paid';
        if ($payment->{$termPaidField}) {
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

        $termFee = $payment->{$termFeeField} ?? 0;
        if ($termTotalPaid >= $termFee) {
            $payment->{$termField} = true;
        }

        $payment->save();

        return back()->with('success', 'Payment of ₱'.number_format($validated['amount_paid'], 2).' recorded successfully. OR#: '.$validated['or_number']);
    }

    /**
     * Calculate irregular student balance with detailed breakdown.
     */
    public function calculateIrregularBalance(StudentSemesterPayment $payment)
    {
        // Check if student is irregular
        if ($payment->student->student_type !== 'irregular') {
            return response()->json([
                'success' => false,
                'message' => 'This calculation is only for irregular students.',
            ], 400);
        }

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
            \Log::error('Error calculating irregular student balance: '.$e->getMessage(), [
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
