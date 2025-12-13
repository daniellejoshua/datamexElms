<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Program;
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

        return Inertia::render('Admin/Curriculum/Create', [
            'programs' => $programs,
        ]);
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
            'academic_year' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $curriculum = Curriculum::create($validated);

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
            'academic_year' => 'required|string',
            'description' => 'nullable|string',
            'status' => 'required|in:active,inactive',
        ]);

        $curriculum->update($validated);

        return redirect()->route('admin.curriculum.index')
            ->with('message', 'Curriculum updated successfully.');
    }
}
