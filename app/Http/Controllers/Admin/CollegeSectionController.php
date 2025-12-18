<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Subject;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
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
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
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

        return Inertia::render('Admin/Sections/College/Sections/Create', [
            'programs' => $programs,
            'curricula' => $curricula,
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
        // Validate that the program is college level
        $program = Program::findOrFail($request->program_id);
        if ($program->education_level !== 'college') {
            return back()->withErrors(['program_id' => 'Selected program is not a college program.']);
        }

        // Automatically determine curriculum based on year level guide
        $curriculumId = $request->curriculum_id;
        if (! $curriculumId) {
            $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
            $guide = \App\Models\YearLevelCurriculumGuide::where('program_id', $request->program_id)
                ->where('academic_year', $currentAcademicYear)
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
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
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
}
