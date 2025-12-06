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

class StudentPaymentController extends Controller
{
    public function __construct(
        protected StudentPaymentService $paymentService
    ) {}

    /**
     * Display a listing of students and their payment status
     */
    public function index(Request $request): Response
    {
        $search = $request->get('search');
        $academicYear = $request->get('academic_year', '2025-2026');
        $semester = $request->get('semester', 'first');
        $paymentStatus = $request->get('payment_status');

        $students = Student::with([
            'user',
            'program',
            'studentSemesterPayments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester);
            },
        ])
            ->when($search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhere('student_number', 'like', "%{$search}%");
            })
            ->when($paymentStatus, function ($query, $status) use ($academicYear, $semester) {
                $query->whereHas('studentSemesterPayments', function ($q) use ($status, $academicYear, $semester) {
                    $q->where('academic_year', $academicYear)
                        ->where('semester', $semester)
                        ->where('status', $status);
                });
            })
            ->paginate(20)
            ->withQueryString();

        // Add payment status to each student
        $students->getCollection()->transform(function ($student) {
            $payment = $student->studentSemesterPayments->first();
            $student->payment_status = $payment ? $payment->status : 'no_record';
            $student->payment_progress = $payment ? $payment->getPaymentProgress() : 0;
            $student->next_payment = $payment ? $payment->getNextPaymentDue() : null;

            return $student;
        });

        return Inertia::render('Registrar/Students/PaymentIndex', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'payment_status' => $paymentStatus,
            ],
            'paymentStatuses' => [
                'pending' => 'Pending',
                'partial' => 'Partially Paid',
                'completed' => 'Completed',
                'overdue' => 'Overdue',
            ],
        ]);
    }

    /**
     * Show student payment details
     */
    public function show(Student $student, Request $request): Response
    {
        $academicYear = $request->get('academic_year', '2025-2026');
        $semester = $request->get('semester', 'first');

        $student->load([
            'user',
            'program',
            'studentSemesterPayments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)->where('semester', $semester);
            },
            'paymentTransactions' => function ($query) use ($academicYear, $semester) {
                $query->whereHas('payable', function ($q) use ($academicYear, $semester) {
                    $q->where('academic_year', $academicYear)->where('semester', $semester);
                })->with('processedBy');
            },
            'studentSubjectEnrollments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->with('sectionSubject.subject');
            },
        ]);

        $paymentSummary = $this->paymentService->getPaymentSummary($student, $academicYear, $semester);

        return Inertia::render('Registrar/Students/PaymentDetails', [
            'student' => $student,
            'paymentSummary' => $paymentSummary,
            'academicYear' => $academicYear,
            'semester' => $semester,
        ]);
    }

    /**
     * Create payment record for student
     */
    public function store(Request $request, Student $student)
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second',
            'base_semester_fee' => 'nullable|numeric|min:0',
            'enrollment_fee_percentage' => 'nullable|numeric|between:0,1',
            'irregular_subject_fee' => 'nullable|numeric|min:0',
        ]);

        $customRates = [];
        if ($validated['base_semester_fee'] ?? null) {
            $customRates['base_semester_fee'] = $validated['base_semester_fee'];
        }
        if ($validated['enrollment_fee_percentage'] ?? null) {
            $customRates['enrollment_fee_percentage'] = $validated['enrollment_fee_percentage'];
        }
        if ($validated['irregular_subject_fee'] ?? null) {
            $customRates['irregular_subject_fee'] = $validated['irregular_subject_fee'];
        }

        $semesterPayment = $this->paymentService->createSemesterPayment(
            $student,
            $validated['academic_year'],
            $validated['semester'],
            $customRates
        );

        return redirect()->back()->with('success', 'Payment record created successfully.');
    }

    /**
     * Process a payment
     */
    public function processPayment(Request $request, Student $student)
    {
        $validated = $request->validate([
            'semester_payment_id' => 'required|exists:student_semester_payments,id',
            'payment_type' => 'required|in:enrollment_fee,prelim_payment,midterm_payment,prefinal_payment,final_payment',
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|in:cash,check,bank_transfer,online,installment',
            'reference_number' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:500',
            'notes' => 'nullable|string|max:1000',
        ]);

        $semesterPayment = StudentSemesterPayment::findOrFail($validated['semester_payment_id']);

        $paymentData = [
            'reference_number' => $validated['reference_number'] ?? null,
            'description' => $validated['description'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ];

        $transaction = $this->paymentService->processPayment(
            $semesterPayment,
            $validated['payment_type'],
            $validated['amount'],
            $validated['payment_method'],
            Auth::id(),
            $paymentData
        );

        return redirect()->back()->with('success', 'Payment processed successfully.');
    }

    /**
     * Get payment receipt
     */
    public function receipt(PaymentTransaction $transaction): Response
    {
        $transaction->load([
            'student.user',
            'payable',
            'processedBy',
        ]);

        return Inertia::render('Registrar/Students/PaymentReceipt', [
            'transaction' => $transaction,
        ]);
    }

    /**
     * Dashboard with payment statistics
     */
    public function dashboard(Request $request): Response
    {
        $academicYear = $request->get('academic_year', '2025-2026');
        $semester = $request->get('semester', 'first');

        $stats = [
            'total_students' => Student::count(),
            'enrollment_paid' => StudentSemesterPayment::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('enrollment_paid', true)
                ->count(),
            'fully_paid' => StudentSemesterPayment::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('status', 'completed')
                ->count(),
            'overdue_payments' => StudentSemesterPayment::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('status', 'overdue')
                ->count(),
            'total_collected' => PaymentTransaction::whereHas('payable', function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)->where('semester', $semester);
            })->where('status', 'completed')->sum('amount'),
        ];

        // Recent transactions
        $recentTransactions = PaymentTransaction::with([
            'student.user',
            'processedBy',
        ])
            ->whereHas('payable', function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)->where('semester', $semester);
            })
            ->where('status', 'completed')
            ->orderBy('payment_date', 'desc')
            ->limit(10)
            ->get();

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
            'recentTransactions' => $recentTransactions,
            'academicYear' => $academicYear,
            'semester' => $semester,
        ]);
    }
}
