<?php

namespace App\Console\Commands;

use App\Models\ArchivedStudentEnrollment;
use App\Models\StudentGrade;
use Illuminate\Console\Command;

class BackfillArchivedSemesterGrades extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backfill-archived-semester-grades {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill missing final_semester_grade for archived student enrollments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $isDryRun = $this->option('dry-run');

        if ($isDryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        // Get all archived enrollments with null final_semester_grade
        $archivedEnrollments = ArchivedStudentEnrollment::whereNull('final_semester_grade')->get();

        $this->info("Found {$archivedEnrollments->count()} archived enrollments with missing semester grades");

        $updated = 0;
        $skipped = 0;

        foreach ($archivedEnrollments as $archived) {
            // Try to find the original student grade using the original_enrollment_id
            if ($archived->original_enrollment_id) {
                $studentGrade = StudentGrade::where('student_enrollment_id', $archived->original_enrollment_id)->first();

                if ($studentGrade && $studentGrade->semester_grade) {
                    if ($isDryRun) {
                        $this->line("Would update enrollment {$archived->id} with semester grade: {$studentGrade->semester_grade}");
                    } else {
                        $archived->final_semester_grade = $studentGrade->semester_grade;
                        $archived->save();
                        $this->line("Updated enrollment {$archived->id} with semester grade: {$studentGrade->semester_grade}");
                    }
                    $updated++;

                    continue;
                }
            }

            // If we can't find the original grade, try to calculate from final_grades
            $finalGrades = $archived->final_grades ?? [];

            // Check if this is SHS (has quarter grades) or college (has prelim/midterm/etc)
            if (isset($finalGrades['first_quarter'], $finalGrades['second_quarter'], $finalGrades['third_quarter'], $finalGrades['fourth_quarter'])) {
                // SHS calculation
                $semesterGrade = (
                    $finalGrades['first_quarter'] +
                    $finalGrades['second_quarter'] +
                    $finalGrades['third_quarter'] +
                    $finalGrades['fourth_quarter']
                ) / 4;

                $semesterGrade = round($semesterGrade, 2);

                if ($isDryRun) {
                    $this->line("Would calculate SHS semester grade for enrollment {$archived->id}: {$semesterGrade}");
                } else {
                    $archived->final_semester_grade = $semesterGrade;
                    $archived->save();
                    $this->line("Calculated SHS semester grade for enrollment {$archived->id}: {$semesterGrade}");
                }
                $updated++;
            } elseif (isset($finalGrades['prelim'], $finalGrades['midterm'], $finalGrades['prefinals'], $finalGrades['finals'])) {
                // College calculation
                $semesterGrade = (
                    $finalGrades['prelim'] +
                    $finalGrades['midterm'] +
                    $finalGrades['prefinals'] +
                    $finalGrades['finals']
                ) / 4;

                $semesterGrade = round($semesterGrade, 2);

                if ($isDryRun) {
                    $this->line("Would calculate college semester grade for enrollment {$archived->id}: {$semesterGrade}");
                } else {
                    $archived->final_semester_grade = $semesterGrade;
                    $archived->save();
                    $this->line("Calculated college semester grade for enrollment {$archived->id}: {$semesterGrade}");
                }
                $updated++;
            } else {
                $this->warn("Cannot calculate semester grade for enrollment {$archived->id} - missing grade data");
                $skipped++;
            }
        }

        $this->info('Process complete:');
        $this->info("- Updated: {$updated}");
        $this->info("- Skipped: {$skipped}");

        if ($isDryRun) {
            $this->info('This was a dry run. Run without --dry-run to apply changes.');
        }
    }
}
