<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ResetDatabaseForFreshStart extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-database-for-fresh-start {--dry-run : Show what would be done without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset database for fresh start by removing student data and resetting academic settings';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        $this->info('=== DATABASE RESET FOR FRESH START ===');
        $this->newLine();

        // Step 1: Remove all student-related data
        $this->info('Step 1: Removing student-related data...');

        $tablesToClear = [
            'StudentSubjectEnrollment' => \App\Models\StudentSubjectEnrollment::class,
            'StudentEnrollment' => \App\Models\StudentEnrollment::class,
            'StudentGrade' => \App\Models\StudentGrade::class,
            'ShsStudentGrade' => \App\Models\ShsStudentGrade::class,
            'StudentSemesterPayment' => \App\Models\StudentSemesterPayment::class,
            'PaymentTransaction' => \App\Models\PaymentTransaction::class,
            'ArchivedStudentEnrollment' => \App\Models\ArchivedStudentEnrollment::class,
            'ArchivedSection' => \App\Models\ArchivedSection::class,
        ];

        foreach ($tablesToClear as $tableName => $modelClass) {
            $count = $modelClass::count();
            $this->line("  Clearing {$tableName}: {$count} records");

            if (! $dryRun) {
                $modelClass::query()->delete();
            }
        }

        // Step 2: Remove student users (but keep admin/teacher/registrar users)
        $this->newLine();
        $this->info('Step 2: Removing student users...');

        $studentUsers = \App\Models\User::where('role', 'student')->get();
        $this->line("  Found {$studentUsers->count()} student users");

        foreach ($studentUsers as $user) {
            $this->line("  Removing student: {$user->name} ({$user->email})");

            if (! $dryRun) {
                // Delete associated student record first
                \App\Models\Student::where('user_id', $user->id)->delete();
                // Then delete the user
                $user->delete();
            }
        }

        // Step 3: Clear sections and section subjects
        $this->newLine();
        $this->info('Step 3: Clearing sections and subjects...');

        $sectionSubjectsCount = \App\Models\SectionSubject::count();
        $sectionsCount = \App\Models\Section::count();

        $this->line("  Clearing SectionSubject: {$sectionSubjectsCount} records");
        $this->line("  Clearing Section: {$sectionsCount} records");

        if (! $dryRun) {
            \App\Models\SectionSubject::query()->delete();
            \App\Models\Section::query()->delete();
        }

        // Step 4: Reset school settings
        $this->newLine();
        $this->info('Step 4: Resetting school settings...');

        if (! $dryRun) {
            \App\Models\SchoolSetting::query()->delete();

            // Create fresh school settings
            \App\Models\SchoolSetting::create([
                'key' => 'current_academic_year',
                'value' => '2024-2025',
            ]);

            \App\Models\SchoolSetting::create([
                'key' => 'current_semester',
                'value' => '1st',
            ]);
        }

        $this->line('  Reset current_academic_year to: 2024-2025');
        $this->line('  Reset current_semester to: 1st');

        // Step 5: Summary
        $this->newLine();
        $this->info('=== RESET COMPLETE ===');

        if ($dryRun) {
            $this->warn('This was a dry run. Run without --dry-run to apply changes.');
        } else {
            $this->info('Database has been reset for fresh start!');
            $this->info('Remaining data:');
            $this->line('  - Admin/Teacher/Registrar users: preserved');
            $this->line('  - Programs: preserved');
            $this->line('  - Subjects: preserved');
            $this->line('  - Academic year: 2024-2025');
            $this->line('  - Semester: 1st');
        }

        return 0;
    }
}
