<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Announcement extends Model
{
    protected $fillable = [
        'title',
        'content',
        'created_by',
        'visibility',
        'priority',
        'is_published',
        'published_at',
        'scheduled_at',
        'expires_at',
        'is_archived',
        'archived_at',
        'rich_content',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_archived' => 'boolean',
        'published_at' => 'datetime',
        'scheduled_at' => 'datetime',
        'expires_at' => 'datetime',
        'archived_at' => 'datetime',
        'rich_content' => 'array',
    ];

    protected $appends = [
        'is_expired',
        'is_scheduled',
    ];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(AnnouncementAttachment::class);
    }

    public function readStatuses(): HasMany
    {
        return $this->hasMany(AnnouncementReadStatus::class);
    }

    public function getIsExpiredAttribute()
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsScheduledAttribute()
    {
        return $this->scheduled_at && $this->scheduled_at->isFuture() && ! $this->is_published;
    }

    public function getReadCountAttribute()
    {
        return $this->readStatuses()->where('is_read', true)->count();
    }

    public function getUnreadCountAttribute()
    {
        return $this->readStatuses()->where('is_read', false)->count();
    }

    public function getTotalReadStatusCountAttribute()
    {
        return $this->readStatuses()->count();
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->where('is_archived', false)
            ->where(function ($q) {
                $q->whereNull('published_at')
                    ->orWhere('published_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeVisibleTo($query, $user)
    {
        if (in_array($user->role, ['super_admin', 'registrar', 'head_teacher'])) {
            return $query;
        }

        $visibleTypes = ['all_users'];

        if ($user->role === 'teacher') {
            $visibleTypes[] = 'teachers_only';
            $visibleTypes[] = 'employees_only';
        }

        if ($user->role === 'student') {
            $visibleTypes[] = 'students_only';
        }

        return $query->whereIn('visibility', $visibleTypes);
    }
}
