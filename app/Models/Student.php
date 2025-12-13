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
        'program_id',
        'curriculum_id',
        'batch_year',
        'current_year_level',
        'current_academic_year',
        'current_semester',
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'suffix',
        'birth_date',
        'address',
        'phone',
        'year_level',
        // 'program', // Removed redundant column
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
        return $this->belongsTo(Program::class, 'program_id', 'id');
    }

    public function curriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class);
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

    public function studentBalances(): HasMany
    {
        return $this->hasMany(StudentBalance::class);
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

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(PaymentTransaction::class);
    }

    public function archivedEnrollments(): HasMany
    {
        return $this->hasMany(ArchivedStudentEnrollment::class);
    }

    public function studentSubjectEnrollments(): HasMany
    {
        return $this->hasMany(StudentSubjectEnrollment::class);
    }

    /**
     * Get subject enrollments for this student.
     */
    public function subjectEnrollments(): HasMany
    {
        return $this->hasMany(StudentSubjectEnrollment::class);
    }

    /**
     * Get active subject enrollments for current semester.
     */
    public function activeSubjectEnrollments(): HasMany
    {
        return $this->subjectEnrollments()->where('status', 'active');
    }

    /**
     * Get subject enrollments for a specific academic period.
     */
    public function subjectEnrollmentsForPeriod($academicYear, $semester): HasMany
    {
        return $this->subjectEnrollments()
            ->where('academic_year', $academicYear)
            ->where('semester', $semester);
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

    /**
     * Ensure student has payment records for the given academic year and semester
     */
    public function ensurePaymentRecords(string $academicYear, string $semester): void
    {
        // Check if payment record already exists
        $existingPayment = StudentSemesterPayment::where([
            'student_id' => $this->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
        ])->first();

        if (! $existingPayment) {
            // Create payment record with default values based on education level
            $enrollmentFee = $this->education_level === 'college' ? 5000 : 3000;
            $prelimAmount = $this->education_level === 'college' ? 6000 : 4000;
            $midtermAmount = $this->education_level === 'college' ? 6000 : 4000;
            $prefinalAmount = $this->education_level === 'college' ? 6000 : 4000;
            $finalAmount = $this->education_level === 'college' ? 6000 : 4000;
            $totalSemesterFee = $enrollmentFee + $prelimAmount + $midtermAmount + $prefinalAmount + $finalAmount;

            StudentSemesterPayment::create([
                'student_id' => $this->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'enrollment_fee' => $enrollmentFee,
                'enrollment_paid' => 0,
                'prelim_amount' => $prelimAmount,
                'prelim_paid' => 0,
                'midterm_amount' => $midtermAmount,
                'midterm_paid' => 0,
                'prefinal_amount' => $prefinalAmount,
                'prefinal_paid' => 0,
                'final_amount' => $finalAmount,
                'final_paid' => 0,
                'total_semester_fee' => $totalSemesterFee,
                'total_paid' => 0,
                'balance' => $totalSemesterFee,
                'status' => 'pending',
            ]);
        }
    }

    /**
     * Assign the initial curriculum to a student based on their enrollment academic year
     */
    public function assignInitialCurriculum()
    {
        if ($this->curriculum_id) {
            return; // Already assigned
        }

        // Find the program curriculum for this student's program and enrollment year
        $programCurriculum = ProgramCurriculum::where('program_id', $this->program_id)
            ->where('academic_year', $this->current_academic_year)
            ->first();

        if ($programCurriculum) {
            $this->curriculum_id = $programCurriculum->curriculum_id;
            $this->save();
        }
    }
}
