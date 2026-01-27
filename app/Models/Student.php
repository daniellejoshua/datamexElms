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
        'previous_program_id',
        'previous_curriculum_id',
        'previous_school',
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
        'course_shifted_at',
        'shift_reason',
        'gender',
        'has_voucher',
        'voucher_id',
        'voucher_status',
        'voucher_invalidated_at',
        'voucher_invalidation_reason',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'enrolled_date' => 'date',
            'course_shifted_at' => 'datetime',
            'has_voucher' => 'boolean',
            'voucher_invalidated_at' => 'datetime',
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

    public function previousProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'previous_program_id', 'id');
    }

    public function previousCurriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class, 'previous_curriculum_id');
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

    public function creditTransfers(): HasMany
    {
        return $this->hasMany(StudentCreditTransfer::class);
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
        return $this->education_level === 'senior_high'
            ? $this->shsPayments()
            : $this->semesterPayments();
    }

    /**
     * Check if student is SHS
     */
    public function isShs(): bool
    {
        return $this->education_level === 'senior_high';
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
     * Ensure SHS student has payment records for the given academic year and semester
     */
    public function ensureShsPaymentRecords(string $academicYear, string $semester): void
    {
        // Check if payment record already exists
        $existingPayment = ShsStudentPayment::where([
            'student_id' => $this->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
        ])->first();

        if (! $existingPayment) {
            // Create SHS payment record with quarterly structure
            // SHS typically has lower fees than college
            $quarterlyAmount = 8000; // Total per quarter
            $totalSemesterFee = $quarterlyAmount * 4; // 4 quarters

            ShsStudentPayment::create([
                'student_id' => $this->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'first_quarter_amount' => $quarterlyAmount,
                'first_quarter_paid' => false,
                'second_quarter_amount' => $quarterlyAmount,
                'second_quarter_paid' => false,
                'third_quarter_amount' => $quarterlyAmount,
                'third_quarter_paid' => false,
                'fourth_quarter_amount' => $quarterlyAmount,
                'fourth_quarter_paid' => false,
                'total_semester_fee' => $totalSemesterFee,
                'total_paid' => 0,
                'balance' => $totalSemesterFee,
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

    /**
     * Get all subject credits for this student
     */
    public function subjectCredits(): HasMany
    {
        return $this->hasMany(StudentSubjectCredit::class);
    }

    /**
     * Get completed (credited) subjects
     */
    public function completedSubjects(): HasMany
    {
        return $this->hasMany(StudentSubjectCredit::class)->where('credit_status', 'credited');
    }

    /**
     * Check if student has completed all curriculum requirements
     */
    public function hasCompletedCurriculum(): bool
    {
        if (! $this->curriculum_id) {
            return false;
        }

        // Get total required subjects in curriculum
        $requiredSubjects = CurriculumSubject::where('curriculum_id', $this->curriculum_id)->count();

        // Get total credited subjects for this student
        $creditedSubjects = $this->completedSubjects()->count();

        return $requiredSubjects > 0 && $creditedSubjects >= $requiredSubjects;
    }

    /**
     * Get curriculum completion percentage
     */
    public function getCurriculumCompletionPercentage(): float
    {
        if (! $this->curriculum_id) {
            return 0;
        }

        $requiredSubjects = CurriculumSubject::where('curriculum_id', $this->curriculum_id)->count();

        if ($requiredSubjects === 0) {
            return 0;
        }

        $creditedSubjects = $this->completedSubjects()->count();

        return round(($creditedSubjects / $requiredSubjects) * 100, 2);
    }

    /**
     * Get remaining subjects needed for graduation
     */
    public function getRemainingSubjects()
    {
        if (! $this->curriculum_id) {
            return collect();
        }

        // Get all curriculum subjects
        $curriculumSubjects = CurriculumSubject::where('curriculum_id', $this->curriculum_id)->get();

        // Get credited curriculum subject IDs
        $creditedIds = $this->completedSubjects()->pluck('curriculum_subject_id')->toArray();

        // Return subjects not yet credited
        return $curriculumSubjects->whereNotIn('id', $creditedIds);
    }

    /**
     * Check if student is eligible for graduation
     */
    public function isEligibleForGraduation(): bool
    {
        // Must have completed all curriculum requirements
        if (! $this->hasCompletedCurriculum()) {
            return false;
        }

        // Additional checks can be added here:
        // - No outstanding balance
        // - No disciplinary holds
        // - Clearance completed
        // etc.

        return true;
    }
}
