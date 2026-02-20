<?php

namespace App\Console\Commands;

use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class BackfillArchivedStudentSubjects extends Command
{
    protected $signature = 'app:backfill-archived-student-subjects
        {--batch=500 : Number of archived enrollments to process per chunk}
        {--dry-run : Do not persist changes}
        {--start-id= : Resume from archived_enrollment id}
    ';

    protected $description = 'Populate missing rows in archived_student_subjects from StudentGrade / StudentSubjectEnrollment';

    public function handle()
    {
        $batch = (int) $this->option('batch');
        $isDryRun = (bool) $this->option('dry-run');
        $startId = $this->option('start-id') ? (int) $this->option('start-id') : null;

        if ($isDryRun) {
            $this->info('DRY RUN — no changes will be made');
        }

        $query = ArchivedStudentEnrollment::query()->orderBy('id');
        if ($startId) {
            $query->where('id', '>=', $startId);
        }

        $totalProcessed = 0;
        $totalInserted = 0;

        $this->info("Starting backfill (batch={$batch})...");

        $query->chunkById($batch, function ($archivedEnrollments) use (&$totalProcessed, &$totalInserted, $isDryRun) {
            foreach ($archivedEnrollments as $archived) {
                $totalProcessed++;
                $createdForEnrollment = 0;

                // Prefer StudentGrade when original_enrollment_id exists
                if ($archived->original_enrollment_id) {
                    $grades = StudentGrade::where('student_enrollment_id', $archived->original_enrollment_id)
                        ->with(['sectionSubject.subject'])
                        ->get();

                    foreach ($grades as $grade) {
                        // avoid duplicates: check by archived_enrollment + section_subject_id OR subject_code
                        $existsQuery = ArchivedStudentSubject::where('archived_student_enrollment_id', $archived->id);

                        if ($grade->section_subject_id) {
                            $existsQuery->where('section_subject_id', $grade->section_subject_id);
                        } else {
                            $subjectCode = $grade->sectionSubject?->subject?->subject_code ?? null;
                            $existsQuery->where('subject_code', $subjectCode);
                        }

                        if ($existsQuery->exists()) {
                            continue;
                        }

                        $sectionSubject = $grade->sectionSubject;
                        $subject = $sectionSubject?->subject;

                        // Compute semester grade if not present but all period grades exist
                        $computedSemester = $grade->semester_grade;
                        if ($computedSemester === null && $grade->prelim_grade !== null && $grade->midterm_grade !== null && $grade->prefinal_grade !== null && $grade->final_grade !== null) {
                            $computedSemester = round((
                                $grade->prelim_grade +
                                $grade->midterm_grade +
                                $grade->prefinal_grade +
                                $grade->final_grade
                            ) / 4, 2);
                        }

                        $row = [
                            'archived_student_enrollment_id' => $archived->id,
                            'student_id' => $archived->student_id,
                            'original_enrollment_id' => $archived->original_enrollment_id,
                            'section_subject_id' => $grade->section_subject_id,
                            'subject_id' => $subject?->id ?? null,
                            'subject_code' => $subject?->subject_code ?? null,
                            'subject_name' => $subject?->subject_name ?? ($sectionSubject?->subject?->subject_name ?? null),
                            'units' => $subject?->units ?? null,
                            'prelim_grade' => $grade->prelim_grade,
                            'midterm_grade' => $grade->midterm_grade,
                            'prefinal_grade' => $grade->prefinal_grade,
                            'final_grade' => $grade->final_grade,
                            'semester_grade' => $computedSemester,
                            'teacher_id' => $grade->teacher_id ?? $sectionSubject?->teacher_id ?? null,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];

                        if ($isDryRun) {
                            $this->line("[DRY] Would insert archived student subject for archived_enrollment={$archived->id}, section_subject_id={$grade->section_subject_id}");
                        } else {
                            // Use insert to avoid firing model events repeatedly; rely on uniqueness checks above
                            DB::table('archived_student_subjects')->insert($row);
                        }

                        $createdForEnrollment++;
                        $totalInserted++;
                    }
                }

                // Fallback: use StudentSubjectEnrollment to at least capture subject metadata
// match semester variants to cover stored forms
                $semesterValues = match ($archived->semester) {
                    'first' => ['1st', 'first'],
                    'second' => ['2nd', 'second'],
                    default => [$archived->semester],
                };

                $subjectEnrollments = StudentSubjectEnrollment::where('student_id', $archived->student_id)
                        ->where('academic_year', $archived->academic_year)
                        ->whereIn('semester', $semesterValues)
                    ->with(['sectionSubject.subject'])
                    ->get();

                foreach ($subjectEnrollments as $se) {
                    $sectionSubject = $se->sectionSubject;
                    $subject = $sectionSubject?->subject;

                    $exists = ArchivedStudentSubject::where('archived_student_enrollment_id', $archived->id)
                        ->where(function ($q) use ($sectionSubject, $subject) {
                            if ($sectionSubject?->id) {
                                $q->orWhere('section_subject_id', $sectionSubject->id);
                            }
                            if ($subject?->subject_code) {
                                $q->orWhere('subject_code', $subject->subject_code);
                            }
                        })->exists();

                    if ($exists) {
                        continue;
                    }

                    $row = [
                        'archived_student_enrollment_id' => $archived->id,
                        'student_id' => $archived->student_id,
                        'original_enrollment_id' => $archived->original_enrollment_id,
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
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];

                    if ($isDryRun) {
                        $this->line("[DRY] Would insert archived subject metadata for archived_enrollment={$archived->id}, section_subject_id={$sectionSubject?->id}");
                    } else {
                        DB::table('archived_student_subjects')->insert($row);
                    }

                    $createdForEnrollment++;
                    $totalInserted++;
                }

                if ($createdForEnrollment === 0) {
                    $this->warn("No source subject data found for archived_enrollment={$archived->id}");
                } else {
                    $this->info("Processed archived_enrollment={$archived->id} — inserted={$createdForEnrollment}");
                }
            }
        });

        $this->info('Backfill complete');
        $this->info("Processed: {$totalProcessed}");
        $this->info("Inserted: {$totalInserted}");

        return 0;
    }
}
