<?php

namespace App\Console\Commands;

use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ResetDatabaseForAdmins extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'db:reset-for-admins {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset database keeping only admin users (registrar, head_teacher, super_admin) and teachers';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('⚠️  This will DELETE ALL student data, enrollments, sections, and programs. Only admin users and teachers will be kept. Are you sure?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('🔄 Starting database reset...');

        DB::beginTransaction();
        try {
            // Get counts before deletion
            $beforeCounts = [
                'users' => DB::table('users')->count(),
                'students' => DB::table('students')->count(),
                'teachers' => DB::table('teachers')->count(),
                'enrollments' => DB::table('student_enrollments')->count(),
                'sections' => DB::table('sections')->count(),
                'programs' => DB::table('programs')->count(),
                'audit_logs' => DB::table('audit_logs')->count(),
            ];

            $this->info('📊 Data before reset:');
            $this->table(['Table', 'Count'], [
                ['Users', $beforeCounts['users']],
                ['Students', $beforeCounts['students']],
                ['Teachers', $beforeCounts['teachers']],
                ['Enrollments', $beforeCounts['enrollments']],
                ['Sections', $beforeCounts['sections']],
                ['Programs', $beforeCounts['programs']],
                ['Audit Logs', $beforeCounts['audit_logs']],
            ]);

            // Step 1: Delete all student-related data (respecting foreign keys)
            $this->info('🗑️  Deleting student enrollments...');
            DB::table('student_subject_enrollments')->delete();
            DB::table('student_enrollments')->delete();
            DB::table('archived_student_enrollments')->delete();

            // Step 2: Delete grades and related data
            $this->info('🗑️  Deleting grades and versions...');
            DB::table('grade_versions')->delete();
            DB::table('student_grades')->delete();
            DB::table('shs_student_grades')->delete();

            // Step 3: Delete student payment data first (before students)
            $this->info('🗑️  Deleting payment records...');
            DB::table('student_semester_payments')->delete();
            DB::table('shs_student_payments')->delete();

            // Step 4: Delete students BEFORE programs (foreign key constraint)
            $this->info('🗑️  Deleting student records...');
            DB::table('students')->delete();

            // Step 5: Delete student users (keep only admin roles)
            $this->info('🗑️  Deleting student user accounts...');
            $adminRoles = ['super_admin', 'head_teacher', 'registrar', 'teacher'];
            DB::table('users')->whereNotIn('role', $adminRoles)->delete();

            // Step 6: Now safe to delete sections and related data
            $this->info('🗑️  Deleting sections and schedules...');
            DB::table('class_schedules')->delete();
            DB::table('section_subjects')->delete();
            DB::table('sections')->delete();

            // Step 7: Now safe to delete programs
            $this->info('🗑️  Deleting programs...');
            DB::table('programs')->delete();

            // Step 8: Clean up audit logs (optional - keeps last 30 days)
            $this->info('🧹 Cleaning up old audit logs...');
            $cutoffDate = now()->subDays(30);
            DB::table('audit_logs')->where('created_at', '<', $cutoffDate)->delete();

            // Step 9: Clean up sessions
            $this->info('🧹 Cleaning up old sessions...');
            $sessionCutoff = now()->subDays(7)->timestamp;
            DB::table('sessions')->where('last_activity', '<', $sessionCutoff)->delete();

            DB::commit();

            // Get counts after deletion
            $afterCounts = [
                'users' => DB::table('users')->count(),
                'students' => DB::table('students')->count(),
                'teachers' => DB::table('teachers')->count(),
                'enrollments' => DB::table('student_enrollments')->count(),
                'sections' => DB::table('sections')->count(),
                'programs' => DB::table('programs')->count(),
                'audit_logs' => DB::table('audit_logs')->count(),
            ];

            $this->newLine();
            $this->info('✅ Database reset completed successfully!');
            $this->info('📊 Data after reset:');
            $this->table(['Table', 'Before', 'After', 'Deleted'], [
                ['Users', $beforeCounts['users'], $afterCounts['users'], $beforeCounts['users'] - $afterCounts['users']],
                ['Students', $beforeCounts['students'], $afterCounts['students'], $beforeCounts['students'] - $afterCounts['students']],
                ['Teachers', $beforeCounts['teachers'], $afterCounts['teachers'], $beforeCounts['teachers'] - $afterCounts['teachers']],
                ['Enrollments', $beforeCounts['enrollments'], $afterCounts['enrollments'], $beforeCounts['enrollments'] - $afterCounts['enrollments']],
                ['Sections', $beforeCounts['sections'], $afterCounts['sections'], $beforeCounts['sections'] - $afterCounts['sections']],
                ['Programs', $beforeCounts['programs'], $afterCounts['programs'], $beforeCounts['programs'] - $afterCounts['programs']],
                ['Audit Logs', $beforeCounts['audit_logs'], $afterCounts['audit_logs'], $beforeCounts['audit_logs'] - $afterCounts['audit_logs']],
            ]);

            $this->newLine();
            $this->warn('🎯 Remaining users by role:');
            $remainingUsers = DB::table('users')
                ->select('role', DB::raw('count(*) as count'))
                ->groupBy('role')
                ->get();

            $this->table(['Role', 'Count'], $remainingUsers->map(function ($user) {
                return [$user->role, $user->count];
            }));

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Database reset failed: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
