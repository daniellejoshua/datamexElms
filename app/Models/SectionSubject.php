<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SectionSubject extends Model
{
    /** @use HasFactory<\Database\Factories\SectionSubjectFactory> */
    use HasFactory;

    protected $fillable = [
        'section_id',
        'subject_id',
        'teacher_id',
        'room',
        'schedule_days',
        'start_time',
        'end_time',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'string',
            'schedule_days' => 'array',
        ];
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function classSchedules(): HasMany
    {
        return $this->hasMany(ClassSchedule::class);
    }

    /**
     * Get student enrollments for this section subject.
     */
    public function studentEnrollments(): HasMany
    {
        return $this->hasMany(StudentSubjectEnrollment::class);
    }

    /**
     * Get active student enrollments for this section subject.
     */
    public function activeStudentEnrollments(): HasMany
    {
        return $this->studentEnrollments()->where('status', 'active');
    }

    /**
     * Get enrolled students for this section subject.
     */
    public function enrolledStudents()
    {
        return $this->belongsToMany(Student::class, 'student_subject_enrollments')
            ->withPivot(['enrollment_type', 'academic_year', 'semester', 'status', 'enrollment_date', 'remarks'])
            ->wherePivot('status', 'active');
    }

    /**
     * Scope for active section subjects
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
