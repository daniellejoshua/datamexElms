<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDatabaseCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:reset-fresh {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset database to fresh state, keeping only users, programs, and subjects';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('This will delete ALL student, enrollment, grade, and curriculum data. Are you sure?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('Starting database reset...');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            // Delete data in order (respecting foreign key constraints)
            $this->deleteTableData('audit_logs');
            $this->deleteTableData('payment_transactions');
            $this->deleteTableData('student_balances');
            $this->deleteTableData('payment_items');
            $this->deleteTableData('payments');
            $this->deleteTableData('student_semester_payments');
            $this->deleteTableData('shs_student_payments');
            $this->deleteTableData('student_subject_enrollments');
            $this->deleteTableData('student_grades');
            $this->deleteTableData('shs_student_grades');
            $this->deleteTableData('student_academic_transcripts');
            $this->deleteTableData('student_grade_summaries');
            $this->deleteTableData('student_enrollments');
            $this->deleteTableData('archived_student_enrollments');
            $this->deleteTableData('archived_students');
            $this->deleteTableData('announcement_read_status');
            $this->deleteTableData('announcements');
            $this->deleteTableData('announcement_attachments');
            $this->deleteTableData('course_materials');
            $this->deleteTableData('material_access_logs');
            $this->deleteTableData('class_schedules');
            $this->deleteTableData('teacher_assignments');
            $this->deleteTableData('section_subjects');
            $this->deleteTableData('sections');
            $this->deleteTableData('year_level_curriculum_guides');
            $this->deleteTableData('program_curriculum');
            $this->deleteTableData('curriculum_subjects');
            $this->deleteTableData('curricula');
            $this->deleteTableData('grade_versions');
            $this->deleteTableData('semester_finalizations');
            $this->deleteTableData('user_preferences');
            $this->deleteTableData('students');

            // Clean up users - remove student roles and related data
            $this->cleanUserData();

            // Reset auto-increment counters for kept tables
            $this->resetAutoIncrement('users');
            $this->resetAutoIncrement('programs');
            $this->resetAutoIncrement('subjects');

            $this->info('Database reset completed successfully!');
            $this->info('Kept: users, programs, subjects');
            $this->info('Deleted: all student, enrollment, grade, curriculum, and related data');

        } catch (\Exception $e) {
            $this->error('Error during reset: '.$e->getMessage());
            throw $e;
        } finally {
            // Re-enable foreign key checks
            DB::statement('SET FOREIGN_KEY_CHECKS = 1');
        }
    }

    private function deleteTableData(string $tableName): void
    {
        if (Schema::hasTable($tableName)) {
            DB::table($tableName)->delete();
            $this->line("Cleared table: {$tableName}");
        }
    }

    private function cleanUserData(): void
    {
        // Delete student users entirely since we want to start fresh
        $deletedCount = DB::table('users')->where('role', 'student')->delete();
        $this->line("Deleted {$deletedCount} student users");
    }

    private function resetAutoIncrement(string $tableName): void
    {
        if (Schema::hasTable($tableName)) {
            DB::statement("ALTER TABLE {$tableName} AUTO_INCREMENT = 1");
            $this->line("Reset auto-increment for: {$tableName}");
        }
    }
}
