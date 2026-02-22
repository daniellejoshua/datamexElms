<?php

namespace App\Traits;

use App\Models\SyncLog;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait SyncsToCloud
{
    public static function bootSyncsToCloud(): void
    {
        static::saved(function ($model) {
            $model->markForSync();
        });

        static::deleted(function ($model) {
            $model->markForSync(true);
        });
    }

    public function markForSync(bool $deleted = false): void
    {
        $this->syncLogs()->create([
            'payload' => $this->getAttributes(),
            'deleted' => $deleted,
        ]);
    }

    public function syncLogs(): MorphMany
    {
        return $this->morphMany(SyncLog::class, 'model');
    }
}
