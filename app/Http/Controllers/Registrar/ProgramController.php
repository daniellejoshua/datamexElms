<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Program;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProgramController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $programs = Program::with('subjects')->withCount('students')->get();

        return Inertia::render('Registrar/Programs/Index', [
            'programs' => $programs,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Registrar/Programs/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'program_code' => 'required|string|max:20|unique:programs',
            'program_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'education_level' => 'required|in:college,shs',
            'track' => 'nullable|string|max:255',
            'total_years' => 'required|integer|min:1|max:6',
            'semester_fee' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        Program::create($validated);

        return redirect()->route('registrar.programs.index')
            ->with('success', 'Program created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Program $program)
    {
        $program->load(['subjects', 'sections', 'students']);

        return Inertia::render('Registrar/Programs/Show', [
            'program' => $program,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Program $program)
    {
        return Inertia::render('Registrar/Programs/Edit', [
            'program' => $program,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'program_code' => 'required|string|max:20|unique:programs,program_code,'.$program->id,
            'program_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'education_level' => 'required|in:college,shs',
            'track' => 'nullable|string|max:255',
            'total_years' => 'required|integer|min:1|max:6',
            'semester_fee' => 'required|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $program->update($validated);

        return redirect()->route('registrar.programs.index')
            ->with('success', 'Program updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Program $program)
    {
        // Check if program has students or sections
        if ($program->students()->count() > 0 || $program->sections()->count() > 0) {
            return redirect()->route('registrar.programs.index')
                ->with('error', 'Cannot delete program with existing students or sections.');
        }

        $program->delete();

        return redirect()->route('registrar.programs.index')
            ->with('success', 'Program deleted successfully.');
    }
}
