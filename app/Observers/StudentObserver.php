<?php

namespace App\Observers;

use App\Models\ShsStudentPayment;
use App\Models\Student;
use App\Models\StudentSemesterPayment;

class StudentObserver
{
    /**
     * Handle the Student "updated" event.
     */
    public function updated(Student $student): void
    {
        // when status transitions out of active, finalize any existing payments
        if ($student->wasChanged('status') && $student->status !== 'active') {
            StudentSemesterPayment::where('student_id', $student->id)
                ->where('fee_finalized', false)
                ->update(['fee_finalized' => true]);

            ShsStudentPayment::where('student_id', $student->id)
                ->where('fee_finalized', false)
                ->update(['fee_finalized' => true]);
        }
    }
}
