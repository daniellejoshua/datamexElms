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
    public function index()
    {
        $curricula = Curriculum::with('program')
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return Inertia::render('Admin/Curriculum/Index', [
            'curriculums' => $curricula,
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
            'status' => 'required|in:active,inactive',
            'curriculum_subjects' => 'required|array',
            'curriculum_subjects.*.subject_id' => 'required|exists:subjects,id',
            'curriculum_subjects.*.year_level' => 'required|integer|min:1',
            'curriculum_subjects.*.semester' => 'required|in:1st,2nd',
        ]);

        $curriculum = Curriculum::create([
            'program_id' => $validated['program_id'],
            'curriculum_code' => $validated['curriculum_code'],
            'curriculum_name' => $validated['curriculum_name'],
            'description' => $request->input('description'),
            'status' => $validated['status'],
        ]);

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

        return Inertia::render('Admin/Curriculum/Show', [
            'curriculum' => $curriculum,
            'subjectsByYearSemester' => $subjectsByYearSemester,
            'totalSubjects' => $totalSubjects,
            'totalUnits' => $totalUnits,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Curriculum $curriculum)
    {
        $programs = Program::active()->get();

        return Inertia::render('Admin/Curriculum/Edit', [
            'curriculum' => $curriculum,
            'programs' => $programs,
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
        ]);

        $curriculum->update($validated);

        return redirect()->route('admin.curriculum.index')
            ->with('success', 'Curriculum updated successfully.');
    }
}
