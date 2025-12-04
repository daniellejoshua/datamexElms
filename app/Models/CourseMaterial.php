<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CourseMaterial extends Model
{
    protected $fillable = [
        'section_id',
        'teacher_id',
        'title',
        'description',
        'file_name',
        'file_path',
        'file_hash',
        'referenced_file_id',
        'file_type',
        'file_size',
        'original_name',
        'category',
        'visibility',
        'is_active',
        'upload_date',
        'download_count',
        'version_number',
    ];

    /**
     * Relationship to the original file (if this is a reference)
     */
    public function originalFile()
    {
        return $this->belongsTo(CourseMaterial::class, 'referenced_file_id');
    }

    /**
     * Relationship to files that reference this one
     */
    public function references()
    {
        return $this->hasMany(CourseMaterial::class, 'referenced_file_id');
    }

    /**
     * Find existing file by hash to prevent duplicates
     */
    public static function findByFileHash(string $hash)
    {
        return static::where('file_hash', $hash)->first();
    }

    /**
     * Create a reference to an existing file for a different section/teacher
     */
    public static function createReference(CourseMaterial $originalFile, array $data)
    {
        return static::create(array_merge($data, [
            'file_name' => $originalFile->file_name,
            'file_path' => $originalFile->file_path,
            'file_hash' => $originalFile->file_hash,
            'referenced_file_id' => $originalFile->id, // Clear reference to original
            'file_type' => $originalFile->file_type,
            'file_size' => $originalFile->file_size,
        ]));
    }

    /**
     * Check if this material is using the original file or a reference
     */
    public function isOriginalFile(): bool
    {
        return $this->referenced_file_id === null;
    }

    /**
     * Get the original material for this file
     */
    public function getOriginalMaterial(): ?CourseMaterial
    {
        if (!$this->file_hash) {
            return $this; // If no hash, this is the original
        }

        return static::where('file_hash', $this->file_hash)
            ->orderBy('created_at')
            ->first();
    }

    /**
     * Get all references to this file
     */
    public function getReferences()
    {
        if (!$this->file_hash) {
            return collect(); // No references if no hash
        }

        return static::where('file_hash', $this->file_hash)
            ->where('id', '!=', $this->id)
            ->get();
    }

    protected $casts = [
        'upload_date' => 'date',
        'is_active' => 'boolean',
        'download_count' => 'integer',
        'version_number' => 'integer',
        'file_size' => 'integer',
    ];

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function accessLogs(): HasMany
    {
        return $this->hasMany(MaterialAccessLog::class);
    }

    public function getFormattedFileSizeAttribute(): string
    {
        $bytes = $this->file_size;
        $units = ['B', 'KB', 'MB', 'GB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, 2).' '.$units[$i];
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForSection($query, $sectionId)
    {
        return $query->where('section_id', $sectionId);
    }
}
