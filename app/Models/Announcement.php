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
        'expires_at',
        'is_archived',
        'archived_at',
        'rich_content',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'is_archived' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
        'archived_at' => 'datetime',
        'rich_content' => 'array',
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

    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->where('is_archived', false)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    public function scopeVisibleTo($query, $user)
    {
        if (in_array($user->role, ['super_admin', 'registrar'])) {
            return $query;
        }

        return $query->where(function ($q) {
            $q->where('visibility', 'all_users')
                ->orWhere(function ($subQ) {
                    $subQ->where('visibility', 'teachers_only')
                        ->whereHas('creator', function ($creatorQ) {
                            $creatorQ->where('role', 'teacher');
                        });
                })
                ->orWhere(function ($subQ) {
                    $subQ->where('visibility', 'students_only')
                        ->whereHas('creator', function ($creatorQ) {
                            $creatorQ->where('role', 'student');
                        });
                });
        });
    }
}
