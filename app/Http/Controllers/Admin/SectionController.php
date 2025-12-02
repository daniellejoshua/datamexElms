<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Rules\TeacherScheduleConflict;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            if (!$hasAnyFilter) {
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
            if (!$hasAnyFilter) {
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
        $section->load(['program', 'sectionSubjects.subject', 'studentEnrollments.student.user']);

        $enrolledStudents = $section->studentEnrollments()
            ->with('student.user')
            ->where('status', 'active')
            ->get();

        $enrolledStudentIds = $enrolledStudents->pluck('student.id')->toArray();

        $availableStudents = Student::with('user')
            ->whereNotIn('id', $enrolledStudentIds)
            ->get();

        return Inertia::render('Admin/Sections/Students', [
            'section' => $section,
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function enrollStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:students,id',
        ]);

        $enrolledCount = 0;
        $alreadyEnrolled = [];

        foreach ($request->student_ids as $studentId) {
            // Check if student is already enrolled in this section
            $existingEnrollment = StudentEnrollment::where('student_id', $studentId)
                ->where('section_id', $section->id)
                ->where('status', 'active')
                ->first();

            if ($existingEnrollment) {
                $student = Student::with('user')->find($studentId);
                $alreadyEnrolled[] = $student->user->name;

                continue;
            }

            StudentEnrollment::create([
                'student_id' => $studentId,
                'section_id' => $section->id,
                'enrollment_date' => now()->toDateString(),
                'enrolled_by' => Auth::id(),
                'status' => 'active',
                'academic_year' => $section->academic_year,
                'semester' => $section->semester,
            ]);

            $enrolledCount++;
        }

        $message = '';
        if ($enrolledCount > 0) {
            $message = "{$enrolledCount} student(s) enrolled successfully.";
        }

        if (! empty($alreadyEnrolled)) {
            $names = implode(', ', $alreadyEnrolled);
            $message .= " Note: {$names} ".(count($alreadyEnrolled) === 1 ? 'is' : 'are').' already enrolled.';
        }

        return redirect()->back()->with('success', trim($message));
    }

    public function unenrollStudent(StudentEnrollment $enrollment): RedirectResponse
    {
        $enrollment->update(['status' => 'dropped']);

        return redirect()->back()
            ->with('success', 'Student unenrolled successfully.');
    }
}
