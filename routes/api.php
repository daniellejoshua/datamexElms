<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Public authentication routes with session support
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes with web session authentication
Route::middleware(['web', 'auth:web', 'throttle.api'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });

    // Simple ping route for CSRF token refresh
    Route::get('/ping', function () {
        return response()->json(['status' => 'ok']);
    });

    // Student check route for registrars (searches)
    Route::get('/students/check/{student_number}', function ($studentNumber) {
        $student = \App\Models\Student::with(['user', 'program', 'curriculum'])
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
                    'name' => $student->user?->name,
                    'email' => $student->user?->email,
                    'student_number' => $student->student_number,
                    // Normalize year level for the frontend: prefer numeric/current_year_level when available
                    'year_level' => (function () use ($student) {
                        // If the student has a numeric current_year_level, map it to a label
                        if (! empty($student->current_year_level)) {
                            if ($student->education_level === 'senior_high') {
                                return $student->current_year_level === 12 ? 'Grade 12' : 'Grade 11';
                            }

                            $map = [1 => '1st Year', 2 => '2nd Year', 3 => '3rd Year', 4 => '4th Year', 5 => '5th Year'];

                            return $map[$student->current_year_level] ?? $student->year_level ?? (string) $student->current_year_level;
                        }

                        // Fallback to stored string value (legacy)
                        return $student->year_level ?? null;
                    })(),
                    'program' => $student->program,
                    'curriculum' => $student->curriculum,
                    'curriculum_id' => $student->curriculum_id,
                    'education_level' => $student->education_level,
                    'student_type' => $student->student_type,
                    'gender' => $student->gender,
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
                    'gender' => $archivedStudent->gender,
                    'name' => $archivedStudent->first_name.' '.$archivedStudent->last_name,
                    'email' => $archivedStudent->user?->email,
                    'student_number' => $archivedStudent->student_number,
                    // Normalize archived year level (prefer numeric values when present)
                    'year_level' => (function () use ($archivedStudent) {
                        if (! empty($archivedStudent->current_year_level)) {
                            if ($archivedStudent->education_level === 'senior_high') {
                                return $archivedStudent->current_year_level === 12 ? 'Grade 12' : 'Grade 11';
                            }

                            $map = [1 => '1st Year', 2 => '2nd Year', 3 => '3rd Year', 4 => '4th Year', 5 => '5th Year'];

                            return $map[$archivedStudent->current_year_level] ?? $archivedStudent->year_level ?? (string) $archivedStudent->current_year_level;
                        }

                        return $archivedStudent->year_level ?? null;
                    })(),
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
    })->middleware(['role:registrar', 'throttle.searches'])->name('api.students.check');

    // Duplicate student check route (email + name + birthdate)
    Route::post('/students/check-duplicate', [\App\Http\Controllers\RegistrarController::class, 'checkDuplicate'])
        ->middleware(['role:registrar', 'throttle.searches'])
        ->name('api.students.check-duplicate');

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
    })->middleware(['role:registrar', 'throttle.searches'])->name('api.archived-students.check');

    // Student payment history route (data-heavy)
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
    })->middleware(['role:registrar', 'throttle.data-heavy'])->name('api.students.payments');

    // Student progress route (data-heavy)
    Route::get('/students/{student}/progress', function (\App\Models\Student $student) {
        $completed = \App\Models\ArchivedStudentEnrollment::where('student_id', $student->id)
            ->where('final_status', 'completed')
            ->count();

        $completedYears = intdiv($completed, 2);
        $suggestedNumeric = 1 + $completedYears;

        return response()->json([
            'completed_semesters' => $completed,
            'completed_years' => $completedYears,
            'suggested_year_numeric' => $suggestedNumeric,
        ]);
    })->middleware(['role:registrar', 'throttle.data-heavy'])->name('api.students.progress');

    // Archived student progress route
    Route::get('/archived-students/{archived}/progress', function (\App\Models\ArchivedStudent $archived) {
        $studentId = $archived->original_student_id ?? $archived->id;

        $completed = \App\Models\ArchivedStudentEnrollment::where('student_id', $studentId)
            ->where('final_status', 'completed')
            ->count();

        $completedYears = intdiv($completed, 2);
        $suggestedNumeric = 1 + $completedYears;

        return response()->json([
            'completed_semesters' => $completed,
            'completed_years' => $completedYears,
            'suggested_year_numeric' => $suggestedNumeric,
        ]);
    })->middleware(['role:registrar', 'throttle.data-heavy'])->name('api.archived-students.progress');

    // Suggest curriculum for a given program and year level (used by registrar UI)
    Route::get('/programs/{program}/suggested-curriculum', function (\Illuminate\Http\Request $request, \App\Models\Program $program) {
        $yearLevelLabel = $request->query('year_level');
        $educationLevel = $request->query('education_level') ?? $program->education_level;
        $academicYear = $request->query('academic_year') ?? \App\Models\SchoolSetting::getCurrentAcademicYear();

        // Parse numeric year
        $numeric = 1;
        if ($educationLevel === 'college') {
            if (preg_match('/(\d+)/', (string) $yearLevelLabel, $m)) {
                $numeric = (int) $m[1];
            }
        } else {
            if (preg_match('/(\d+)/', (string) $yearLevelLabel, $m)) {
                $numeric = (int) $m[1];
            }
        }

        // Determine batch start year if year > 1
        if ($numeric > 1) {
            if (preg_match('/(\d{4})/', (string) $academicYear, $m)) {
                $startYear = (int) $m[1];
            } else {
                $startYear = (int) date('Y');
            }
            $batchStart = (string) ($startYear - ($numeric - 1));
        } else {
            $batchStart = (string) preg_replace('/[^0-9-]/', '', (string) $academicYear);
        }

        // Check for explicit year-level guide
        $guide = \App\Models\YearLevelCurriculumGuide::where('program_id', $program->id)
            ->where('year_level', $numeric)
            ->with('curriculum')
            ->first();

        if ($guide && $guide->curriculum) {
            return response()->json([
                'curriculum' => [
                    'id' => $guide->curriculum->id,
                    'curriculum_code' => $guide->curriculum->curriculum_code,
                    'curriculum_name' => $guide->curriculum->curriculum_name,
                ],
                'source' => 'guide',
            ]);
        }

        // Check program curricula mappings
        $mapping = \App\Models\ProgramCurriculum::where('program_id', $program->id)
            ->where('academic_year', 'like', '%'.$batchStart.'%')
            ->with('curriculum')
            ->first();

        if ($mapping && $mapping->curriculum) {
            return response()->json([
                'curriculum' => [
                    'id' => $mapping->curriculum->id,
                    'curriculum_code' => $mapping->curriculum->curriculum_code,
                    'curriculum_name' => $mapping->curriculum->curriculum_name,
                ],
                'source' => 'program_curriculum',
            ]);
        }

        // Cohort majority check
        $existingCurriculumId = \App\Models\Student::where('program_id', $program->id)
            ->where('batch_year', $batchStart)
            ->where('current_year_level', $numeric)
            ->whereNotNull('curriculum_id')
            ->select('curriculum_id', \Illuminate\Support\Facades\DB::raw('count(*) as ct'))
            ->groupBy('curriculum_id')
            ->orderByDesc('ct')
            ->pluck('curriculum_id')
            ->first();

        if ($existingCurriculumId) {
            $c = \App\Models\Curriculum::find($existingCurriculumId);

            return response()->json([
                'curriculum' => [
                    'id' => $c->id,
                    'curriculum_code' => $c->curriculum_code,
                    'curriculum_name' => $c->curriculum_name,
                ],
                'source' => 'cohort_majority',
            ]);
        }

        // Fallback to current curriculum
        $current = $program->currentCurriculum;
        if ($current) {
            return response()->json([
                'curriculum' => [
                    'id' => $current->id,
                    'curriculum_code' => $current->curriculum_code,
                    'curriculum_name' => $current->curriculum_name,
                ],
                'source' => 'current',
            ]);
        }

        return response()->json(['curriculum' => null, 'source' => 'none']);
    })->middleware(['role:registrar', 'throttle.searches'])->name('api.programs.suggested-curriculum');

    // Course shift subject comparison
    Route::get('/students/{student}/course-shift-comparison', [
        \App\Http\Controllers\Api\CourseShiftComparisonController::class,
        'compare',
    ])->middleware(['role:registrar'])->name('api.students.course-shift-comparison');
});

// Route used by LAN instance to push changes to cloud
Route::post('/sync', [\App\Http\Controllers\Api\CloudSyncController::class, 'handle']);
