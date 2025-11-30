<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'user_type',
        'user_name',
        'event',
        'auditable_type',
        'auditable_id',
        'old_values',
        'new_values',
        'metadata',
        'ip_address',
        'user_agent',
        'url',
        'method',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'metadata' => 'array',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function auditable(): MorphTo
    {
        return $this->morphTo();
    }

    // Scope for cleanup (records older than X days)
    public function scopeOlderThan($query, int $days)
    {
        return $query->where('created_at', '<', now()->subDays($days));
    }

    // Scope for specific events
    public function scopeEvent($query, string $event)
    {
        return $query->where('event', $event);
    }

    // Scope for grade-related audits
    public function scopeGradeAudits($query)
    {
        return $query->whereIn('auditable_type', [
            'App\\Models\\StudentGrade',
            'App\\Models\\ShsStudentGrade',
        ]);
    }
}
