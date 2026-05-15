<?php

namespace App\Console\Commands;

use App\Models\SyncLog;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\InteractsWithTime;

class PushToCloud extends Command
{
    use InteractsWithTime;

    protected $signature = 'sync:push {--limit=100}';

    protected $description = 'Send pending sync logs to the cloud instance';

    public function handle(): int
    {
        $limit = $this->option('limit');

        SyncLog::with('model')->limit($limit)->get()->each(function (SyncLog $log) {
            $this->info("pushing #{$log->id} ({$log->model_type})");

            try {
                Http::timeout(5)
                    ->post(config('sync.cloud_url').'/api/sync', [
                        'model' => $log->model_type,
                        'data' => $log->payload,
                        'deleted' => $log->deleted,
                    ]);

                $log->delete();
            } catch (\Exception $e) {
                // keep the log for later retry
                $this->error('failed: '.$e->getMessage());
            }
        });

        return 0;
    }
}
