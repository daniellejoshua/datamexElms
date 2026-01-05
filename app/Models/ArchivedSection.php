<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ArchivedSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'original_section_id',
        'program_id',
        'curriculum_id',
        'year_level',
        'section_name',
        'academic_year',
        'semester',
        'room',
        'status',
        'course_data',
        'total_enrolled_students',
        'completed_students',
        'dropped_students',
        'section_average_grade',
        'archived_at',
        'archived_by',
        'archive_notes',
    ];

    protected function casts(): array
    {
        return [
            'course_data' => 'array',
            'archived_at' => 'datetime',
            'section_average_grade' => 'decimal:2',
        ];
    }

    public function archivedEnrollments(): HasMany
    {
        return $this->hasMany(ArchivedStudentEnrollment::class);
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    public function scopeByAcademicYear($query, string $year)
    {
        return $query->where('academic_year', $year);
    }

    public function scopeBySemester($query, string $semester)
    {
        return $query->where('semester', $semester);
    }
}
