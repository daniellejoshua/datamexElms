<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Public authentication routes with session support
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes with web session authentication
Route::middleware(['web', 'auth:web'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });

    // Student check route for registrars
    Route::get('/students/check/{student_number}', function ($studentNumber) {
        $student = \App\Models\Student::with(['user', 'program'])
            ->where('student_number', $studentNumber)
            ->first();

        if ($student) {
            // Check for unpaid balances from previous semesters
            $unpaidBalances = \App\Models\StudentSemesterPayment::where('student_id', $student->id)
                ->where('balance', '>', 0)
                ->with(['student.user'])
                ->get()
                ->map(function ($payment) {
                    return [
                        'academic_year' => $payment->academic_year,
                        'semester' => $payment->semester,
                        'total_fee' => $payment->total_semester_fee,
                        'total_paid' => $payment->total_paid,
                        'balance' => $payment->balance,
                        'status' => $payment->status,
                    ];
                });

            return response()->json([
                'exists' => true,
                'has_unpaid_balances' => $unpaidBalances->isNotEmpty(),
                'unpaid_balances' => $unpaidBalances,
                'student' => [
                    'id' => $student->id,
                    'first_name' => $student->first_name,
                    'last_name' => $student->last_name,
                    'middle_name' => $student->middle_name,
                    'name' => $student->user->name,
                    'email' => $student->user->email,
                    'student_number' => $student->student_number,
                    'year_level' => $student->year_level,
                    'program' => $student->program,
                    'education_level' => $student->education_level,
                    'student_type' => $student->student_type,
                    'birth_date' => $student->birth_date,
                    'phone' => $student->phone,
                    'parent_contact' => $student->parent_contact,
                    'address' => $student->address,
                ],
            ]);
        }

        // Check archived students
        $archivedStudent = \App\Models\ArchivedStudent::with(['user', 'program'])
            ->where('student_number', $studentNumber)
            ->first();

        if ($archivedStudent) {
            // Check for unpaid balances (archived students might not have current payment records)
            $unpaidBalances = \App\Models\StudentSemesterPayment::where('student_id', $archivedStudent->original_student_id ?? $archivedStudent->id)
                ->where('balance', '>', 0)
                ->get()
                ->map(function ($payment) {
                    return [
                        'academic_year' => $payment->academic_year,
                        'semester' => $payment->semester,
                        'total_fee' => $payment->total_semester_fee,
                        'total_paid' => $payment->total_paid,
                        'balance' => $payment->balance,
                        'status' => $payment->status,
                    ];
                });

            return response()->json([
                'exists' => false,
                'archived' => [
                    'id' => $archivedStudent->id,
                    'first_name' => $archivedStudent->first_name,
                    'last_name' => $archivedStudent->last_name,
                    'middle_name' => $archivedStudent->middle_name,
                    'name' => $archivedStudent->first_name.' '.$archivedStudent->last_name,
                    'email' => $archivedStudent->user?->email,
                    'student_number' => $archivedStudent->student_number,
                    'year_level' => $archivedStudent->year_level,
                    'program' => $archivedStudent->program,
                    'education_level' => $archivedStudent->education_level,
                    'student_type' => 'returning',
                    'birth_date' => $archivedStudent->birth_date,
                    'phone' => $archivedStudent->phone,
                    'parent_contact' => $archivedStudent->parent_contact,
                    'address' => $archivedStudent->address,
                ],
                'has_unpaid_balances' => $unpaidBalances->isNotEmpty(),
                'unpaid_balances' => $unpaidBalances,
            ]);
        }

        return response()->json(['exists' => false, 'archived' => false]);
    })->middleware('role:registrar');

    // Archived student check route
    Route::get('/archived-students/check', function (\Illuminate\Http\Request $request) {
        $email = $request->query('email');
        if (! $email) {
            return response()->json(['archivedStudent' => null]);
        }

        $archivedStudent = \App\Models\ArchivedStudent::with('user', 'program')
            ->whereHas('user', function ($query) use ($email) {
                $query->where('email', $email);
            })
            ->first();

        if ($archivedStudent) {
            return response()->json([
                'archivedStudent' => [
                    'id' => $archivedStudent->id,
                    'student_number' => $archivedStudent->student_number,
                    'first_name' => $archivedStudent->first_name,
                    'last_name' => $archivedStudent->last_name,
                    'middle_name' => $archivedStudent->middle_name,
                    'birth_date' => $archivedStudent->birth_date,
                    'address' => $archivedStudent->address,
                    'phone' => $archivedStudent->phone,
                    'parent_contact' => $archivedStudent->parent_contact,
                    'education_level' => $archivedStudent->education_level,
                    'track' => $archivedStudent->track,
                    'strand' => $archivedStudent->strand,
                    'archived_at' => $archivedStudent->archived_at,
                ],
            ]);
        }

        return response()->json(['archivedStudent' => null]);
    })->middleware('role:registrar');

    // Student payment history route
    Route::get('/students/{student}/payments', function (\App\Models\Student $student) {
        $payments = \App\Models\StudentSemesterPayment::where('student_id', $student->id)
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'academic_year' => $payment->academic_year,
                    'semester' => $payment->semester,
                    'enrollment_fee' => $payment->enrollment_fee,
                    'total_semester_fee' => $payment->total_semester_fee,
                    'total_paid' => $payment->total_paid,
                    'balance' => $payment->balance,
                    'status' => $payment->status,
                    'enrollment_paid' => $payment->enrollment_paid,
                    'enrollment_payment_date' => $payment->enrollment_payment_date,
                ];
            });

        $totalPaid = $payments->sum('total_paid');
        $totalBalance = $payments->sum('balance');
        $totalFee = $payments->sum('total_semester_fee');

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'middle_name' => $student->middle_name,
            ],
            'payments' => $payments,
            'paymentSummary' => [
                'totalPaid' => $totalPaid,
                'balance' => $totalBalance,
                'totalFee' => $totalFee,
            ],
        ]);
    })->middleware('role:registrar');
});
