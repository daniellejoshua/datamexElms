<?php

namespace App\Console\Commands;

use App\Services\BackupManagerService;
use Illuminate\Console\Command;

class RunAutomaticBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:run-automatic {--force : Run backup immediately even when schedule is not due}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Run automatic database backup according to configured schedule';

    /**
     * Execute the console command.
     */
    public function handle(BackupManagerService $backupManager): int
    {
        try {
            $result = $backupManager->runAutomaticBackup((bool) $this->option('force'));

            if (! ($result['ran'] ?? false)) {
                $this->info('Automatic backup skipped: '.($result['reason'] ?? 'not due'));

                return self::SUCCESS;
            }

            $filename = $result['backup']['filename'] ?? 'unknown';
            $destination = $result['backup']['destination'] ?? 'local';

            $this->info("Automatic backup completed: {$filename} ({$destination})");

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            $this->error('Automatic backup failed: '.$exception->getMessage());

            return self::FAILURE;
        }
    }
}
