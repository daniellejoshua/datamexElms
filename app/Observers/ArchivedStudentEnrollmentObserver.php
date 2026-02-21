<?php

namespace App\Observers;

use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;

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

        // --- Update student's current year level (existing behavior) ---
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

        // --- Create normalized archived subject rows for this archived enrollment ---
        // Prefer using StudentGrade records (most accurate per-subject grades). If none
        // found, fall back to StudentSubjectEnrollment to at least capture subject metadata.
        $originalEnrollmentId = $archivedEnrollment->original_enrollment_id;

        if ($originalEnrollmentId) {
            $grades = StudentGrade::where('student_enrollment_id', $originalEnrollmentId)
                ->with(['sectionSubject.subject'])
                ->get();

            if ($grades->isNotEmpty()) {
                foreach ($grades as $grade) {
                    $sectionSubject = $grade->sectionSubject;
                    $subject = $sectionSubject?->subject;

                    ArchivedStudentSubject::create([
                        'archived_student_enrollment_id' => $archivedEnrollment->id,
                        'student_id' => $studentId,
                        'original_enrollment_id' => $originalEnrollmentId,
                        'section_subject_id' => $grade->section_subject_id,
                        'subject_id' => $subject?->id ?? null,
                        'subject_code' => $subject?->subject_code ?? null,
                        'subject_name' => $subject?->subject_name ?? ($sectionSubject?->subject?->subject_name ?? null),
                        'units' => $subject?->units ?? null,
                        'prelim_grade' => $grade->prelim_grade,
                        'midterm_grade' => $grade->midterm_grade,
                        'prefinal_grade' => $grade->prefinal_grade,
                        'final_grade' => $grade->final_grade,
                        'semester_grade' => $grade->semester_grade,
                        'teacher_id' => $grade->teacher_id ?? $sectionSubject?->teacher_id ?? null,
                    ]);
                }
                // do NOT return here; fall back below to capture any subjects that lacked grades
            }
        }

        // Fallback: capture subject enrollments (no fine-grained grades available)
        // archivedEnrollment.semester may be stored as 'first'/'second',
        // but student subject enrollments use '1st'/'2nd' (and sometimes 'first').
        $semesterValues = match ($archivedEnrollment->semester) {
            'first' => ['1st', 'first'],
            'second' => ['2nd', 'second'],
            default => [$archivedEnrollment->semester],
        };

        $subjectEnrollments = StudentSubjectEnrollment::where('student_id', $studentId)
            ->where('academic_year', $archivedEnrollment->academic_year)
            ->whereIn('semester', $semesterValues)
            ->where('status', 'active')
            ->when($archivedEnrollment->archivedSection?->original_section_id, function ($q, $secId) {
                $q->whereHas('sectionSubject', fn ($q2) => $q2->where('section_id', $secId));
            })
            ->with(['sectionSubject.subject'])
            ->get();

        foreach ($subjectEnrollments as $se) {
            $sectionSubject = $se->sectionSubject;
            $subject = $sectionSubject?->subject;

            // skip if row already exists to avoid duplicates (may have been added above via grades)
            $exists = ArchivedStudentSubject::where('archived_student_enrollment_id', $archivedEnrollment->id)
                ->where(function ($q) use ($sectionSubject, $subject) {
                    if ($sectionSubject?->id) {
                        $q->orWhere('section_subject_id', $sectionSubject->id);
                    }
                    if ($subject?->subject_code) {
                        $q->orWhere('subject_code', $subject->subject_code);
                    }
                })
                ->exists();

            if ($exists) {
                continue;
            }

            ArchivedStudentSubject::create([
                'archived_student_enrollment_id' => $archivedEnrollment->id,
                'student_id' => $studentId,
                'original_enrollment_id' => $originalEnrollmentId,
                'section_subject_id' => $sectionSubject?->id,
                'subject_id' => $subject?->id ?? null,
                'subject_code' => $subject?->subject_code ?? null,
                'subject_name' => $subject?->subject_name ?? ($sectionSubject?->subject?->subject_name ?? null),
                'units' => $subject?->units ?? null,
                'prelim_grade' => null,
                'midterm_grade' => null,
                'prefinal_grade' => null,
                'final_grade' => null,
                'semester_grade' => null,
                'teacher_id' => $sectionSubject?->teacher_id ?? null,
            ]);
        }
    }
}
