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
        $query = Program::with(['programFees', 'curriculums' => function ($query) {
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
                $q->where('program_name', 'LIKE', "%{$search}%")
                    ->orWhere('program_code', 'LIKE', "%{$search}%");
            });
        }

        $programs = $query->paginate(6)->withPath(request()->getPathInfo());

        // Load subjects and calculate correct counts for each program
        $programs->getCollection()->each(function ($program) {
            $program->load('subjects');

            // Get the current/active curriculum for this program
            $currentCurriculum = $program->curriculums->first();

            // For SHS programs, include core and applied subjects that are available to all SHS students
            if ($program->education_level === 'senior_high') {
                $coreAppliedSubjects = \App\Models\Subject::where('education_level', 'senior_high')
                    ->whereIn('subject_type', ['core', 'applied'])
                    ->whereNull('program_id')
                    ->get();

                // Merge program's specialized subjects with core/applied subjects
                $allSubjects = $program->subjects->merge($coreAppliedSubjects);
                $program->setRelation('subjects', $allSubjects->unique('id'));
            }

            // Add curriculum subjects count for display
            $program->curriculum_subjects_count = $currentCurriculum ? $currentCurriculum->curriculumSubjects->count() : 0;
        });

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
            'education_level' => 'required|in:college,senior_high',
            'track' => 'nullable|string|max:255',
            'total_years' => 'required|integer|min:1|max:6',
            'semester_fee' => 'nullable|numeric|min:0',
            'program_fees' => 'nullable|array',
            'program_fees.*.year_level' => 'required_with:program_fees|integer|min:1|max:6',
            'program_fees.*.fee_type' => 'required_with:program_fees|in:regular',
            'program_fees.*.semester_fee' => 'required_with:program_fees|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        // If program_fees provided, use first regular fee as the program's base semester_fee when not explicitly set
        if (empty($validated['semester_fee']) && ! empty($validated['program_fees'])) {
            $firstFee = collect($validated['program_fees'])->first();
            $validated['semester_fee'] = $firstFee['semester_fee'] ?? 0;
        }

        // Persist program and associated program_fees (if any)
        \DB::transaction(function () use ($validated) {
            $programFees = $validated['program_fees'] ?? null;

            // ensure semester_fee is set (default to 0)
            $programData = array_merge($validated, ['program_fees' => null]);
            $programData['semester_fee'] = $programData['semester_fee'] ?? 0;

            $program = Program::create($programData);

            if ($programFees) {
                foreach ($programFees as $fee) {
                    $program->programFees()->create([
                        'year_level' => $fee['year_level'],
                        'fee_type' => $fee['fee_type'],
                        'semester_fee' => $fee['semester_fee'],
                    ]);
                }
            }
        });

        return redirect()->route('registrar.programs.index')
            ->with('success', 'Program created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Program $program)
    {
        $program->load(['subjects', 'sections', 'students', 'programFees', 'curriculums' => function ($query) {
            $query->active()->orderBy('is_current', 'desc')->orderBy('created_at', 'desc');
        }, 'curriculums.curriculumSubjects']);

        // For SHS programs, include core and applied subjects that are available to all SHS students
        if ($program->education_level === 'senior_high') {
            $coreAppliedSubjects = \App\Models\Subject::where('education_level', 'senior_high')
                ->whereIn('subject_type', ['core', 'applied'])
                ->whereNull('program_id')
                ->get();

            // Merge program's specialized subjects with core/applied subjects
            $allSubjects = $program->subjects->merge($coreAppliedSubjects);
            $program->setRelation('subjects', $allSubjects->unique('id'));
        }

        // Get the current/active curriculum for this program
        $currentCurriculum = $program->curriculums->first();

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
            'curriculum_subjects_count' => $currentCurriculum ? $currentCurriculum->curriculumSubjects->count() : 0,
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
            'education_level' => 'required|in:college,masteral,senior_high',
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

        // After changing fees, freeze any existing student payments for this
        // program that belong to past academic years/semesters.  This ensures
        // irregular students created before the freeze logic won't see their
        // stored amounts change when we recalc or touch them elsewhere.
        $currentYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        \App\Models\StudentSemesterPayment::whereHas('student', function ($q) use ($program) {
            $q->where('program_id', $program->id);
        })
        ->where(function ($q) use ($currentYear, $currentSemester) {
            $q->where('academic_year', '!=', $currentYear)
              ->orWhere('semester', '!=', $currentSemester);
        })
        ->update(['fee_finalized' => true]);

        if ($request->has('modal')) {
            return response()->json([
                'program' => $program->load(['subjects', 'sections', 'students', 'programFees']),
                'message' => 'Program updated successfully.',
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
