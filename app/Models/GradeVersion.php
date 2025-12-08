<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GradeVersion extends Model
{
    protected $fillable = [
        'student_grade_id',
        'shs_student_grade_id',
        'version_number',
        'grade_type',
        'teacher_id',
        'teacher_name',
        'prelim_grade',
        'midterm_grade',
        'prefinals_grade',
        'finals_grade',
        'semester_grade',
        'first_quarter_grade',
        'second_quarter_grade',
        'third_quarter_grade',
        'fourth_quarter_grade',
        'final_grade',
        'change_reason',
        'teacher_remarks',
        'change_type',
        'requires_approval',
        'is_approved',
        'approved_by',
        'approved_at',
        'academic_year',
        'semester',
    ];

    protected $casts = [
        'requires_approval' => 'boolean',
        'is_approved' => 'boolean',
        'approved_at' => 'datetime',
        'prelim_grade' => 'decimal:2',
        'midterm_grade' => 'decimal:2',
        'prefinals_grade' => 'decimal:2',
        'finals_grade' => 'decimal:2',
        'semester_grade' => 'decimal:2',
        'first_quarter_grade' => 'decimal:2',
        'second_quarter_grade' => 'decimal:2',
        'third_quarter_grade' => 'decimal:2',
        'fourth_quarter_grade' => 'decimal:2',
        'final_grade' => 'decimal:2',
    ];

    public function studentGrade(): BelongsTo
    {
        return $this->belongsTo(StudentGrade::class);
    }

    public function shsStudentGrade(): BelongsTo
    {
        return $this->belongsTo(ShsStudentGrade::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    // Scopes
    public function scopeLatestVersion(Builder $query)
    {
        return $query->orderByDesc('version_number')->limit(1);
    }

    public function scopeForAcademicYear(Builder $query, string $year)
    {
        return $query->where('academic_year', $year);
    }

    public function scopePendingApproval(Builder $query)
    {
        return $query->where('requires_approval', true)
            ->where('is_approved', false);
    }

    // Get the actual grade record this version belongs to
    public function getOriginalGrade()
    {
        if ($this->grade_type === 'college') {
            return $this->studentGrade;
        }

        return $this->shsStudentGrade;
    }
}
