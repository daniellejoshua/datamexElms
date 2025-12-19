<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Section extends Model
{
    /** @use HasFactory<\Database\Factories\SectionFactory> */
    use HasFactory;

    protected $fillable = [
        'program_id',
        'curriculum_id',
        'section_name',
        'year_level',
        'academic_year',
        'semester',
        'status',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
    }

    // Teacher assignments relationship
    public function teacherAssignments(): HasMany
    {
        return $this->hasMany(TeacherAssignment::class);
    }

    // New many-to-many relationships through SectionSubject pivot
    public function sectionSubjects(): HasMany
    {
        return $this->hasMany(SectionSubject::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class, 'section_subjects')
            ->withPivot(['teacher_id', 'room', 'schedule_days', 'start_time', 'end_time', 'status'])
            ->withTimestamps();
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(Teacher::class, 'section_subjects')
            ->withPivot(['subject_id', 'room', 'schedule_days', 'start_time', 'end_time', 'status'])
            ->withTimestamps();
    }

    // Keep existing relationships
    public function studentEnrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function courseMaterials(): HasMany
    {
        return $this->hasMany(CourseMaterial::class);
    }

    // Class schedules relationship through section subjects
    public function classSchedules(): HasManyThrough
    {
        return $this->hasManyThrough(ClassSchedule::class, SectionSubject::class);
    }
}
