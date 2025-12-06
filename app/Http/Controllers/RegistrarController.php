<?php

namespace App\Http\Controllers;

use App\Helpers\AcademicHelper;
use App\Models\PaymentTransaction;
use App\Models\Program;
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

        $query = Student::with(['user', 'program'])
            ->when($educationLevel !== 'all', function ($q) use ($educationLevel) {
                $q->where('education_level', $educationLevel);
            })
            ->when($status !== 'all', function ($q) use ($status) {
                $isActive = $status === 'active';
                $q->whereHas('user', function ($query) use ($isActive) {
                    $query->where('is_active', $isActive);
                });
            })
            ->when($yearLevel !== 'all', function ($q) use ($yearLevel) {
                $q->where('year_level', $yearLevel);
            })
            ->when($studentType !== 'all', function ($q) use ($studentType) {
                $q->where('student_type', $studentType);
            });

        $students = $query->paginate(15)->withQueryString();

        // Get current enrollment sections for each student
        $currentAcademicYear = AcademicHelper::getCurrentAcademicYear();
        $currentSemester = AcademicHelper::getCurrentSemester();

        $students->getCollection()->transform(function ($student) use ($currentAcademicYear, $currentSemester) {
            $enrollment = StudentEnrollment::with(['section.program'])
                ->where('student_id', $student->id)
                ->where('academic_year', $currentAcademicYear)
                ->where('semester', $currentSemester)
                ->where('status', 'active')
                ->first();

            $student->current_section = $enrollment?->section;
            return $student;
        });

        $programs = Program::orderBy('program_name')->get();

        return Inertia::render('Registrar/Students/Index', [
            'students' => $students,
            'programs' => $programs,
            'filters' => [
                'education_level' => $educationLevel,
                'status' => $status,
                'year_level' => $yearLevel,
                'student_type' => $studentType,
            ],
        ]);
    }

    /**
     * Show the student registration form.
     */
    public function create(): Response
    {
        $programs = Program::orderBy('education_level')
            ->orderBy('program_name')
            ->get();

        return Inertia::render('Registrar/Students/Create', [
            'programs' => $programs,
            'currentAcademicYear' => AcademicHelper::getCurrentAcademicYear(),
            'currentSemester' => AcademicHelper::getCurrentSemester(),
        ]);
    }

    /**
     * Store a newly registered student.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
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
            'email' => ['required', 'email', 'unique:users,email'],
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
        ]);

        try {
            DB::beginTransaction();

            // Create user account with email as username and default password
            $user = User::create([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make('password123'),
                'role' => 'student',
                'is_active' => true,
            ]);

            // Generate student number (you can customize this logic)
            $studentNumber = $this->generateStudentNumber($validated['education_level']);

            // Extract numeric year level from string (e.g., "1st Year" -> 1, "Grade 11" -> 11)
            $numericYearLevel = $this->extractNumericYearLevel($validated['year_level'], $validated['education_level']);

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

            // Create student record
            $student = Student::create([
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
                'student_type' => $validated['student_type'],
                'education_level' => $validated['education_level'],
                'track' => $validated['track'],
                'strand' => $validated['strand'],
                'status' => 'active',
                'enrolled_date' => now(),
            ]);

            // Create enrollment fee payment record
            $academicYear = AcademicHelper::getCurrentAcademicYear();
            $semester = AcademicHelper::getCurrentSemester();
            $enrollmentFee = (float) $validated['enrollment_fee'];
            $paymentAmount = (float) $validated['payment_amount'];

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
                    'description' => 'Initial enrollment fee payment',
                    'payment_date' => now(),
                    'status' => 'completed',
                    'processed_by' => Auth::id(),
                    'notes' => 'Payment made during student registration',
                ]);

                // Mark enrollment as paid since they registered (regardless of amount)
                $semesterPayment->refresh();
                $semesterPayment->enrollment_payment_date = now();
                $semesterPayment->enrollment_paid = true; // Always true when they register
                $semesterPayment->save(); // Trigger the booted() method to recalculate totals
            }

            DB::commit();

            return redirect()
                ->route('registrar.students')
                ->with('success', "Student {$user->name} registered successfully! Student Number: {$studentNumber}. Default password: password123");

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withErrors(['error' => 'Failed to register student: '.$e->getMessage()])
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

    /**
     * Show student enrollment form.
     */
    public function showEnrollment(): Response
    {
        $sections = Section::with('program')->where('status', 'active')->get();
        $programs = \App\Models\Program::all();

        return Inertia::render('Registrar/SimpleEnrollment', [
            'sections' => $sections,
            'programs' => $programs,
        ]);
    }

    /**
     * Process student enrollment.
     */
    public function processEnrollment(Request $request)
    {
        // Implementation for processing enrollment
        // This would include validation and enrollment logic
    }
}
