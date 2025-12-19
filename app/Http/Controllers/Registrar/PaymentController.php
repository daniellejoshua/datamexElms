<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\Student;
use App\Models\StudentSemesterPayment;
use App\Services\StudentPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    protected $paymentService;

    public function __construct(StudentPaymentService $paymentService)
    {
        $this->paymentService = $paymentService;
    }

    /**
     * Display payment dashboard
     */
    public function index(Request $request): Response
    {
        $filters = $request->only(['search', 'status', 'academic_year', 'semester']);

        $payments = StudentSemesterPayment::with(['student.user'])
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->whereHas('student.user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                })->orWhereHas('student', function ($q) use ($search) {
                    $q->where('student_id', 'like', "%{$search}%");
                });
            })
            ->when($filters['status'] ?? null && ($filters['status'] !== 'all'), function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($filters['academic_year'] ?? null && ($filters['academic_year'] !== 'all'), function ($query, $year) {
                $query->where('academic_year', $year);
            })
            ->when($filters['semester'] ?? null && ($filters['semester'] !== 'all'), function ($query, $semester) {
                $query->where('semester', $semester);
            })
            ->orderBy('updated_at', 'desc')
            ->paginate(20)
            ->withQueryString();

        // Get statistics
        $stats = [
            'total_pending' => StudentSemesterPayment::where('status', 'pending')->count(),
            'total_partial' => StudentSemesterPayment::where('status', 'partial')->count(),
            'total_completed' => StudentSemesterPayment::where('status', 'completed')->count(),
            'total_overdue' => StudentSemesterPayment::where('status', 'overdue')->count(),
            'total_revenue' => StudentSemesterPayment::sum('total_paid'),
            'pending_balance' => StudentSemesterPayment::whereIn('status', ['pending', 'partial'])->sum('balance'),
        ];

        return Inertia::render('Registrar/Payments/Index', [
            'payments' => $payments,
            'filters' => $filters,
            'stats' => $stats,
        ]);
    }

    /**
     * Show payment details for a specific student
     */
    public function show(Student $student, Request $request): Response
    {
        $academicYear = $request->get('academic_year', '2024-2025');
        $semester = $request->get('semester', 'first');

        $paymentSummary = $this->paymentService->getPaymentSummary($student, $academicYear, $semester);

        $student->load(['user', 'program', 'studentEnrollments' => function ($query) use ($academicYear, $semester) {
            $query->where('academic_year', $academicYear)
                ->where('semester', $semester);
        }]);

        return Inertia::render('Registrar/Payments/Show', [
            'student' => $student,
            'paymentSummary' => $paymentSummary,
            'academicYear' => $academicYear,
            'semester' => $semester,
        ]);
    }

    /**
     * Create payment record for a student
     */
    public function create(Student $student): Response
    {
        $currentAcademicYear = '2024-2025'; // This should come from settings
        $currentSemester = 'first'; // This should come from settings

        $student->load(['user', 'program']);

        return Inertia::render('Registrar/Payments/Create', [
            'student' => $student,
            'academicYear' => $currentAcademicYear,
            'semester' => $currentSemester,
        ]);
    }

    /**
     * Store new payment record
     */
    public function store(Request $request, Student $student)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second',
            'base_semester_fee' => 'nullable|numeric|min:0',
            'enrollment_fee_percentage' => 'nullable|numeric|min:0|max:100',
            'irregular_subject_fee' => 'nullable|numeric|min:0',
        ]);

        $customRates = [];
        if ($validated['base_semester_fee']) {
            $customRates['base_semester_fee'] = $validated['base_semester_fee'];
        }
        if ($validated['enrollment_fee_percentage']) {
            $customRates['enrollment_fee_percentage'] = $validated['enrollment_fee_percentage'] / 100;
        }
        if ($validated['irregular_subject_fee']) {
            $customRates['irregular_subject_fee'] = $validated['irregular_subject_fee'];
        }

        $payment = $this->paymentService->createSemesterPayment(
            $student,
            $validated['academic_year'],
            $validated['semester'],
            $customRates
        );

        return redirect()->route('registrar.payments.show', [
            'student' => $student->id,
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
        ])->with('success', 'Payment record created successfully.');
    }

    /**
     * Process a payment
     */
    public function processPayment(Request $request, StudentSemesterPayment $payment)
    {
        $validated = $request->validate([
            'payment_type' => 'required|in:enrollment_fee,prelim_payment,midterm_payment,prefinal_payment,final_payment',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,check,bank_transfer,online,installment',
            'reference_number' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Validate payment amount
        $nextPayment = $payment->getNextPaymentDue();
        if (! $nextPayment || $nextPayment['type'] !== $validated['payment_type']) {
            return back()->withErrors(['payment_type' => 'Invalid payment type or payment already completed.']);
        }

        if ($validated['amount'] != $nextPayment['amount']) {
            return back()->withErrors(['amount' => "Amount must be exactly {$nextPayment['amount']}"]);
        }

        try {
            $transaction = $this->paymentService->processPayment(
                $payment,
                $validated['payment_type'],
                $validated['amount'],
                $validated['payment_method'],
                Auth::id(),
                [
                    'reference_number' => $validated['reference_number'],
                    'description' => $validated['description'],
                    'notes' => $validated['notes'],
                ]
            );

            return back()->with('success', 'Payment processed successfully. Reference: '.$transaction->reference_number);
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to process payment: '.$e->getMessage()]);
        }
    }

    /**
     * Get payment report
     */
    public function report(Request $request): Response
    {
        $filters = $request->only(['academic_year', 'semester', 'date_from', 'date_to']);

        $transactions = PaymentTransaction::with(['student.user'])
            ->where('status', 'completed')
            ->when($filters['academic_year'] ?? null, function ($query, $year) {
                $query->whereHas('payable', function ($q) use ($year) {
                    $q->where('academic_year', $year);
                });
            })
            ->when($filters['semester'] ?? null, function ($query, $semester) {
                $query->whereHas('payable', function ($q) use ($semester) {
                    $q->where('semester', $semester);
                });
            })
            ->when($filters['date_from'] ?? null, function ($query, $date) {
                $query->where('payment_date', '>=', $date);
            })
            ->when($filters['date_to'] ?? null, function ($query, $date) {
                $query->where('payment_date', '<=', $date);
            })
            ->orderBy('payment_date', 'desc')
            ->paginate(50)
            ->withQueryString();

        $summary = [
            'total_transactions' => $transactions->total(),
            'total_amount' => PaymentTransaction::where('status', 'completed')
                ->when($filters['academic_year'] ?? null, function ($query, $year) {
                    $query->whereHas('payable', function ($q) use ($year) {
                        $q->where('academic_year', $year);
                    });
                })
                ->when($filters['date_from'] ?? null, function ($query, $date) {
                    $query->where('payment_date', '>=', $date);
                })
                ->when($filters['date_to'] ?? null, function ($query, $date) {
                    $query->where('payment_date', '<=', $date);
                })
                ->sum('amount'),
        ];

        return Inertia::render('Registrar/Payments/Report', [
            'transactions' => $transactions,
            'filters' => $filters,
            'summary' => $summary,
        ]);
    }

    /**
     * Generate payment receipt
     */
    public function receipt(PaymentTransaction $transaction)
    {
        $transaction->load(['student.user', 'processedBy', 'payable']);

        return Inertia::render('Registrar/Payments/Receipt', [
            'transaction' => $transaction,
        ]);
    }
}
