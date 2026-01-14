<?php

namespace App\Models;

use App\Observers\StudentGradeObserver;
use Illuminate\Database\Eloquent\Attributes\ObservedBy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[ObservedBy([StudentGradeObserver::class])]
class StudentGrade extends Model
{
    protected $fillable = [
        'student_enrollment_id',
        'section_subject_id',
        'teacher_id',
        'prelim_grade',
        'midterm_grade',
        'prefinal_grade',
        'final_grade',
        'semester_grade',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'prelim_submitted_at' => 'datetime',
            'midterm_submitted_at' => 'datetime',
            'prefinal_submitted_at' => 'datetime',
            'final_submitted_at' => 'datetime',
            'finalized_at' => 'datetime',
        ];
    }

    public function studentEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class);
    }

    public function sectionSubject(): BelongsTo
    {
        return $this->belongsTo(SectionSubject::class);
    }
}
