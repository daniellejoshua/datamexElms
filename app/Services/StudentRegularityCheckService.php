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
     * Check if student has completed all subjects expected for their year level.
     */
    protected function hasCompletedExpectedSubjects(Student $student): bool
    {
        $currentYearNum = $this->extractYearNumber($student->current_year_level);
        $currentSemester = $this->normalizeSemester($student->current_semester ?? '1st');

        // Get all subjects student should have completed by now
        $expectedSubjects = $this->getExpectedSubjects($student, $currentYearNum, $currentSemester);

        if ($expectedSubjects->isEmpty()) {
            // No expected subjects means first year first semester - should be regular
            return true;
        }

        // Get all subjects the student has actually completed
        $completedSubjectIds = $this->getCompletedSubjectIds($student);

        // Check if student has completed ALL expected subjects
        foreach ($expectedSubjects as $subject) {
            if (! in_array($subject->subject_id, $completedSubjectIds)) {
                // Missing at least one required subject - still irregular
                return false;
            }
        }

        // All expected subjects completed - can be regular
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

        // Get completed subjects from current student grades
        $currentGrades = StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
            $query->where('student_id', $student->id);
        })
            ->whereNotNull('final_grade')
            ->where('final_grade', '>=', 75) // Passing grade
            ->with('sectionSubject.subject')
            ->get();

        foreach ($currentGrades as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $completedIds[] = $grade->sectionSubject->subject_id;
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
            if (isset($enrollment->final_grades) && is_array($enrollment->final_grades)) {
                foreach ($enrollment->final_grades as $subjectName => $grades) {
                    if (isset($grades['final_average']) && $grades['final_average'] >= 75) {
                        // Try to find subject by name (approximate match)
                        $subject = \App\Models\Subject::where('name', 'like', '%'.$subjectName.'%')->first();
                        if ($subject) {
                            $completedIds[] = $subject->id;
                        }
                    }
                }
            }
        }

        // Get credited subjects (for shifters/transferees)
        $creditedSubjects = StudentSubjectCredit::where('student_id', $student->id)
            ->where('status', 'approved')
            ->pluck('subject_id')
            ->toArray();

        $completedIds = array_merge($completedIds, $creditedSubjects);

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

        return [
            'status' => 'irregular',
            'can_become_regular' => empty($missingSubjects),
            'missing_subjects_count' => count($missingSubjects),
            'missing_subjects' => $missingSubjects,
            'completed_subjects_count' => count($completedSubjectIds),
            'expected_subjects_count' => $expectedSubjects->count(),
        ];
    }
}
