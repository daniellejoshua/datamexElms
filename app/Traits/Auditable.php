<?php

namespace App\Traits;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait Auditable
{
    public static function bootAuditable(): void
    {
        static::created(function ($model) {
            $model->auditEvent('created');
        });

        static::updated(function ($model) {
            $model->auditEvent('updated');
        });

        static::deleted(function ($model) {
            $model->auditEvent('deleted');
        });
    }

    protected function auditEvent(string $event): void
    {
        $user = Auth::user();
        $oldValues = null;
        $newValues = null;

        if ($event === 'updated') {
            $oldValues = $this->getOriginal();
            $newValues = $this->getAttributes();
            
            // Remove unchanged values
            $changes = array_diff_assoc($newValues, $oldValues);
            if (empty($changes)) {
                return; // No actual changes
            }
            
            $newValues = $changes;
            $oldValues = array_intersect_key($oldValues, $changes);
        } elseif ($event === 'created') {
            $newValues = $this->getAttributes();
        } elseif ($event === 'deleted') {
            $oldValues = $this->getOriginal();
        }

        AuditLog::create([
            'user_id' => $user?->id,
            'user_type' => $user?->role ?? 'system',
            'user_name' => $user?->first_name . ' ' . $user?->last_name ?? 'System',
            'event' => $event,
            'auditable_type' => get_class($this),
            'auditable_id' => $this->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'metadata' => $this->getAuditMetadata(),
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'url' => Request::url(),
            'method' => Request::method(),
            'academic_year' => $this->getAcademicYear(),
            'semester' => $this->getSemester(),
        ]);
    }

    // Override this method in models to provide custom metadata
    protected function getAuditMetadata(): array
    {
        return [];
    }

    // Override these methods in models to provide academic context
    protected function getAcademicYear(): ?string
    {
        return null;
    }

    protected function getSemester(): ?string
    {
        return null;
    }
}
