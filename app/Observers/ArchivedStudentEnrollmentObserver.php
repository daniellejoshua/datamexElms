<?php

namespace App\Observers;

use App\Models\ArchivedStudentEnrollment;
use App\Models\Student;

class ArchivedStudentEnrollmentObserver
{
    /**
     * Handle the ArchivedStudentEnrollment "created" event.
     */
    public function created(ArchivedStudentEnrollment $archivedEnrollment): void
    {
        // Only act when the enrollment is marked as completed
        if ($archivedEnrollment->final_status !== 'completed') {
            return;
        }

        $studentId = $archivedEnrollment->student_id;
        if (! $studentId) {
            return;
        }

        // Count completed archived semesters for this student
        $completedSemesters = ArchivedStudentEnrollment::where('student_id', $studentId)
            ->where('final_status', 'completed')
            ->count();

        // Each academic year consists of 2 semesters
        $completedAcademicYears = (int) floor($completedSemesters / 2);

        // Allowed year = 1 + completed full years
        $allowedYearLevel = 1 + $completedAcademicYears;

        $student = Student::find($studentId);
        if (! $student) {
            return;
        }

        $current = $student->current_year_level ?? 1;

        // Only update forward (never decrease)
        if ($allowedYearLevel > $current) {
            $student->update(['current_year_level' => $allowedYearLevel]);
        }
    }
}
