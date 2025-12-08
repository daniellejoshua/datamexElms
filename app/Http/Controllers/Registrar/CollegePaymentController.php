<?php

namespace App\Http\Controllers\Registrar;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
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
                $enrollment = StudentEnrollment::with(['section.program'])
                    ->where('student_id', $payment->student_id)
                    ->where('academic_year', $payment->academic_year)
                    ->where('semester', $payment->semester)
                    ->where('status', 'active')
                    ->first();

                $payment->section = $enrollment?->section;

                return $payment;
            });

        // Convert back to paginated format
        $perPage = 15;
        $currentPage = request()->get('page', 1);
        $currentPageItems = $payments->slice(($currentPage - 1) * $perPage, $perPage);
        $paginatedPayments = new \Illuminate\Pagination\LengthAwarePaginator(
            $currentPageItems,
            $payments->count(),
            $perPage,
            $currentPage,
            ['path' => request()->url(), 'pageName' => 'page']
        );

        $stats = [
            'total_payments' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })
                ->where('academic_year', $filterAcademicYear)
                ->where('semester', $filterSemester)
                ->count(),
            'pending_payments' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })
                ->where('academic_year', $filterAcademicYear)
                ->where('semester', $filterSemester)
                ->where('status', 'pending')
                ->count(),
            'overdue_payments' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'college');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })
                ->where('academic_year', $filterAcademicYear)
                ->where('semester', $filterSemester)
                ->where('status', 'overdue')
                ->count(),
            'total_collectible' => StudentSemesterPayment::whereHas('student', function ($query) use ($filterStudentType) {
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
        if (!in_array($currentAcademicYear, $academicYears)) {
            $academicYears[] = $currentAcademicYear;
            sort($academicYears);
        }

        return Inertia::render('Registrar/Payments/College/Index', [
            'payments' => $paginatedPayments,
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

        if ($student->education_level !== 'college') {
            abort(404, 'Student not found in college records.');
        }

        $payments = StudentSemesterPayment::where('student_id', $student->id)
            ->with(['paymentTransactions' => function ($query) {
                $query->orderBy('payment_date', 'desc');
            }])
            ->orderBy('created_at', 'desc')
            ->get();

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

        if ($validated['amount_paid'] > $payment->balance) {
            return back()->withErrors(['amount_paid' => 'Payment amount cannot exceed remaining balance.']);
        }

        // Check if the term is already fully paid
        $termPaidField = $validated['term'].'_paid';
        if ($payment->{$termPaidField}) {
            return back()->withErrors(['term' => 'This term has already been fully paid.']);
        }

        // Enforce sequential payment order
        $termSequence = ['enrollment', 'prelim', 'midterm', 'prefinal', 'final'];
        $currentTermIndex = array_search($validated['term'], $termSequence);

        // Check if all previous terms are paid
        for ($i = 0; $i < $currentTermIndex; $i++) {
            $previousTermPaidField = $termSequence[$i].'_paid';
            if (! $payment->{$previousTermPaidField}) {
                return back()->withErrors(['term' => 'You must pay for '.ucfirst($termSequence[$i]).' before paying for '.ucfirst($validated['term']).'.']);
            }
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
}
