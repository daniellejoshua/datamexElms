<?php

namespace App\Console\Commands;

use App\Models\ArchivedStudent;
use App\Models\GradeVersion;
use App\Models\PaymentTransaction;
use App\Models\Student;
use App\Models\StudentBalance;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSemesterPayment;
use App\Models\StudentSubjectEnrollment;
use App\Models\SchoolSetting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ClearStudentDataAndResetAcademicYear extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clear-student-data-and-reset-academic-year {--confirm : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clear all student-related data and reset academic year to 2025-2026 2nd semester';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (!$this->option('confirm')) {
            $this->warn('⚠️  WARNING: This will permanently delete all student-related data!');
            $this->line('');
            $this->line('This command will delete:');
            $this->line('• All students and their user accounts');
            $this->line('• All student enrollments');
            $this->line('• All payment records and transactions');
            $this->line('• All student grades and subject enrollments');
            $this->line('• All archived students');
            $this->line('• All student balances');
            $this->line('');
            $this->line('And reset the academic year to: 2025-2026 2nd Semester');
            $this->line('');

            if (!$this->confirm('Are you sure you want to continue?')) {
                $this->info('Operation cancelled.');
                return;
            }
        }

        $this->info('🧹 Starting data cleanup...');

        DB::beginTransaction();

        try {
            // Count records before deletion for reporting
            $studentCount = Student::count();
            $userCount = User::where('role', 'student')->count();
            $enrollmentCount = StudentEnrollment::count();
            $paymentCount = StudentSemesterPayment::count();
            $transactionCount = PaymentTransaction::count();
            $gradeCount = StudentGrade::count();
            $subjectEnrollmentCount = StudentSubjectEnrollment::count();
            $archivedCount = ArchivedStudent::count();
            $balanceCount = StudentBalance::count();
            $gradeVersionCount = GradeVersion::count();

            $this->line("📊 Records to be deleted:");
            $this->line("• Students: {$studentCount}");
            $this->line("• Student Users: {$userCount}");
            $this->line("• Enrollments: {$enrollmentCount}");
            $this->line("• Payment Records: {$paymentCount}");
            $this->line("• Payment Transactions: {$transactionCount}");
            $this->line("• Grades: {$gradeCount}");
            $this->line("• Subject Enrollments: {$subjectEnrollmentCount}");
            $this->line("• Archived Students: {$archivedCount}");
            $this->line("• Student Balances: {$balanceCount}");
            $this->line("• Grade Versions: {$gradeVersionCount}");
            $this->line('');

            // Delete in order to respect foreign key constraints
            $this->info('🗑️  Deleting grade versions...');
            GradeVersion::query()->delete();

            $this->info('🗑️  Deleting payment transactions...');
            PaymentTransaction::query()->delete();

            $this->info('🗑️  Deleting student grades...');
            StudentGrade::query()->delete();

            $this->info('🗑️  Deleting student subject enrollments...');
            StudentSubjectEnrollment::query()->delete();

            $this->info('🗑️  Deleting student semester payments...');
            StudentSemesterPayment::query()->delete();

            $this->info('🗑️  Deleting student enrollments...');
            StudentEnrollment::query()->delete();

            $this->info('🗑️  Deleting student balances...');
            StudentBalance::query()->delete();

            $this->info('🗑️  Deleting archived students...');
            ArchivedStudent::query()->delete();

            $this->info('🗑️  Deleting students...');
            Student::query()->delete();

            $this->info('🗑️  Deleting student user accounts...');
            User::where('role', 'student')->delete();

            DB::commit();

            $this->info('✅ Student data cleared successfully!');
            $this->line('');

            // Reset academic year and semester
            $this->info('📅 Setting academic year to 2025-2026 2nd Semester...');
            SchoolSetting::setCurrentAcademicPeriod('2025-2026', '2nd');

            $this->info('✅ Academic year reset successfully!');
            $this->line('');

            $this->info('🎉 Operation completed successfully!');
            $this->line('');
            $this->line('📋 Summary:');
            $this->line("• Deleted {$studentCount} students");
            $this->line("• Deleted {$userCount} student user accounts");
            $this->line("• Deleted {$enrollmentCount} enrollments");
            $this->line("• Deleted {$paymentCount} payment records");
            $this->line("• Deleted {$transactionCount} payment transactions");
            $this->line("• Deleted {$gradeCount} grades");
            $this->line("• Deleted {$subjectEnrollmentCount} subject enrollments");
            $this->line("• Deleted {$archivedCount} archived students");
            $this->line("• Deleted {$balanceCount} student balances");
            $this->line("• Deleted {$gradeVersionCount} grade versions");
            $this->line("• Set academic year to: 2025-2026 2nd Semester");

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error occurred: ' . $e->getMessage());
            return 1;
        }

        return 0;
    }
}
