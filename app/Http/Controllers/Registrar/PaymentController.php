<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentSemesterPayment;
use App\Models\ShsStudentPayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    /**
     * Display payment dashboard
     */
    public function index(Request $request): Response
    {
        $students = Student::with(['user', 'program', 'semesterPayments', 'shsPayments'])
            ->when($request->search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_number', 'like', "%{$search}%");
            })
            ->when($request->payment_status, function ($query, $status) {
                if ($status === 'paid') {
                    // Students with at least one fully paid semester/quarter
                    $query->where(function ($q) {
                        $q->whereHas('semesterPayments', function ($sp) {
                            $sp->where('payment_status', 'paid');
                        })->orWhereHas('shsPayments', function ($shp) {
                            $shp->where('payment_status', 'paid');
                        });
                    });
                } elseif ($status === 'pending') {
                    // Students with pending payments
                    $query->where(function ($q) {
                        $q->whereHas('semesterPayments', function ($sp) {
                            $sp->where('payment_status', 'pending');
                        })->orWhereHas('shsPayments', function ($shp) {
                            $shp->where('payment_status', 'pending');
                        });
                    });
                } elseif ($status === 'partial') {
                    // Students with partial payments
                    $query->where(function ($q) {
                        $q->whereHas('semesterPayments', function ($sp) {
                            $sp->where('payment_status', 'partial');
                        })->orWhereHas('shsPayments', function ($shp) {
                            $shp->where('payment_status', 'partial');
                        });
                    });
                }
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        // Add payment summaries for each student
        $students->getCollection()->transform(function ($student) {
            // Get payments based on education level
            $payments = $student->education_level === 'shs' 
                ? $student->shsPayments 
                : $student->semesterPayments;
            $student->payments = $payments ?: collect([]);
            $student->latest_payment = $payments->first();
            
            // Calculate summary statistics
            $totalDue = $payments->sum('total_semester_fee');
            $totalPaid = $payments->sum('total_paid');
            $totalBalance = $payments->sum('balance');
            
            $student->payment_summary = [
                'total_due' => $totalDue,
                'total_paid' => $totalPaid,
                'total_balance' => $totalBalance,
                'status' => $totalBalance <= 0 ? 'paid' : ($totalPaid > 0 ? 'partial' : 'pending')
            ];
            
            return $student;
        });

        return Inertia::render('Registrar/Payments/Index', [
            'students' => $students,
            'filters' => $request->only(['search', 'payment_status']),
        ]);
    }

    /**
     * Show student payment details
     */
    public function show(Student $student): Response
    {
        $student->load(['user', 'program']);

        // Get payment records
        if ($student->education_level === 'shs') {
            $payments = $student->shsPayments()->latest()->get();
        } else {
            $payments = $student->semesterPayments()->latest()->get();
        }

        return Inertia::render('Registrar/Payments/ShowStudentPayments', [
            'student' => $student,
            'payments' => $payments,
        ]);
    }

    /**
     * Create payment record for student
     */
    public function store(Request $request, Student $student): RedirectResponse
    {
        $validated = $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string|in:1,2',
            'payment_type' => 'required|string|in:tuition,miscellaneous,laboratory,other',
            'amount_due' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'description' => 'nullable|string|max:255',
        ]);

        // Create payment based on education level
        if ($student->education_level === 'shs') {
            ShsStudentPayment::create([
                'student_id' => $student->id,
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester'],
                'payment_type' => $validated['payment_type'],
                'amount_due' => $validated['amount_due'],
                'amount_paid' => 0,
                'balance' => $validated['amount_due'],
                'due_date' => $validated['due_date'],
                'payment_status' => 'pending',
                'description' => $validated['description'],
            ]);
        } else {
            StudentSemesterPayment::create([
                'student_id' => $student->id,
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester'],
                'payment_type' => $validated['payment_type'],
                'amount_due' => $validated['amount_due'],
                'amount_paid' => 0,
                'balance' => $validated['amount_due'],
                'due_date' => $validated['due_date'],
                'payment_status' => 'pending',
                'description' => $validated['description'],
            ]);
        }

        return redirect()->route('registrar.payments.show', $student)
            ->with('success', 'Payment record created successfully.');
    }

    /**
     * Record payment for specific period/quarter
     */
    public function recordPayment(Request $request, $paymentId): RedirectResponse
    {
        $payment = StudentSemesterPayment::find($paymentId);
        $isShs = false;
        
        if (!$payment) {
            $payment = ShsStudentPayment::find($paymentId);
            $isShs = true;
            if (!$payment) {
                abort(404, 'Payment record not found');
            }
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'payment_method' => 'required|string|in:cash,bank_transfer,gcash,credit_card,installment',
            'payment_period' => 'required|string',
            'reference_number' => 'nullable|string|max:100',
        ]);

        $amount = $validated['amount'];
        $period = $validated['payment_period'];

        // Update the appropriate period based on education level
        if ($isShs) {
            // SHS quarterly payments
            switch ($period) {
                case 'first_quarter':
                    if (!$payment->first_quarter_paid && $amount >= $payment->first_quarter_amount) {
                        $payment->first_quarter_paid = true;
                        $payment->first_quarter_payment_date = now();
                    }
                    break;
                case 'second_quarter':
                    if (!$payment->second_quarter_paid && $amount >= $payment->second_quarter_amount) {
                        $payment->second_quarter_paid = true;
                        $payment->second_quarter_payment_date = now();
                    }
                    break;
                case 'third_quarter':
                    if (!$payment->third_quarter_paid && $amount >= $payment->third_quarter_amount) {
                        $payment->third_quarter_paid = true;
                        $payment->third_quarter_payment_date = now();
                    }
                    break;
                case 'fourth_quarter':
                    if (!$payment->fourth_quarter_paid && $amount >= $payment->fourth_quarter_amount) {
                        $payment->fourth_quarter_paid = true;
                        $payment->fourth_quarter_payment_date = now();
                    }
                    break;
            }
        } else {
            // College period payments
            switch ($period) {
                case 'prelim':
                    if (!$payment->prelim_paid && $amount >= $payment->prelim_amount) {
                        $payment->prelim_paid = true;
                        $payment->prelim_payment_date = now();
                    }
                    break;
                case 'midterm':
                    if (!$payment->midterm_paid && $amount >= $payment->midterm_amount) {
                        $payment->midterm_paid = true;
                        $payment->midterm_payment_date = now();
                    }
                    break;
                case 'prefinal':
                    if (!$payment->prefinal_paid && $amount >= $payment->prefinal_amount) {
                        $payment->prefinal_paid = true;
                        $payment->prefinal_payment_date = now();
                    }
                    break;
                case 'final':
                    if (!$payment->final_paid && $amount >= $payment->final_amount) {
                        $payment->final_paid = true;
                        $payment->final_payment_date = now();
                    }
                    break;
            }
        }

        // Update balance and payment status
        $payment->updateBalance();

        return redirect()->back()->with('success', 'Payment recorded successfully.');
    }

    /**
     * Generate payment summary report
     */
    public function report(Request $request): Response
    {
        $request->validate([
            'start_date' => 'nullable|date',
            'end_date' => 'nullable|date|after_or_equal:start_date',
            'academic_year' => 'nullable|string',
            'semester' => 'nullable|string|in:1,2',
        ]);

        // Get payment summaries
        $collegePayments = StudentSemesterPayment::query()
            ->when($request->start_date, function ($query, $date) {
                $query->where('payment_date', '>=', $date);
            })
            ->when($request->end_date, function ($query, $date) {
                $query->where('payment_date', '<=', $date);
            })
            ->when($request->academic_year, function ($query, $year) {
                $query->where('academic_year', $year);
            })
            ->when($request->semester, function ($query, $semester) {
                $query->where('semester', $semester);
            })
            ->selectRaw('
                payment_status,
                payment_type,
                COUNT(*) as count,
                SUM(amount_due) as total_due,
                SUM(amount_paid) as total_paid,
                SUM(balance) as total_balance
            ')
            ->groupBy(['payment_status', 'payment_type'])
            ->get();

        $shsPayments = ShsStudentPayment::query()
            ->when($request->start_date, function ($query, $date) {
                $query->where('payment_date', '>=', $date);
            })
            ->when($request->end_date, function ($query, $date) {
                $query->where('payment_date', '<=', $date);
            })
            ->when($request->academic_year, function ($query, $year) {
                $query->where('academic_year', $year);
            })
            ->when($request->semester, function ($query, $semester) {
                $query->where('semester', $semester);
            })
            ->selectRaw('
                payment_status,
                payment_type,
                COUNT(*) as count,
                SUM(amount_due) as total_due,
                SUM(amount_paid) as total_paid,
                SUM(balance) as total_balance
            ')
            ->groupBy(['payment_status', 'payment_type'])
            ->get();

        return Inertia::render('Registrar/Payments/Report', [
            'collegePayments' => $collegePayments,
            'shsPayments' => $shsPayments,
            'filters' => $request->only(['start_date', 'end_date', 'academic_year', 'semester']),
        ]);
    }

    /**
     * Show individual payment record details
     */
    public function showPayment($paymentId): Response
    {
        // Try to find the payment in both tables
        $payment = StudentSemesterPayment::with(['student.user', 'student.program'])->find($paymentId);
        
        if (!$payment) {
            $payment = ShsStudentPayment::with(['student.user', 'student.program'])->find($paymentId);
            if (!$payment) {
                abort(404, 'Payment record not found');
            }
        }

        return Inertia::render('Registrar/Payments/ShowPayment', [
            'payment' => $payment,
            'student' => $payment->student,
        ]);
    }
}
