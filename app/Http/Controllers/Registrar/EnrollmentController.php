<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Http\Requests\Registrar\StoreEnrollmentRequest;
use App\Http\Requests\Registrar\UpdateEnrollmentRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    /**
     * Display a listing of enrollments
     */
    public function index(Request $request): Response
    {
        $enrollments = StudentEnrollment::with(['student.user', 'student.program'])
            ->when($request->search, function ($query, $search) {
                $query->whereHas('student', function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_number', 'like', "%{$search}%");
                });
            })
            ->when($request->status, function ($query, $status) {
                $query->where('status', $status);
            })
            ->when($request->program, function ($query, $program) {
                $query->whereHas('student.program', function ($q) use ($program) {
                    $q->where('id', $program);
                });
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Registrar/Enrollments/Index', [
            'enrollments' => $enrollments,
            'programs' => Program::select('id', 'program_name', 'program_code')->get(),
            'filters' => $request->only(['search', 'status', 'program']),
        ]);
    }

    /**
     * Show the form for creating a new enrollment
     */
    public function create(): Response
    {
        return Inertia::render('Registrar/Enrollments/Create', [
            'programs' => Program::select('id', 'program_name', 'program_code', 'education_level')->get(),
        ]);
    }

    /**
     * Store a newly created enrollment
     */
    public function store(StoreEnrollmentRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        
        // Check if student exists by email or student number
        $existingUser = User::where('email', $validated['email'])->first();
        $existingStudent = Student::where('student_number', $validated['student_number'] ?? null)->first();
        
        if ($existingUser || $existingStudent) {
            return redirect()->back()
                ->withErrors(['email' => 'Student already exists. Please search and enroll existing student.']);
        }

        // Create new user account for the student
        $user = User::create([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['temporary_password'] ?? 'password123'),
            'email_verified_at' => now(),
        ]);

        $user->assignRole('student');

        // Generate unique student number if not provided
        $studentNumber = $validated['student_number'] ?? $this->generateStudentNumber($validated['program_id']);

        // Create student record
        $student = Student::create([
            'user_id' => $user->id,
            'program_id' => $validated['program_id'],
            'student_number' => $studentNumber,
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'birth_date' => $validated['birth_date'],
            'address' => $validated['address'],
            'phone' => $validated['phone'] ?? null,
            'parent_contact' => $validated['parent_contact'] ?? null,
            'education_level' => Program::find($validated['program_id'])->education_level,
            'status' => 'enrolled',
            'enrolled_date' => now(),
        ]);

        // Create enrollment record
        StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'year_level' => $validated['year_level'],
            'enrollment_date' => now(),
            'status' => 'enrolled',
        ]);

        return redirect()->route('registrar.enrollments.show', $student)
            ->with('success', 'Student enrolled successfully! Login credentials sent to student email.');
    }

    /**
     * Display the specified enrollment
     */
    public function show(Student $student): Response
    {
        $student->load(['user', 'program', 'enrollments', 'payments']);

        return Inertia::render('Registrar/Enrollments/Show', [
            'student' => $student,
        ]);
    }

    /**
     * Show the form for editing the specified enrollment
     */
    public function edit(Student $student): Response
    {
        $student->load(['user', 'program', 'enrollments']);

        return Inertia::render('Registrar/Enrollments/Edit', [
            'student' => $student,
            'programs' => Program::select('id', 'program_name', 'program_code', 'education_level')->get(),
        ]);
    }

    /**
     * Update the specified enrollment
     */
    public function update(UpdateEnrollmentRequest $request, Student $student): RedirectResponse
    {
        $validated = $request->validated();

        // Update user information
        $student->user->update([
            'name' => $validated['first_name'] . ' ' . $validated['last_name'],
            'email' => $validated['email'],
        ]);

        // Update student information
        $student->update([
            'program_id' => $validated['program_id'],
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'middle_name' => $validated['middle_name'] ?? null,
            'birth_date' => $validated['birth_date'],
            'address' => $validated['address'],
            'phone' => $validated['phone'] ?? null,
            'parent_contact' => $validated['parent_contact'] ?? null,
        ]);

        // Update current enrollment if exists
        $currentEnrollment = $student->enrollments()->where('status', 'enrolled')->first();
        if ($currentEnrollment) {
            $currentEnrollment->update([
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester'],
                'year_level' => $validated['year_level'],
            ]);
        }

        return redirect()->route('registrar.enrollments.show', $student)
            ->with('success', 'Student information updated successfully.');
    }

    /**
     * Search for existing students
     */
    public function search(Request $request): Response
    {
        $students = Student::with(['user', 'program'])
            ->when($request->search, function ($query, $search) {
                $query->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('student_number', 'like', "%{$search}%")
                      ->orWhereHas('user', function ($q) use ($search) {
                          $q->where('email', 'like', "%{$search}%");
                      });
            })
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Registrar/Enrollments/Search', [
            'students' => $students,
            'search' => $request->search,
        ]);
    }

    /**
     * Enroll an existing student
     */
    public function enrollExisting(Request $request, Student $student): RedirectResponse
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|string',
            'year_level' => 'required|integer|min:1|max:4',
        ]);

        // Check if student already has active enrollment
        $activeEnrollment = $student->enrollments()
            ->where('status', 'enrolled')
            ->where('academic_year', $request->academic_year)
            ->where('semester', $request->semester)
            ->first();

        if ($activeEnrollment) {
            return redirect()->back()
                ->withErrors(['enrollment' => 'Student is already enrolled for this academic year and semester.']);
        }

        // Create new enrollment
        StudentEnrollment::create([
            'student_id' => $student->id,
            'academic_year' => $request->academic_year,
            'semester' => $request->semester,
            'year_level' => $request->year_level,
            'enrollment_date' => now(),
            'status' => 'enrolled',
        ]);

        // Update student status
        $student->update(['status' => 'enrolled']);

        return redirect()->route('registrar.enrollments.show', $student)
            ->with('success', 'Student enrolled successfully for ' . $request->academic_year . ' - ' . $request->semester);
    }

    /**
     * Generate unique student number
     */
    private function generateStudentNumber(int $programId): string
    {
        $program = Program::find($programId);
        $year = date('Y');
        $prefix = $program->program_code . substr($year, -2);
        
        $lastStudent = Student::where('student_number', 'like', $prefix . '%')
            ->orderBy('student_number', 'desc')
            ->first();
            
        if ($lastStudent) {
            $lastNumber = intval(substr($lastStudent->student_number, -4));
            $newNumber = str_pad($lastNumber + 1, 4, '0', STR_PAD_LEFT);
        } else {
            $newNumber = '0001';
        }
        
        return $prefix . $newNumber;
    }
}
