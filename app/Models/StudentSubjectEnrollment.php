<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSubjectEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'section_subject_id',
        'enrollment_type',
        'academic_year',
        'semester',
        'status',
        'enrollment_date',
        'enrolled_by',
        'remarks',
    ];

    protected $casts = [
        'enrollment_date' => 'date',
    ];

    /**
     * Get the student that owns this enrollment.
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the section subject this enrollment is for.
     */
    public function sectionSubject(): BelongsTo
    {
        return $this->belongsTo(SectionSubject::class);
    }

    /**
     * Get the user who enrolled the student.
     */
    public function enrolledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'enrolled_by');
    }

    /**
     * Get the subject through the section subject relationship.
     */
    public function subject()
    {
        return $this->sectionSubject->subject();
    }

    /**
     * Get the section through the section subject relationship.
     */
    public function section()
    {
        return $this->sectionSubject->section();
    }

    /**
     * Get the teacher through the section subject relationship.
     */
    public function teacher()
    {
        return $this->sectionSubject->teacher();
    }

    /**
     * Scope for active enrollments.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Scope for regular students.
     */
    public function scopeRegular($query)
    {
        return $query->where('enrollment_type', 'regular');
    }

    /**
     * Scope for irregular students.
     */
    public function scopeIrregular($query)
    {
        return $query->where('enrollment_type', 'irregular');
    }

    /**
     * Scope for current academic period.
     */
    public function scopeCurrentPeriod($query, $academicYear, $semester)
    {
        return $query->where('academic_year', $academicYear)
            ->where('semester', $semester);
    }
}
