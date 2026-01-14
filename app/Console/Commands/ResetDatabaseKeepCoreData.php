<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ResetDatabaseKeepCoreData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-database-keep-core-data {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset database keeping only programs, subjects, curricula, and non-student users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('This will delete ALL data except programs, subjects, curricula, and non-student users. Are you sure?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('Starting database reset...');
        $this->warn('This will keep: programs, subjects, curricula, and non-student users');
        $this->warn('This will delete: ALL other data including students, sections, enrollments, etc.');

        // Disable foreign key checks temporarily
        DB::statement('SET FOREIGN_KEY_CHECKS = 0');

        try {
            // Delete data in order (respecting foreign key constraints)
            $tablesToDelete = [
                'audit_logs',
                'payment_transactions',
                'student_balances',
                'payment_items',
                'payments',
                'student_semester_payments',
                'shs_student_payments',
                'student_subject_enrollments',
                'student_grades',
                'shs_student_grades',
                'student_academic_transcripts',
                'student_grade_summaries',
                'student_enrollments',
                'archived_student_enrollments',
                'archived_sections',
                'announcement_read_status',
                'announcements',
                'announcement_attachments',
                'course_materials',
                'material_access_logs',
                'class_schedules',
                'teacher_assignments',
                'section_subjects',
                'sections',
                'year_level_curriculum_guides',
                'program_curriculum',
                'grade_versions',
                'semester_finalizations',
                'user_preferences',
                'students',
                'teachers',
                'school_settings',
            ];

            foreach ($tablesToDelete as $table) {
                $this->deleteTableData($table);
            }

            // Clean up users - remove only student users
            $this->cleanUserData();

            // Reset auto-increment counters for kept tables
            $this->resetAutoIncrement('users');
            $this->resetAutoIncrement('programs');
            $this->resetAutoIncrement('subjects');
            $this->resetAutoIncrement('curricula');

            $this->info('Database reset completed successfully!');
            $this->info('Kept: users (non-student), programs, subjects, curricula');
            $this->info('Deleted: all student, enrollment, grade, section, and related data');

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
            $count = DB::table($tableName)->count();
            DB::table($tableName)->delete();
            $this->line("Cleared table: {$tableName} ({$count} records)");
        } else {
            $this->line("Table not found: {$tableName}");
        }
    }

    private function cleanUserData(): void
    {
        // Delete only student users, keep admin/teacher/registrar users
        $deletedCount = DB::table('users')->where('role', 'student')->delete();
        $this->line("Deleted {$deletedCount} student users");

        $keptCount = DB::table('users')->count();
        $this->line("Kept {$keptCount} non-student users");
    }

    private function resetAutoIncrement(string $tableName): void
    {
        if (Schema::hasTable($tableName)) {
            DB::statement("ALTER TABLE {$tableName} AUTO_INCREMENT = 1");
            $this->line("Reset auto-increment for: {$tableName}");
        }
    }
}
