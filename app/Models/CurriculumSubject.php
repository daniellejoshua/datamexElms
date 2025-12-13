<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CurriculumSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'curriculum_id',
        'subject_id',
        'subject_code',
        'subject_name',
        'description',
        'units',
        'hours',
        'year_level',
        'semester',
        'subject_type',
        'prerequisites',
        'is_lab',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'prerequisites' => 'array',
            'units' => 'decimal:1',
            'is_lab' => 'boolean',
        ];
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function program()
    {
        return $this->hasOneThrough(Program::class, Curriculum::class, 'id', 'id', 'curriculum_id', 'program_id');
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

    public function scopeByType($query, string $type)
    {
        return $query->where('subject_type', $type);
    }

    public function scopeCore($query)
    {
        return $query->where('subject_type', 'core');
    }

    public function scopeElective($query)
    {
        return $query->where('subject_type', 'elective');
    }

    public function scopeMajor($query)
    {
        return $query->where('subject_type', 'major');
    }

    public function scopeLabSubjects($query)
    {
        return $query->where('is_lab', true);
    }
}
