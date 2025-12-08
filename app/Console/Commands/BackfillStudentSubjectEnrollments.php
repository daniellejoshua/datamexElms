<?php

namespace App\Console\Commands;

use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\SectionSubject;
use Illuminate\Console\Command;

class BackfillStudentSubjectEnrollments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:backfill-student-subject-enrollments {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Backfill missing StudentSubjectEnrollment records for existing StudentEnrollment records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        // Get all active student enrollments
        $studentEnrollments = StudentEnrollment::where('status', 'active')->get();

        $this->info("Found {$studentEnrollments->count()} active student enrollments");

        $created = 0;
        $skipped = 0;

        foreach ($studentEnrollments as $enrollment) {
            // Get all active section subjects for this section, academic year, and semester
            $sectionSubjects = SectionSubject::where('section_id', $enrollment->section_id)
                ->where('status', 'active')
                ->get();

            $this->info("Processing enrollment for student {$enrollment->student_id} in section {$enrollment->section_id} ({$sectionSubjects->count()} subjects)");

            foreach ($sectionSubjects as $sectionSubject) {
                // Check if StudentSubjectEnrollment already exists
                $existing = StudentSubjectEnrollment::where([
                    'student_id' => $enrollment->student_id,
                    'section_subject_id' => $sectionSubject->id,
                    'academic_year' => $enrollment->academic_year,
                    'semester' => $enrollment->semester,
                ])->first();

                if ($existing) {
                    $this->line("  Skipping - StudentSubjectEnrollment already exists for subject {$sectionSubject->id}");
                    $skipped++;
                    continue;
                }

                if (!$dryRun) {
                    StudentSubjectEnrollment::create([
                        'student_id' => $enrollment->student_id,
                        'section_subject_id' => $sectionSubject->id,
                        'enrollment_type' => 'regular',
                        'academic_year' => $enrollment->academic_year,
                        'semester' => $enrollment->semester,
                        'status' => 'active',
                        'enrollment_date' => $enrollment->enrollment_date,
                        'enrolled_by' => $enrollment->enrolled_by,
                    ]);
                }

                $this->line("  Created StudentSubjectEnrollment for subject {$sectionSubject->id}");
                $created++;
            }
        }

        $this->info("Summary:");
        $this->info("  Created: {$created}");
        $this->info("  Skipped: {$skipped}");

        if ($dryRun) {
            $this->warn('This was a dry run. Run without --dry-run to apply changes.');
        } else {
            $this->info('Backfill completed successfully!');
        }

        return 0;
    }
}
