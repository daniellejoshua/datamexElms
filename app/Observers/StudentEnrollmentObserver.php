<?php

namespace App\Observers;

use App\Models\StudentEnrollment;
use App\Models\SectionSubject;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Support\Facades\Auth;

class StudentEnrollmentObserver
{
    /**
     * Handle the StudentEnrollment "created" event.
     */
    public function created(StudentEnrollment $enrollment): void
    {
        if (! $enrollment->section_id) {
            return;
        }

        $this->syncSectionSubjects($enrollment);
    }

    /**
     * Handle the StudentEnrollment "updated" event.
     */
    public function updated(StudentEnrollment $enrollment): void
    {
        // If the section was changed (e.g. from null to a real section), sync subjects
        if ($enrollment->wasChanged('section_id') && $enrollment->section_id) {
            $this->syncSectionSubjects($enrollment);
        }
    }

    /**
     * Ensure the student has StudentSubjectEnrollment rows for all active
     * SectionSubject rows on the assigned section. Reactivate dropped
     * enrollments when possible; otherwise create new entries.
     */
    protected function syncSectionSubjects(StudentEnrollment $enrollment): void
    {
        $sectionId = $enrollment->section_id;

        if (! $sectionId) {
            return;
        }

        // Do not automatically create subject enrollments for irregular students
        // — they need to select subjects manually. This covers both new
        // enrollments and carries when the observer fires after section change.
        $student = $enrollment->student;
        if ($student && $student->student_type === 'irregular') {
            return;
        }

        $sectionSubjects = SectionSubject::where('section_id', $sectionId)
            ->where('status', 'active')
            ->get();

        foreach ($sectionSubjects as $sectionSubject) {
            $existing = StudentSubjectEnrollment::where('student_id', $enrollment->student_id)
                ->where('section_subject_id', $sectionSubject->id)
                ->where('academic_year', $enrollment->academic_year)
                ->where('semester', $enrollment->semester)
                ->first();

            if ($existing) {
                // Reactivate dropped enrollments
                if ($existing->status === 'dropped') {
                    $existing->update([
                        'status' => 'active',
                        'enrolled_by' => $enrollment->enrolled_by ?? Auth::id(),
                        'enrollment_date' => now()->toDateString(),
                    ]);
                }

                continue;
            }

            StudentSubjectEnrollment::create([
                'student_id' => $enrollment->student_id,
                'section_subject_id' => $sectionSubject->id,
                'enrollment_type' => 'regular',
                'enrolled_by' => $enrollment->enrolled_by ?? Auth::id(),
                'enrollment_date' => $enrollment->enrollment_date ? $enrollment->enrollment_date->toDateString() : now()->toDateString(),
                'academic_year' => $enrollment->academic_year,
                'semester' => $enrollment->semester,
                'status' => 'active',
            ]);
        }
    }
}
