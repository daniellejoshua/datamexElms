<?php

namespace App\Console\Commands;

use App\Models\ShsStudentPayment;
use Illuminate\Console\Command;

class CleanDuplicateShsPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:clean-duplicate-shs-payments {--dry-run : Show what would be deleted without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up duplicate SHS payment records, keeping only annual records';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        if ($dryRun) {
            $this->info('DRY RUN MODE - No changes will be made');
        }

        // Find all SHS payments that are not 'annual'
        $nonAnnualPayments = ShsStudentPayment::whereHas('student', function ($query) {
            $query->where('education_level', 'senior_high');
        })
            ->where('semester', '!=', 'annual')
            ->with('student')
            ->get();

        $deleted = 0;

        foreach ($nonAnnualPayments as $payment) {
            $this->line("Student: {$payment->student->user->name} ({$payment->student->student_number})");
            $this->line("  Payment ID: {$payment->id}");
            $this->line("  Academic Year: {$payment->academic_year}");
            $this->line("  Semester: {$payment->semester}");
            $this->line("  Total Fee: {$payment->total_semester_fee}");

            if (! $dryRun) {
                $payment->delete();
                $this->line('  ✓ Deleted');
            } else {
                $this->line('  (Would delete)');
            }

            $deleted++;
            $this->line('');
        }

        if ($dryRun) {
            $this->info("DRY RUN COMPLETE - Would delete {$deleted} non-annual SHS payment records");
        } else {
            $this->info("CLEANUP COMPLETE - Deleted {$deleted} non-annual SHS payment records");
        }

        return Command::SUCCESS;
    }
}
