<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentSemesterPayment extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year',
        'semester',
        'enrollment_fee',
        'enrollment_paid',
        'enrollment_payment_date',
        'prelim_amount',
        'prelim_paid',
        'prelim_payment_date',
        'midterm_amount',
        'midterm_paid',
        'midterm_payment_date',
        'prefinal_amount',
        'prefinal_paid',
        'prefinal_payment_date',
        'final_amount',
        'final_paid',
        'final_payment_date',
        'irregular_subject_fee',
        'irregular_subjects_count',
        'total_semester_fee',
        'total_paid',
        'balance',
        'payment_plan',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_fee' => 'decimal:2',
            'prelim_amount' => 'decimal:2',
            'midterm_amount' => 'decimal:2',
            'prefinal_amount' => 'decimal:2',
            'final_amount' => 'decimal:2',
            'irregular_subject_fee' => 'decimal:2',
            'total_semester_fee' => 'decimal:2',
            'total_paid' => 'decimal:2',
            'balance' => 'decimal:2',
            'enrollment_paid' => 'boolean',
            'prelim_paid' => 'boolean',
            'midterm_paid' => 'boolean',
            'prefinal_paid' => 'boolean',
            'final_paid' => 'boolean',
            'enrollment_payment_date' => 'date',
            'prelim_payment_date' => 'date',
            'midterm_payment_date' => 'date',
            'prefinal_payment_date' => 'date',
            'final_payment_date' => 'date',
            'irregular_subjects_count' => 'integer',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function paymentTransactions()
    {
        return $this->morphMany(PaymentTransaction::class, 'payable');
    }

    /**
     * Get the student's enrollment for this academic period
     */
    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'student_id', 'student_id')
            ->where('academic_year', $this->academic_year)
            ->where('semester', $this->semester)
            ->where('status', 'active');
    }

    /**
     * Get the section through the student's enrollment for this period
     */
    public function getEnrollmentWithSection()
    {
        return StudentEnrollment::with('section')
            ->where('student_id', $this->student_id)
            ->where('academic_year', $this->academic_year)
            ->where('semester', $this->semester)
            ->where('status', 'active')
            ->first();
    }

    /**
     * Calculate total paid amount
     */
    public function calculateTotalPaid(): float
    {
        // Calculate from payment transactions first
        $transactionTotal = $this->paymentTransactions()
            ->where('status', 'completed')
            ->sum('amount');

        if ($transactionTotal > 0) {
            return (float) $transactionTotal;
        }

        // Fallback to boolean flags if no transactions
        $total = 0;

        if ($this->enrollment_paid) {
            $total += (float) $this->enrollment_fee;
        }
        if ($this->prelim_paid) {
            $total += (float) $this->prelim_amount;
        }
        if ($this->midterm_paid) {
            $total += (float) $this->midterm_amount;
        }
        if ($this->prefinal_paid) {
            $total += (float) $this->prefinal_amount;
        }
        if ($this->final_paid) {
            $total += (float) $this->final_amount;
        }

        return (float) $total;
    }

    /**
     * Calculate remaining balance
     */
    public function calculateBalance(): float
    {
        $totalFee = (float) $this->total_semester_fee;
        $totalPaid = (float) $this->calculateTotalPaid();

        return max(0, $totalFee - $totalPaid);
    }

    /**
     * Calculate irregular student additional fees
     */
    public function calculateIrregularFees(): float
    {
        return $this->irregular_subjects_count * $this->irregular_subject_fee;
    }

    /**
     * Check if enrollment fee is overdue
     */
    public function isEnrollmentOverdue(): bool
    {
        if ($this->enrollment_paid) {
            return false;
        }

        // Enrollment should be paid within 2 weeks of semester start
        $semesterStart = $this->getSemesterStartDate();

        return now()->diffInDays($semesterStart, false) > 14;
    }

    /**
     * Get payment completion percentage
     */
    public function getPaymentProgress(): float
    {
        if ($this->total_semester_fee <= 0) {
            return 0;
        }

        return ($this->calculateTotalPaid() / $this->total_semester_fee) * 100;
    }

    /**
     * Get next payment due
     */
    public function getNextPaymentDue(): ?array
    {
        if (! $this->enrollment_paid) {
            return [
                'type' => 'enrollment',
                'amount' => $this->enrollment_fee,
                'description' => 'Enrollment Fee (Downpayment)',
            ];
        }

        if (! $this->prelim_paid) {
            return [
                'type' => 'prelim',
                'amount' => $this->prelim_amount,
                'description' => 'Preliminary Term Payment',
            ];
        }

        if (! $this->midterm_paid) {
            return [
                'type' => 'midterm',
                'amount' => $this->midterm_amount,
                'description' => 'Midterm Payment',
            ];
        }

        if (! $this->prefinal_paid) {
            return [
                'type' => 'prefinal',
                'amount' => $this->prefinal_amount,
                'description' => 'Pre-final Payment',
            ];
        }

        if (! $this->final_paid) {
            return [
                'type' => 'final',
                'amount' => $this->final_amount,
                'description' => 'Final Term Payment',
            ];
        }

        return null; // All payments completed
    }

    /**
     * Get semester start date for payment due calculations
     */
    private function getSemesterStartDate(): \Carbon\Carbon
    {
        // This would typically come from a semester settings table
        // For now, we'll use a basic calculation
        $year = (int) substr($this->academic_year, 0, 4);

        return $this->semester === 'first'
            ? \Carbon\Carbon::create($year, 8, 15) // August 15
            : \Carbon\Carbon::create($year + 1, 1, 15); // January 15
    }

    /**
     * Auto-update totals when payment status changes
     */
    protected static function booted(): void
    {
        static::saving(function (StudentSemesterPayment $payment) {
            $payment->total_paid = $payment->calculateTotalPaid();
            $payment->balance = $payment->calculateBalance();

            // Update status based on payment progress
            $progress = $payment->getPaymentProgress();

            if ($progress >= 100) {
                $payment->status = 'completed';
            } elseif ($progress > 0) {
                $payment->status = 'partial';
            } else {
                $payment->status = 'pending';
            }
        });
    }
}
