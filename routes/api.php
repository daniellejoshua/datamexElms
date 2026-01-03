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

    // Student check route for registrars (searches)
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
    })->middleware(['role:registrar', 'throttle.searches'])->name('api.students.check');

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
            ->where('academic_year', $academicYear)
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

    // Address API routes for Philippine locations
    Route::get('/addresses/provinces', function () {
        // Return list of Philippine provinces
        $provinces = [
            ['code' => 'ABR', 'name' => 'Abra'],
            ['code' => 'AGN', 'name' => 'Agusan del Norte'],
            ['code' => 'AGS', 'name' => 'Agusan del Sur'],
            ['code' => 'AKL', 'name' => 'Aklan'],
            ['code' => 'ALB', 'name' => 'Albay'],
            ['code' => 'ANT', 'name' => 'Antique'],
            ['code' => 'APA', 'name' => 'Apayao'],
            ['code' => 'AUR', 'name' => 'Aurora'],
            ['code' => 'BAS', 'name' => 'Basilan'],
            ['code' => 'BAN', 'name' => 'Bataan'],
            ['code' => 'BTN', 'name' => 'Batanes'],
            ['code' => 'BTG', 'name' => 'Batangas'],
            ['code' => 'BEN', 'name' => 'Benguet'],
            ['code' => 'BIL', 'name' => 'Biliran'],
            ['code' => 'BOH', 'name' => 'Bohol'],
            ['code' => 'BUK', 'name' => 'Bukidnon'],
            ['code' => 'BUL', 'name' => 'Bulacan'],
            ['code' => 'CAG', 'name' => 'Cagayan'],
            ['code' => 'CAN', 'name' => 'Camarines Norte'],
            ['code' => 'CAS', 'name' => 'Camarines Sur'],
            ['code' => 'CAM', 'name' => 'Camiguin'],
            ['code' => 'CAP', 'name' => 'Capiz'],
            ['code' => 'CAT', 'name' => 'Catanduanes'],
            ['code' => 'CAV', 'name' => 'Cavite'],
            ['code' => 'CEB', 'name' => 'Cebu'],
            ['code' => 'COM', 'name' => 'Compostela Valley'],
            ['code' => 'DAN', 'name' => 'Davao del Norte'],
            ['code' => 'DAS', 'name' => 'Davao del Sur'],
            ['code' => 'DAV', 'name' => 'Davao Occidental'],
            ['code' => 'DAO', 'name' => 'Davao Oriental'],
            ['code' => 'DIN', 'name' => 'Dinagat Islands'],
            ['code' => 'EAS', 'name' => 'Eastern Samar'],
            ['code' => 'GUI', 'name' => 'Guimaras'],
            ['code' => 'IFU', 'name' => 'Ifugao'],
            ['code' => 'ILN', 'name' => 'Ilocos Norte'],
            ['code' => 'ILS', 'name' => 'Ilocos Sur'],
            ['code' => 'ILI', 'name' => 'Iloilo'],
            ['code' => 'ISA', 'name' => 'Isabela'],
            ['code' => 'KAL', 'name' => 'Kalinga'],
            ['code' => 'LUN', 'name' => 'La Union'],
            ['code' => 'LAG', 'name' => 'Laguna'],
            ['code' => 'LAN', 'name' => 'Lanao del Norte'],
            ['code' => 'LAS', 'name' => 'Lanao del Sur'],
            ['code' => 'LEY', 'name' => 'Leyte'],
            ['code' => 'MAG', 'name' => 'Maguindanao'],
            ['code' => 'MAD', 'name' => 'Marinduque'],
            ['code' => 'MAS', 'name' => 'Masbate'],
            ['code' => 'MSC', 'name' => 'Misamis Occidental'],
            ['code' => 'MSR', 'name' => 'Misamis Oriental'],
            ['code' => 'MOU', 'name' => 'Mountain Province'],
            ['code' => 'NEC', 'name' => 'Negros Occidental'],
            ['code' => 'NER', 'name' => 'Negros Oriental'],
            ['code' => 'NSA', 'name' => 'Northern Samar'],
            ['code' => 'NUE', 'name' => 'Nueva Ecija'],
            ['code' => 'NUV', 'name' => 'Nueva Vizcaya'],
            ['code' => 'MDC', 'name' => 'Occidental Mindoro'],
            ['code' => 'MDR', 'name' => 'Oriental Mindoro'],
            ['code' => 'PLW', 'name' => 'Palawan'],
            ['code' => 'PAM', 'name' => 'Pampanga'],
            ['code' => 'PAN', 'name' => 'Pangasinan'],
            ['code' => 'QUE', 'name' => 'Quezon'],
            ['code' => 'QUI', 'name' => 'Quirino'],
            ['code' => 'RIZ', 'name' => 'Rizal'],
            ['code' => 'ROM', 'name' => 'Romblon'],
            ['code' => 'WSA', 'name' => 'Samar'],
            ['code' => 'SAR', 'name' => 'Sarangani'],
            ['code' => 'SIQ', 'name' => 'Siquijor'],
            ['code' => 'SOR', 'name' => 'Sorsogon'],
            ['code' => 'SCO', 'name' => 'South Cotabato'],
            ['code' => 'SLE', 'name' => 'Southern Leyte'],
            ['code' => 'SUK', 'name' => 'Sultan Kudarat'],
            ['code' => 'SLU', 'name' => 'Sulu'],
            ['code' => 'SUN', 'name' => 'Surigao del Norte'],
            ['code' => 'SUR', 'name' => 'Surigao del Sur'],
            ['code' => 'TAR', 'name' => 'Tarlac'],
            ['code' => 'TAW', 'name' => 'Tawi-Tawi'],
            ['code' => 'ZMB', 'name' => 'Zambales'],
            ['code' => 'ZAN', 'name' => 'Zamboanga del Norte'],
            ['code' => 'ZAS', 'name' => 'Zamboanga del Sur'],
            ['code' => 'ZSI', 'name' => 'Zamboanga Sibugay'],
            // NCR
            ['code' => 'NCR', 'name' => 'National Capital Region'],
        ];

        return response()->json($provinces);
    })->middleware(['role:registrar'])->name('api.addresses.provinces');

    Route::get('/addresses/cities/{provinceCode}', function ($provinceCode) {
        // Return cities/municipalities for the selected province
        $cities = [
            'ABR' => [
                ['code' => 'ABR-001', 'name' => 'Bangued'],
                ['code' => 'ABR-002', 'name' => 'Boliney'],
                ['code' => 'ABR-003', 'name' => 'Bucay'],
                ['code' => 'ABR-004', 'name' => 'Bucloc'],
                ['code' => 'ABR-005', 'name' => 'Daguioman'],
                ['code' => 'ABR-006', 'name' => 'Danglas'],
                ['code' => 'ABR-007', 'name' => 'Dolores'],
                ['code' => 'ABR-008', 'name' => 'La Paz'],
                ['code' => 'ABR-009', 'name' => 'Lacub'],
                ['code' => 'ABR-010', 'name' => 'Lagangilang'],
                ['code' => 'ABR-011', 'name' => 'Lagayan'],
                ['code' => 'ABR-012', 'name' => 'Langiden'],
                ['code' => 'ABR-013', 'name' => 'Licuan-Baay'],
                ['code' => 'ABR-014', 'name' => 'Luba'],
                ['code' => 'ABR-015', 'name' => 'Malibcong'],
                ['code' => 'ABR-016', 'name' => 'Manabo'],
                ['code' => 'ABR-017', 'name' => 'Peñarrubia'],
                ['code' => 'ABR-018', 'name' => 'Pidigan'],
                ['code' => 'ABR-019', 'name' => 'Pilar'],
                ['code' => 'ABR-020', 'name' => 'Sallapadan'],
                ['code' => 'ABR-021', 'name' => 'San Isidro'],
                ['code' => 'ABR-022', 'name' => 'San Juan'],
                ['code' => 'ABR-023', 'name' => 'San Quintin'],
                ['code' => 'ABR-024', 'name' => 'Tayum'],
                ['code' => 'ABR-025', 'name' => 'Tineg'],
                ['code' => 'ABR-026', 'name' => 'Tubo'],
                ['code' => 'ABR-027', 'name' => 'Villaviciosa'],
            ],
            'BTG' => [
                ['code' => 'BTG-001', 'name' => 'Agoncillo'],
                ['code' => 'BTG-002', 'name' => 'Alitagtag'],
                ['code' => 'BTG-003', 'name' => 'Balayan'],
                ['code' => 'BTG-004', 'name' => 'Balete'],
                ['code' => 'BTG-005', 'name' => 'Batangas City'],
                ['code' => 'BTG-006', 'name' => 'Bauan'],
                ['code' => 'BTG-007', 'name' => 'Calaca'],
                ['code' => 'BTG-008', 'name' => 'Calatagan'],
                ['code' => 'BTG-009', 'name' => 'Cuenca'],
                ['code' => 'BTG-010', 'name' => 'Ibaan'],
                ['code' => 'BTG-011', 'name' => 'Laurel'],
                ['code' => 'BTG-012', 'name' => 'Lemery'],
                ['code' => 'BTG-013', 'name' => 'Lian'],
                ['code' => 'BTG-014', 'name' => 'Lipa'],
                ['code' => 'BTG-015', 'name' => 'Loboc'],
                ['code' => 'BTG-016', 'name' => 'Mabini'],
                ['code' => 'BTG-017', 'name' => 'Malvar'],
                ['code' => 'BTG-018', 'name' => 'Mataas na Kahoy'],
                ['code' => 'BTG-019', 'name' => 'Nasugbu'],
                ['code' => 'BTG-020', 'name' => 'Padre Garcia'],
                ['code' => 'BTG-021', 'name' => 'Rosario'],
                ['code' => 'BTG-022', 'name' => 'San Jose'],
                ['code' => 'BTG-023', 'name' => 'San Juan'],
                ['code' => 'BTG-024', 'name' => 'San Luis'],
                ['code' => 'BTG-025', 'name' => 'San Nicolas'],
                ['code' => 'BTG-026', 'name' => 'San Pascual'],
                ['code' => 'BTG-027', 'name' => 'Santa Teresita'],
                ['code' => 'BTG-028', 'name' => 'Santo Tomas'],
                ['code' => 'BTG-029', 'name' => 'Taal'],
                ['code' => 'BTG-030', 'name' => 'Talisa'],
                ['code' => 'BTG-031', 'name' => 'Tanauan'],
                ['code' => 'BTG-032', 'name' => 'Taysan'],
                ['code' => 'BTG-033', 'name' => 'Tingloy'],
                ['code' => 'BTG-034', 'name' => 'Tuy'],
            ],
            'CAV' => [
                ['code' => 'CAV-001', 'name' => 'Alfonso'],
                ['code' => 'CAV-002', 'name' => 'Amadeo'],
                ['code' => 'CAV-003', 'name' => 'Bacoor'],
                ['code' => 'CAV-004', 'name' => 'Carmona'],
                ['code' => 'CAV-005', 'name' => 'Cavite City'],
                ['code' => 'CAV-006', 'name' => 'Dasmariñas'],
                ['code' => 'CAV-007', 'name' => 'General Emilio Aguinaldo'],
                ['code' => 'CAV-008', 'name' => 'General Mariano Alvarez'],
                ['code' => 'CAV-009', 'name' => 'General Trias'],
                ['code' => 'CAV-010', 'name' => 'Imus'],
                ['code' => 'CAV-011', 'name' => 'Indang'],
                ['code' => 'CAV-012', 'name' => 'Kawit'],
                ['code' => 'CAV-013', 'name' => 'Magallanes'],
                ['code' => 'CAV-014', 'name' => 'Maragondon'],
                ['code' => 'CAV-015', 'name' => 'Mendez'],
                ['code' => 'CAV-016', 'name' => 'Naic'],
                ['code' => 'CAV-017', 'name' => 'Noveleta'],
                ['code' => 'CAV-018', 'name' => 'Rosario'],
                ['code' => 'CAV-019', 'name' => 'Silang'],
                ['code' => 'CAV-020', 'name' => 'Tagaytay'],
                ['code' => 'CAV-021', 'name' => 'Tanza'],
                ['code' => 'CAV-022', 'name' => 'Trece Martires'],
                ['code' => 'CAV-023', 'name' => 'Trece Martires City'],
            ],
            'LAG' => [
                ['code' => 'LAG-001', 'name' => 'Alaminos'],
                ['code' => 'LAG-002', 'name' => 'Bay'],
                ['code' => 'LAG-003', 'name' => 'Biñan'],
                ['code' => 'LAG-004', 'name' => 'Cabuyao'],
                ['code' => 'LAG-005', 'name' => 'Calamba'],
                ['code' => 'LAG-006', 'name' => 'Calauan'],
                ['code' => 'LAG-007', 'name' => 'Cavinti'],
                ['code' => 'LAG-008', 'name' => 'Famy'],
                ['code' => 'LAG-009', 'name' => 'Kalayaan'],
                ['code' => 'LAG-010', 'name' => 'Liliw'],
                ['code' => 'LAG-011', 'name' => 'Los Baños'],
                ['code' => 'LAG-012', 'name' => 'Luisiana'],
                ['code' => 'LAG-013', 'name' => 'Lumban'],
                ['code' => 'LAG-014', 'name' => 'Mabitac'],
                ['code' => 'LAG-015', 'name' => 'Magdalena'],
                ['code' => 'LAG-016', 'name' => 'Majayjay'],
                ['code' => 'LAG-017', 'name' => 'Nagcarlan'],
                ['code' => 'LAG-018', 'name' => 'Paete'],
                ['code' => 'LAG-019', 'name' => 'Pagsanjan'],
                ['code' => 'LAG-020', 'name' => 'Pakil'],
                ['code' => 'LAG-021', 'name' => 'Pangil'],
                ['code' => 'LAG-022', 'name' => 'Pila'],
                ['code' => 'LAG-023', 'name' => 'Rizal'],
                ['code' => 'LAG-024', 'name' => 'San Pablo'],
                ['code' => 'LAG-025', 'name' => 'San Pedro'],
                ['code' => 'LAG-026', 'name' => 'Santa Cruz'],
                ['code' => 'LAG-027', 'name' => 'Santa Maria'],
                ['code' => 'LAG-028', 'name' => 'Santa Rosa'],
                ['code' => 'LAG-029', 'name' => 'Siniloan'],
                ['code' => 'LAG-030', 'name' => 'Victoria'],
            ],
            'NCR' => [
                ['code' => 'NCR-001', 'name' => 'Caloocan'],
                ['code' => 'NCR-002', 'name' => 'Las Piñas'],
                ['code' => 'NCR-003', 'name' => 'Makati'],
                ['code' => 'NCR-004', 'name' => 'Malabon'],
                ['code' => 'NCR-005', 'name' => 'Mandaluyong'],
                ['code' => 'NCR-006', 'name' => 'Manila'],
                ['code' => 'NCR-007', 'name' => 'Marikina'],
                ['code' => 'NCR-008', 'name' => 'Muntinlupa'],
                ['code' => 'NCR-009', 'name' => 'Navotas'],
                ['code' => 'NCR-010', 'name' => 'Parañaque'],
                ['code' => 'NCR-011', 'name' => 'Pasay'],
                ['code' => 'NCR-012', 'name' => 'Pasig'],
                ['code' => 'NCR-013', 'name' => 'Pateros'],
                ['code' => 'NCR-014', 'name' => 'Quezon City'],
                ['code' => 'NCR-015', 'name' => 'San Juan'],
                ['code' => 'NCR-016', 'name' => 'Taguig'],
                ['code' => 'NCR-017', 'name' => 'Valenzuela'],
            ],
        ];

        return response()->json($cities[$provinceCode] ?? []);
    })->middleware(['role:registrar'])->name('api.addresses.cities');

    Route::get('/addresses/barangays/{cityCode}', function ($cityCode) {
        // Return barangays for the selected city
        $barangays = [
            'CAV-003' => [ // Bacoor
                ['code' => 'CAV-003-001', 'name' => 'Alima'],
                ['code' => 'CAV-003-002', 'name' => 'Aniban'],
                ['code' => 'CAV-003-003', 'name' => 'Banalo'],
                ['code' => 'CAV-003-004', 'name' => 'Bayanan'],
                ['code' => 'CAV-003-005', 'name' => 'Campo Santo'],
                ['code' => 'CAV-003-006', 'name' => 'Daang Bukid'],
                ['code' => 'CAV-003-007', 'name' => 'Digman'],
                ['code' => 'CAV-003-008', 'name' => 'Habay'],
                ['code' => 'CAV-003-009', 'name' => 'Kaingin'],
                ['code' => 'CAV-003-010', 'name' => 'Ligas'],
                ['code' => 'CAV-003-011', 'name' => 'Mabolo'],
                ['code' => 'CAV-003-012', 'name' => 'Maliksi'],
                ['code' => 'CAV-003-013', 'name' => 'Mambog'],
                ['code' => 'CAV-003-014', 'name' => 'Molino'],
                ['code' => 'CAV-003-015', 'name' => 'Niog'],
                ['code' => 'CAV-003-016', 'name' => 'Poblacion'],
                ['code' => 'CAV-003-017', 'name' => 'Real'],
                ['code' => 'CAV-003-018', 'name' => 'Salinas'],
                ['code' => 'CAV-003-019', 'name' => 'San Nicolas'],
                ['code' => 'CAV-003-020', 'name' => 'Sineguelasan'],
                ['code' => 'CAV-003-021', 'name' => 'Tabing Dagat'],
                ['code' => 'CAV-003-022', 'name' => 'Talaba'],
                ['code' => 'CAV-003-023', 'name' => 'Tamsui'],
                ['code' => 'CAV-003-024', 'name' => 'Zapote'],
            ],
            'NCR-003' => [ // Makati
                ['code' => 'NCR-003-001', 'name' => 'Bangkal'],
                ['code' => 'NCR-003-002', 'name' => 'Bel-Air'],
                ['code' => 'NCR-003-003', 'name' => 'Carmona'],
                ['code' => 'NCR-003-004', 'name' => 'Cembo'],
                ['code' => 'NCR-003-005', 'name' => 'Comembo'],
                ['code' => 'NCR-003-006', 'name' => 'Dasmariñas'],
                ['code' => 'NCR-003-007', 'name' => 'East Rembo'],
                ['code' => 'NCR-003-008', 'name' => 'Forbes Park'],
                ['code' => 'NCR-003-009', 'name' => 'Guadalupe Nuevo'],
                ['code' => 'NCR-003-010', 'name' => 'Guadalupe Viejo'],
                ['code' => 'NCR-003-011', 'name' => 'Kasilawan'],
                ['code' => 'NCR-003-012', 'name' => 'La Paz'],
                ['code' => 'NCR-003-013', 'name' => 'Magallanes'],
                ['code' => 'NCR-003-014', 'name' => 'Olympia'],
                ['code' => 'NCR-003-015', 'name' => 'Palanan'],
                ['code' => 'NCR-003-016', 'name' => 'Pembo'],
                ['code' => 'NCR-003-017', 'name' => 'Pinagkaisahan'],
                ['code' => 'NCR-003-018', 'name' => 'Pio del Pilar'],
                ['code' => 'NCR-003-019', 'name' => 'Pitogo'],
                ['code' => 'NCR-003-020', 'name' => 'Poblacion'],
                ['code' => 'NCR-003-021', 'name' => 'Post Proper Northside'],
                ['code' => 'NCR-003-022', 'name' => 'Post Proper Southside'],
                ['code' => 'NCR-003-023', 'name' => 'Rizal'],
                ['code' => 'NCR-003-024', 'name' => 'San Antonio'],
                ['code' => 'NCR-003-025', 'name' => 'San Isidro'],
                ['code' => 'NCR-003-026', 'name' => 'San Lorenzo'],
                ['code' => 'NCR-003-027', 'name' => 'Santa Cruz'],
                ['code' => 'NCR-003-028', 'name' => 'Singkamas'],
                ['code' => 'NCR-003-029', 'name' => 'South Cembo'],
                ['code' => 'NCR-003-030', 'name' => 'Tejeros'],
                ['code' => 'NCR-003-031', 'name' => 'Urdaneta'],
                ['code' => 'NCR-003-032', 'name' => 'Valenzuela'],
                ['code' => 'NCR-003-033', 'name' => 'West Rembo'],
            ],
            'LAG-028' => [ // Santa Rosa
                ['code' => 'LAG-028-001', 'name' => 'Aplaya'],
                ['code' => 'LAG-028-002', 'name' => 'Balibago'],
                ['code' => 'LAG-028-003', 'name' => 'Caingin'],
                ['code' => 'LAG-028-004', 'name' => 'Dila'],
                ['code' => 'LAG-028-005', 'name' => 'Dita'],
                ['code' => 'LAG-028-006', 'name' => 'Don Jose'],
                ['code' => 'LAG-028-007', 'name' => 'Ibaba'],
                ['code' => 'LAG-028-008', 'name' => 'Kanluran'],
                ['code' => 'LAG-028-009', 'name' => 'Labas'],
                ['code' => 'LAG-028-010', 'name' => 'Macabling'],
                ['code' => 'LAG-028-011', 'name' => 'Malitlit'],
                ['code' => 'LAG-028-012', 'name' => 'Malusak'],
                ['code' => 'LAG-028-013', 'name' => 'Market Area'],
                ['code' => 'LAG-028-014', 'name' => 'Pooc'],
                ['code' => 'LAG-028-015', 'name' => 'Pulong Santa Cruz'],
                ['code' => 'LAG-028-016', 'name' => 'Santo Domingo'],
                ['code' => 'LAG-028-017', 'name' => 'Sinalhan'],
                ['code' => 'LAG-028-018', 'name' => 'Tagapo'],
            ],
        ];

        return response()->json($barangays[$cityCode] ?? []);
    })->middleware(['role:registrar'])->name('api.addresses.barangays');
});
