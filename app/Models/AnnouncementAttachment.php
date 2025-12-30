<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AnnouncementAttachment extends Model
{
    protected $fillable = [
        'announcement_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
        'original_name',
        'download_count',
        'file_hash',
        'is_duplicate',
        'cloudinary_public_id',
        'cloudinary_url',
        'image_format',
        'image_width',
        'image_height',
    ];

    protected $casts = [
        'file_size' => 'integer',
        'download_count' => 'integer',
        'is_duplicate' => 'boolean',
        'image_width' => 'integer',
        'image_height' => 'integer',
    ];

    public function announcement(): BelongsTo
    {
        return $this->belongsTo(Announcement::class);
    }
}
