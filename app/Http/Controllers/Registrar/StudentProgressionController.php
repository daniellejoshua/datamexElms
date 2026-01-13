<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\SemesterFinalization;
use App\Models\Student;
use App\Services\StudentProgressionService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentProgressionController extends Controller
{
    public function __construct(
        private StudentProgressionService $progressionService
    ) {}

    /**
     * Show the semester progression management page.
     */
    public function index(Request $request)
    {
        $academicYear = $request->get('academic_year', '2024-2025');
        $semester = $request->get('semester', '1st');
        $educationLevel = $request->get('education_level', 'college');

        // Get students eligible for progression
        $students = Student::with(['user', 'program', 'enrollments' => function ($query) use ($academicYear, $semester) {
            $query->where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('status', 'active')
                ->with(['studentGrades.sectionSubject.subject']);
        }])
            ->where('education_level', $educationLevel)
            ->where('status', 'active')
            ->whereHas('enrollments', function ($query) use ($academicYear, $semester) {
                $query->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->where('status', 'active');
            })
            ->get()
            ->map(function ($student) {
                $enrollment = $student->enrollments->first();
                $grades = $enrollment ? $enrollment->studentGrades : collect();

                // Calculate average grade
                $averageGrade = $grades->avg('final_grade') ?? 0;

                // Check if student has all required grades
                $hasCompleteGrades = $grades->every(fn ($grade) => ! is_null($grade->final_grade));

                return [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'student_number' => $student->student_number,
                    'year_level' => $student->current_year_level,
                    'program' => $student->program?->name,
                    'track' => $student->track,
                    'strand' => $student->strand,
                    'average_grade' => round($averageGrade, 2),
                    'has_complete_grades' => $hasCompleteGrades,
                    'is_passing' => $averageGrade >= 75,
                    'enrollment_id' => $enrollment?->id,
                    'can_progress' => $hasCompleteGrades && $averageGrade >= 75,
                ];
            });

        // Check if current semester is finalized
        $isFinalized = SemesterFinalization::isFinalized($academicYear, $semester, $educationLevel);

        // Get graduation candidates
        $graduationCandidates = $this->progressionService->getGraduationCandidates($academicYear, $semester, $educationLevel);

        return Inertia::render('Registrar/StudentProgression/Index', [
            'students' => $students,
            'graduationCandidates' => $graduationCandidates->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'student_number' => $student->student_number,
                    'program' => $student->program?->name,
                    'track' => $student->track,
                    'year_level' => $student->current_year_level,
                ];
            }),
            'filters' => [
                'academic_year' => $academicYear,
                'semester' => $semester,
                'education_level' => $educationLevel,
            ],
            'isFinalized' => $isFinalized,
            'stats' => [
                'total_students' => $students->count(),
                'passing_students' => $students->where('is_passing', true)->count(),
                'complete_grades' => $students->where('has_complete_grades', true)->count(),
                'graduation_candidates' => $graduationCandidates->count(),
            ],
        ]);
    }

    /**
     * Progress a single student to the next semester.
     */
    public function progressStudent(Request $request, Student $student)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
            'action' => 'required|in:next_semester,next_year,graduate',
        ]);

        try {
            switch ($request->action) {
                case 'next_semester':
                    $nextPeriod = $this->getNextPeriod($request->academic_year, $request->semester);
                    $this->progressionService->progressToNextSemester(
                        $student,
                        $nextPeriod['academic_year'],
                        $nextPeriod['semester']
                    );
                    break;

                case 'next_year':
                    $nextAcademicYear = $this->getNextAcademicYear($request->academic_year);
                    $this->progressionService->progressToNextYearLevel($student, $nextAcademicYear);
                    break;

                case 'graduate':
                    $this->progressionService->graduateStudent($student);
                    break;
            }

            return back()->with('success', "Student {$student->user->name} has been successfully progressed.");

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Batch progress multiple students.
     */
    public function batchProgress(Request $request)
    {
        $request->validate([
            'student_ids' => 'required|array',
            'student_ids.*' => 'exists:students,id',
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
        ]);

        try {
            $results = $this->progressionService->batchProcessSemesterCompletion(
                $request->student_ids,
                $request->academic_year,
                $request->semester
            );

            $message = "Batch progression completed: {$results['success']} successful, {$results['failed']} failed.";

            if (! empty($results['errors'])) {
                $message .= ' Errors: '.implode('; ', $results['errors']);
            }

            return back()->with('success', $message);

        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Finalize a semester (prevent further changes).
     */
    public function finalizeSemester(Request $request)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:1st,2nd',
            'education_level' => 'required|in:college,senior_high',
            'track' => 'nullable|string',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Check if already finalized
        if (SemesterFinalization::isFinalized(
            $request->academic_year,
            $request->semester,
            $request->education_level,
            $request->track
        )) {
            return back()->withErrors(['error' => 'This semester is already finalized.']);
        }

        SemesterFinalization::create([
            'academic_year' => $request->academic_year,
            'semester' => $request->semester,
            'education_level' => $request->education_level,
            'track' => $request->track,
            'finalized_at' => now(),
            'finalized_by' => auth()->id,
            'notes' => $request->notes,
        ]);

        return back()->with('success', 'Semester has been successfully finalized. No further changes can be made.');
    }

    /**
     * Show progression history for a student.
     */
    public function studentHistory(Student $student)
    {
        $archivedEnrollments = $student->archivedEnrollments()
            ->with('archivedSection')
            ->orderBy('academic_year')
            ->orderBy('semester')
            ->get();

        return Inertia::render('Registrar/StudentProgression/History', [
            'student' => [
                'id' => $student->id,
                'name' => $student->user->name,
                'student_number' => $student->student_number,
                'current_year_level' => $student->current_year_level,
                'program' => $student->program?->name,
                'status' => $student->status,
            ],
            'history' => $archivedEnrollments->map(function ($archived) {
                return [
                    'id' => $archived->id,
                    'academic_year' => $archived->academic_year,
                    'semester' => $archived->semester,
                    'final_status' => $archived->final_status,
                    'final_semester_grade' => $archived->final_semester_grade,
                    'letter_grade' => $archived->letter_grade,
                    'completion_date' => $archived->completion_date?->format('Y-m-d'),
                    'final_grades' => $archived->final_grades,
                    'year_level' => $archived->student_data['year_level_at_completion'] ?? 'N/A',
                ];
            }),
        ]);
    }

    /**
     * Get next academic period.
     */
    private function getNextPeriod(string $academicYear, string $semester): array
    {
        if ($semester === '1st') {
            return [
                'academic_year' => $academicYear,
                'semester' => '2nd',
            ];
        }

        return [
            'academic_year' => $this->getNextAcademicYear($academicYear),
            'semester' => '1st',
        ];
    }

    /**
     * Get next academic year.
     */
    private function getNextAcademicYear(string $currentYear): string
    {
        $years = explode('-', $currentYear);
        $startYear = (int) $years[0] + 1;
        $endYear = (int) $years[1] + 1;

        return "{$startYear}-{$endYear}";
    }
}
