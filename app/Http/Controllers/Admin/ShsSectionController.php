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

class ShsSectionController extends Controller
{
    public function index(Request $request): Response
    {
        // Get current academic period for default filtering
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Section::with(['program', 'subjects', 'sectionSubjects.teacher.user'])
            ->whereHas('program', function ($programQuery) {
                $programQuery->where('education_level', 'shs');
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
                            ->orWhere('program_code', 'like', '%'.$request->search.'%')
                            ->orWhere('track', 'like', '%'.$request->search.'%');
                    });
            });
        }

        if ($request->has('program_id') && $request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->has('track') && $request->track) {
            $query->whereHas('program', function ($programQuery) use ($request) {
                $programQuery->where('track', $request->track);
            });
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('program_id')
            ->orderBy('section_name')
            ->paginate(6)
            ->withQueryString();

        $programs = Program::where('education_level', 'shs')->orderBy('track')->orderBy('program_code')->get();
        $subjects = Subject::where('education_level', 'shs')->orderBy('subject_code')->get();
        $tracks = Program::where('education_level', 'shs')->distinct()->pluck('track')->filter();

        return Inertia::render('Admin/Sections/Shs/Sections/Index', [
            'sections' => $sections,
            'programs' => $programs,
            'subjects' => $subjects,
            'tracks' => $tracks,
            'filters' => array_merge([
                'academic_year' => $academicYear ?? '',
                'semester' => $semester ?? '',
            ], $request->only(['search', 'program_id', 'track'])),
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

        $programs = Program::where('education_level', 'shs')
            ->where('status', 'active')
            ->orderBy('track')
            ->orderBy('program_code')
            ->get();

        return Inertia::render('Admin/Sections/Shs/Sections/Create', [
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
        // Validate that the program is SHS level
        $program = Program::findOrFail($request->program_id);
        if ($program->education_level !== 'shs') {
            return back()->withErrors(['program_id' => 'Selected program is not an SHS program.']);
        }

        $section = Section::create($request->validated());

        return redirect()->route('admin.shs.sections.index')
            ->with('success', 'SHS section created successfully.');
    }

    public function show(Section $section): Response
    {
        if ($section->program->education_level !== 'shs') {
            abort(404);
        }

        $section->load(['program', 'subjects', 'sectionSubjects.teacher.user', 'studentEnrollments.student.user']);

        return Inertia::render('Admin/Sections/Shs/Sections/Show', [
            'section' => $section,
        ]);
    }

    public function edit(Section $section): Response
    {
        if ($section->program->education_level !== 'shs') {
            abort(404);
        }

        $programs = Program::where('education_level', 'shs')
            ->where('status', 'active')
            ->orderBy('track')
            ->orderBy('program_code')
            ->get();

        return Inertia::render('Admin/Sections/Shs/Sections/Edit', [
            'section' => $section,
            'programs' => $programs,
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function update(UpdateSectionRequest $request, Section $section): RedirectResponse
    {
        if ($section->program->education_level !== 'shs') {
            abort(404);
        }

        // Validate that the program is SHS level
        $program = Program::findOrFail($request->program_id);
        if ($program->education_level !== 'shs') {
            return back()->withErrors(['program_id' => 'Selected program is not an SHS program.']);
        }

        $section->update($request->validated());

        return redirect()->route('admin.shs.sections.index')
            ->with('success', 'SHS section updated successfully.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        if ($section->program->education_level !== 'shs') {
            abort(404);
        }

        $section->delete();

        return redirect()->route('admin.shs.sections.index')
            ->with('success', 'SHS section deleted successfully.');
    }

    public function subjects(Section $section): Response
    {
        if ($section->program->education_level !== 'shs') {
            abort(404);
        }

        $section->load(['program', 'sectionSubjects.subject', 'sectionSubjects.teacher.user']);

        $subjects = Subject::where('education_level', 'shs')
            ->orderBy('subject_code')
            ->get();

        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Sections/Shs/Sections/Subjects', [
            'section' => $section,
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function attachSubject(Request $request, Section $section)
    {
        if ($section->program->education_level !== 'shs') {
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

        // Validate subject is SHS level
        $subject = Subject::findOrFail($request->subject_id);
        if ($subject->education_level !== 'shs') {
            return back()->withErrors(['subject_id' => 'Selected subject is not an SHS subject.']);
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
