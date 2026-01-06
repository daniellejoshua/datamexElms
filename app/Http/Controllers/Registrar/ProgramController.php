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
    public function index(Request $request)
    {
        $query = Program::with(['subjects', 'programFees', 'curriculums' => function ($query) {
            $query->active()->orderBy('is_current', 'desc')->orderBy('created_at', 'desc');
        }, 'curriculums.curriculumSubjects.subject'])->withCount('students');

        // Apply filters
        if ($request->filled('education_level') && $request->education_level !== 'all') {
            $query->where('education_level', $request->education_level);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('program_name', 'like', "%{$search}%")
                    ->orWhere('program_code', 'like', "%{$search}%");
            });
        }

        $programs = $query->paginate(6)->appends($request->query());

        return Inertia::render('Registrar/Programs/Index', [
            'programs' => $programs,
            'filters' => $request->only(['education_level', 'status', 'search']),
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
        $program->load(['subjects', 'sections', 'students', 'programFees']);

        // Count only currently enrolled students (with enrollments for current academic year/semester)
        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        $enrolledStudentsCount = $program->students()
            ->whereHas('enrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })
            ->count();

        return Inertia::render('Registrar/Programs/Show', [
            'program' => $program,
            'enrolled_students_count' => $enrolledStudentsCount,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Program $program)
    {
        $validated = $request->validate([
            'program_name' => 'required|string|max:255',
            'program_code' => 'required|string|max:20|unique:programs,program_code,'.$program->id,
            'description' => 'nullable|string',
            'education_level' => 'required|in:college,masteral,shs',
            'semester_fee' => 'nullable|numeric|min:0',
            'program_fees' => 'required|array',
            'program_fees.*.year_level' => 'required|integer|min:1|max:4',
            'program_fees.*.fee_type' => 'required|in:regular',
            'program_fees.*.semester_fee' => 'required|numeric|min:0',
            'modal' => 'sometimes|boolean',
        ]);

        // Update program basic info
        $program->update([
            'program_name' => $validated['program_name'],
            'program_code' => $validated['program_code'],
            'description' => $validated['description'],
            'education_level' => $validated['education_level'],
        ]);

        // Remove any existing irregular fees since they're not managed here
        $program->programFees()->where('fee_type', 'irregular')->delete();

        // Update or create program fees (only regular fees)
        foreach ($validated['program_fees'] as $feeData) {
            $program->programFees()->updateOrCreate(
                [
                    'year_level' => $feeData['year_level'],
                    'fee_type' => $feeData['fee_type'],
                ],
                [
                    'semester_fee' => $feeData['semester_fee'],
                ]
            );
        }

        if ($request->has('modal')) {
            return response()->json([
                'program' => $program->load(['subjects', 'sections', 'students', 'programFees']),
                'message' => 'Program updated successfully.'
            ]);
        }

        return redirect()->route('registrar.programs.show', $program)
            ->with('success', 'Program updated successfully.');
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Program $program)
    {
        $program->load(['subjects', 'programFees']);

        return Inertia::render('Registrar/Programs/Edit', [
            'program' => $program,
        ]);
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

    /**
     * Get subjects by education level for program assignment
     */
    public function getSubjectsByEducationLevel($educationLevel)
    {
        $subjects = \App\Models\Subject::where('education_level', $educationLevel)
            ->where('status', 'active')
            ->orderBy('year_level')
            ->orderBy('semester')
            ->orderBy('subject_code')
            ->get()
            ->groupBy(['year_level', 'semester']);

        return response()->json($subjects);
    }
}
