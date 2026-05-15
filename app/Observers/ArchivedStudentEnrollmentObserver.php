<?php

namespace App\Observers;

use App\Models\ArchivedStudentEnrollment;
use App\Models\CurriculumSubject;
use App\Models\ArchivedStudentSubject;
use App\Models\ShsStudentGrade;
use App\Models\Student;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
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

        $student = Student::find($studentId);
        if (! $student) {
            return;
        }

        // --- Create normalized archived subject rows for this archived enrollment ---
        // Prefer using StudentGrade records for college, ShsStudentGrade for SHS.
        // If none found, fall back to StudentSubjectEnrollment for subject metadata.
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
                        'teacher_remarks' => $grade->teacher_remarks,
                    ]);
                }
                // do NOT return here; fall back below to capture any subjects that lacked grades
            }

            // SHS grade source
            $shsGrades = ShsStudentGrade::where('student_enrollment_id', $originalEnrollmentId)
                ->with(['sectionSubject.subject'])
                ->get();

            if ($shsGrades->isNotEmpty()) {
                foreach ($shsGrades as $grade) {
                    $sectionSubject = $grade->sectionSubject;
                    $subject = $sectionSubject?->subject;

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
                        'section_subject_id' => $grade->section_subject_id,
                        'subject_id' => $subject?->id ?? null,
                        'subject_code' => $subject?->subject_code ?? null,
                        'subject_name' => $subject?->subject_name ?? ($sectionSubject?->subject?->subject_name ?? null),
                        'units' => $subject?->units ?? null,
                        // SHS aliases map to prelim/midterm storage in model
                        'first_quarter_grade' => $grade->first_quarter_grade,
                        'second_quarter_grade' => $grade->second_quarter_grade,
                        'prefinal_grade' => null,
                        'final_grade' => null,
                        'semester_grade' => $grade->final_grade,
                        'teacher_id' => $grade->teacher_id ?? $sectionSubject?->teacher_id ?? null,
                        'teacher_remarks' => $grade->teacher_remarks,
                    ]);
                }
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
                'teacher_remarks' => $archivedEnrollment->teacher_remarks,
            ]);
        }

        // Re-evaluate year-level progression after archived subject rows are synced.
        $this->updateStudentYearLevelAfterArchive($student);
    }

    private function updateStudentYearLevelAfterArchive(Student $student): void
    {
        $completedSemesters = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->where('final_status', 'completed')
            ->count();

        $completedAcademicYears = (int) floor($completedSemesters / 2);
        $allowedYearLevel = 1 + $completedAcademicYears;
        $current = (int) ($student->current_year_level ?? 1);

        if ($allowedYearLevel <= $current) {
            return;
        }

        $educationLevel = strtolower((string) ($student->education_level ?? $student->program?->education_level ?? ''));
        $isShs = in_array($educationLevel, ['shs', 'senior_high'], true);

        // SHS guard: only allow Grade 11 -> Grade 12 when Grade 11 curriculum is complete/passed.
        if ($isShs && $current === 11 && $allowedYearLevel >= 12 && ! $this->hasCompletedShsGrade11Curriculum($student)) {
            return;
        }

        $student->update(['current_year_level' => $allowedYearLevel]);
    }

    private function hasCompletedShsGrade11Curriculum(Student $student): bool
    {
        if (empty($student->curriculum_id)) {
            return false;
        }

        $grade11Curriculum = CurriculumSubject::query()
            ->where('curriculum_id', $student->curriculum_id)
            ->whereIn('year_level', [11, '11', 'Grade 11', 'grade 11', 1, '1'])
            ->get();

        if ($grade11Curriculum->isEmpty()) {
            return false;
        }

        $requiredCodes = $grade11Curriculum
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)))
            ->unique();

        $requiredIds = $grade11Curriculum
            ->pluck('subject_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique();

        $passedCodes = ArchivedStudentSubject::query()
            ->where('student_id', $student->id)
            ->where(function ($q) {
                $q->where('semester_grade', '>=', 75)
                    ->orWhere('final_grade', '>=', 75);
            })
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));

        $creditedCodes = StudentSubjectCredit::query()
            ->where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get(['subject_id', 'subject_code'])
            ->filter(fn ($row) => $requiredIds->contains((int) $row->subject_id))
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));

        $allCompletedCodes = $passedCodes->merge($creditedCodes)->unique();

        return $requiredCodes->every(fn ($code) => $allCompletedCodes->contains($code));
    }
}
