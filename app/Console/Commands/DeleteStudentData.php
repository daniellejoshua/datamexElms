<?php

namespace App\Console\Commands;

use App\Models\ArchivedStudent;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class DeleteStudentData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-student-data {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all student-related data while preserving non-student users';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('This will delete ALL student data. Are you sure?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('Starting student data deletion...');

        // Get count of records to be deleted
        $studentCount = Student::count();
        $enrollmentCount = StudentEnrollment::count();
        $archivedStudentCount = ArchivedStudent::count();
        $archivedEnrollmentCount = ArchivedStudentEnrollment::count();
        $paymentCount = StudentSemesterPayment::count();

        $this->info("Found {$studentCount} students, {$enrollmentCount} enrollments, {$archivedStudentCount} archived students, {$archivedEnrollmentCount} archived enrollments, {$paymentCount} payments to delete.");

        // Start transaction for safety
        DB::beginTransaction();

        try {
            // Collect student user IDs BEFORE deleting students
            $studentUserIds = Student::pluck('user_id')->toArray();
            $archivedStudentUserIds = ArchivedStudent::pluck('user_id')->toArray();
            $allStudentUserIds = array_merge($studentUserIds, $archivedStudentUserIds);

            // Delete in order to respect foreign key constraints
            // Delete child records first
            DB::table('student_academic_transcripts')->delete();
            $this->info('✓ Deleted student academic transcripts');

            DB::table('student_grades')->delete();
            $this->info('✓ Deleted student grades');

            DB::table('material_access_logs')->delete();
            $this->info('✓ Deleted material access logs');

            StudentSemesterPayment::query()->delete();
            $this->info('✓ Deleted student semester payments');

            StudentEnrollment::query()->delete();
            $this->info('✓ Deleted student enrollments');

            ArchivedStudentEnrollment::query()->delete();
            $this->info('✓ Deleted archived student enrollments');

            // Delete students (this will cascade to related data)
            Student::query()->delete();
            $this->info('✓ Deleted students');

            ArchivedStudent::query()->delete();
            $this->info('✓ Deleted archived students');

            // Delete user accounts that belong to students only
            // We need to be careful here - only delete users that were students
            if (! empty($allStudentUserIds)) {
                User::whereIn('id', $allStudentUserIds)->delete();
                $this->info('✓ Deleted student user accounts');
            }

            // Also delete any orphaned student user accounts (users with student role but no student record)
            $orphanedStudentUsers = DB::table('users')
                ->leftJoin('students', 'users.id', '=', 'students.user_id')
                ->where('users.role', 'student')
                ->whereNull('students.id')
                ->pluck('users.id');

            if ($orphanedStudentUsers->isNotEmpty()) {
                User::whereIn('id', $orphanedStudentUsers)->delete();
                $this->info('✓ Deleted orphaned student user accounts ('.$orphanedStudentUsers->count().')');
            }

            DB::commit();
            $this->info('✅ All student data deleted successfully!');
            $this->info('Non-student users (teachers, admins, etc.) have been preserved.');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error during deletion: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
