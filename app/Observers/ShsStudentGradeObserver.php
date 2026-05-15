<?php

namespace App\Observers;

use App\Models\ShsStudentGrade;
use App\Models\StudentCreditTransfer;
use App\Models\StudentSubjectCredit;
use App\Services\StudentRegularityCheckService;
use Illuminate\Support\Facades\Log;

class ShsStudentGradeObserver
{
    /**
     * Handle SHS grade save events (create/update).
     */
    public function saved(ShsStudentGrade $grade): void
    {
        // SHS completion is based on final grade (derived from Q1/Q2).
        if (is_null($grade->final_grade)) {
            return;
        }

        $this->updateSubjectCredit($grade);
        $this->processPendingCredits($grade);
        $this->syncStudentTypeFromCredits($grade);
    }

    protected function updateSubjectCredit(ShsStudentGrade $grade): void
    {
        $enrollment = $grade->studentEnrollment;
        if (! $enrollment) {
            return;
        }

        $student = $enrollment->student;
        $sectionSubject = $grade->sectionSubject;

        if (! $student || ! $sectionSubject || ! $sectionSubject->subject_id) {
            return;
        }

        $curriculumSubject = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
            ->where('subject_id', $sectionSubject->subject_id)
            ->first();

        if (! $curriculumSubject) {
            Log::warning('SHS curriculum subject not found for credit update', [
                'student_id' => $student->id,
                'curriculum_id' => $student->curriculum_id,
                'subject_id' => $sectionSubject->subject_id,
            ]);

            return;
        }

        $isPassed = $grade->final_grade >= 75;
        $creditStatus = $isPassed ? 'credited' : 'failed';

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
                'final_grade' => $grade->final_grade,
                'credited_at' => $isPassed ? now() : null,
                'academic_year' => $enrollment->academic_year,
                'semester_taken' => $enrollment->semester,
            ]
        );
    }

    protected function processPendingCredits(ShsStudentGrade $grade): void
    {
        $enrollment = $grade->studentEnrollment;
        $subjectId = $grade->sectionSubject?->subject_id;

        if (! $enrollment || ! $subjectId) {
            return;
        }

        $pendingCredits = StudentCreditTransfer::where('student_id', $enrollment->student_id)
            ->where('subject_id', $subjectId)
            ->where('credit_status', 'pending')
            ->get();

        foreach ($pendingCredits as $credit) {
            $credit->update([
                'credit_status' => $grade->final_grade >= 75 ? 'credited' : 'rejected',
            ]);
        }
    }

    protected function syncStudentTypeFromCredits(ShsStudentGrade $grade): void
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
            }

            return;
        }

        if ($student->student_type === 'irregular') {
            app(StudentRegularityCheckService::class)->checkAndUpdateRegularityAfterReenrollment($student);
        }
    }
}

