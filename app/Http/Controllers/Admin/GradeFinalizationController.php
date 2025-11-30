<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SemesterFinalization;
use App\Models\StudentGrade;
use App\Models\ShsStudentGrade;
use App\Models\GradeVersion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class GradeFinalizationController extends Controller
{
    public function index(): Response
    {
        $finalizations = SemesterFinalization::with('finalizedBy')
            ->orderBy('finalized_at', 'desc')
            ->get();
            
        return Inertia::render('Admin/GradeFinalization/Index', [
            'finalizations' => $finalizations,
            'pendingGrades' => $this->getPendingGradesSummary()
        ]);
    }
    
    public function finalizeSemester(Request $request): JsonResponse
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd,summer',
            'education_level' => 'required|in:college,shs',
            'track' => 'nullable|string',
            'notes' => 'nullable|string|max:1000'
        ]);
        
        // Check if already finalized
        $existing = SemesterFinalization::where('academic_year', $request->academic_year)
            ->where('semester', $request->semester)
            ->where('education_level', $request->education_level)
            ->when($request->track, fn($q) => $q->where('track', $request->track))
            ->first();
            
        if ($existing) {
            return response()->json(['message' => 'Semester already finalized'], 400);
        }
        
        DB::transaction(function () use ($request) {
            // Create finalization record
            SemesterFinalization::create([
                'academic_year' => $request->academic_year,
                'semester' => $request->semester,
                'education_level' => $request->education_level,
                'track' => $request->track,
                'finalized_at' => now(),
                'finalized_by' => auth()->id(),
                'notes' => $request->notes
            ]);
            
            // Finalize all grades for this semester
            $this->finalizeAllGrades(
                $request->academic_year,
                $request->semester,
                $request->education_level,
                $request->track
            );
            
            // Clean up grade versions after finalization
            $this->cleanupGradeVersions(
                $request->academic_year,
                $request->semester,
                $request->education_level,
                $request->track
            );
        });
        
        return response()->json(['message' => 'Semester grades finalized successfully']);
    }
    
    protected function finalizeAllGrades(
        string $academicYear,
        string $semester,
        string $educationLevel,
        ?string $track = null
    ): void {
        if ($educationLevel === 'shs') {
            // Update SHS grades
            ShsStudentGrade::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->whereHas('student', function($q) use ($track) {
                    if ($track) {
                        $q->where('track', $track);
                    }
                })
                ->where('status', '!=', 'finalized')
                ->update([
                    'status' => 'finalized',
                    'finalized_at' => now(),
                    'finalized_by' => auth()->id()
                ]);
        } else {
            // Update college grades
            StudentGrade::where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('status', '!=', 'finalized')
                ->update([
                    'status' => 'finalized',
                    'finalized_at' => now(),
                    'finalized_by' => auth()->id()
                ]);
        }
    }
    
    protected function cleanupGradeVersions(
        string $academicYear,
        string $semester,
        string $educationLevel,
        ?string $track = null
    ): void {
        // Mark pre-finalization versions for potential cleanup
        GradeVersion::where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('grade_type', $educationLevel)
            ->where('is_pre_finalization', true)
            ->update(['is_pre_finalization' => false]);
            
        // Note: Actual deletion can be done later via scheduled job
        // For now, we just mark them as post-finalization
    }
    
    protected function getPendingGradesSummary(): array
    {
        return [
            'college_grades' => [
                'draft' => StudentGrade::where('status', 'draft')->count(),
                'submitted' => StudentGrade::where('status', 'submitted')->count(),
            ],
            'shs_grades' => [
                'draft' => ShsStudentGrade::where('status', 'draft')->count(),
                'submitted' => ShsStudentGrade::where('status', 'submitted')->count(),
            ]
        ];
    }
    
    public function unfinalizeGrade(Request $request): JsonResponse
    {
        $request->validate([
            'grade_id' => 'required|integer',
            'grade_type' => 'required|in:college,shs',
            'reason' => 'required|string|max:500'
        ]);
        
        $modelClass = $request->grade_type === 'college' ? StudentGrade::class : ShsStudentGrade::class;
        $grade = $modelClass::findOrFail($request->grade_id);
        
        if ($grade->status !== 'finalized') {
            return response()->json(['message' => 'Grade is not finalized'], 400);
        }
        
        $grade->update([
            'status' => 'draft',
            'finalized_at' => null,
            'finalized_by' => null,
            'finalization_notes' => 'Unfinalized: ' . $request->reason
        ]);
        
        return response()->json(['message' => 'Grade unfinalized successfully']);
    }
}
