<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\ArchivedSection;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Rules\TeacherScheduleConflict;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function index(Request $request): Response
    {
        // Get current academic period for default filtering
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Section::with(['program', 'subjects', 'sectionSubjects.teacher.user'])
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply filters with defaults
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('section_name', 'like', '%'.$request->search.'%')
                    ->orWhereHas('subjects', function ($subjectQuery) use ($request) {
                        $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('program', function ($programQuery) use ($request) {
                        $programQuery->where('program_name', 'like', '%'.$request->search.'%')
                            ->orWhere('program_code', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('sectionSubjects', function ($sectionSubjectQuery) use ($request) {
                        $sectionSubjectQuery->where('room', 'like', '%'.$request->search.'%');
                    });
            });
        }

        if ($request->has('program_id') && $request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->whereHas('subjects', function ($subjectQuery) use ($request) {
                $subjectQuery->where('subjects.id', $request->subject_id);
            });
        }

        // Only apply academic year filter if explicitly provided
        // Don't apply default if user chose "All" (which removes the parameter)
        if ($request->has('academic_year')) {
            $academicYear = $request->get('academic_year');
            if ($academicYear) {
                $query->where('academic_year', $academicYear);
            }
        } else {
            // Only apply default on first load (no filters at all)
            $hasAnyFilter = $request->has('semester') || $request->has('search') || $request->has('program_id') || $request->has('subject_id');
            if (! $hasAnyFilter) {
                $academicYear = $currentAcademicYear;
                $query->where('academic_year', $academicYear);
            } else {
                $academicYear = null;
            }
        }

        // Only apply semester filter if explicitly provided
        // Don't apply default if user chose "All" (which removes the parameter)
        if ($request->has('semester')) {
            $semester = $request->get('semester');
            if ($semester) {
                $query->where('semester', $semester);
            }
        } else {
            // Only apply default on first load (no filters at all)
            $hasAnyFilter = $request->has('academic_year') || $request->has('search') || $request->has('program_id') || $request->has('subject_id');
            if (! $hasAnyFilter) {
                $semester = $currentSemester;
                $query->where('semester', $semester);
            } else {
                $semester = null;
            }
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('program_id')
            ->orderBy('section_name')
            ->paginate(15)
            ->withQueryString();

        $programs = Program::orderBy('program_code')->get();
        $subjects = Subject::orderBy('subject_code')->get();

        return Inertia::render('Admin/Sections/Index', [
            'sections' => $sections,
            'programs' => $programs,
            'subjects' => $subjects,
            'filters' => array_merge([
                'academic_year' => $academicYear ?? '',
                'semester' => $semester ?? '',
            ], $request->only(['search', 'program_id', 'subject_id'])),
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        // Get current academic period
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $programs = Program::where('status', 'active')->orderBy('program_code')->get();
        $curricula = \App\Models\Curriculum::where('status', 'active')->with('program')->orderBy('curriculum_code')->get();

        // Get archived sections for reference when creating new sections
        $archivedSections = \App\Models\ArchivedSection::with(['archivedEnrollments'])
            ->whereHas('archivedEnrollments', function ($query) {
                $query->whereNotNull('student_id');
            })
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->limit(50)
            ->get();

        return Inertia::render('Admin/Sections/Create', [
            'programs' => $programs,
            'curricula' => $curricula,
            'archivedSections' => $archivedSections,
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function store(StoreSectionRequest $request): RedirectResponse
    {
        $section = Section::create($request->validated());

        // Automatically attach subjects from the curriculum that match the section's year level and semester
        if ($request->curriculum_id) {
            $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $request->curriculum_id)
                ->where('year_level', $request->year_level)
                ->where('semester', $request->semester)
                ->where('status', 'active')
                ->get();

            foreach ($curriculumSubjects as $curriculumSubject) {
                $section->sectionSubjects()->create([
                    'subject_id' => $curriculumSubject->subject_id,
                    'status' => 'active',
                ]);
            }
        }

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function show(Section $section): Response
    {
        $section->load([
            'program',
            'teacherAssignments.teacher.user',
            'studentEnrollments' => function ($query) {
                $query->with('student.user')->where('status', 'active');
            },
            'classSchedules',
        ]);

        // Load section subjects with relationships
        $sectionSubjects = $section->sectionSubjects()->with(['subject', 'teacher.user'])->get();

        // Get available students for enrollment
        $enrolledStudentIds = $section->studentEnrollments()
            ->where('status', 'active')
            ->pluck('student_id');

        // Get available students that match the program and enrollment rules
        // Only show students who are enrolled in the current academic period
        $availableStudentsQuery = Student::with(['user', 'program', 'studentEnrollments' => function ($query) use ($section) {
            $query->where('status', 'active')
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester);
        }])
            ->whereNotIn('id', $enrolledStudentIds)
            ->where('program_id', $section->program_id) // Only students from same program
            ->where('curriculum_id', $section->curriculum_id) // Only students from same curriculum
            ->where('status', 'active') // Only active students
            ->where(function ($query) use ($section) {
                // Regular students must match year level, irregular students are exempt
                $query->where('current_year_level', $section->year_level)
                    ->orWhere('student_type', 'irregular');
            })
            ->whereHas('studentEnrollments', function ($query) use ($section) {
                // Only students enrolled in the current academic period
                $query->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'active');
            });

        // For non-irregular students, exclude those already enrolled in THIS SPECIFIC section for current academic period
        $availableStudents = $availableStudentsQuery->get()->filter(function ($student) use ($section) {
            // If student is irregular, they can be in multiple sections
            if ($student->student_type === 'irregular') {
                return true;
            }

            // For regular students, check if they're already enrolled in THIS SPECIFIC section for this academic period
            $hasActiveEnrollmentInThisSection = $student->studentEnrollments()
                ->where('status', 'active')
                ->where('section_id', $section->id)
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->exists();

            return ! $hasActiveEnrollmentInThisSection;
        });

        return Inertia::render('Admin/Sections/Show', [
            'section' => $section,
            'sectionSubjects' => $sectionSubjects,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function edit(Section $section): Response
    {
        $section->load('program');
        $programs = Program::where('status', 'active')->orderBy('program_code')->get();

        return Inertia::render('Admin/Sections/Edit', [
            'section' => $section,
            'programs' => $programs,
        ]);
    }

    public function update(UpdateSectionRequest $request, Section $section): RedirectResponse
    {
        $section->update($request->validated());

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section updated successfully.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        // Check if section has active enrollments
        $hasActiveEnrollments = $section->studentEnrollments()
            ->where('status', 'active')
            ->exists();

        if ($hasActiveEnrollments) {
            return redirect()->back()
                ->with('error', 'Cannot delete section with active enrollments.');
        }

        $section->delete();

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section deleted successfully.');
    }

    public function subjects(Section $section): Response
    {
        $section->load(['program', 'sectionSubjects.subject', 'sectionSubjects.teacher.user']);

        $subjects = Subject::where('status', 'active')
            ->orderBy('subject_code')
            ->get();

        $teachers = Teacher::with('user')
            ->where('status', 'active')
            ->get();

        return Inertia::render('Admin/Sections/Subjects', [
            'section' => $section,
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function attachSubject(Request $request, Section $section): RedirectResponse
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($validated['teacher_id'] && $validated['schedule_days'] && $validated['start_time'] && $validated['end_time']) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $validated['teacher_id'],
                $validated['subject_id'],
                $section->id,
                $validated['schedule_days'],
                $validated['start_time'],
                $validated['end_time']
            );

            $validator = validator($validated, [
                'teacher_id' => [$teacherConflictRule],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
        }

        // Check if subject is already attached
        if ($section->subjects()->where('subject_id', $validated['subject_id'])->exists()) {
            return back()->withErrors(['subject_id' => 'This subject is already assigned to this section.']);
        }

        $section->subjects()->attach($validated['subject_id'], [
            'teacher_id' => $validated['teacher_id'],
            'room' => $validated['room'],
            'schedule_days' => $validated['schedule_days'] ? json_encode($validated['schedule_days']) : null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'active',
        ]);

        // Get the newly created section subject
        $sectionSubject = $section->sectionSubjects()->where('subject_id', $validated['subject_id'])->first();

        // Enroll all active students in this section to this new subject
        $activeEnrollments = StudentEnrollment::where('section_id', $section->id)
            ->where('status', 'active')
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->get();

        foreach ($activeEnrollments as $enrollment) {
            // Check if student is already enrolled in this subject
            $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                'student_id' => $enrollment->student_id,
                'section_subject_id' => $sectionSubject->id,
                'academic_year' => $section->academic_year,
                'semester' => $section->semester,
            ])->first();

            if (! $existingSubjectEnrollment) {
                StudentSubjectEnrollment::create([
                    'student_id' => $enrollment->student_id,
                    'section_subject_id' => $sectionSubject->id,
                    'enrollment_type' => 'regular',
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                    'enrollment_date' => now(),
                    'enrolled_by' => Auth::id(),
                ]);
            }
        }

        return back()->with('success', 'Subject assigned to section successfully.');
    }

    public function updateSubject(Request $request, Section $section, Subject $subject): RedirectResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Get the current section subject for exclusion in conflict check
        $sectionSubject = $section->subjects()->where('subject_id', $subject->id)->firstOrFail();

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($validated['teacher_id'] && $validated['schedule_days'] && $validated['start_time'] && $validated['end_time']) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $validated['teacher_id'],
                $subject->id,
                $section->id,
                $validated['schedule_days'],
                $validated['start_time'],
                $validated['end_time'],
                $sectionSubject->id // Exclude current assignment from conflict check
            );

            $validator = validator($validated, [
                'teacher_id' => [$teacherConflictRule],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
        }

        $section->subjects()->updateExistingPivot($subject->id, [
            'teacher_id' => $validated['teacher_id'],
            'room' => $validated['room'],
            'schedule_days' => $validated['schedule_days'] ? json_encode($validated['schedule_days']) : null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        return back()->with('success', 'Subject schedule updated successfully.');
    }

    public function detachSubject(Section $section, Subject $subject): RedirectResponse
    {
        $section->subjects()->detach($subject->id);

        return back()->with('success', 'Subject removed from section successfully.');
    }

    public function students(Section $section): Response
    {
        \Illuminate\Support\Facades\Log::info('Students page accessed', [
            'section_id' => $section->id,
            'user_id' => Auth::id(),
            'user_name' => Auth::user() ? Auth::user()->name : 'Not authenticated',
            'timestamp' => now(),
        ]);

        // Get current academic period
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $section->load(['program', 'sectionSubjects.subject', 'studentEnrollments.student.user']);

        $enrolledStudents = $section->studentEnrollments()
            ->with('student.user')
            ->where('status', 'active')
            ->get();

        $enrolledStudentIds = $enrolledStudents->pluck('student.id')->toArray();

        // Get available students that match the program and enrollment rules
        // Only show students who are enrolled in the current academic period
        $availableStudentsQuery = Student::with(['user', 'program', 'studentEnrollments' => function ($query) use ($section) {
            $query->where('status', 'active')
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester);
        }])
            ->whereNotIn('id', $enrolledStudentIds)
            ->where('program_id', $section->program_id) // Only students from same program
            ->where('curriculum_id', $section->curriculum_id) // Only students from same curriculum
            ->where('status', 'active') // Only active students
            ->where(function ($query) use ($section) {
                // Regular students must match year level, irregular students are exempt
                $query->where('current_year_level', $section->year_level)
                    ->orWhere('student_type', 'irregular');
            })
            ->whereHas('studentEnrollments', function ($query) use ($section) {
                // Only students enrolled in the current academic period
                $query->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'active');
            });

        // For non-irregular students, exclude those already enrolled in THIS SPECIFIC section for current academic period
        $availableStudents = $availableStudentsQuery->get()->filter(function ($student) use ($section) {
            // If student is irregular, they can be in multiple sections
            if ($student->student_type === 'irregular') {
                return true;
            }

            // For regular students, check if they're already enrolled in THIS SPECIFIC section for this academic period
            $hasActiveEnrollmentInThisSection = $student->studentEnrollments()
                ->where('status', 'active')
                ->where('section_id', $section->id)
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->exists();

            return ! $hasActiveEnrollmentInThisSection;
        });

        // Debug logging
        \Illuminate\Support\Facades\Log::info('Students data prepared', [
            'section_id' => $section->id,
            'section_name' => $section->section_name,
            'section_program_id' => $section->program_id,
            'section_year_level' => $section->year_level,
            'enrolled_students_count' => $enrolledStudents->count(),
            'available_students_count' => $availableStudents->count(),
            'enrolled_student_ids' => $enrolledStudentIds,
            'available_student_sample' => $availableStudents->take(3)->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'student_number' => $student->student_number,
                    'program_id' => $student->program_id,
                    'year_level' => $student->current_year_level,
                    'student_type' => $student->student_type,
                ];
            }),
        ]);

        return Inertia::render('Admin/Sections/Students', [
            'section' => array_merge($section->toArray(), [
                'current_academic_year' => $currentAcademicYear,
                'current_semester' => $currentSemester,
            ]),
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents->values(), // Reset array keys after filtering
            'canCarryForward' => $this->canCarryForwardStudents($section),
        ]);
    }

    /**
     * Check if this section can carry forward students from an archived section
     */
    protected function canCarryForwardStudents(Section $section): bool
    {
        // Check for archived section with same year level (repeating students)
        $sameYearArchived = ArchivedSection::where('section_name', $section->section_name)
            ->where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->orderBy('archived_at', 'desc')
            ->first();

        if ($sameYearArchived) {
            return true;
        }

        // Check for archived section from previous year level (students progressing)
        $previousYearLevel = $section->year_level - 1;
        if ($previousYearLevel > 0) {
            $previousYearArchived = ArchivedSection::where('section_name', $section->section_name)
                ->where('program_id', $section->program_id)
                ->where('year_level', $previousYearLevel)
                ->orderBy('archived_at', 'desc')
                ->first();

            if ($previousYearArchived) {
                return true;
            }
        }

        return false;
    }

    /**
     * Carry forward students from the last archived version of this section
     * Handles both:
     * 1. Same year level (repeating students)
     * 2. Previous year level (students progressing to next year)
     */
    public function carryForwardStudents(Section $section)
    {
        try {
            $archivedSection = null;
            $isProgression = false;

            // Determine which archived section to look for based on semester progression
            if ($section->semester === '1st') {
                // For 1st semester sections, look for students progressing from previous year (2nd semester)
                $previousYearLevel = $section->year_level - 1;
                if ($previousYearLevel > 0) {
                    $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                        ->where('section_name', $section->section_name)
                        ->where('program_id', $section->program_id)
                        ->where('year_level', $previousYearLevel)
                        ->where('semester', 'second') // Look for 2nd semester of previous year
                        ->orderBy('archived_at', 'desc')
                        ->first();

                    if ($archivedSection) {
                        $isProgression = true;
                    }
                }
            } else {
                // For 2nd semester sections, look for continuing students from same year (1st semester)
                $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                    ->where('section_name', $section->section_name)
                    ->where('program_id', $section->program_id)
                    ->where('year_level', $section->year_level)
                    ->where('semester', 'first') // Look for 1st semester of same year
                    ->orderBy('archived_at', 'desc')
                    ->first();
            }

            // Fallback: if no specific semester match found, try the old logic
            if (! $archivedSection) {
                // First try to find archived section with same year level
                $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                    ->where('section_name', $section->section_name)
                    ->where('program_id', $section->program_id)
                    ->where('year_level', $section->year_level)
                    ->orderBy('archived_at', 'desc')
                    ->first();

                // If no same-year section found, look for previous year level (student progression)
                if (! $archivedSection) {
                    $previousYearLevel = $section->year_level - 1;
                    if ($previousYearLevel > 0) {
                        $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                            ->where('section_name', $section->section_name)
                            ->where('program_id', $section->program_id)
                            ->where('year_level', $previousYearLevel)
                            ->orderBy('archived_at', 'desc')
                            ->first();

                        if ($archivedSection) {
                            $isProgression = true;
                        }
                    }
                }
            }

            if (! $archivedSection) {
                return response()->json([
                    'success' => false,
                    'message' => 'No archived section found to carry forward students from.',
                    'data' => [
                        'enrolled' => [],
                        'skipped' => [],
                        'not_enrolled' => [],
                        'year_level_mismatch' => [],
                        'archived_students' => [],
                        'is_progression' => false,
                    ],
                ]);
            }

            // Get all archived students for display
            $archivedStudents = $archivedSection->archivedEnrollments
                ->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->student_id,
                        'name' => $enrollment->student->user->name ?? 'Unknown Student',
                        'student_number' => $enrollment->student->student_number ?? '',
                        'year_level' => $enrollment->student->current_year_level ?? '',
                    ];
                })
                ->sortBy('name')
                ->values()
                ->toArray();

            $enrolledStudents = [];
            $skippedStudents = [];
            $notEnrolledStudents = [];
            $yearLevelMismatch = [];

            // Get all students who were enrolled in the archived section
            $archivedStudentIds = $archivedSection->archivedEnrollments
                ->pluck('student_id')
                ->unique()
                ->toArray();

            foreach ($archivedStudentIds as $studentId) {
                $student = Student::with('user')->find($studentId);

                if (! $student) {
                    $skippedStudents[] = [
                        'id' => $studentId,
                        'name' => "Student ID {$studentId}",
                        'reason' => 'not found',
                    ];

                    continue;
                }

                // Check if student's current year level matches the section's year level
                // This is important for progression - students who progressed should match
                if ($student->current_year_level != $section->year_level && $student->student_type !== 'irregular') {
                    $yearLevelMismatch[] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'current_year_level' => $student->current_year_level,
                        'section_year_level' => $section->year_level,
                        'reason' => 'year level mismatch',
                    ];

                    continue;
                }

                // Skip students who are not enrolled in the current semester OR are already in a current section
                $isCurrentlyEnrolled = StudentEnrollment::where('student_id', $studentId)
                    ->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'active')
                    ->exists();

                if (! $isCurrentlyEnrolled) {
                    $notEnrolledStudents[] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'reason' => 'not enrolled in current semester',
                    ];

                    continue;
                }

                // Check if student is already enrolled in any section for the current semester
                $existingEnrollment = StudentEnrollment::where([
                    'student_id' => $studentId,
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ])->first();

                if ($existingEnrollment) {
                    $conflictSection = Section::with('program')->find($existingEnrollment->section_id);
                    $skippedStudents[] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'reason' => 'already enrolled in '.($conflictSection ? $conflictSection->section_name : 'another section'),
                    ];

                    continue;
                }

                // Create the enrollment record
                StudentEnrollment::create([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ]);

                // Automatically enroll student in all section subjects
                $sectionSubjects = SectionSubject::where('section_id', $section->id)
                    ->where('status', 'active')
                    ->get();

                foreach ($sectionSubjects as $sectionSubject) {
                    $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                        'student_id' => $studentId,
                        'section_subject_id' => $sectionSubject->id,
                        'academic_year' => $section->academic_year,
                        'semester' => $section->semester,
                    ])->first();

                    if (! $existingSubjectEnrollment) {
                        StudentSubjectEnrollment::create([
                            'student_id' => $studentId,
                            'section_subject_id' => $sectionSubject->id,
                            'enrollment_type' => 'regular',
                            'academic_year' => $section->academic_year,
                            'semester' => $section->semester,
                            'status' => 'active',
                            'enrollment_date' => now(),
                            'enrolled_by' => Auth::id(),
                        ]);
                    }
                }

                // Ensure student has payment records
                $student->ensurePaymentRecords($section->academic_year, $section->semester);

                $enrolledStudents[] = [
                    'id' => $student->id,
                    'name' => $student->user->name,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Carry forward operation completed',
                'data' => [
                    'enrolled' => $enrolledStudents,
                    'skipped' => $skippedStudents,
                    'not_enrolled' => $notEnrolledStudents,
                    'year_level_mismatch' => $yearLevelMismatch,
                    'archived_students' => $archivedStudents,
                    'is_progression' => $isProgression,
                    'archived_section' => [
                        'name' => $archivedSection->section_name,
                        'year_level' => $archivedSection->year_level,
                        'academic_year' => $archivedSection->academic_year,
                        'semester' => $archivedSection->semester,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Carry forward students failed', [
                'section_id' => $section->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to carry forward students: '.$e->getMessage(),
                'data' => [
                    'enrolled' => [],
                    'skipped' => [],
                    'not_enrolled' => [],
                    'year_level_mismatch' => [],
                    'archived_students' => [],
                    'is_progression' => false,
                ],
            ]);
        }
    }

    public function enrollStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:students,id',
        ]);

        $enrolledStudents = [];
        $skippedStudents = [];
        $errorStudents = [];

        try {
            foreach ($request->student_ids as $studentId) {
                $student = Student::with('user')->find($studentId);

                if (! $student) {
                    $errorStudents[] = "Student ID {$studentId} not found";

                    continue;
                }

                // Check if student belongs to the same program as the section
                if ($student->program_id !== $section->program_id) {
                    $skippedStudents[] = $student->user->name.' (program mismatch)';

                    continue;
                }

                // Check if student is in the same year level as the section (exempt irregular students)
                if ($student->student_type !== 'irregular' && $student->current_year_level != $section->year_level) {
                    $skippedStudents[] = $student->user->name.' (year level mismatch)';

                    continue;
                }

                // Check if student is already enrolled in this section
                $existingEnrollment = StudentEnrollment::where([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'status' => 'active',
                ])->first();

                if ($existingEnrollment) {
                    $skippedStudents[] = $student->user->name.' (already enrolled in this section)';

                    continue;
                }

                // Check if student is already enrolled in another section for the same academic period
                $conflictingEnrollment = StudentEnrollment::where([
                    'student_id' => $studentId,
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ])->whereNot('section_id', $section->id)->first();

                if ($conflictingEnrollment) {
                    $conflictSection = Section::with('program')->find($conflictingEnrollment->section_id);
                    $skippedStudents[] = $student->user->name.' (already enrolled in '.
                        $conflictSection->program->program_code.' Year '.
                        $conflictSection->year_level.' Section '.
                        $conflictSection->section_name.')';

                    continue;
                }

                // Create the enrollment record
                $enrollment = StudentEnrollment::create([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ]);

                // Automatically enroll student in all section subjects (for regular enrollment)
                $sectionSubjects = SectionSubject::where('section_id', $section->id)
                    ->where('status', 'active')
                    ->get();

                foreach ($sectionSubjects as $sectionSubject) {
                    // Check if student is already enrolled in this subject
                    $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                        'student_id' => $studentId,
                        'section_subject_id' => $sectionSubject->id,
                        'academic_year' => $section->academic_year,
                        'semester' => $section->semester,
                    ])->first();

                    if (! $existingSubjectEnrollment) {
                        StudentSubjectEnrollment::create([
                            'student_id' => $studentId,
                            'section_subject_id' => $sectionSubject->id,
                            'enrollment_type' => 'regular',
                            'academic_year' => $section->academic_year,
                            'semester' => $section->semester,
                            'status' => 'active',
                            'enrollment_date' => now(),
                            'enrolled_by' => Auth::id(),
                        ]);
                    }
                }

                // Ensure student has payment records for the academic year/semester
                $student->ensurePaymentRecords($section->academic_year, $section->semester);

                $enrolledStudents[] = $student->user->name;
            }

            // Build success/info messages
            $messages = [];

            if (! empty($enrolledStudents)) {
                $messages[] = count($enrolledStudents).' student(s) enrolled successfully: '.implode(', ', $enrolledStudents);
            }

            if (! empty($skippedStudents)) {
                $messages[] = 'Skipped '.count($skippedStudents).' student(s): '.implode(', ', $skippedStudents);
            }

            if (! empty($errorStudents)) {
                $messages[] = 'Errors: '.implode(', ', $errorStudents);
            }

            if (empty($enrolledStudents)) {
                return redirect()->back()->with('warning', 'No students were enrolled. '.implode(' | ', $messages));
            }

            return redirect()->back()->with('success', implode(' | ', $messages));

        } catch (\Exception $e) {
            Log::error('Student enrollment failed', [
                'section_id' => $section->id,
                'student_ids' => $request->student_ids,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to enroll students: '.$e->getMessage());
        }
    }

    public function removeStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        try {
            $enrollment = StudentEnrollment::where('section_id', $section->id)
                ->where('student_id', $request->student_id)
                ->where('status', 'active')
                ->first();

            if (! $enrollment) {
                return redirect()->back()->with('error', 'Student not found in this section');
            }

            $enrollment->update(['status' => 'dropped']);

            \Illuminate\Support\Facades\Log::info('Student removed from section', [
                'student_id' => $request->student_id,
                'section_id' => $section->id,
                'removed_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'Student removed successfully');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove student error: '.$e->getMessage(), [
                'section_id' => $section->id,
                'student_id' => $request->student_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'An error occurred while removing the student');
        }
    }

    public function unenrollStudent(StudentEnrollment $enrollment): RedirectResponse
    {
        $enrollment->update(['status' => 'dropped']);

        return redirect()->back()
            ->with('success', 'Student unenrolled successfully.');
    }

    /**
     * Show subject-specific enrollment form for irregular students
     */
    public function subjectEnrollment(Section $section, Student $student): Response
    {
        // Ensure this is for irregular students
        if ($student->student_type !== 'irregular') {
            abort(403, 'Subject-level enrollment is only available for irregular students.');
        }

        $section->load(['program', 'sectionSubjects.subject']);

        // Get subjects in this section that the student is not already enrolled in
        $enrolledSubjectIds = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->where('status', 'active')
            ->whereHas('sectionSubject', function ($query) use ($section) {
                $query->where('section_id', $section->id);
            })
            ->pluck('section_subject_id')
            ->toArray();

        $availableSubjects = $section->sectionSubjects()
            ->with(['subject', 'teacher.user'])
            ->whereNotIn('id', $enrolledSubjectIds)
            ->where('status', 'active')
            ->get();

        $currentEnrollments = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->where('status', 'active')
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
            ->whereHas('sectionSubject', function ($query) use ($section) {
                $query->where('section_id', $section->id);
            })
            ->get();

        return Inertia::render('Admin/Sections/SubjectEnrollment', [
            'section' => $section,
            'student' => $student->load('user'),
            'availableSubjects' => $availableSubjects,
            'currentEnrollments' => $currentEnrollments,
        ]);
    }

    /**
     * Enroll irregular student in specific subjects
     */
    public function enrollStudentInSubjects(Request $request, Section $section, Student $student): RedirectResponse
    {
        // Ensure this is for irregular students
        if ($student->student_type !== 'irregular') {
            return redirect()->back()->withErrors(['error' => 'Subject-level enrollment is only available for irregular students.']);
        }

        $request->validate([
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => 'required|exists:section_subjects,id',
        ]);

        try {
            $enrollmentsToCreate = [];
            $alreadyEnrolled = [];
            $enrolledCount = 0;

            foreach ($request->subject_ids as $sectionSubjectId) {
                // Check if already enrolled in this subject
                $existingEnrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('section_subject_id', $sectionSubjectId)
                    ->where('status', 'active')
                    ->first();

                if ($existingEnrollment) {
                    $sectionSubject = SectionSubject::with('subject')->find($sectionSubjectId);
                    $alreadyEnrolled[] = $sectionSubject->subject->subject_name;

                    continue;
                }

                $enrollmentsToCreate[] = [
                    'student_id' => $student->id,
                    'section_subject_id' => $sectionSubjectId,
                    'enrollment_type' => 'irregular',
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now()->toDateString(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $enrolledCount++;
            }

            if (! empty($enrollmentsToCreate)) {
                StudentSubjectEnrollment::insert($enrollmentsToCreate);
            }

            $messages = [];
            if ($enrolledCount > 0) {
                $messages[] = "Student enrolled in {$enrolledCount} subject(s) successfully.";
            }

            if (! empty($alreadyEnrolled)) {
                $names = implode(', ', $alreadyEnrolled);
                $messages[] = "Already enrolled in: {$names}";
            }

            $message = implode(' | ', $messages);
            $type = $enrolledCount > 0 ? 'success' : 'warning';

            return redirect()->back()->with($type, $message ?: 'No subjects were enrolled.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Subject enrollment error: '.$e->getMessage(), [
                'section_id' => $section->id,
                'student_id' => $student->id,
                'subject_ids' => $request->subject_ids,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'An error occurred during subject enrollment. Please try again.');
        }
    }

    /**
     * Remove irregular student from specific subject
     */
    public function removeStudentFromSubject(Request $request, Section $section, Student $student): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'section_subject_id' => 'required|exists:section_subjects,id',
        ]);

        try {
            $enrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('section_subject_id', $request->section_subject_id)
                ->where('status', 'active')
                ->first();

            if (! $enrollment) {
                return response()->json(['error' => 'Student not enrolled in this subject'], 404);
            }

            $enrollment->update(['status' => 'dropped']);

            \Illuminate\Support\Facades\Log::info('Student removed from subject', [
                'student_id' => $student->id,
                'section_subject_id' => $request->section_subject_id,
                'removed_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Student removed from subject successfully']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove student from subject error: '.$e->getMessage(), [
                'student_id' => $student->id,
                'section_subject_id' => $request->section_subject_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'An error occurred while removing the student from subject'], 500);
        }
    }
}
