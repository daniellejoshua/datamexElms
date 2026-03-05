<?php

namespace App\Observers;

use App\Models\StudentCreditTransfer;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use App\Services\StudentRegularityCheckService;
use Illuminate\Support\Facades\Log;

class StudentGradeObserver
{
    /**
     * Handle the StudentGrade "saved" event.
     * This fires after both create and update operations.
     */
    public function saved(StudentGrade $grade): void
    {
        // Check if all grading periods are complete
        if ($this->hasCompletedAllGrades($grade)) {
            // Create/update subject credit record for ALL students
            $this->updateSubjectCredit($grade);

            // Also process pending credit transfers for irregular/transferee students
            $this->processPendingCredits($grade);

            // Recompute student type (regular/irregular) after this grade update.
            $this->syncStudentTypeFromCredits($grade);
        }
    }

    /**
     * Check if student has completed all required grading periods
     */
    protected function hasCompletedAllGrades(StudentGrade $grade): bool
    {
        return ! is_null($grade->prelim_grade) &&
               ! is_null($grade->midterm_grade) &&
               ! is_null($grade->prefinal_grade) &&
               ! is_null($grade->final_grade) &&
               ! is_null($grade->semester_grade);
    }

    /**
     * Create or update subject credit record for this student
     * This applies to ALL students (regular, irregular, transferee)
     */
    protected function updateSubjectCredit(StudentGrade $grade): void
    {
        $enrollment = $grade->studentEnrollment;
        if (! $enrollment) {
            return;
        }

        $student = $enrollment->student;
        $sectionSubject = $grade->sectionSubject;

        if (! $sectionSubject || ! $sectionSubject->subject_id) {
            return;
        }

        // Find the curriculum subject for this student's curriculum
        $curriculumSubject = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
            ->where('subject_id', $sectionSubject->subject_id)
            ->first();

        if (! $curriculumSubject) {
            Log::warning('Curriculum subject not found', [
                'student_id' => $student->id,
                'curriculum_id' => $student->curriculum_id,
                'subject_id' => $sectionSubject->subject_id,
            ]);

            return;
        }

        // Determine credit status based on grade
        $isPassed = $grade->semester_grade >= 75;
        $creditStatus = $isPassed ? 'credited' : 'failed';

        // Create or update the credit record
        StudentSubjectCredit::updateOrCreate(
            [
                'student_id' => $student->id,
                'curriculum_subject_id' => $curriculumSubject->id,
            ],
            [
                'subject_id' => $sectionSubject->subject_id,
                'subject_code' => $curriculumSubject->subject_code,
                'subject_name' => $curriculumSubject->subject_name,
                'units' => $curriculumSubject->units,
                'year_level' => $curriculumSubject->year_level,
                'semester' => $curriculumSubject->semester,
                'credit_type' => 'regular',
                'credit_status' => $creditStatus,
                'final_grade' => $grade->semester_grade,
                'credited_at' => $isPassed ? now() : null,
                'student_grade_id' => $grade->id,
                'academic_year' => $sectionSubject->academic_year ?? null,
                'semester_taken' => $sectionSubject->semester ?? null,
            ]
        );

        Log::info('Subject credit updated', [
            'student_id' => $student->id,
            'subject_code' => $curriculumSubject->subject_code,
            'credit_status' => $creditStatus,
            'final_grade' => $grade->semester_grade,
        ]);
    }

    /**
     * Process pending credit transfers for irregular/transferee students
     */
    protected function processPendingCredits(StudentGrade $grade): void
    {
        // Get the student and subject information
        $enrollment = $grade->studentEnrollment;
        if (! $enrollment) {
            return;
        }

        $studentId = $enrollment->student_id;
        $sectionSubject = $grade->sectionSubject;
        if (! $sectionSubject || ! $sectionSubject->subject_id) {
            return;
        }

        $subjectId = $sectionSubject->subject_id;

        // Find pending credit transfers for this student and subject
        $pendingCredits = StudentCreditTransfer::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('credit_status', 'pending')
            ->get();

        foreach ($pendingCredits as $credit) {
            // Check if the student passed (semester_grade >= 75)
            if ($grade->semester_grade >= 75) {
                // Update credit status to "credited"
                $credit->update([
                    'credit_status' => 'credited',
                ]);

                Log::info('Credit transfer automatically approved', [
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                    'semester_grade' => $grade->semester_grade,
                    'credit_transfer_id' => $credit->id,
                ]);
            } else {
                // Student failed - mark as rejected or needs retake
                $credit->update([
                    'credit_status' => 'rejected',
                ]);

                Log::info('Credit transfer rejected due to failing grade', [
                    'student_id' => $studentId,
                    'subject_id' => $subjectId,
                    'semester_grade' => $grade->semester_grade,
                    'credit_transfer_id' => $credit->id,
                ]);
            }
        }
    }

    protected function syncStudentTypeFromCredits(StudentGrade $grade): void
    {
        $student = $grade->studentEnrollment?->student;
        if (! $student) {
            return;
        }

        $hasFailedBacklogs = StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'failed')
            ->exists();

        if ($hasFailedBacklogs) {
            if ($student->student_type !== 'irregular') {
                $student->update(['student_type' => 'irregular']);
                Log::info('Student marked irregular due to failed subject', [
                    'student_id' => $student->id,
                    'student_number' => $student->student_number,
                ]);
            }

            return;
        }

        if ($student->student_type === 'irregular') {
            app(StudentRegularityCheckService::class)->checkAndUpdateRegularityAfterReenrollment($student);
        }
    }
}
