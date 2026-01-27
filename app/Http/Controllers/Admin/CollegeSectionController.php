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

class CollegeSectionController extends Controller
{
    public function index(Request $request): Response
    {
        // Get current academic period for default filtering
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Section::with(['program', 'subjects', 'sectionSubjects.teacher.user'])
            ->whereHas('program', function ($programQuery) {
                $programQuery->where('education_level', 'college');
            })
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply filters
        $academicYear = $request->get('academic_year', $currentAcademicYear);
        $semester = $request->get('semester', $currentSemester);

        if ($academicYear && $academicYear !== 'all') {
            $query->where('academic_year', $academicYear);
        }

        if ($semester && $semester !== 'all') {
            $query->where('semester', $semester);
        }

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
                    });
            });
        }

        if ($request->has('program_id') && $request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('program_id')
            ->orderBy('section_name')
            ->paginate(6)
            ->withQueryString();

        $programs = Program::where('education_level', 'college')->orderBy('program_code')->get();
        $subjects = Subject::orderBy('subject_code')->get();

        return Inertia::render('Admin/Sections/College/Sections/Index', [
            'sections' => $sections,
            'programs' => $programs,
            'subjects' => $subjects,
            'filters' => array_merge([
                'academic_year' => $academicYear ?? '',
                'semester' => $semester ?? '',
            ], $request->only(['search', 'program_id'])),
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(2, 0),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $programs = Program::where('education_level', 'college')
            ->where('status', 'active')
            ->orderBy('program_code')
            ->get();
        $curricula = \App\Models\Curriculum::where('status', 'active')->with('program')->orderBy('curriculum_code')->get();

        // Get archived sections for reference when creating new sections
        // Get sections from the most recently archived semester (based on archived_at timestamp)
        $mostRecentArchivedSemester = \App\Models\ArchivedSection::selectRaw('academic_year, semester, MAX(archived_at) as latest_archive')
            ->groupBy('academic_year', 'semester')
            ->orderBy('latest_archive', 'desc')
            ->first();

        $archivedSections = collect();
        if ($mostRecentArchivedSemester) {
            $archivedSections = \App\Models\ArchivedSection::with(['archivedEnrollments', 'program'])
                ->where('academic_year', $mostRecentArchivedSemester->academic_year)
                ->where('semester', $mostRecentArchivedSemester->semester)
                ->whereHas('archivedEnrollments', function ($query) {
                    $query->whereNotNull('student_id');
                })
                ->orderBy('section_name')
                ->get();
        }

        return Inertia::render('Admin/Sections/College/Sections/Create', [
            'programs' => $programs,
            'curricula' => $curricula,
            'archivedSections' => $archivedSections,
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(2, 0),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function store(StoreSectionRequest $request): RedirectResponse
    {
        // Validate that the program is college level
        $program = Program::findOrFail($request->program_id);
        if ($program->education_level !== 'college') {
            return back()->withErrors(['program_id' => 'Selected program is not a college program.']);
        }

        // Automatically determine curriculum based on year level guide
        $curriculumId = $request->curriculum_id;
        if (! $curriculumId) {
            // Try to find a year level guide for this program and year level (not filtered by academic year)
            $guide = \App\Models\YearLevelCurriculumGuide::where('program_id', $request->program_id)
                ->where('year_level', $request->year_level)
                ->with('curriculum')
                ->first();

            if ($guide && $guide->curriculum) {
                $curriculumId = $guide->curriculum->id;
            } else {
                // Fallback to program's current curriculum
                $curriculumId = $program->current_curriculum?->id;
            }
        }

        if (! $curriculumId) {
            return back()->withErrors(['curriculum_id' => 'No curriculum found for this program and year level. Please create a year level guide or select a curriculum manually.']);
        }

        $sectionData = $request->validated();
        $sectionData['curriculum_id'] = $curriculumId;

        $section = Section::create($sectionData);

        // Automatically attach subjects from the curriculum that match the section's year level and semester
        $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $curriculumId)
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

        return redirect()->route('admin.college.sections.index')
            ->with('success', 'College section created successfully with subjects attached.');
    }

    public function show(Section $section): Response
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $section->load(['program', 'subjects', 'sectionSubjects.teacher.user', 'studentEnrollments.student.user']);

        return Inertia::render('Admin/Sections/College/Sections/Show', [
            'section' => $section,
        ]);
    }

    public function edit(Section $section): Response
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $programs = Program::where('education_level', 'college')
            ->where('status', 'active')
            ->orderBy('program_code')
            ->get();

        $curricula = \App\Models\Curriculum::where('status', 'active')->with('program')->orderBy('curriculum_code')->get();

        return Inertia::render('Admin/Sections/College/Sections/Edit', [
            'section' => $section->load(['program', 'curriculum']),
            'programs' => $programs,
            'curricula' => $curricula,
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(2, 0),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function update(UpdateSectionRequest $request, Section $section): RedirectResponse
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        // Only allow updating section_name and status
        $section->update([
            'section_name' => $request->section_name,
            'status' => $request->status,
        ]);

        return redirect()->route('admin.college.sections.index')
            ->with('success', 'College section updated successfully.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $section->delete();

        return redirect()->route('admin.college.sections.index')
            ->with('success', 'College section deleted successfully.');
    }

    public function subjects(Section $section): Response
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $section->load(['program', 'sectionSubjects.subject', 'sectionSubjects.teacher.user']);

        $subjects = Subject::where('education_level', 'college')
            ->orderBy('subject_code')
            ->get();

        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Sections/College/Sections/Subjects', [
            'section' => $section,
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function attachSubject(Request $request, Section $section)
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Validate subject is college level
        $subject = Subject::findOrFail($request->subject_id);
        if ($subject->education_level !== 'college') {
            return back()->withErrors(['subject_id' => 'Selected subject is not a college subject.']);
        }

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($request->teacher_id && $request->schedule_days && $request->start_time && $request->end_time) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $request->teacher_id,
                $request->subject_id,
                $section->id,
                $request->schedule_days,
                $request->start_time,
                $request->end_time,
                null,
                $section->academic_year,
                $section->semester
            );

            $validator = validator($request->all(), [
                'teacher_id' => [$teacherConflictRule],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
        }

        $section->sectionSubjects()->create([
            'subject_id' => $request->subject_id,
            'teacher_id' => $request->teacher_id,
            'room' => $request->room,
            'schedule_days' => $request->schedule_days ? json_encode($request->schedule_days) : null,
            'start_time' => $request->start_time,
            'end_time' => $request->end_time,
            'status' => 'active',
        ]);

        return back()->with('success', 'Subject assigned to section successfully.');
    }

    public function updateSubject(Request $request, Section $section, Subject $subject): RedirectResponse
    {
        if ($section->program->education_level !== 'college') {
            abort(404);
        }

        $validated = $request->validate([
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Get the current section subject pivot record for exclusion in conflict check
        $sectionSubject = $section->sectionSubjects()->where('subject_id', $subject->id)->firstOrFail();

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($validated['teacher_id'] && $validated['schedule_days'] && $validated['start_time'] && $validated['end_time']) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $validated['teacher_id'],
                $subject->id,
                $section->id,
                $validated['schedule_days'],
                $validated['start_time'],
                $validated['end_time'],
                $sectionSubject->id, // Exclude current assignment from conflict check
                $section->academic_year,
                $section->semester
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
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        // Get the most recent archived sections (since we now only keep the most recent archived data)
        $mostRecentArchived = ArchivedSection::selectRaw('academic_year, semester')
            ->orderBy('academic_year', 'desc')
            ->orderByRaw("CASE WHEN semester = 'first' THEN 1 WHEN semester = 'second' THEN 2 WHEN semester = 'summer' THEN 3 END DESC")
            ->first();

        $archivedSections = collect();
        if ($mostRecentArchived) {
            $archivedSections = ArchivedSection::with(['archivedEnrollments.student.user', 'program'])
                ->where('academic_year', $mostRecentArchived->academic_year)
                ->where('semester', $mostRecentArchived->semester)
                ->whereHas('archivedEnrollments', function ($query) {
                    $query->whereNotNull('student_id');
                })
                ->orderBy('section_name')
                ->get();

            // Filter to only college sections by checking if they have a program that is college level
            $archivedSections = $archivedSections->filter(function ($section) {
                return $section->program && $section->program->education_level === 'college';
            });
        }

        return Inertia::render('Admin/Sections/College/Sections/CarryForward', [
            'archivedSections' => $archivedSections,
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'previousSemester' => $mostRecentArchived ? $mostRecentArchived->semester : null,
        ]);
    }

    public function carryForward(Request $request): RedirectResponse
    {
        $request->validate([
            'archived_section_id' => 'required|exists:archived_sections,id',
            'section_name' => 'required|string|max:50',
            'academic_year' => 'required|string|max:20',
            'semester' => 'required|in:1st,2nd',
            'student_ids' => 'nullable|array',
            'student_ids.*' => 'exists:students,id',
        ]);

        $archivedSection = ArchivedSection::with(['archivedEnrollments.student'])->findOrFail($request->archived_section_id);

        // Use program and curriculum from archived section
        if (! $archivedSection->program_id || ! $archivedSection->curriculum_id) {
            return back()->withErrors(['archived_section_id' => 'Archived section is missing program or curriculum information.']);
        }

        // Create new section
        $newSection = Section::create([
            'program_id' => $archivedSection->program_id,
            'curriculum_id' => $archivedSection->curriculum_id,
            'section_name' => $request->section_name,
            'year_level' => $archivedSection->year_level,
            'academic_year' => $request->academic_year,
            'semester' => $request->semester,
            'status' => 'active',
        ]);

        // Recreate subjects from archived course data
        $courseData = $archivedSection->course_data;
        if ($courseData) {
            foreach ($courseData as $course) {
                $subject = \App\Models\Subject::where('id', $course['id'])->first();
                if ($subject) {
                    $newSection->sectionSubjects()->create([
                        'subject_id' => $subject->id,
                        'status' => 'active',
                    ]);
                }
            }
        }

        // Enroll students
        $studentIds = $request->student_ids ?? $archivedSection->archivedEnrollments->pluck('student_id')->toArray();

        foreach ($studentIds as $studentId) {
            // Check if student is still active and not already enrolled this semester
            $student = Student::find($studentId);

            if (! $student || $student->status !== 'active') {
                continue;
            }

            // Check for existing enrollment this semester
            $existingEnrollment = StudentEnrollment::where('student_id', $studentId)
                ->where('academic_year', $request->academic_year)
                ->where('semester', $request->semester)
                ->first();

            if (! $existingEnrollment) {
                continue; // Skip students who are not enrolled in the current semester
            }

            // Update the existing enrollment to the new section
            $existingEnrollment->update([
                'section_id' => $newSection->id,
                'enrolled_by' => Auth::id(),
            ]);
        }

        return redirect()->route('admin.college.sections.show', $newSection->id)
            ->with('success', 'Section carried forward successfully with '.count($studentIds).' students enrolled.');
    }

    public function getTeacherSchedule(Request $request, Section $section)
    {
        $teacherId = $request->input('teacher_id');
        $scheduleDays = $request->input('schedule_days');
        if (is_string($scheduleDays)) {
            $scheduleDays = json_decode($scheduleDays, true) ?? [];
        }

        $proposedSchedule = [
            'days' => $scheduleDays,
            'start_time' => $request->input('start_time'),
            'end_time' => $request->input('end_time'),
        ];

        if (! $teacherId) {
            return response()->json(['schedule' => []]);
        }

        $schedule = \App\Models\SectionSubject::with(['section.program', 'subject'])
            ->where('teacher_id', $teacherId)
            ->whereHas('section', function ($query) use ($section) {
                $query->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester);
            })
            ->whereNotNull('schedule_days')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->get()
            ->map(function ($assignment) use ($proposedSchedule) {
                $hasConflict = false;

                if (! empty($proposedSchedule['days']) && $proposedSchedule['start_time'] && $proposedSchedule['end_time']) {
                    // Check day overlap
                    $existingDays = is_array($assignment->schedule_days)
                        ? $assignment->schedule_days
                        : json_decode($assignment->schedule_days, true) ?? [];

                    $dayOverlap = count(array_intersect($proposedSchedule['days'], $existingDays)) > 0;

                    if ($dayOverlap) {
                        // Check time overlap
                        $proposedStart = \Carbon\Carbon::parse($proposedSchedule['start_time']);
                        $proposedEnd = \Carbon\Carbon::parse($proposedSchedule['end_time']);
                        $existingStart = \Carbon\Carbon::parse($assignment->start_time);
                        $existingEnd = \Carbon\Carbon::parse($assignment->end_time);

                        $hasConflict = $proposedStart->lt($existingEnd) && $proposedEnd->gt($existingStart);
                    }
                }

                return [
                    'id' => $assignment->id,
                    'subject_code' => $assignment->subject->subject_code,
                    'subject_name' => $assignment->subject->subject_name,
                    'section' => $assignment->section->program->program_code.'-'.$assignment->section->year_level.$assignment->section->section_name,
                    'room' => $assignment->room,
                    'schedule_days' => is_array($assignment->schedule_days)
                        ? $assignment->schedule_days
                        : json_decode($assignment->schedule_days, true) ?? [],
                    'start_time' => $assignment->start_time,
                    'end_time' => $assignment->end_time,
                    'has_conflict' => $hasConflict,
                ];
            });

        return response()->json([
            'schedule' => $schedule,
            'proposed' => $proposedSchedule,
        ]);
    }
}
