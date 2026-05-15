<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class UpdateVoucherIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'voucher:update-ids {--dry-run : Show what would be updated without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update voucher IDs for existing SHS students to the format shsvoucher(student_number)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $students = \App\Models\Student::where('education_level', 'senior_high')
            ->where('has_voucher', true)
            ->whereNull('voucher_id')
            ->get();

        if ($students->isEmpty()) {
            $this->info('No SHS students found that need voucher ID updates.');

            return;
        }

        $this->info("Found {$students->count()} SHS students that need voucher ID updates.");

        if ($dryRun) {
            $this->info('DRY RUN - The following students would be updated:');
            foreach ($students as $student) {
                $expectedVoucherId = 'shsvoucher('.$student->student_number.')';
                $this->line("  - {$student->first_name} {$student->last_name} ({$student->student_number}) -> {$expectedVoucherId}");
            }

            return;
        }

        $updated = 0;
        foreach ($students as $student) {
            $voucherId = 'shsvoucher('.$student->student_number.')';
            $student->update(['voucher_id' => $voucherId]);
            $updated++;
        }

        $this->info("Successfully updated {$updated} SHS students with voucher IDs.");
    }
}
