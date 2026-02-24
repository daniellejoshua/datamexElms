<?php

namespace App\Console\Commands;

use App\Models\ProgramFee;
use App\Models\StudentSemesterPayment;
use Illuminate\Console\Command;

class FixStudentPaymentFees extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:fix-student-payment-fees {--dry-run : Show what would be changed without making changes} {--all : Include payments for students regardless of status (dangerous)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Fix student payment fees to use correct base fees from program_fees table';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        $allFlag = $this->option('all');

        // by default we only fix active students so that dropped/inactive/graduate
        // records retain the fees they were originally created with.  passing
        // --all overrides that behaviour and processes every payment.
        // start with college semester payments
        $collegePayments = StudentSemesterPayment::with('student.program')
            ->when(!$allFlag, fn($q) => $q->whereHas('student', function ($q) {
                $q->where('status', 'active');
            }))
            ->get();

        // also include SHS payments so the same freeze behaviour applies
        $shsPayments = \App\Models\ShsStudentPayment::with('student.program')
            ->when(!$allFlag, fn($q) => $q->whereHas('student', function ($q) {
                $q->where('status', 'active');
            }))
            ->get();

        $fixed = 0;

        foreach ($collegePayments->concat($shsPayments) as $payment) {
            // skip finalized payments by default to avoid changing historical
            // records; pass --all to override this behaviour.
            if (! $allFlag && ($payment->fee_finalized ?? false)) {
                continue;
            }

            $student = $payment->student;

            // automatically freeze payments that belong to past academic periods
            // this makes it easier to catch rows created before the freeze logic
            // was introduced in the service layer.
            $currentYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
            $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();
            if ($payment->academic_year !== $currentYear || $payment->semester !== $currentSemester) {
                if (! $dryRun) {
                    $payment->fee_finalized = true;
                    $payment->save();
                }
            }

            // Get current year level
            $currentYearLevel = $student->current_year_level ?? $student->year_level;
            if (is_string($currentYearLevel)) {
                preg_match('/\d+/', $currentYearLevel, $matches);
                $currentYearLevel = isset($matches[0]) ? (int) $matches[0] : 1;
            }

            // Get base fee from program_fees table
            $programFee = ProgramFee::where('program_id', $student->program_id)
                ->where('year_level', $currentYearLevel)
                ->where('education_level', $student->education_level)
                ->where('fee_type', 'regular')
                ->first();

            $correctBaseFee = $programFee->semester_fee ?? $student->program->semester_fee ?? 12000.00;

            // For regular students: total_semester_fee should be base fee
            // For irregular students: total_semester_fee should be base fee + irregular fees
            $correctTotalFee = $correctBaseFee + ($payment->irregular_subjects_count * $payment->irregular_subject_fee);

            if ($payment->total_semester_fee != $correctTotalFee) {
                $this->line("Student: {$student->user->name} ({$student->student_type})");
                $this->line("  Current total_semester_fee: {$payment->total_semester_fee}");
                $this->line("  Correct total_semester_fee: {$correctTotalFee}");
                $this->line("  Irregular subjects: {$payment->irregular_subjects_count}");

                if (! $dryRun) {
                    $payment->update(['total_semester_fee' => $correctTotalFee]);
                    $this->line('  ✓ Updated');
                } else {
                    $this->line('  (Would update)');
                }

                $fixed++;
                $this->line('');
            }
        }

        if ($dryRun) {
            $this->info("DRY RUN COMPLETE - Would fix {$fixed} payments");
        } else {
            $this->info("FIXED {$fixed} payments");
        }

        return Command::SUCCESS;
    }
}
