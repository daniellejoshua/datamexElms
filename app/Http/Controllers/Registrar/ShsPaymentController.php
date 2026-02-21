<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\SchoolSetting;
use App\Models\ShsStudentPayment;
use App\Models\Student;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ShsPaymentController extends Controller
{
    /**
     * Display SHS students payment dashboard.
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
        $searchTerm = request('search', '');

        $query = ShsStudentPayment::with(['student' => function ($query) use ($filterAcademicYear, $filterSemester) {
            $query->select(['id', 'user_id', 'student_number', 'first_name', 'last_name', 'year_level', 'track', 'strand', 'has_voucher', 'voucher_status', 'voucher_id', 'program_id'])
                ->with('user:id,name')
                ->with(['enrollments' => function ($enrollmentQuery) use ($filterAcademicYear, $filterSemester) {
                    $enrollmentQuery->where('academic_year', $filterAcademicYear)
                        ->where('semester', $filterSemester)
                        ->where('status', 'active')
                        ->with('section:id,section_name,year_level,program_id')
                        ->with('section.program:id,program_code');
                }]);
        }])
            ->with('paymentTransactions')
            ->whereHas('student', function ($q) use ($filterStudentType) {
                $q->where('education_level', 'senior_high');
                if ($filterStudentType !== 'all') {
                    $q->where('student_type', $filterStudentType);
                }
            })
            ->where('academic_year', $filterAcademicYear)
            ->where('semester', 'annual'); // SHS payments are always annual

        // Add search functionality
        if (! empty($searchTerm)) {
            $query->whereHas('student', function ($studentQuery) use ($searchTerm) {
                $studentQuery->whereHas('user', function ($userQuery) use ($searchTerm) {
                    $userQuery->where('name', 'like', '%'.$searchTerm.'%');
                })
                    ->orWhere('student_number', 'like', '%'.$searchTerm.'%');
            });
        }

        $payments = $query->paginate(15);

        // Modify payment data for students with active vouchers
        $payments->getCollection()->transform(function ($payment) {
            if ($payment->student && $payment->student->has_voucher && $payment->student->voucher_status === 'active') {
                $payment->total_semester_fee = 0;
                $payment->total_paid = 0; // Ensure total paid is zero for voucher students
                $payment->balance = 0; // Set balance to 0 for voucher students
            }

            return $payment;
        });

        $stats = [
            'total_students' => Student::where('education_level', 'senior_high')
                ->when($filterStudentType !== 'all', function ($query) use ($filterStudentType) {
                    $query->where('student_type', $filterStudentType);
                })
                ->count(),
            'students_not_enrolled' => Student::where('education_level', 'senior_high')
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
            'students_with_balance' => ShsStudentPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'senior_high');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })->where('academic_year', $filterAcademicYear)->where('semester', 'annual')->where('balance', '>', 0)->count(),
            'total_outstanding_balance' => ShsStudentPayment::whereHas('student', function ($query) use ($filterStudentType) {
                $query->where('education_level', 'senior_high');
                if ($filterStudentType !== 'all') {
                    $query->where('student_type', $filterStudentType);
                }
            })->where('academic_year', $filterAcademicYear)->where('semester', 'annual')->sum('balance'),
        ];

        // Generate academic years list
        $academicYears = ShsStudentPayment::whereHas('student', function ($query) {
            $query->where('education_level', 'senior_high');
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

        return Inertia::render('Registrar/Payments/Shs/Index', [
            'payments' => $payments,
            'stats' => $stats,
            'filters' => [
                'academic_year' => $filterAcademicYear,
                'semester' => $filterSemester,
                'student_type' => $filterStudentType,
                'search' => $searchTerm,
            ],
            'currentAcademicYear' => $currentAcademicYear,
            'currentSemester' => $currentSemester,
            'academicYears' => $academicYears,
        ]);
    }

    /**
     * Show specific SHS student's payment details.
     */
    public function show(Student $student): Response
    {
        $student->load(['user', 'program', 'enrollments' => function ($query) {
            $query->where('status', 'active')
                ->with('section:id,section_name')
                ->orderBy('academic_year', 'desc')
                ->orderBy('semester', 'desc');
        }]);

        if ($student->education_level !== 'senior_high') {
            abort(404, 'Student not found in SHS records.');
        }

        $payments = ShsStudentPayment::where('student_id', $student->id)
            ->with('paymentTransactions')
            ->orderBy('created_at', 'desc')
            ->get();

        // Apply voucher logic for students with active vouchers
        $payments->transform(function ($payment) use ($student) {
            if ($student->has_voucher && $student->voucher_status === 'active') {
                $payment->total_semester_fee = 0;
                $payment->total_paid = 0; // Ensure total paid is zero for voucher students
                $payment->balance = 0; // Set balance to 0 for voucher students
            }

            return $payment;
        });

        return Inertia::render('Registrar/Payments/Shs/Show', [
            'student' => $student,
            'payments' => $payments,
        ]);
    }

    /**
     * Create new payment record for SHS student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'academic_year' => 'required|string',
            'total_due' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string',
            'payment_items' => 'required|array|min:1',
            'payment_items.*.item_name' => 'required|string',
            'payment_items.*.amount' => 'required|numeric|min:0',
            'payment_items.*.description' => 'nullable|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        if ($student->education_level !== 'senior_high') {
            return back()->withErrors(['student_id' => 'Student must be enrolled in SHS.']);
        }

        // Check if payment record already exists for this academic year
        $existingPayment = ShsStudentPayment::where('student_id', $student->id)
            ->where('academic_year', $validated['academic_year'])
            ->first();

        if ($existingPayment) {
            return back()->withErrors(['academic_year' => 'Payment record already exists for this academic year.']);
        }

        // For SHS, always use 'annual' semester
        $payment = ShsStudentPayment::create([
            'student_id' => $validated['student_id'],
            'academic_year' => $validated['academic_year'],
            'semester' => 'annual',
            'first_quarter_amount' => 0,
            'second_quarter_amount' => 0,
            'third_quarter_amount' => 0,
            'fourth_quarter_amount' => 0,
            'total_semester_fee' => $validated['total_due'],
            'total_paid' => 0,
            'balance' => $validated['total_due'],
        ]);

        return redirect()->route('registrar.payments.shs.index')
            ->with('success', 'SHS payment record created successfully.');
    }

    /**
     * Record a simple payment for SHS student.
     */
    public function recordPayment(Request $request, ShsStudentPayment $payment)
    {
        $validated = $request->validate([
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'or_number' => 'nullable|string|max:255',
            'quarter' => 'required|in:yearly',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount_paid'] > $payment->balance) {
            return back()->withErrors(['amount_paid' => 'Payment amount cannot exceed remaining balance.']);
        }

        $newTotalPaid = $payment->total_paid + $validated['amount_paid'];
        $newBalance = $payment->balance - $validated['amount_paid'];

        // For yearly payments, we don't mark specific quarters
        // Just update the total paid and balance
        $payment->update([
            'total_paid' => $newTotalPaid,
            'balance' => $newBalance,
        ]);

        // Create PaymentTransaction record
        \App\Models\PaymentTransaction::create([
            'student_id' => $payment->student_id,
            'payable_type' => \App\Models\ShsStudentPayment::class,
            'payable_id' => $payment->id,
            'amount' => $validated['amount_paid'],
            'payment_type' => 'enrollment_fee',
            'payment_method' => 'cash',
            'reference_number' => $validated['or_number'] ?? 'PAY-'.now()->format('YmdHis').'-'.$payment->id,
            'description' => 'Tuition payment for '.$payment->academic_year.' - '.$payment->semester,
            'payment_date' => $validated['payment_date'],
            'status' => 'completed',
            'processed_by' => \Illuminate\Support\Facades\Auth::id(),
            'notes' => $validated['notes'],
        ]);

        // Clear dashboard cache since payment data changed
        \Illuminate\Support\Facades\Cache::forget('registrar.dashboard.stats');

        return back()->with('success', 'Payment of ₱'.number_format($validated['amount_paid'], 2).' recorded successfully for yearly payment.');
    }

    /**
     * Get SHS fee structure template.
     */
    public function getFeeStructure()
    {
        $shsFeeStructure = [
            ['item_name' => 'Tuition Fee', 'amount' => 15000, 'description' => 'Basic tuition for SHS'],
            ['item_name' => 'Miscellaneous Fee', 'amount' => 3000, 'description' => 'School supplies and activities'],
            ['item_name' => 'Laboratory Fee', 'amount' => 2500, 'description' => 'Science laboratory usage'],
            ['item_name' => 'Library Fee', 'amount' => 500, 'description' => 'Library access and materials'],
            ['item_name' => 'Student Activity Fee', 'amount' => 1000, 'description' => 'Sports and extracurricular activities'],
        ];

        return response()->json($shsFeeStructure);
    }
}
