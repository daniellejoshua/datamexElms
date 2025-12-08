<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
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

        return Inertia::render('Admin/Sections/Create', [
            'programs' => $programs,
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

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function show(Section $section): Response
    {
        $section->load([
            'program',
            'subject',
            'teacherAssignments.teacher.user',
            'studentEnrollments' => function ($query) {
                $query->with('student.user')->where('status', 'active');
            },
            'classSchedules',
        ]);

        // Get available students for enrollment
        $enrolledStudentIds = $section->studentEnrollments()
            ->where('status', 'active')
            ->pluck('student_id');

        $availableStudents = Student::with('user')
            ->whereNotIn('id', $enrolledStudentIds)
            ->where('status', 'active')
            ->orderBy('student_number')
            ->get();

        return Inertia::render('Admin/Sections/Show', [
            'section' => $section,
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

        $section->load(['program', 'sectionSubjects.subject', 'studentEnrollments.student.user']);

        $enrolledStudents = $section->studentEnrollments()
            ->with('student.user')
            ->where('status', 'active')
            ->get();

        $enrolledStudentIds = $enrolledStudents->pluck('student.id')->toArray();

        // Get available students that match the program and enrollment rules
        // Irregular students are exempted from year level restrictions
        $availableStudentsQuery = Student::with(['user', 'program', 'studentEnrollments' => function ($query) {
            $query->where('status', 'active');
        }])
            ->whereNotIn('id', $enrolledStudentIds)
            ->where('program_id', $section->program_id) // Only students from same program
            ->where('status', 'active') // Only active students
            ->where(function ($query) use ($section) {
                // Regular students must match year level, irregular students are exempt
                $query->where('current_year_level', $section->year_level)
                    ->orWhere('student_type', 'irregular');
            });

        // For non-irregular students, exclude those already enrolled in any section for current academic period
        $availableStudents = $availableStudentsQuery->get()->filter(function ($student) use ($section) {
            // If student is irregular, they can be in multiple sections
            if ($student->student_type === 'irregular') {
                return true;
            }

            // For regular students, check if they're already enrolled in any section for this academic period
            $hasActiveEnrollment = $student->studentEnrollments()
                ->where('status', 'active')
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->exists();

            return ! $hasActiveEnrollment;
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
            'section' => $section,
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents->values(), // Reset array keys after filtering
        ]);
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

                // Check if student has any unpaid balances from previous semesters
                $unpaidBalances = StudentSemesterPayment::where('student_id', $studentId)
                    ->where('balance', '>', 0)
                    ->sum('balance');

                if ($unpaidBalances > 0) {
                    $skippedStudents[] = $student->user->name.' (has unpaid balance of ₱'.number_format($unpaidBalances, 2).')';

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

    public function removeStudent(Request $request, Section $section): \Illuminate\Http\JsonResponse
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
                return response()->json(['error' => 'Student not found in this section'], 404);
            }

            $enrollment->update(['status' => 'dropped']);

            \Illuminate\Support\Facades\Log::info('Student removed from section', [
                'student_id' => $request->student_id,
                'section_id' => $section->id,
                'removed_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Student removed successfully']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove student error: '.$e->getMessage(), [
                'section_id' => $section->id,
                'student_id' => $request->student_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'An error occurred while removing the student'], 500);
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
