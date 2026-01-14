<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSubjectCredit extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'curriculum_subject_id',
        'subject_id',
        'subject_code',
        'subject_name',
        'units',
        'year_level',
        'semester',
        'credit_type',
        'credit_status',
        'final_grade',
        'credited_at',
        'student_grade_id',
        'student_credit_transfer_id',
        'academic_year',
        'semester_taken',
        'approved_by',
        'approved_at',
        'notes',
    ];

    protected $casts = [
        'final_grade' => 'decimal:2',
        'credited_at' => 'datetime',
        'approved_at' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function curriculumSubject(): BelongsTo
    {
        return $this->belongsTo(CurriculumSubject::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function studentGrade(): BelongsTo
    {
        return $this->belongsTo(StudentGrade::class);
    }

    public function studentCreditTransfer(): BelongsTo
    {
        return $this->belongsTo(StudentCreditTransfer::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * Check if this credit is completed (credited)
     */
    public function isCompleted(): bool
    {
        return $this->credit_status === 'credited';
    }

    /**
     * Check if this subject was passed (grade >= 60)
     */
    public function isPassed(): bool
    {
        return $this->final_grade && $this->final_grade >= 60;
    }
}
