<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Section;
use App\Models\StudentEnrollment;
use App\Models\SectionSubject;
use Illuminate\Support\Facades\DB;
use App\Models\SchoolSetting;

class CurriculumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Curriculum::with('program');

        // Apply filters
        if ($request->filled('program_id') && $request->program_id !== 'all') {
            $query->where('program_id', $request->program_id);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'current') {
                $query->where('is_current', true);
            } elseif ($request->status === 'old') {
                $query->where('is_current', false);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('curriculum_name', 'like', "%{$search}%")
                    ->orWhere('curriculum_code', 'like', "%{$search}%")
                    ->orWhereHas('program', function ($programQuery) use ($search) {
                        $programQuery->where('program_name', 'like', "%{$search}%");
                    });
            });
        }

        $curricula = $query->orderBy('created_at', 'desc')->paginate(12);
        $programs = Program::active()->get();

        return Inertia::render('Admin/Curriculum/Index', [
            'curricula' => $curricula,
            'programs' => $programs,
            'filters' => $request->only(['program_id', 'status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $programs = Program::active()->get();

        // Load base subjects for curriculum builder:
        // college => minor, SHS => core/applied
        $baseSubjects = Subject::whereIn('subject_type', ['minor', 'core', 'applied'])
            ->where('status', 'active')
            ->orderBy('subject_code')
            ->get();

        return Inertia::render('Admin/Curriculum/Create', [
            'programs' => $programs,
            'subjects' => $baseSubjects,
        ]);
    }

    /**
     * Get majors for a specific program (API endpoint)
     */
    public function getMajorsForProgram(Request $request)
    {
        $request->validate([
            'program_id' => 'required|exists:programs,id',
        ]);

        $majors = Subject::where('program_id', $request->program_id)
            ->where('subject_type', 'major')
            ->whereNotNull('major')
            ->where('status', 'active')
            ->distinct()
            ->pluck('major')
            ->toArray();

        return response()->json($majors);
    }

    /**
     * Get subjects for a specific program (API endpoint)
     */
    public function getSubjectsForProgram(Request $request)
    {
        $request->validate([
            'program_id' => 'required|exists:programs,id',
        ]);

        $program = Program::find($request->program_id);
        $educationLevel = strtolower((string) ($program?->education_level ?? ''));
        $majorLikeType = in_array($educationLevel, ['senior_high', 'shs'], true)
            ? 'specialized'
            : 'major';

        // Load program-specific specialization subjects
        $subjects = Subject::where('program_id', $request->program_id)
            ->where('subject_type', $majorLikeType)
            ->where('status', 'active')
            ->orderBy('subject_code')
            ->get();

        return response()->json($subjects);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'curriculum_code' => 'required|string|unique:curriculum',
            'curriculum_name' => 'required|string',
            'description' => 'nullable|string',
            'is_current' => 'boolean',
            'curriculum_subjects' => 'required|array',
            'curriculum_subjects.*.subject_id' => 'required|exists:subjects,id',
            'curriculum_subjects.*.year_level' => 'required|integer|min:1',
            'curriculum_subjects.*.semester' => 'required|in:1st,2nd',
        ]);

        // If setting this curriculum as current, check if academic year is complete
        if (isset($validated['is_current']) && $validated['is_current']) {
            $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

            // Prevent setting as current during 2nd semester
            if ($currentSemester === '2nd') {
                return redirect()->back()
                    ->withErrors(['is_current' => 'Cannot set curriculum as current during 2nd semester. Please wait until after the 2nd semester is complete.'])
                    ->withInput();
            }

            Curriculum::where('program_id', $validated['program_id'])
                ->update(['is_current' => false]);
        }

        $curriculum = Curriculum::create([
            'program_id' => $validated['program_id'],
            'curriculum_code' => $validated['curriculum_code'],
            'curriculum_name' => $validated['curriculum_name'],
            'description' => $request->input('description'),
            'status' => 'active',
            'is_current' => $validated['is_current'] ?? false,
        ]);

        $program = Program::find($validated['program_id']);
        $entryYearLevel = $program && $program->education_level === 'senior_high' ? 11 : 1;

        // If this is set as current, update only entry-level guides to use this curriculum
        // Other year levels continue with their existing curriculum
        if (isset($validated['is_current']) && $validated['is_current']) {
            $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
            \App\Models\YearLevelCurriculumGuide::where('program_id', $validated['program_id'])
                ->where('academic_year', $currentAcademicYear)
                ->where('year_level', $entryYearLevel)
                ->update(['curriculum_id' => $curriculum->id]);
        }

        // Create curriculum subjects
        foreach ($validated['curriculum_subjects'] as $subjectData) {
            $subject = Subject::find($subjectData['subject_id']);
            CurriculumSubject::create([
                'curriculum_id' => $curriculum->id,
                'subject_id' => $subjectData['subject_id'],
                'subject_code' => $subject->subject_code,
                'subject_name' => $subject->subject_name,
                'description' => $subject->description,
                'units' => $subject->units,
                'year_level' => $subjectData['year_level'],
                'semester' => $subjectData['semester'],
                'subject_type' => $subject->subject_type,
                'is_lab' => $subject->is_lab ?? false,
                'status' => 'active',
            ]);
        }

        return redirect()->route('admin.curriculum.index')
            ->with('message', 'Curriculum created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Curriculum $curriculum)
    {
        $curriculum->load(['program', 'curriculumSubjects' => function ($query) {
            $query->orderBy('year_level')->orderBy('semester')->orderBy('subject_code');
        }, 'curriculumSubjects.subject']);

        // Group subjects by year level and semester
        $subjectsByYearSemester = [];
        foreach ($curriculum->curriculumSubjects as $subject) {
            $key = "Year {$subject->year_level} - {$subject->semester} Semester";
            if (! isset($subjectsByYearSemester[$key])) {
                $subjectsByYearSemester[$key] = [];
            }
            $subjectsByYearSemester[$key][] = $subject;
        }

        $totalSubjects = $curriculum->curriculumSubjects->count();
        $totalUnits = $curriculum->curriculumSubjects->sum('units');
        $totalMajors = $curriculum->curriculumSubjects->where('subject_type', 'major')->count();
        $totalMinors = $curriculum->curriculumSubjects->where('subject_type', 'minor')->count();

        return Inertia::render('Admin/Curriculum/Show', [
            'curriculum' => $curriculum,
            'subjectsByYearSemester' => $subjectsByYearSemester,
            'totalSubjects' => $totalSubjects,
            'totalUnits' => $totalUnits,
            'totalMajors' => $totalMajors,
            'totalMinors' => $totalMinors,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Curriculum $curriculum)
    {
        $programs = Program::active()->get();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        $entryYearLevel = $curriculum->program && $curriculum->program->education_level === 'senior_high' ? 11 : 1;

        // Count active student enrollments in entry-level sections for this program
        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();

        $firstYearSectionIds = Section::where('program_id', $curriculum->program_id)
            ->where('year_level', $entryYearLevel)
            ->where('academic_year', $currentAcademicYear)
            ->pluck('id');

        $activeFirstYearEnrollments = 0;
        if ($firstYearSectionIds->isNotEmpty()) {
            $activeFirstYearEnrollments = StudentEnrollment::whereIn('section_id', $firstYearSectionIds)
                ->where('academic_year', $currentAcademicYear)
                ->where('status', 'active')
                ->count();
        }

        return Inertia::render('Admin/Curriculum/Edit', [
            'curriculum' => $curriculum->load('program'),
            'programs' => $programs,
            'currentSemester' => $currentSemester,
            'activeFirstYearEnrollments' => $activeFirstYearEnrollments,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Curriculum $curriculum)
    {
        $curriculum->loadMissing('program');
        $isShsProgram = $curriculum->program && $curriculum->program->education_level === 'senior_high';
        $entryYearLevel = $isShsProgram ? 11 : 1;

        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'curriculum_code' => 'required|string|unique:curriculum,curriculum_code,'.$curriculum->id,
            'curriculum_name' => 'required|string',
            'is_current' => 'boolean',
        ]);

        // If the curriculum is currently active, ignore any attempt from the
        // edit form to unset it. The UI disables the checkbox for active
        // curricula, but enforce it server-side by removing the key so the
        // update does not change the active flag.
        if ($curriculum->is_current && array_key_exists('is_current', $validated) && $validated['is_current'] == false) {
            unset($validated['is_current']);
        }

        // Check if trying to change the current status
        $isCurrentChanging = isset($validated['is_current']) && $validated['is_current'] !== $curriculum->is_current;

        if ($isCurrentChanging) {
            $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

            // During 2nd semester, prevent any changes to current status
            if ($currentSemester === '2nd') {
                return redirect()->back()
                    ->withErrors(['is_current' => 'Cannot change curriculum current status during 2nd semester. Please wait until after the 2nd semester is complete.'])
                    ->withInput();
            }

            // During 1st semester, only allow setting as current (not unsetting)
            if ($currentSemester === '1st' && ! $validated['is_current']) {
                return redirect()->back()
                    ->withErrors(['is_current' => 'Cannot unset curriculum as current during 1st semester. Please wait until after the 2nd semester is complete.'])
                    ->withInput();
            }

            // If setting this curriculum as current, ensure no other curriculum in the same program is current
            if ($validated['is_current']) {
                Curriculum::where('program_id', $curriculum->program_id)
                    ->where('id', '!=', $curriculum->id)
                    ->update(['is_current' => false]);

                // Update only entry-level guides to use the new current curriculum
                // Other year levels continue with their existing curriculum
                $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
                \App\Models\YearLevelCurriculumGuide::where('program_id', $curriculum->program_id)
                    ->where('academic_year', $currentAcademicYear)
                    ->where('year_level', $entryYearLevel)
                    ->update(['curriculum_id' => $curriculum->id]);

                // Also update all active entry-level sections for this program
                // so they use the new current curriculum. Sync their
                // section subjects to match the curriculum and update entry-level
                // students enrolled in those sections for the current academic
                // year to point to the new curriculum.
                $firstYearSectionIds = Section::where('program_id', $curriculum->program_id)
                    ->where('year_level', $entryYearLevel)
                    ->where('status', 'active')
                    ->pluck('id');

                $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

                if ($firstYearSectionIds->isNotEmpty()) {
                    DB::transaction(function () use ($firstYearSectionIds, $curriculum, $currentAcademicYear, $isShsProgram) {
                        $newCurriculumId = $curriculum->id;

                        $sections = Section::whereIn('id', $firstYearSectionIds)->get();

                        foreach ($sections as $section) {
                            $section->update(['curriculum_id' => $newCurriculumId]);

                            $currSubjects = CurriculumSubject::where('curriculum_id', $newCurriculumId)
                                ->whereIn('year_level', $this->getYearLevelAliases((int) $section->year_level, $isShsProgram))
                                ->whereIn('semester', $this->getSemesterAliases($section->semester))
                                ->pluck('subject_id')
                                ->unique()
                                ->values()
                                ->toArray();

                            $existing = SectionSubject::where('section_id', $section->id)
                                ->get()
                                ->keyBy('subject_id');

                            foreach ($currSubjects as $subjectId) {
                                if ($existing->has($subjectId)) {
                                    $ss = $existing->get($subjectId);
                                    if ($ss->status !== 'active') {
                                        $ss->update(['status' => 'active']);
                                    }
                                } else {
                                    SectionSubject::create([
                                        'section_id' => $section->id,
                                        'subject_id' => $subjectId,
                                        'teacher_id' => null,
                                        'room' => null,
                                        'schedule_days' => null,
                                        'start_time' => null,
                                        'end_time' => null,
                                        'status' => 'active',
                                    ]);
                                }
                            }

                            foreach ($existing as $subjectId => $ss) {
                                if (! in_array($subjectId, $currSubjects, true)) {
                                    if ($ss->status !== 'inactive') {
                                        $ss->update(['status' => 'inactive']);
                                    }
                                }
                            }
                        }

                        // Update entry-level students enrolled in those sections for the current academic year
                        $studentIds = StudentEnrollment::whereIn('section_id', $firstYearSectionIds)
                            ->where('academic_year', $currentAcademicYear)
                            ->pluck('student_id')
                            ->unique()
                            ->toArray();

                        if (! empty($studentIds)) {
                            \App\Models\Student::whereIn('id', $studentIds)
                                ->update([
                                    'previous_curriculum_id' => DB::raw('curriculum_id'),
                                    'curriculum_id' => $newCurriculumId,
                                ]);
                        }
                    });
                }
            }
        }

        $curriculum->update($validated);

        return redirect()->route('admin.curriculum.index')
            ->with('success', 'Curriculum updated successfully. Entry-level guides and sections have been updated to use this curriculum.');
    }

    /**
     * Normalize semester values to support legacy values (e.g., 1/2, first/second).
     */
    private function getSemesterAliases(?string $semester): array
    {
        $normalized = strtolower(trim((string) $semester));

        if (in_array($normalized, ['1', '1st', 'first'], true)) {
            return ['1', 1, '1st', 'first'];
        }

        if (in_array($normalized, ['2', '2nd', 'second'], true)) {
            return ['2', 2, '2nd', 'second'];
        }

        if (in_array($normalized, ['3', '3rd', 'third', 'summer'], true)) {
            return ['3', 3, '3rd', 'third', 'summer'];
        }

        return [$semester];
    }

    /**
     * Normalize year-level values for SHS legacy curricula (e.g., 1/2 instead of 11/12).
     */
    private function getYearLevelAliases(int $yearLevel, bool $isShsProgram): array
    {
        if (! $isShsProgram) {
            return [$yearLevel];
        }

        if ($yearLevel === 11) {
            return [11, 1];
        }

        if ($yearLevel === 12) {
            return [12, 2];
        }

        return [$yearLevel];
    }
}
