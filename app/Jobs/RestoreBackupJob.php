<?php

namespace App\Jobs;

use App\Services\BackupManagerService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class RestoreBackupJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public string $path,
        public ?int $userId = null,
    ) {
        // job payload
    }

    /**
     * Execute the job.
     */
    public function handle(BackupManagerService $backupManager): void
    {
        try {
            $output = $backupManager->restoreBackup($this->path);

            // log audit entry including the raw output for later inspection
            DB::table('audit_logs')->insert([
                'user_id' => $this->userId,
                'user_type' => null,
                'user_name' => null,
                'event' => 'restore',
                'auditable_type' => 'backup',
                'auditable_id' => null,
                'old_values' => null,
                'new_values' => json_encode(['path' => $this->path]),
                'metadata' => json_encode(['output' => $output]),
                'ip_address' => null,
                'user_agent' => null,
                'url' => null,
                'method' => null,
                'academic_year' => null,
                'semester' => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // keep an info log as well so it's visible in stderr logs
            Log::info('RestoreBackupJob completed', ['path' => $this->path, 'output' => $output]);
        } catch (\Throwable $e) {
            Log::error('RestoreBackupJob failed', ['path' => $this->path, 'error' => $e->getMessage()]);

            // optionally rethrow to allow retry, or swallow
            throw $e;
        }
    }
}
