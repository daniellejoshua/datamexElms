<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Program;
use App\Models\ProgramCurriculum;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\CurriculumSubject;
use App\Models\StudentEnrollment;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramCurriculumController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programCurricula = ProgramCurriculum::with(['program', 'curriculum'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/ProgramCurricula/Index', [
            'programCurricula' => $programCurricula,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $programs = Program::active()->get();
        $curriculums = Curriculum::active()->get();

        return Inertia::render('Admin/ProgramCurricula/Create', [
            'programs' => $programs,
            'curriculums' => $curriculums,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'academic_year' => 'required|string',
            'curriculum_id' => 'required|exists:curriculum,id',
        ]);

        // Check if this program-academic_year combination already exists
        $exists = ProgramCurriculum::where('program_id', $validated['program_id'])
            ->where('academic_year', $validated['academic_year'])
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'academic_year' => 'A curriculum is already assigned to this program for the selected academic year.',
            ]);
        }

        ProgramCurriculum::create($validated);

        return redirect()->route('admin.program-curricula.index')
            ->with('message', 'Program curriculum mapping created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(ProgramCurriculum $programCurriculum)
    {
        $programCurriculum->load(['program', 'curriculum']);

        return Inertia::render('Admin/ProgramCurricula/Show', [
            'programCurriculum' => $programCurriculum,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(ProgramCurriculum $programCurriculum)
    {
        $programs = Program::active()->get();
        $curriculums = Curriculum::active()->get();

        return Inertia::render('Admin/ProgramCurricula/Edit', [
            'programCurriculum' => $programCurriculum,
            'programs' => $programs,
            'curriculums' => $curriculums,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ProgramCurriculum $programCurriculum)
    {
        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'academic_year' => 'required|string',
            'curriculum_id' => 'required|exists:curriculum,id',
        ]);

        // Check if this program-academic_year combination already exists (excluding current record)
        $exists = ProgramCurriculum::where('program_id', $validated['program_id'])
            ->where('academic_year', $validated['academic_year'])
            ->where('id', '!=', $programCurriculum->id)
            ->exists();

        if ($exists) {
            return back()->withErrors([
                'academic_year' => 'A curriculum is already assigned to this program for the selected academic year.',
            ]);
        }

        // Do not allow changing the `is_current` flag from the edit form.
        // Any attempt to alter `is_current` should be done through the dedicated
        // "set current" action. If the request includes `is_current` and it
        // differs from the stored value, return an error.
        if ($request->has('is_current')) {
            $requested = (bool) $request->input('is_current');
            if ($requested !== (bool) $programCurriculum->is_current) {
                return back()->withErrors([
                    'is_current' => 'Change the current curriculum using the "Set Current" action.',
                ]);
            }
        }

        $programCurriculum->update($validated);

        return redirect()->route('admin.program-curricula.index')
            ->with('message', 'Program curriculum mapping updated successfully.');
    }

    /**
     * Update the current curriculum for a program.
     */
    public function updateCurrent(Request $request, Program $program)
    {
        $validated = $request->validate([
            'curriculum_id' => 'required|exists:curriculum,id',
        ]);
        $isShsProgram = $program->education_level === 'senior_high';
        $entryYearLevel = $isShsProgram ? 11 : 1;
        $entryLevelLabel = $entryYearLevel === 11 ? 'grade 11' : 'first-year';

        // Prevent switching the current curriculum during the 2nd semester.
        if (SchoolSetting::getCurrentSemester() === '2nd') {
            return back()->withErrors([
                'curriculum_id' => 'Updating the current curriculum is not allowed during the 2nd semester.',
            ]);
        }

        // Safety check: ensure no active student enrollments exist in entry-level sections
        // for the current academic year. This avoids disrupting running classes
        // and handles irregular enrollments safely.
        // Select all active entry-level sections for this program
        $entryLevelSections = Section::where('program_id', $program->id)
            ->where('year_level', $entryYearLevel)
            ->where('status', 'active')
            ->pluck('id');

        // Conflict check: any active enrollments in these sections (ignore dropped etc.)
        $activeEnrollmentsCount = 0;
        if ($entryLevelSections->isNotEmpty()) {
            $activeEnrollmentsCount = StudentEnrollment::whereIn('section_id', $entryLevelSections)
                ->where('status', 'active')
                ->count();
        }

        if ($activeEnrollmentsCount > 0) {
            // There are active enrollments, but entry-level sections should always
            // use the current curriculum. Proceed with the update but surface a
            // warning so admins are aware that students may be affected.
            session()->flash('warning', "There are active enrollments in {$entryLevelLabel} sections; these sections and students will be updated to use the new curriculum.");
        }

        // Check if the curriculum is already assigned to this program
        $programCurriculum = ProgramCurriculum::where('program_id', $program->id)
            ->where('curriculum_id', $validated['curriculum_id'])
            ->first();

        if (! $programCurriculum) {
            return back()->withErrors([
                'curriculum_id' => 'The selected curriculum is not assigned to this program.',
            ]);
        }

        // Set all other curricula for this program to not current
        ProgramCurriculum::where('program_id', $program->id)
            ->update(['is_current' => false]);

        // Set the selected curriculum as current
        $programCurriculum->update(['is_current' => true]);

        // Perform updates to entry-level sections and students so they point
        // to the new curriculum. Wrap in a transaction to keep changes
        // consistent.
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        DB::transaction(function () use ($programCurriculum, $entryLevelSections, $currentAcademicYear, $isShsProgram) {
            $newCurriculumId = $programCurriculum->curriculum_id;

            $sections = Section::whereIn('id', $entryLevelSections)->get();

            foreach ($sections as $section) {
                // Update section to point to new curriculum
                $section->update(['curriculum_id' => $newCurriculumId]);

                // Sync section subjects: ensure subjects in the new curriculum exist
                // as active section_subjects, and any section_subjects not present
                // in the new curriculum are marked inactive.
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

                // Activate or create subjects from curriculum
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

                // Any existing section_subjects not in the curriculum should be set inactive
                foreach ($existing as $subjectId => $ss) {
                    if (! in_array($subjectId, $currSubjects, true)) {
                        if ($ss->status !== 'inactive') {
                            $ss->update(['status' => 'inactive']);
                        }
                    }
                }
            }

            // Update entry-level students enrolled in those sections for the current academic year
            $studentIds = StudentEnrollment::whereIn('section_id', $entryLevelSections)
                ->where('academic_year', $currentAcademicYear)
                ->pluck('student_id')
                ->unique()
                ->toArray();

            if (! empty($studentIds)) {
                Student::whereIn('id', $studentIds)
                    ->update([
                        'previous_curriculum_id' => DB::raw('curriculum_id'),
                        'curriculum_id' => $newCurriculumId,
                    ]);
            }
        });

        return back()->with('message', 'Current curriculum updated successfully. Entry-level sections and students have been updated.');
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
