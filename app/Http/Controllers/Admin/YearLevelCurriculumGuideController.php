<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\YearLevelCurriculumGuide;
use Illuminate\Http\Request;
use Inertia\Inertia;

class YearLevelCurriculumGuideController extends Controller
{
    /**
     * Display a listing of year level curriculum guides.
     */
    public function index(Request $request)
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        $query = YearLevelCurriculumGuide::with(['program', 'curriculum' => function ($query) {
                // Force fresh curriculum data with is_current flag
                $query->select('id', 'program_id', 'curriculum_code', 'curriculum_name', 'description', 'status', 'is_current');
            }])
            ->where('academic_year', $currentAcademicYear);

        // Apply filters
        if ($request->filled('program_id') && $request->program_id !== 'all') {
            $query->where('program_id', $request->program_id);
        }

        if ($request->filled('education_level') && $request->education_level !== 'all') {
            $query->whereHas('program', function ($q) use ($request) {
                $q->where('education_level', $request->education_level);
            });
        }

        $guides = $query->orderBy('program_id')
            ->orderBy('year_level')
            ->get()
            ->groupBy(['program_id', 'year_level']);

        $programs = Program::active()->with('yearLevelGuides')->get();

        return Inertia::render('Admin/YearLevelCurriculumGuides/Index', [
            'guides' => $guides,
            'programs' => $programs,
            'currentAcademicYear' => $currentAcademicYear,
            'filters' => $request->only(['program_id', 'education_level']),
        ]);
    }

    /**
     * Show the form for creating a new year level curriculum guide.
     */
    public function create()
    {
        $programs = Program::active()->with('curriculums')->get();
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        return Inertia::render('Admin/YearLevelCurriculumGuides/Create', [
            'programs' => $programs,
            'currentAcademicYear' => $currentAcademicYear,
        ]);
    }

    /**
     * Store a newly created year level curriculum guide.
     */
    public function store(Request $request)
    {
        $request->validate([
            'program_id' => 'required|exists:programs,id',
            'year_level' => 'required|integer|min:1|max:12',
            'curriculum_id' => 'required|exists:curriculums,id',
            'academic_year' => 'required|string',
        ]);

        YearLevelCurriculumGuide::updateOrCreate([
            'program_id' => $request->program_id,
            'year_level' => $request->year_level,
            'academic_year' => $request->academic_year,
        ], [
            'curriculum_id' => $request->curriculum_id,
        ]);

        return redirect()->route('admin.year-level-curriculum-guides.index')
            ->with('success', 'Year level curriculum guide created successfully.');
    }

    /**
     * Show the form for editing a year level curriculum guide.
     */
    public function edit($programId, $yearLevel)
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        $guide = YearLevelCurriculumGuide::where('program_id', $programId)
            ->where('year_level', $yearLevel)
            ->where('academic_year', $currentAcademicYear)
            ->with(['program', 'curriculum'])
            ->firstOrFail();

        $programs = Program::active()->with('curriculums')->get();

        return Inertia::render('Admin/YearLevelCurriculumGuides/Edit', [
            'guide' => $guide,
            'programs' => $programs,
            'currentAcademicYear' => $currentAcademicYear,
        ]);
    }

    /**
     * Update the specified year level curriculum guide.
     */
    public function update(Request $request, $programId, $yearLevel)
    {
        $request->validate([
            'curriculum_id' => 'required|exists:curriculums,id',
        ]);

        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        YearLevelCurriculumGuide::where('program_id', $programId)
            ->where('year_level', $yearLevel)
            ->where('academic_year', $currentAcademicYear)
            ->update([
                'curriculum_id' => $request->curriculum_id,
            ]);

        return redirect()->route('admin.year-level-curriculum-guides.index')
            ->with('success', 'Year level curriculum guide updated successfully.');
    }

    /**
     * Remove the specified year level curriculum guide.
     */
    public function destroy($programId, $yearLevel)
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();

        YearLevelCurriculumGuide::where('program_id', $programId)
            ->where('year_level', $yearLevel)
            ->where('academic_year', $currentAcademicYear)
            ->delete();

        return redirect()->route('admin.year-level-curriculum-guides.index')
            ->with('success', 'Year level curriculum guide deleted successfully.');
    }
}
