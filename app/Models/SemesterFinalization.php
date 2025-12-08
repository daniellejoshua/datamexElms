<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SemesterFinalization extends Model
{
    protected $fillable = [
        'academic_year',
        'semester',
        'education_level',
        'track',
        'finalized_at',
        'finalized_by',
        'notes',
    ];

    protected $casts = [
        'finalized_at' => 'datetime',
    ];

    public function finalizedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'finalized_by');
    }

    public static function isFinalized(
        string $academicYear,
        string $semester,
        string $educationLevel,
        ?string $track = null
    ): bool {
        return static::where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->where('education_level', $educationLevel)
            ->when($track, fn ($query) => $query->where('track', $track))
            ->exists();
    }

    public function scopeForCurrentSemester($query)
    {
        return $query->where('academic_year', config('academic.current_year', '2024-2025'))
            ->where('semester', config('academic.current_semester', '1st'));
    }
}
