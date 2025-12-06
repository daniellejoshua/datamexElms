<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentBalance;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class StudentBalanceController extends Controller
{
    /**
     * Display student balance management dashboard.
     */
    public function index(): Response
    {
        $balances = StudentBalance::with(['student.user', 'program', 'createdBy'])
            ->paginate(20);

        $stats = [
            'total_balances' => StudentBalance::count(),
            'active_balances' => StudentBalance::active()->count(),
            'college_balances' => StudentBalance::college()->withBalance()->sum('balance'),
            'shs_balances' => StudentBalance::shs()->withBalance()->sum('balance'),
        ];

        return Inertia::render('Registrar/Balances/Index', [
            'balances' => $balances,
            'stats' => $stats,
        ]);
    }

    /**
     * Show create balance form.
     */
    public function create(): Response
    {
        $students = Student::with(['user', 'program'])
            ->whereHas('user', fn ($q) => $q->where('is_active', true))
            ->get();

        $programs = Program::all();

        return Inertia::render('Registrar/Balances/Create', [
            'students' => $students,
            'programs' => $programs,
        ]);
    }

    /**
     * Store new student balance.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'course_code' => 'nullable|string|max:255',
            'course_name' => 'nullable|string|max:255',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'total_fee' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        $paidAmount = $validated['paid_amount'] ?? 0;
        $balance = $validated['total_fee'] - $paidAmount;

        $studentBalance = StudentBalance::create([
            'student_id' => $validated['student_id'],
            'program_id' => $student->program_id,
            'course_code' => $validated['course_code'],
            'course_name' => $validated['course_name'],
            'education_level' => $student->education_level,
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'total_fee' => $validated['total_fee'],
            'paid_amount' => $paidAmount,
            'balance' => $balance,
            'status' => $balance <= 0 ? 'cleared' : 'active',
            'notes' => $validated['notes'],
            'created_by' => Auth::id(),
        ]);

        return redirect()->route('registrar.balances.show', $studentBalance)
            ->with('success', 'Student balance created successfully.');
    }

    /**
     * Show specific student balance.
     */
    public function show(StudentBalance $balance): Response
    {
        $balance->load(['student.user', 'program', 'createdBy']);

        return Inertia::render('Registrar/Balances/Show', [
            'balance' => $balance,
        ]);
    }

    /**
     * Show edit balance form.
     */
    public function edit(StudentBalance $balance): Response
    {
        $balance->load(['student.user', 'program']);

        return Inertia::render('Registrar/Balances/Edit', [
            'balance' => $balance,
        ]);
    }

    /**
     * Update student balance.
     */
    public function update(Request $request, StudentBalance $balance): RedirectResponse
    {
        $validated = $request->validate([
            'course_code' => 'nullable|string|max:255',
            'course_name' => 'nullable|string|max:255',
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'total_fee' => 'required|numeric|min:0',
            'paid_amount' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $paidAmount = $validated['paid_amount'] ?? 0;
        $newBalance = $validated['total_fee'] - $paidAmount;

        $balance->update([
            'course_code' => $validated['course_code'],
            'course_name' => $validated['course_name'],
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'total_fee' => $validated['total_fee'],
            'paid_amount' => $paidAmount,
            'balance' => $newBalance,
            'status' => $newBalance <= 0 ? 'cleared' : 'active',
            'notes' => $validated['notes'],
        ]);

        return redirect()->route('registrar.balances.show', $balance)
            ->with('success', 'Student balance updated successfully.');
    }

    /**
     * Record payment towards balance.
     */
    public function recordPayment(Request $request, StudentBalance $balance): RedirectResponse
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string',
        ]);

        if ($validated['amount'] > $balance->balance) {
            return back()->withErrors(['amount' => 'Payment amount cannot exceed remaining balance.']);
        }

        $balance->increment('paid_amount', $validated['amount']);
        $balance->updateBalance();

        return back()->with('success', 'Payment recorded successfully.');
    }

    /**
     * Set exact balance amount.
     */
    public function setExactBalance(Request $request, StudentBalance $balance): RedirectResponse
    {
        $validated = $request->validate([
            'exact_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $newPaidAmount = $balance->total_fee - $validated['exact_balance'];

        $balance->update([
            'paid_amount' => $newPaidAmount,
            'balance' => $validated['exact_balance'],
            'status' => $validated['exact_balance'] <= 0 ? 'cleared' : 'active',
            'notes' => $balance->notes."\n\nBalance manually set to ".$validated['exact_balance'].' by registrar. '.($validated['notes'] ?? ''),
        ]);

        return back()->with('success', 'Exact balance set successfully.');
    }

    /**
     * Get balance summary for student.
     */
    public function getStudentBalanceSummary(Student $student)
    {
        $balances = $student->studentBalances()
            ->where('status', 'active')
            ->get();

        $summary = [
            'total_balance' => $balances->sum('balance'),
            'total_fees' => $balances->sum('total_fee'),
            'total_paid' => $balances->sum('paid_amount'),
            'balance_count' => $balances->count(),
        ];

        return response()->json([
            'summary' => $summary,
            'balances' => $balances,
        ]);
    }
}
