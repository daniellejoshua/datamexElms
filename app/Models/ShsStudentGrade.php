<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShsStudentGrade extends Model
{
    protected $fillable = [
        'student_enrollment_id',
        'teacher_id',
        'first_quarter_grade',
        'first_quarter_submitted_at',
        'second_quarter_grade',
        'second_quarter_submitted_at',
        'third_quarter_grade',
        'third_quarter_submitted_at',
        'fourth_quarter_grade',
        'fourth_quarter_submitted_at',
        'final_grade',
        'completion_status',
        'teacher_remarks',
    ];

    protected function casts(): array
    {
        return [
            'first_quarter_grade' => 'decimal:2',
            'second_quarter_grade' => 'decimal:2',
            'third_quarter_grade' => 'decimal:2',
            'fourth_quarter_grade' => 'decimal:2',
            'final_grade' => 'decimal:2',
            'first_quarter_submitted_at' => 'datetime',
            'second_quarter_submitted_at' => 'datetime',
            'third_quarter_submitted_at' => 'datetime',
            'fourth_quarter_submitted_at' => 'datetime',
        ];
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    /**
     * Calculate final grade as average of 4 quarters
     */
    public function calculateFinalGrade(): ?float
    {
        $quarters = collect([
            $this->first_quarter_grade,
            $this->second_quarter_grade,
            $this->third_quarter_grade,
            $this->fourth_quarter_grade,
        ])->filter();

        if ($quarters->count() === 4) {
            return round($quarters->average(), 2);
        }

        return null;
    }

    /**
     * Update final grade automatically when quarters are complete
     */
    protected static function booted(): void
    {
        static::saving(function (ShsStudentGrade $grade) {
            $grade->final_grade = $grade->calculateFinalGrade();
        });
    }
}
