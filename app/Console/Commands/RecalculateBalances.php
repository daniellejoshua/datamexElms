<?php

namespace App\Console\Commands;

use App\Models\StudentSemesterPayment;
use Illuminate\Console\Command;

class RecalculateBalances extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'payments:recalculate-balances {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Recalculate total_paid and balance for all student semester payments';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');
        $payments = StudentSemesterPayment::all();

        $this->info($dryRun ? 'DRY RUN: Showing balance recalculations' : 'Recalculating balances...');
        $this->info("Found {$payments->count()} payment records to process");

        $bar = $this->output->createProgressBar($payments->count());
        $bar->start();

        $updated = 0;
        foreach ($payments as $payment) {
            $currentTotalPaid = $payment->total_paid;
            $currentBalance = $payment->balance;

            $newTotalPaid = $payment->calculateTotalPaid();
            $newBalance = $payment->calculateBalance();

            if ($currentTotalPaid != $newTotalPaid || $currentBalance != $newBalance) {
                if ($dryRun) {
                    $this->newLine();
                    $this->warn("Student {$payment->student_id} ({$payment->academic_year} {$payment->semester}):");
                    $this->line("  Current: total_paid={$currentTotalPaid}, balance={$currentBalance}");
                    $this->line("  New: total_paid={$newTotalPaid}, balance={$newBalance}");
                } else {
                    $payment->update([
                        'total_paid' => $newTotalPaid,
                        'balance' => $newBalance,
                    ]);
                }
                $updated++;
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        if ($dryRun) {
            $this->info("Dry run complete. {$updated} records would be updated.");
        } else {
            $this->info("Balance recalculation complete. Updated {$updated} records.");
        }
    }
}
