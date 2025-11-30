<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory;
    protected $fillable = [
        'user_id',
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'birth_date',
        'address',
        'phone',
        'year_level',
        'program',
        'parent_contact',
        'student_type',
        'education_level',
        'track',
        'strand',
        'status',
        'enrolled_date',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'enrolled_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function studentEnrollments(): HasMany
    {
        return $this->hasMany(StudentEnrollment::class);
    }

    public function studentGrades(): HasManyThrough
    {
        return $this->hasManyThrough(StudentGrade::class, StudentEnrollment::class);
    }

    public function shsGrades(): HasManyThrough
    {
        return $this->hasManyThrough(ShsStudentGrade::class, StudentEnrollment::class);
    }

    public function semesterPayments(): HasMany
    {
        return $this->hasMany(StudentSemesterPayment::class);
    }

    public function studentSemesterPayments(): HasMany
    {
        return $this->hasMany(StudentSemesterPayment::class);
    }

    public function shsPayments(): HasMany
    {
        return $this->hasMany(ShsStudentPayment::class);
    }

    /**
     * Get payment model based on education level
     */
    public function payments(): HasMany
    {
        return $this->education_level === 'shs' 
            ? $this->shsPayments() 
            : $this->semesterPayments();
    }

    /**
     * Check if student is SHS
     */
    public function isShs(): bool
    {
        return $this->education_level === 'shs';
    }

    /**
     * Check if student is College
     */
    public function isCollege(): bool
    {
        return $this->education_level === 'college';
    }
}
