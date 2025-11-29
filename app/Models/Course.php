<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Course extends Model
{
    protected $fillable = [
        'subject_name',
        'course_code',
        'description',
        'units',
        'education_level',
        'track',
        'status',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    /**
     * Scope for SHS courses
     */
    public function scopeShs($query)
    {
        return $query->whereIn('education_level', ['shs', 'both']);
    }

    /**
     * Scope for College courses
     */
    public function scopeCollege($query)
    {
        return $query->whereIn('education_level', ['college', 'both']);
    }

    /**
     * Scope for specific track (SHS)
     */
    public function scopeTrack($query, string $track)
    {
        return $query->where('track', $track);
    }
}
