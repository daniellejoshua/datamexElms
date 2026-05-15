<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'subject_code',
        'subject_name',
        'description',
        'units',
        'subject_type',
        'education_level',
        'prerequisites',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'prerequisites' => 'array',
        ];
    }

    public function getMajorNameAttribute(): ?string
    {
        return $this->major?->program_name;
    }

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function major(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'program_id');
    }

    public function curriculumSubjects(): HasMany
    {
        return $this->hasMany(CurriculumSubject::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByYearLevel($query, int $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeBySemester($query, string $semester)
    {
        return $query->where('semester', $semester);
    }

    public function scopeByEducationLevel($query, string $level)
    {
        return $query->where('education_level', $level);
    }

    public function scopeCollege($query)
    {
        return $query->where('education_level', 'college');
    }

    public function scopeShs($query)
    {
        return $query->where('education_level', 'senior_high');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('subject_type', $type);
    }
}
