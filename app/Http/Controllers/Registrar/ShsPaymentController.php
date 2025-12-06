<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
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
        $payments = ShsStudentPayment::with(['student.user'])
            ->whereHas('student', function ($query) {
                $query->where('education_level', 'shs');
            })
            ->paginate(15);

        $stats = [
            'total_payments' => ShsStudentPayment::whereHas('student', function ($query) {
                $query->where('education_level', 'shs');
            })->count(),
            'pending_payments' => ShsStudentPayment::whereHas('student', function ($query) {
                $query->where('education_level', 'shs');
            })->where('balance', '>', 0)->count(),
            'overdue_payments' => ShsStudentPayment::whereHas('student', function ($query) {
                $query->where('education_level', 'shs');
            })->where('balance', '>', 0)->count(), // SHS doesn't have overdue status
            'total_collectible' => ShsStudentPayment::whereHas('student', function ($query) {
                $query->where('education_level', 'shs');
            })->sum('balance'),
        ];

        return Inertia::render('Registrar/Payments/Shs/Index', [
            'payments' => $payments,
            'stats' => $stats,
        ]);
    }

    /**
     * Show specific SHS student's payment details.
     */
    public function show(Student $student): Response
    {
        $student->load(['user']);

        if ($student->education_level !== 'shs') {
            abort(404, 'Student not found in SHS records.');
        }

        $payments = ShsStudentPayment::where('student_id', $student->id)
            ->orderBy('created_at', 'desc')
            ->get();

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

        if ($student->education_level !== 'shs') {
            return back()->withErrors(['student_id' => 'Student must be enrolled in SHS.']);
        }

        $payment = ShsStudentPayment::create([
            'student_id' => $validated['student_id'],
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'first_quarter_amount' => $validated['payment_type'] === 'first_quarter' ? $validated['total_due'] : 0,
            'second_quarter_amount' => $validated['payment_type'] === 'second_quarter' ? $validated['total_due'] : 0,
            'third_quarter_amount' => $validated['payment_type'] === 'third_quarter' ? $validated['total_due'] : 0,
            'fourth_quarter_amount' => $validated['payment_type'] === 'fourth_quarter' ? $validated['total_due'] : 0,
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
            'quarter' => 'required|in:1,2,3,4',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount_paid'] > $payment->balance) {
            return back()->withErrors(['amount_paid' => 'Payment amount cannot exceed remaining balance.']);
        }

        $newTotalPaid = $payment->total_paid + $validated['amount_paid'];
        $newBalance = $payment->balance - $validated['amount_paid'];

        // Mark specific quarter as paid based on quarter selection
        $quarterField = match ($validated['quarter']) {
            1 => 'first_quarter_paid',
            2 => 'second_quarter_paid',
            3 => 'third_quarter_paid',
            4 => 'fourth_quarter_paid',
        };

        $quarterDateField = match ($validated['quarter']) {
            1 => 'first_quarter_payment_date',
            2 => 'second_quarter_payment_date',
            3 => 'third_quarter_payment_date',
            4 => 'fourth_quarter_payment_date',
        };

        $payment->update([
            'total_paid' => $newTotalPaid,
            'balance' => $newBalance,
            $quarterField => true,
            $quarterDateField => $validated['payment_date'],
        ]);

        return back()->with('success', 'Payment of ₱'.number_format($validated['amount_paid'], 2).' recorded successfully for Quarter '.$validated['quarter'].'.');
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
