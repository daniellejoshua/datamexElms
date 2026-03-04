<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchivedStudentSubject extends Model
{
    use HasFactory;

    protected $fillable = [
        'archived_student_enrollment_id',
        'student_id',
        'original_enrollment_id',
        'section_subject_id',
        'subject_id',
        'subject_code',
        'subject_name',
        'units',
        'prelim_grade',
        'midterm_grade',
        'prefinal_grade',
        'final_grade',
        'semester_grade',
        'teacher_id',
    ];

    /**
     * Auto-compute semester_grade when all period grades are present.
     */
    protected static function booted(): void
    {
        static::saving(function (self $model): void {
            $p = $model->prelim_grade;
            $m = $model->midterm_grade;
            $pf = $model->prefinal_grade;
            $f = $model->final_grade;

            if ($p !== null && $m !== null && $pf !== null && $f !== null) {
                $avg = ($p + $m + $pf + $f) / 4;
                $model->semester_grade = round($avg);
            }
        });
    }

    protected function casts(): array
    {
        return [
            'prelim_grade' => 'decimal:2',
            'midterm_grade' => 'decimal:2',
            'prefinal_grade' => 'decimal:2',
            'final_grade' => 'decimal:2',
            'semester_grade' => 'decimal:2',
            'units' => 'decimal:2',
        ];
    }

    public function archivedEnrollment(): BelongsTo
    {
        return $this->belongsTo(ArchivedStudentEnrollment::class, 'archived_student_enrollment_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(\App\Models\Teacher::class);
    }
}
