<?php

namespace App\Services;

use App\Models\ArchivedStudentEnrollment;
use App\Models\CurriculumSubject;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use Illuminate\Support\Facades\Log;

/**
 * Service to check if irregular students can become regular students
 * by determining if they've caught up with the standard curriculum progression.
 */
class StudentRegularityCheckService
{
    /**
     * Cached list of failed subject IDs collected during checks.
     * @var array<int>
     */
    protected array $lastFailedIds = [];
    /**
     * Check if a student can transition from irregular to regular status.
     *
     * A student can become regular if they have completed all subjects
     * that a regular student at their year level should have completed.
     */
    public function checkAndUpdateRegularity(Student $student): bool
    {
        // Only check irregular students
        if ($student->student_type !== 'irregular') {
            return false;
        }

        // Students without a curriculum can't be checked
        if (! $student->curriculum_id) {
            return false;
        }

        $canBecomeRegular = $this->hasCompletedExpectedSubjects($student);

        if ($canBecomeRegular) {
            $student->update(['student_type' => 'regular']);

            Log::info("Student {$student->student_number} ({$student->user->name}) has been promoted to REGULAR status", [
                'previous_type' => 'irregular',
                'current_year_level' => $student->current_year_level,
                'curriculum_id' => $student->curriculum_id,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Check if a student can become regular after re-enrollment by completing all previous year levels.
     * This is a more lenient check that focuses only on previous year levels, not current semester subjects.
     */
    public function checkAndUpdateRegularityAfterReenrollment(Student $student): bool
    {
        // Only check irregular students
        if ($student->student_type !== 'irregular') {
            return false;
        }

        // Students without a curriculum can't be checked
        if (! $student->curriculum_id) {
            return false;
        }

        $canBecomeRegular = $this->hasCompletedPreviousYearLevels($student);

        if ($canBecomeRegular) {
            $student->update(['student_type' => 'regular']);

            Log::info("Student {$student->student_number} ({$student->user->name}) has been promoted to REGULAR status after re-enrollment", [
                'previous_type' => 'irregular',
                'current_year_level' => $student->current_year_level,
                'curriculum_id' => $student->curriculum_id,
                'check_type' => 'previous_year_levels_only',
            ]);

            return true;
        }

        return false;
    }

    /**
     * Check if student has completed all subjects expected for their year level.
     */
    protected function hasCompletedExpectedSubjects(Student $student): bool
    {
        $currentYearNum = $this->extractYearNumber($student->current_year_level);
        $currentSemester = $this->normalizeSemester($student->current_semester ?? '1st');

        // Get all subjects student should have completed by now
        $expectedSubjects = $this->getExpectedSubjects($student, $currentYearNum, $currentSemester);

        // If the student has any recorded failed subjects (current or archived),
        // they should not be promoted to regular, even if expected subjects list is empty.
        $failedSubjectIds = $this->getFailedSubjectIds($student);
        if (! empty($failedSubjectIds)) {
            return false;
        }

        if ($expectedSubjects->isEmpty()) {
            // No expected subjects means first year first semester - and no failures found
            return true;
        }

        // Get all subjects the student has actually completed (passing grades)
        $completedSubjectIds = $this->getCompletedSubjectIds($student);

        // A student can become regular if none of the expected subjects are failed.
        foreach ($expectedSubjects as $subject) {
            $subId = $subject->subject_id;
            if (in_array($subId, $failedSubjectIds, true)) {
                // Failing a required subject disqualifies them
                return false;
            }
            // missing subjects are acceptable; we don't require them to appear in completed list
        }

        return true;

        // All expected subjects completed - can be regular
        return true;
    }

    /**
     * Check if student has completed all subjects from previous year levels only.
     * This is used for re-enrollment to provide a more lenient regularity check.
     */
    protected function hasCompletedPreviousYearLevels(Student $student): bool
    {
        $currentYearNum = $this->extractYearNumber($student->current_year_level);

        // Get all subjects from previous year levels only (not current year)
        $previousYearSubjects = CurriculumSubject::where('curriculum_id', $student->curriculum_id)
            ->where('year_level', '<', $currentYearNum)
            ->get();

        if ($previousYearSubjects->isEmpty()) {
            // No previous year subjects means first year student - should be regular
            return true;
        }

        // Get all subjects the student has actually completed
        $completedSubjectIds = $this->getCompletedSubjectIds($student);

        // Check if student has completed ALL previous year level subjects
        foreach ($previousYearSubjects as $subject) {
            if (! in_array($subject->subject_id, $completedSubjectIds)) {
                // Missing at least one required subject from previous years - still irregular
                return false;
            }
        }

        // All previous year level subjects completed - can be regular
        return true;
    }

    /**
     * Get all subjects a student should have completed by their current year/semester.
     */
    protected function getExpectedSubjects(Student $student, int $currentYearNum, int $currentSemesterNum): \Illuminate\Support\Collection
    {
        return CurriculumSubject::where('curriculum_id', $student->curriculum_id)
            ->where(function ($query) use ($currentYearNum, $currentSemesterNum) {
                // Include all subjects from previous years
                $query->where('year_level', '<', $currentYearNum)
                    // Include subjects from earlier semesters of current year
                    ->orWhere(function ($q) use ($currentYearNum, $currentSemesterNum) {
                        $q->where('year_level', '=', $currentYearNum)
                            ->where('semester', '<', $currentSemesterNum);
                    });
            })
            ->get();
    }

    /**
     * Get all subject IDs the student has completed (passing grades).
     */
    protected function getCompletedSubjectIds(Student $student): array
    {
        $completedIds = [];
        $failedIds = [];
        // reset cached failed ids for this computation
        $this->lastFailedIds = [];

        // Get current student grades (consider various grade columns)
        $currentGrades = StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
            $query->where('student_id', $student->id);
        })
            ->where(function ($q) {
                $q->whereNotNull('final_grade')
                  ->orWhereNotNull('semester_grade')
                  ->orWhereNotNull('prefinal_grade')
                  ->orWhereNotNull('midterm_grade')
                  ->orWhereNotNull('prelim_grade');
            })
            ->with('sectionSubject.subject')
            ->get();

        foreach ($currentGrades as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subjectId = $grade->sectionSubject->subject_id;
                $value = $grade->semester_grade ?? $grade->final_grade ?? $grade->prefinal_grade ?? $grade->midterm_grade ?? $grade->prelim_grade;
                if ($value >= 75) {
                    $completedIds[] = $subjectId;
                } else {
                    // record failed current grades so they disqualify promotion
                    $failedIds[] = $subjectId;
                }
            }
        }

        // Get completed subjects from archived enrollments (from previous student_id)
        $archivedEnrollments = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->orWhere(function ($query) use ($student) {
                // Check by student_number if they were re-enrolled
                $query->whereHas('student', function ($q) use ($student) {
                    $q->where('student_number', $student->student_number);
                });
            })
            ->get();

        foreach ($archivedEnrollments as $enrollment) {
            // Prefer explicit archived subject rows when available
            if ($enrollment->relationLoaded('archivedStudentSubjects') || $enrollment->archivedStudentSubjects()->exists()) {
                $archivedSubjects = $enrollment->archivedStudentSubjects()->get();
                foreach ($archivedSubjects as $archSub) {
                    if (! $archSub->subject_id) {
                        continue;
                    }
                    $value = $archSub->semester_grade ?? $archSub->final_grade ?? $archSub->prefinal_grade ?? $archSub->midterm_grade ?? $archSub->prelim_grade;
                    if ($value === null) {
                        continue;
                    }
                    if ($value >= 75) {
                        $completedIds[] = $archSub->subject_id;
                    } else {
                        $failedIds[] = $archSub->subject_id;
                    }
                }
                continue;
            }

            // Fallback: inspect legacy final_grades array stored on the enrollment
            if (isset($enrollment->final_grades) && is_array($enrollment->final_grades)) {
                foreach ($enrollment->final_grades as $subjectName => $grades) {
                    if (isset($grades['final_average'])) {
                        $subject = \App\Models\Subject::where('name', 'like', '%'.$subjectName.'%')->first();
                        if (! $subject) {
                            continue;
                        }
                        if ($grades['final_average'] >= 75) {
                            $completedIds[] = $subject->id;
                        } else {
                            $failedIds[] = $subject->id;
                        }
                    }
                }
            }
        }

        // Get credited subjects (for shifters/transferees)
        $creditedSubjects = StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->pluck('subject_id')
            ->toArray();

        $completedIds = array_merge($completedIds, $creditedSubjects);

        // store failed ids as property for later use
        $this->lastFailedIds = array_unique($failedIds);

        return array_unique($completedIds);
    }

    /**
     * Extract numeric year from year level string.
     */
    protected function extractYearNumber(string $yearLevel): int
    {
        // Handle formats like "1st Year", "2nd Year", "3rd Year", "4th Year"
        if (preg_match('/(\d+)/', $yearLevel, $matches)) {
            return (int) $matches[1];
        }

        // Handle "Grade 11", "Grade 12"
        if (stripos($yearLevel, 'grade') !== false) {
            if (stripos($yearLevel, '11') !== false) {
                return 1;
            }
            if (stripos($yearLevel, '12') !== false) {
                return 2;
            }
        }

        return 1; // Default to first year
    }

    /**
     * Normalize semester to numeric value for comparison.
     */
    protected function normalizeSemester(?string $semester): int
    {
        if (! $semester) {
            return 1;
        }

        $semester = strtolower($semester);

        if (str_contains($semester, '1st') || str_contains($semester, 'first')) {
            return 1;
        }
        if (str_contains($semester, '2nd') || str_contains($semester, 'second')) {
            return 2;
        }
        if (str_contains($semester, 'summer')) {
            return 3;
        }

        return 1; // Default to first semester
    }

    /**
     * Batch check all irregular students and update their status.
     * Useful after semester archiving.
     */
    public function checkAllIrregularStudents(): array
    {
        $irregularStudents = Student::where('student_type', 'irregular')
            ->whereNotNull('curriculum_id')
            ->get();

        $promoted = [];
        $stillIrregular = [];

        foreach ($irregularStudents as $student) {
            if ($this->checkAndUpdateRegularity($student)) {
                $promoted[] = $student->student_number;
            } else {
                $stillIrregular[] = $student->student_number;
            }
        }

        return [
            'promoted_count' => count($promoted),
            'promoted_students' => $promoted,
            'still_irregular_count' => count($stillIrregular),
            'still_irregular_students' => $stillIrregular,
        ];
    }

    /**
     * Return failed subject IDs recorded during computation.
     * If they haven't been computed yet, compute via `getCompletedSubjectIds`.
     *
     * @return array<int>
     */
    protected function getFailedSubjectIds(?Student $student = null): array
    {
        if (! empty($this->lastFailedIds)) {
            return $this->lastFailedIds;
        }

        if ($student) {
            $this->getCompletedSubjectIds($student);
        }

        return $this->lastFailedIds ?? [];
    }

    /**
     * Get detailed status of why a student is still irregular.
     */
    public function getIrregularityDetails(Student $student): array
    {
        if ($student->student_type !== 'irregular') {
            return ['status' => 'regular', 'message' => 'Student is already regular'];
        }

        $currentYearNum = $this->extractYearNumber($student->current_year_level);
        $currentSemester = $this->normalizeSemester($student->current_semester ?? '1st');

        $expectedSubjects = $this->getExpectedSubjects($student, $currentYearNum, $currentSemester);
        $completedSubjectIds = $this->getCompletedSubjectIds($student);

        $missingSubjects = [];

        foreach ($expectedSubjects as $curriculumSubject) {
            if (! in_array($curriculumSubject->subject_id, $completedSubjectIds)) {
                $subject = $curriculumSubject->subject;
                $missingSubjects[] = [
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->name,
                    'year_level' => $curriculumSubject->year_level,
                    'semester' => $curriculumSubject->semester,
                    'units' => $subject->units,
                ];
            }
        }

        // Also check for any failed subjects (current or archived) — these disqualify promotion.
        $failedIds = $this->getFailedSubjectIds($student);
        $failedSubjects = [];
        if (! empty($failedIds)) {
            foreach ($failedIds as $fid) {
                $subject = \App\Models\Subject::find($fid);
                if (! $subject) {
                    continue;
                }
                $failedSubjects[] = [
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->name,
                    'units' => $subject->units,
                ];
            }
        }

        return [
            'status' => 'irregular',
            'can_become_regular' => empty($missingSubjects) && empty($failedSubjects),
            'missing_subjects_count' => count($missingSubjects),
            'missing_subjects' => $missingSubjects,
            'failed_subjects_count' => count($failedSubjects),
            'failed_subjects' => $failedSubjects,
            'completed_subjects_count' => count($completedSubjectIds),
            'expected_subjects_count' => $expectedSubjects->count(),
        ];
    }
}
