<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

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

        // Load all minor subjects initially
        $minorSubjects = Subject::where('subject_type', 'minor')
            ->where('status', 'active')
            ->orderBy('subject_code')
            ->get();

        return Inertia::render('Admin/Curriculum/Create', [
            'programs' => $programs,
            'subjects' => $minorSubjects,
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

        $program = \App\Models\Program::find($request->program_id);

        // For all programs, show major subjects for that specific program
        $subjects = Subject::where('program_id', $request->program_id)
            ->where('subject_type', 'major')
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

        // If this is set as current, update only year level 1 guides to use this curriculum
        // Other year levels continue with their existing curriculum
        if (isset($validated['is_current']) && $validated['is_current']) {
            $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
            \App\Models\YearLevelCurriculumGuide::where('program_id', $validated['program_id'])
                ->where('academic_year', $currentAcademicYear)
                ->where('year_level', 1)
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

        return Inertia::render('Admin/Curriculum/Edit', [
            'curriculum' => $curriculum->load('program'),
            'programs' => $programs,
            'currentSemester' => $currentSemester,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Curriculum $curriculum)
    {
        $validated = $request->validate([
            'program_id' => 'required|exists:programs,id',
            'curriculum_code' => 'required|string|unique:curriculum,curriculum_code,'.$curriculum->id,
            'curriculum_name' => 'required|string',
            'is_current' => 'boolean',
        ]);

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

                // Update only year level 1 guides to use the new current curriculum
                // Other year levels continue with their existing curriculum
                $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
                \App\Models\YearLevelCurriculumGuide::where('program_id', $curriculum->program_id)
                    ->where('academic_year', $currentAcademicYear)
                    ->where('year_level', 1)
                    ->update(['curriculum_id' => $curriculum->id]);
            }
        }

        $curriculum->update($validated);

        return redirect()->route('admin.curriculum.index')
            ->with('success', 'Curriculum updated successfully. Year 1 guides have been updated to use this curriculum.');
    }
}
