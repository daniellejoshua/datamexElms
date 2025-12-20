<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Curriculum extends Model
{
    use HasFactory;

    protected $table = 'curriculum';

    protected $fillable = [
        'program_id',
        'curriculum_code',
        'curriculum_name',
        'description',
        'status',
        'is_current',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculumSubjects(): HasMany
    {
        return $this->hasMany(CurriculumSubject::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeIsCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeByProgram($query, int $programId)
    {
        return $query->where('program_id', $programId);
    }

    public function scopeByAcademicYear($query, string $year)
    {
        return $query->where('academic_year', $year);
    }

    public function getTotalUnitsAttribute()
    {
        return $this->curriculumSubjects()->sum('units');
    }

    public function getSubjectsByYearAndSemester($yearLevel, $semester)
    {
        return $this->curriculumSubjects()
            ->where('year_level', $yearLevel)
            ->where('semester', $semester)
            ->orderBy('subject_code')
            ->get();
    }
}
