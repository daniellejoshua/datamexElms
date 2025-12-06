<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Services\StudentPaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class EnrollmentController extends Controller
{
    public function __construct(
        protected StudentPaymentService $paymentService
    ) {}

    /**
     * Display enrollment dashboard
     */
    public function index(Request $request): Response
    {
        $academicYear = $request->get('academic_year', '2025-2026');
        $semester = $request->get('semester', 'first');
        $search = $request->get('search');
        $enrollmentStatus = $request->get('enrollment_status');

        $students = Student::with([
            'user',
            'program',
            'studentEnrollments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->with('section');
            },
            'studentSubjectEnrollments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->with('sectionSubject.subject');
            },
        ])
            ->when($search, function ($query, $search) {
                $query->whereHas('user', function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%");
                })->orWhere('student_number', 'like', "%{$search}%");
            })
            ->when($enrollmentStatus, function ($query, $status) use ($academicYear, $semester) {
                if ($status === 'enrolled') {
                    $query->whereHas('studentEnrollments', function ($q) use ($academicYear, $semester) {
                        $q->where('academic_year', $academicYear)
                            ->where('semester', $semester)
                            ->where('status', 'active');
                    });
                } elseif ($status === 'not_enrolled') {
                    $query->whereDoesntHave('studentEnrollments', function ($q) use ($academicYear, $semester) {
                        $q->where('academic_year', $academicYear)
                            ->where('semester', $semester)
                            ->where('status', 'active');
                    });
                } elseif ($status === 'irregular') {
                    $query->whereHas('studentSubjectEnrollments', function ($q) use ($academicYear, $semester) {
                        $q->where('academic_year', $academicYear)
                            ->where('semester', $semester)
                            ->where('enrollment_type', 'irregular');
                    });
                }
            })
            ->paginate(20)
            ->withQueryString();

        // Add enrollment status to each student
        $students->getCollection()->transform(function ($student) {
            $regularEnrollment = $student->studentEnrollments->where('status', 'active')->first();
            $irregularEnrollments = $student->studentSubjectEnrollments->where('enrollment_type', 'irregular');

            $student->enrollment_type = $regularEnrollment ? 'regular' : ($irregularEnrollments->count() > 0 ? 'irregular' : 'not_enrolled');
            $student->enrolled_subjects_count = $irregularEnrollments->count();
            $student->current_section = $regularEnrollment?->section;

            return $student;
        });

        return Inertia::render('Registrar/Enrollments/Index', [
            'students' => $students,
            'filters' => [
                'search' => $search,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'enrollment_status' => $enrollmentStatus,
            ],
            'enrollmentStatuses' => [
                'enrolled' => 'Enrolled (Regular)',
                'irregular' => 'Irregular Students',
                'not_enrolled' => 'Not Enrolled',
            ],
        ]);
    }

    /**
     * Show enrollment form for student
     */
    public function create(Student $student): Response
    {
        $student->load(['user', 'program']);

        // Get available sections for the student's program
        $sections = Section::with(['program', 'sectionSubjects.subject'])
            ->where('program_id', $student->program_id)
            ->where('status', 'active')
            ->get();

        return Inertia::render('Registrar/Enrollments/Create', [
            'student' => $student,
            'sections' => $sections,
        ]);
    }

    /**
     * Enroll student in a section (regular enrollment)
     */
    public function store(Request $request, Student $student)
    {
        $validated = $request->validate([
            'section_id' => 'required|exists:sections,id',
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second',
            'enrollment_date' => 'required|date',
            'create_payment_record' => 'boolean',
        ]);

        $section = Section::findOrFail($validated['section_id']);

        // Check if student is already enrolled for this period
        $existingEnrollment = StudentEnrollment::where([
            'student_id' => $student->id,
            'academic_year' => $validated['academic_year'],
            'semester' => $validated['semester'],
            'status' => 'active',
        ])->first();

        if ($existingEnrollment) {
            return redirect()->back()->withErrors(['enrollment' => 'Student is already enrolled for this academic period.']);
        }

        return DB::transaction(function () use ($student, $section, $validated) {
            // Create enrollment
            $enrollment = StudentEnrollment::create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'enrollment_date' => $validated['enrollment_date'],
                'enrolled_by' => Auth::id(),
                'status' => 'active',
                'academic_year' => $validated['academic_year'],
                'semester' => $validated['semester'],
            ]);

            // Auto-enroll in all section subjects as regular enrollment
            $sectionSubjects = $section->sectionSubjects;
            foreach ($sectionSubjects as $sectionSubject) {
                StudentSubjectEnrollment::create([
                    'student_id' => $student->id,
                    'section_subject_id' => $sectionSubject->id,
                    'enrollment_type' => 'regular',
                    'academic_year' => $validated['academic_year'],
                    'semester' => $validated['semester'],
                    'status' => 'active',
                    'enrollment_date' => $validated['enrollment_date'],
                    'enrolled_by' => Auth::id(),
                ]);
            }

            // Create payment record if requested
            if ($validated['create_payment_record'] ?? true) {
                $this->paymentService->createSemesterPayment(
                    $student,
                    $validated['academic_year'],
                    $validated['semester']
                );
            }

            return redirect()->route('registrar.enrollments.show', $student)
                ->with('success', 'Student enrolled successfully.');
        });
    }

    /**
     * Simple enrollment: New student creates record, existing student updates semester
     */
    public function simpleEnrollment(Request $request)
    {
        $request->validate([
            'student_number' => 'required|string',
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
            'section_id' => 'required|exists:sections,id',
            // For new students only
            'student_name' => 'nullable|string',
            'email' => 'nullable|email',
            'program_id' => 'nullable|exists:programs,id',
            'year_level' => 'nullable|string',
            'education_level' => 'nullable|in:college,shs',
        ]);

        $student = Student::where('student_number', $request->student_number)->first();

        if ($student) {
            // EXISTING STUDENT: Just enroll them in new semester
            return $this->enrollExistingStudent($student, $request);
        } else {
            // NEW STUDENT: Create student record then enroll
            return $this->createAndEnrollNewStudent($request);
        }
    }

    /**
     * Enroll existing student in new semester
     */
    private function enrollExistingStudent(Student $student, Request $request)
    {
        return DB::transaction(function () use ($student, $request) {
            $section = Section::findOrFail($request->section_id);

            // Create new enrollment for this semester
            $enrollment = StudentEnrollment::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'academic_year' => $request->academic_year,
                    'semester' => $request->semester,
                ],
                [
                    'section_id' => $section->id,
                    'enrollment_date' => now(),
                    'status' => 'active',
                    'enrolled_by' => Auth::id(),
                ]
            );

            // Enroll in section subjects
            $this->enrollInSectionSubjects($student->id, $section->id, $request->academic_year, $request->semester);

            // Create payment record
            $this->paymentService->createSemesterPayment($student, $request->academic_year, $request->semester);

            return redirect()->back()->with('success', "Student {$student->user->name} enrolled in {$request->semester} semester successfully!");
        });
    }

    /**
     * Create new student and enroll them
     */
    private function createAndEnrollNewStudent(Request $request)
    {
        // Validate required fields for new student
        $request->validate([
            'student_name' => 'required|string',
            'email' => 'required|email|unique:users,email',
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|string',
            'education_level' => 'required|in:college,shs',
        ]);

        return DB::transaction(function () use ($request) {
            // Create user
            $user = \App\Models\User::create([
                'name' => $request->student_name,
                'email' => $request->email,
                'password' => bcrypt('password123'), // Default password
                'role' => 'student',
                'is_active' => true,
            ]);

            // Create student
            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $request->student_number,
                'program_id' => $request->program_id,
                'current_year_level' => $request->year_level,
                'year_level' => $request->year_level,
                'education_level' => $request->education_level,
                'status' => 'active',
                'enrolled_date' => now(),
            ]);

            $section = Section::findOrFail($request->section_id);

            // Create enrollment
            $enrollment = StudentEnrollment::create([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'enrollment_date' => now(),
                'status' => 'active',
                'enrolled_by' => Auth::id(),
                'academic_year' => $request->academic_year,
                'semester' => $request->semester,
            ]);

            // Enroll in section subjects
            $this->enrollInSectionSubjects($student->id, $section->id, $request->academic_year, $request->semester);

            // Create payment record
            $this->paymentService->createSemesterPayment($student, $request->academic_year, $request->semester);

            return redirect()->back()->with('success', "New student {$student->user->name} created and enrolled successfully! Default password: password123");
        });
    }

    /**
     * Show student enrollment details
     */
    public function show(Student $student, Request $request): Response
    {
        $academicYear = $request->get('academic_year', '2025-2026');
        $semester = $request->get('semester', 'first');

        $student->load([
            'user',
            'program',
            'studentEnrollments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->with('section.program');
            },
            'studentSubjectEnrollments' => function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->with(['sectionSubject.subject', 'sectionSubject.teacher.user']);
            },
        ]);

        // Get available subjects for irregular enrollment
        $availableSubjects = SectionSubject::with(['subject', 'section', 'teacher.user'])
            ->whereHas('section', function ($query) use ($student) {
                $query->where('program_id', $student->program_id);
            })
            ->whereDoesntHave('studentSubjectEnrollments', function ($query) use ($student, $academicYear, $semester) {
                $query->where('student_id', $student->id)
                    ->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->where('status', 'active');
            })
            ->get();

        return Inertia::render('Registrar/Enrollments/Show', [
            'student' => $student,
            'availableSubjects' => $availableSubjects,
            'academicYear' => $academicYear,
            'semester' => $semester,
        ]);
    }

    /**
     * Enroll student in specific subjects (irregular enrollment)
     */
    public function enrollSubjects(Request $request, Student $student)
    {
        $validated = $request->validate([
            'subject_enrollments' => 'required|array|min:1',
            'subject_enrollments.*.section_subject_id' => 'required|exists:section_subjects,id',
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second',
            'enrollment_date' => 'required|date',
            'create_payment_record' => 'boolean',
        ]);

        return DB::transaction(function () use ($student, $validated) {
            $enrolledSubjects = [];

            foreach ($validated['subject_enrollments'] as $subjectEnrollment) {
                // Check if already enrolled in this subject
                $existing = StudentSubjectEnrollment::where([
                    'student_id' => $student->id,
                    'section_subject_id' => $subjectEnrollment['section_subject_id'],
                    'academic_year' => $validated['academic_year'],
                    'semester' => $validated['semester'],
                    'status' => 'active',
                ])->first();

                if (! $existing) {
                    $enrolledSubjects[] = StudentSubjectEnrollment::create([
                        'student_id' => $student->id,
                        'section_subject_id' => $subjectEnrollment['section_subject_id'],
                        'enrollment_type' => 'irregular',
                        'academic_year' => $validated['academic_year'],
                        'semester' => $validated['semester'],
                        'status' => 'active',
                        'enrollment_date' => $validated['enrollment_date'],
                        'enrolled_by' => Auth::id(),
                    ]);
                }
            }

            // Update or create payment record
            if ($validated['create_payment_record'] ?? true) {
                $this->paymentService->createSemesterPayment(
                    $student,
                    $validated['academic_year'],
                    $validated['semester']
                );
            }

            $count = count($enrolledSubjects);

            return redirect()->back()->with('success', "Student enrolled in {$count} subject(s) successfully.");
        });
    }

    /**
     * Unenroll student from enrollment or specific subjects
     */
    public function destroy(Request $request, Student $student)
    {
        $validated = $request->validate([
            'enrollment_id' => 'sometimes|exists:student_enrollments,id',
            'subject_enrollment_id' => 'sometimes|exists:student_subject_enrollments,id',
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second',
        ]);

        return DB::transaction(function () use ($student, $validated) {
            if (isset($validated['enrollment_id'])) {
                // Unenroll from section (regular enrollment)
                $enrollment = StudentEnrollment::findOrFail($validated['enrollment_id']);
                $enrollment->update(['status' => 'dropped']);

                // Also drop all subject enrollments for this period
                StudentSubjectEnrollment::where([
                    'student_id' => $student->id,
                    'academic_year' => $validated['academic_year'],
                    'semester' => $validated['semester'],
                    'enrollment_type' => 'regular',
                ])->update(['status' => 'dropped']);

                $message = 'Student unenrolled from section successfully.';
            } elseif (isset($validated['subject_enrollment_id'])) {
                // Unenroll from specific subject
                $subjectEnrollment = StudentSubjectEnrollment::findOrFail($validated['subject_enrollment_id']);
                $subjectEnrollment->update(['status' => 'dropped']);

                $message = 'Student unenrolled from subject successfully.';
            }

            return redirect()->back()->with('success', $message);
        });
    }

    /**
     * Enroll student in all subjects of a section
     */
    private function enrollInSectionSubjects(int $studentId, int $sectionId, string $academicYear, string $semester): void
    {
        $section = Section::with('sectionSubjects')->findOrFail($sectionId);

        foreach ($section->sectionSubjects as $sectionSubject) {
            StudentSubjectEnrollment::updateOrCreate(
                [
                    'student_id' => $studentId,
                    'section_subject_id' => $sectionSubject->id,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                ],
                [
                    'enrollment_type' => 'regular',
                    'status' => 'active',
                    'enrollment_date' => now(),
                    'enrolled_by' => Auth::id(),
                ]
            );
        }
    }
}
