<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ResetStudentData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-student-data {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all student data - WARNING: This will delete ALL student records and related data';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->warn('⚠️  WARNING: This command will permanently delete ALL student data!');
        $this->warn('This includes:');
        $this->warn('  - All student records');
        $this->warn('  - All enrollment records');
        $this->warn('  - All grades and transcripts');
        $this->warn('  - All payment records');
        $this->warn('  - All credit transfer records');
        $this->warn('  - All archived student data');

        if (! $this->option('force')) {
            if (! $this->confirm('Are you sure you want to continue? This action cannot be undone!')) {
                $this->info('Operation cancelled.');

                return;
            }
        }

        $this->info('Starting student data reset...');

        DB::beginTransaction();

        try {
            // Get counts before deletion for reporting
            $counts = [
                'students' => DB::table('students')->count(),
                'student_enrollments' => DB::table('student_enrollments')->count(),
                'student_subject_enrollments' => DB::table('student_subject_enrollments')->count(),
                'student_grades' => DB::table('student_grades')->count(),
                'shs_student_grades' => DB::table('shs_student_grades')->count(),
                'student_semester_payments' => DB::table('student_semester_payments')->count(),
                'student_credit_transfers' => DB::table('student_credit_transfers')->count(),
                'student_subject_credits' => DB::table('student_subject_credits')->count(),
                'student_academic_transcripts' => DB::table('student_academic_transcripts')->count(),
                'student_grade_summaries' => DB::table('student_grade_summaries')->count(),
                'archived_students' => DB::table('archived_students')->count(),
                'archived_student_enrollments' => DB::table('archived_student_enrollments')->count(),
            ];

            $this->info('Records to be deleted:');
            foreach ($counts as $table => $count) {
                if ($count > 0) {
                    $this->line("  - {$table}: {$count} records");
                }
            }

            // Delete in order to respect foreign key constraints
            // Start with tables that reference students
            $this->info('Deleting student-related records...');

            // Delete in reverse dependency order
            DB::table('archived_student_enrollments')->delete();
            $this->line('✓ Deleted archived student enrollments');

            DB::table('archived_students')->delete();
            $this->line('✓ Deleted archived students');

            DB::table('student_subject_enrollments')->delete();
            $this->line('✓ Deleted student subject enrollments');

            DB::table('student_grades')->delete();
            $this->line('✓ Deleted student grades');

            DB::table('shs_student_grades')->delete();
            $this->line('✓ Deleted SHS student grades');

            DB::table('student_semester_payments')->delete();
            $this->line('✓ Deleted student semester payments');

            DB::table('student_credit_transfers')->delete();
            $this->line('✓ Deleted student credit transfers');

            DB::table('student_subject_credits')->delete();
            $this->line('✓ Deleted student subject credits');

            DB::table('student_academic_transcripts')->delete();
            $this->line('✓ Deleted student academic transcripts');

            DB::table('student_grade_summaries')->delete();
            $this->line('✓ Deleted student grade summaries');

            DB::table('student_enrollments')->delete();
            $this->line('✓ Deleted student enrollments');

            // Finally delete the students themselves
            DB::table('students')->delete();
            $this->line('✓ Deleted students');

            DB::commit();

            $this->info('✅ Student data reset completed successfully!');
            $this->info('Summary of deleted records:');
            foreach ($counts as $table => $count) {
                if ($count > 0) {
                    $this->line("  - {$table}: {$count} records deleted");
                }
            }

            Log::info('Student data reset completed', [
                'deleted_counts' => $counts,
                'reset_by' => auth()->id() ?? 'console',
                'timestamp' => now(),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();

            $this->error('❌ Error during student data reset: '.$e->getMessage());

            Log::error('Student data reset failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'reset_by' => auth()->id() ?? 'console',
                'timestamp' => now(),
            ]);

            return 1;
        }

        return 0;
    }
}
