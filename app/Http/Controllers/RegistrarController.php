<?php

namespace App\Http\Controllers;

use App\Models\ArchivedStudent;
use App\Models\ArchivedStudentEnrollment;
use App\Models\PaymentTransaction;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RegistrarController extends Controller
{
    /**
     * Show the registrar dashboard.
     */
    public function dashboard(): Response
    {
        $stats = [
            'total_students' => Student::count(),
            'active_students' => Student::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })->count(),
            'total_teachers' => Teacher::count(),
            'active_teachers' => Teacher::where('status', 'active')->count(),
            'total_sections' => Section::count(),
        ];

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * Show all students for management.
     */
    public function students(): Response
    {
        $educationLevel = request('education_level', 'all');
        $status = request('status', 'all');
        $yearLevel = request('year_level', 'all');
        $studentType = request('student_type', 'all');
        $enrollmentStatus = request('enrollment_status', 'enrolled'); // Default to 'enrolled'

        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Student::with(['user', 'program'])
            ->when($educationLevel !== 'all', function ($q) use ($educationLevel) {
                $q->where('education_level', $educationLevel);
            })
            ->when($status !== 'all', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($yearLevel !== 'all', function ($q) use ($yearLevel) {
                $q->where('year_level', $yearLevel);
            })
            ->when($studentType !== 'all', function ($q) use ($studentType) {
                $q->where('student_type', $studentType);
            });

        // Filter by enrollment status
        if ($enrollmentStatus === 'enrolled') {
            // Only show students currently enrolled in the current semester
            $query->whereHas('studentEnrollments', function ($q) use ($currentAcademicYear, $currentSemester) {
                $q->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            });
        } elseif ($enrollmentStatus === 'not_enrolled') {
            // Only show students NOT currently enrolled in the current semester
            $query->whereDoesntHave('studentEnrollments', function ($q) use ($currentAcademicYear, $currentSemester) {
                $q->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            });
        }
        // 'all' shows all students regardless of enrollment status

        $students = $query->paginate(15)->withQueryString();

        // Get current enrollment sections for each student
        $students->getCollection()->transform(function ($student) use ($currentAcademicYear, $currentSemester) {
            // First try to find enrollment with a section assigned
            $enrollment = StudentEnrollment::with(['section.program'])
                ->where('student_id', $student->id)
                ->where('academic_year', $currentAcademicYear)
                ->where('semester', $currentSemester)
                ->where('status', 'active')
                ->whereNotNull('section_id')
                ->first();

            // If no enrollment with section found, check if student has any active enrollment in current period
            if (! $enrollment) {
                $enrollment = StudentEnrollment::with(['section.program'])
                    ->where('student_id', $student->id)
                    ->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active')
                    ->first();
            }

            $student->current_section = $enrollment?->section;
            $student->is_currently_enrolled = $enrollment !== null;

            return $student;
        });

        $programs = Program::orderBy('program_name')->get();

        $onHoldCount = Student::where('is_on_hold', true)->count();

        return Inertia::render('Registrar/Students/Index', [
            'students' => $students,
            'programs' => $programs,
            'on_hold_count' => $onHoldCount,
            'filters' => [
                'education_level' => $educationLevel,
                'status' => $status,
                'year_level' => $yearLevel,
                'student_type' => $studentType,
                'enrollment_status' => $enrollmentStatus,
            ],
            'current_academic_period' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
        ]);
    }

    /**
     * Show the student registration form.
     */
    public function create(): Response
    {
        $programs = Program::with('programFees')->orderBy('education_level')
            ->orderBy('program_name')
            ->get();

        return Inertia::render('Registrar/Students/Create', [
            'programs' => $programs,
            'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
            'currentSemester' => SchoolSetting::getCurrentSemester(),
        ]);
    }

    /**
     * Clear an on-hold status for a student after payment reconciliation.
     */
    public function clearHold(Request $request, Student $student)
    {
        // Permission check could be added here
        $student->update([
            'is_on_hold' => false,
            'hold_balance' => null,
            'hold_reason' => null,
        ]);

        return redirect()->back()->with('success', "Hold cleared for {$student->user->name}.");
    }

    /**
     * Store a newly registered student or update existing student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            // Student number for checking existing students
            'student_number' => ['nullable', 'string'],

            // Personal Information
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'address' => ['nullable', 'string'],
            'street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email'],
            'parent_contact' => ['nullable', 'string', 'max:20'],

            // Academic Information
            'program_id' => ['required', 'exists:programs,id'],
            'year_level' => ['required', 'string'],
            'student_type' => ['required', Rule::in(['regular', 'irregular'])],
            'education_level' => ['required', 'string'],
            'track' => ['nullable', 'string'],
            'strand' => ['nullable', 'string'],

            // Payment Information
            'enrollment_fee' => ['required', 'numeric', 'min:0'],
            'payment_amount' => ['required', 'numeric', 'min:0'],

            // Course shifting confirmation
            'confirm_course_shift' => ['nullable', 'boolean'],
        ]);

        try {
            DB::beginTransaction();

            // Check if this is an existing student being updated
            $existingStudent = null;
            if (! empty($validated['student_number'])) {
                $existingStudent = Student::where('student_number', $validated['student_number'])->first();
            }

            // Also check if there's an existing active student with this email
            if (! $existingStudent) {
                $existingStudentByEmail = Student::whereHas('user', function ($query) use ($validated) {
                    $query->where('email', $validated['email']);
                })->first();

                if ($existingStudentByEmail) {
                    $existingStudent = $existingStudentByEmail;
                }
            }

            // Check if this is a returning student from archived records
            $archivedStudent = ArchivedStudent::whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })->first();

            $isReturningStudent = $archivedStudent !== null;
            $isUpdatingExisting = $existingStudent !== null;

            // If updating existing student, use their existing user
            if ($isUpdatingExisting) {
                $user = $existingStudent->user;
                $user->update([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'email' => $validated['email'],
                    'is_active' => true,
                ]);
                $studentNumber = $existingStudent->student_number;
            } elseif ($isReturningStudent) {
                $user = $archivedStudent->user;
                // Update user name if changed
                $user->update([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'is_active' => true,
                ]);
            } else {
                // New student - validate email uniqueness
                $request->validate([
                    'email' => 'unique:users,email',
                ]);

                $user = User::create([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'email' => $validated['email'],
                    'password' => Hash::make('password123'),
                    'role' => 'student',
                    'is_active' => true,
                ]);
            }

            // Generate student number for new students only
            if (! $isUpdatingExisting) {
                $studentNumber = $isReturningStudent && $archivedStudent->student_number
                    ? $archivedStudent->student_number
                    : $this->generateStudentNumber($validated['education_level']);
            }

            // Extract numeric year level from string (e.g., "1st Year" -> 1, "Grade 11" -> 11)
            $numericYearLevel = $this->extractNumericYearLevel($validated['year_level'], $validated['education_level']);

            // --- Year-level progression validation for existing/returning students ---
            // Rule: 1 academic year == 2 semesters. We determine how many archived
            // semesters have happened since the student's enrolled date (archived
            // semesters imply completion). Existing or returning students cannot
            // be advanced beyond the number of completed academic years + 1.
            if ($isUpdatingExisting || $isReturningStudent) {
                // Prevent decreasing year level for existing/returning students.
                if ($isUpdatingExisting) {
                    $existingNumeric = $existingStudent->current_year_level ?? $this->extractNumericYearLevel($existingStudent->year_level ?? '1', $existingStudent->education_level ?? $validated['education_level']);
                    if ($numericYearLevel < $existingNumeric) {
                        return back()->withErrors([
                            'year_level' => "Invalid year level. Cannot decrease from {$existingNumeric} to {$numericYearLevel}.",
                        ])->withInput();
                    }
                    $enrolledDate = $existingStudent->enrolled_date ?? $existingStudent->created_at;
                } else {
                    $archivedNumeric = $this->extractNumericYearLevel($archivedStudent->year_level ?? '1', $archivedStudent->education_level ?? $validated['education_level']);
                    if ($numericYearLevel < $archivedNumeric) {
                        return back()->withErrors([
                            'year_level' => "Invalid year level. Cannot decrease from {$archivedNumeric} to {$numericYearLevel}.",
                        ])->withInput();
                    }
                    $enrolledDate = $archivedStudent->enrolled_date ?? $archivedStudent->archived_at ?? now();
                }

                if ($enrolledDate) {
                    // Count archived student enrollments for this student which represent
                    // completed semesters. Use per-student archived enrollments rather
                    // than global section archives.
                    $studentIdForArchiveCount = $isUpdatingExisting ? $existingStudent->id : ($archivedStudent->original_student_id ?? null);

                    // Count completed archived semesters for this student. Use only
                    // archived enrollments with a final_status indicating completion
                    // to avoid counting dropped/failed semesters.
                    $archivedSemestersCount = 0;
                    if ($studentIdForArchiveCount) {
                        $archivedSemestersCount = ArchivedStudentEnrollment::where('student_id', $studentIdForArchiveCount)
                            ->where('final_status', 'completed')
                            ->count();
                    }

                    // Each academic year = 2 semesters. The allowed year is the
                    // baseline starting year (1) plus completed full years.
                    $completedAcademicYears = intdiv($archivedSemestersCount, 2);

                    // Allowed year level is 1 + completed full academic years.
                    $allowedYearLevel = 1 + $completedAcademicYears;

                    if ($numericYearLevel > $allowedYearLevel) {
                        return back()->withErrors([
                            'year_level' => "Requested year level not allowed. Based on archived semesters, the student may only be up to '".($allowedYearLevel)."' at this time.",
                        ])->withInput();
                    }
                }
            }
            // --- end year-level validation ---

            // Concatenate address parts if provided
            $address = $validated['address'] ?? '';
            if (empty($address)) {
                $addressParts = array_filter([
                    $validated['street'] ?? null,
                    $validated['barangay'] ?? null,
                    $validated['city'] ?? null,
                    $validated['province'] ?? null,
                    $validated['zip_code'] ?? null,
                ]);
                $address = implode(', ', $addressParts);
            }

            // Check if existing student is changing programs (shifting courses)
            $isShiftingCourses = false;
            $currentProgram = null;
            $newProgram = null;

            if ($isUpdatingExisting && $existingStudent->program_id != $validated['program_id']) {
                $isShiftingCourses = true;
                $currentProgram = $existingStudent->program;
                $newProgram = Program::find($validated['program_id']);

                // Check if course shift is confirmed
                if (! $validated['confirm_course_shift']) {
                    return Inertia::render('Registrar/Students/Create', [
                        'programs' => Program::orderBy('education_level')
                            ->orderBy('program_name')
                            ->get(),
                        'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
                        'currentSemester' => SchoolSetting::getCurrentSemester(),
                        'course_shift_required' => [
                            'current_program' => $currentProgram->program_name ?? 'Unknown',
                            'current_program_code' => $currentProgram->program_code ?? null,
                            'new_program' => $newProgram->program_name ?? 'Unknown',
                            'new_program_code' => $newProgram->program_code ?? null,
                            'student_name' => $existingStudent->first_name.' '.$existingStudent->last_name,
                        ],
                        'old' => $request->all(), // Preserve form input
                    ]);
                }

                // Mark as irregular only if confirmed
                $validated['student_type'] = 'irregular';
            }

            // Also check if returning archived student is changing programs
            if ($isReturningStudent && $archivedStudent->program_id != $validated['program_id']) {
                $isShiftingCourses = true;
                $currentProgram = $archivedStudent->program;
                $newProgram = Program::find($validated['program_id']);

                // Check if course shift is confirmed
                if (! $validated['confirm_course_shift']) {
                    return Inertia::render('Registrar/Students/Create', [
                        'programs' => Program::orderBy('education_level')
                            ->orderBy('program_name')
                            ->get(),
                        'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
                        'currentSemester' => SchoolSetting::getCurrentSemester(),
                        'course_shift_required' => [
                            'current_program' => $currentProgram->program_name ?? 'Unknown',
                            'current_program_code' => $currentProgram->program_code ?? null,
                            'new_program' => $newProgram->program_name ?? 'Unknown',
                            'new_program_code' => $newProgram->program_code ?? null,
                            'student_name' => $archivedStudent->first_name.' '.$archivedStudent->last_name,
                        ],
                        'old' => $request->all(), // Preserve form input
                    ]);
                }

                // Mark as irregular only if confirmed
                $validated['student_type'] = 'irregular';
            }

            // Create student record
            $studentData = [
                'user_id' => $user->id,
                'program_id' => $validated['program_id'],
                'student_number' => $studentNumber,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'birth_date' => $validated['birth_date'],
                'address' => $address,
                'phone' => $validated['phone'],
                'parent_contact' => $validated['parent_contact'],
                'year_level' => $validated['year_level'],
                'current_year_level' => $numericYearLevel,
                'current_academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
                'current_semester' => \App\Models\SchoolSetting::getCurrentSemester(),
                'student_type' => $validated['student_type'],
                'education_level' => $validated['education_level'],
                'track' => $validated['track'],
                'strand' => $validated['strand'],
                'status' => 'active',
                'enrolled_date' => $isUpdatingExisting ? $existingStudent->enrolled_date : now(),
            ];

            // Create or update student record
            if ($isUpdatingExisting) {
                $existingStudent->update($studentData);
                $student = $existingStudent;
                $message = "Student {$user->name} updated successfully!";
                if ($isShiftingCourses) {
                    $message .= ' Student marked as irregular due to course shifting.';
                }
            } else {
                $student = Student::create($studentData);
                $baseMessage = "Student {$user->name} registered successfully! Student Number: {$studentNumber}. Default password: password123";
                if ($isShiftingCourses) {
                    $baseMessage .= ' Student marked as irregular due to course shifting.';
                }
                $message = $baseMessage;
            }

            // Check if student has outstanding balances from previous semesters
            $academicYear = SchoolSetting::getCurrentAcademicYear();
            $semester = SchoolSetting::getCurrentSemester();

            $studentIdToCheck = $isReturningStudent ? $archivedStudent->original_student_id : $student->id;
            $unpaidBalances = StudentSemesterPayment::where('student_id', $studentIdToCheck)
                ->where('balance', '>', 0)
                ->where(function ($query) use ($academicYear, $semester) {
                    $query->where('academic_year', '<', $academicYear)
                        ->orWhere(function ($subQuery) use ($academicYear, $semester) {
                            $subQuery->where('academic_year', $academicYear)
                                ->where('semester', '!=', $semester);
                        });
                })
                ->sum('balance');

            if ($unpaidBalances > 0) {
                return back()->withErrors([
                    'student' => 'Cannot enroll student. Outstanding balance of ₱'.number_format($unpaidBalances, 2).' from previous semester(s) must be settled first.',
                ])->withInput();
            }

            // Check if student is already enrolled in the current semester
            $existingEnrollment = StudentEnrollment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if ($existingEnrollment) {
                return back()->withErrors([
                    'student' => "Student is already enrolled in the current semester ({$academicYear} - {$semester}). Cannot enroll again.",
                ])->withInput();
            }
            $enrollmentFee = (float) $validated['enrollment_fee'];
            $paymentAmount = (float) $validated['payment_amount'];

            // Check if payment record already exists for this semester
            $existingPayment = StudentSemesterPayment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if (! $existingPayment) {
                // Create the payment record (without setting enrollment_paid yet)
                $semesterPayment = StudentSemesterPayment::create([
                    'student_id' => $student->id,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'enrollment_fee' => $enrollmentFee,
                    'enrollment_paid' => false,
                    'enrollment_payment_date' => null,
                    'total_semester_fee' => $enrollmentFee,
                    'payment_plan' => 'installment',
                    // Note: total_paid and balance will be calculated by the model's booted() method
                ]);
            } else {
                $semesterPayment = $existingPayment;
            }

            // If there's an initial payment, create a payment transaction
            if ($paymentAmount > 0) {
                PaymentTransaction::create([
                    'student_id' => $student->id,
                    'payable_type' => StudentSemesterPayment::class,
                    'payable_id' => $semesterPayment->id,
                    'amount' => $paymentAmount,
                    'payment_type' => 'enrollment_fee',
                    'payment_method' => 'cash',
                    'reference_number' => 'REG-'.now()->format('YmdHis').'-'.$student->id,
                    'description' => 'Enrollment fee payment',
                    'payment_date' => now(),
                    'status' => 'completed',
                    'processed_by' => Auth::id(),
                    'notes' => 'Payment made during student enrollment',
                ]);

                // Mark enrollment as paid since they registered (regardless of amount)
                $semesterPayment->refresh();
                $semesterPayment->enrollment_payment_date = now();
                $semesterPayment->enrollment_paid = true; // Always true when they register
                $semesterPayment->save(); // Trigger the booted() method to recalculate totals
            }

            // Create enrollment record to track student's enrollment in this semester
            // Double-check that enrollment doesn't already exist (safety check)
            $existingEnrollmentCheck = StudentEnrollment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if (! $existingEnrollmentCheck) {
                StudentEnrollment::create([
                    'student_id' => $student->id,
                    'section_id' => null, // Will be assigned later when sections are created
                    'enrollment_date' => now(),
                    'status' => 'active',
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'enrolled_by' => Auth::id(),
                ]);
            }

            DB::commit();

            return redirect()
                ->route('registrar.students')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withErrors(['error' => 'Failed to register student: '.$e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Show the form for editing a student.
     */
    public function edit(Student $student): Response
    {
        $student->load(['user', 'program', 'currentEnrollment.section.program']);

        return Inertia::render('Registrar/Students/Edit', [
            'student' => $student,
            'programs' => Program::all(),
        ]);
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            // Personal Information only (academic info cannot be edited)
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'address' => ['nullable', 'string'],
            'street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($student->user_id)],
            'parent_contact' => ['nullable', 'string', 'max:20'],

            // Status only (academic fields cannot be edited)
            'status' => ['required', Rule::in(['active', 'inactive', 'graduated', 'dropped'])],
        ]);

        try {
            DB::beginTransaction();

            // Update user information
            $student->user->update([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => $validated['email'],
            ]);

            // Concatenate address parts if provided
            $address = $validated['address'] ?? '';
            if (empty($address)) {
                $addressParts = array_filter([
                    $validated['street'] ?? null,
                    $validated['barangay'] ?? null,
                    $validated['city'] ?? null,
                    $validated['province'] ?? null,
                    $validated['zip_code'] ?? null,
                ]);
                $address = implode(', ', $addressParts);
            }

            // Update student information (only personal info and status)
            $student->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'birth_date' => $validated['birth_date'],
                'address' => $address,
                'street' => $validated['street'],
                'barangay' => $validated['barangay'],
                'city' => $validated['city'],
                'province' => $validated['province'],
                'zip_code' => $validated['zip_code'],
                'phone' => $validated['phone'],
                'parent_contact' => $validated['parent_contact'],
                'status' => $validated['status'],
            ]);

            // Deactivate user account if student status is dropped or inactive
            if (in_array($validated['status'], ['dropped', 'inactive'])) {
                $student->user->update(['is_active' => false]);
            } elseif ($validated['status'] === 'active') {
                // Reactivate user account if status is changed to active
                $student->user->update(['is_active' => true]);
            }

            DB::commit();

            return redirect()->route('registrar.students')->with('success', 'Student updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withErrors(['error' => 'Failed to update student: '.$e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Extract numeric year level from string.
     */
    private function extractNumericYearLevel(string $yearLevel, string $educationLevel): int
    {
        if ($educationLevel === 'college') {
            // Extract first digit from "1st Year", "2nd Year", etc.
            if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                return (int) $matches[1];
            }
        } else {
            // Extract numeric grade from "Grade 11", "Grade 12"
            if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                return (int) $matches[1];
            }
        }

        return 1; // Default to 1 if parsing fails
    }

    /**
     * Generate a unique student number.
     */
    private function generateStudentNumber(string $educationLevel): string
    {
        $year = date('Y');
        $prefix = $educationLevel === 'college' ? 'COL' : 'SHS';

        // Get the last student number for this year and education level
        $lastStudent = Student::where('student_number', 'like', "{$year}-{$prefix}-%")
            ->orderBy('student_number', 'desc')
            ->first();

        if ($lastStudent) {
            // Extract the sequence number and increment it
            $lastNumber = (int) substr($lastStudent->student_number, -4);
            $newNumber = $lastNumber + 1;
        } else {
            $newNumber = 1;
        }

        return sprintf('%s-%s-%04d', $year, $prefix, $newNumber);
    }

    /**
     * Show all teachers for management.
     */
    public function teachers(): Response
    {
        $teachers = Teacher::with('user')
            ->paginate(15);

        return Inertia::render('Registrar/Teachers/Index', [
            'teachers' => $teachers,
        ]);
    }

    /**
     * Show all sections for management.
     */
    public function sections(): Response
    {
        $sections = Section::with(['teacher', 'program'])
            ->paginate(15);

        return Inertia::render('Registrar/Sections/Index', [
            'sections' => $sections,
        ]);
    }
}
