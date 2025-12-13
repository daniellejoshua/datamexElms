<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\Program;
use App\Models\ProgramCurriculum;
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

        $programCurriculum->update($validated);

        return redirect()->route('admin.program-curricula.index')
            ->with('message', 'Program curriculum mapping updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ProgramCurriculum $programCurriculum)
    {
        $programCurriculum->delete();

        return redirect()->route('admin.program-curricula.index')
            ->with('message', 'Program curriculum mapping deleted successfully.');
    }
}
