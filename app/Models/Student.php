<?php

namespace App\Models;

use App\Traits\HasPaymentGatedGrades;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Student extends Model
{
    /** @use HasFactory<\Database\Factories\StudentFactory> */
    use HasFactory, HasPaymentGatedGrades;

    protected $fillable = [
        'user_id',
        'program_id',
        'current_year_level',
        'student_number',
        'student_id', // Add student_id to fillable
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

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
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

    /**
     * Payment relationships for existing system
     */
    public function semesterPayments(): HasMany
    {
        return $this->hasMany(StudentSemesterPayment::class);
    }

    public function shsPayments(): HasMany
    {
        return $this->hasMany(ShsStudentPayment::class);
    }

    /**
     * Unified payment relationship (new system)
     */
    public function payments(): HasMany
    {
        return $this->education_level === 'shs' 
            ? $this->shsPayments() 
            : $this->semesterPayments();
    }

    /**
     * Get payments for specific academic period
     */
    public function paymentsForPeriod(string $academicYear, string $semester): HasMany
    {
        return $this->payments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester);
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
