<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchivedStudentEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'archived_section_id',
        'student_id',
        'original_enrollment_id',
        'academic_year',
        'semester',
        'enrolled_date',
        'completion_date',
        'final_status',
        'final_grades',
        'final_semester_grade',
        'letter_grade',
        'student_data',
    ];

    protected function casts(): array
    {
        return [
            'final_grades' => 'array',
            'student_data' => 'array',
            'enrolled_date' => 'date',
            'completion_date' => 'date',
            'final_semester_grade' => 'decimal:2',
        ];
    }

    public function archivedSection(): BelongsTo
    {
        return $this->belongsTo(ArchivedSection::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('final_status', $status);
    }

    public function scopeByGradeRange($query, float $min, float $max)
    {
        return $query->whereBetween('final_semester_grade', [$min, $max]);
    }
}
