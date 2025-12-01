<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year',
        'semester',
        'education_level',
        'period_name',
        'amount_due',
        'amount_paid',
        'is_paid',
        'payment_date',
        'payment_status',
        'payment_notes',
    ];

    protected $casts = [
        'amount_due' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'is_paid' => 'boolean',
        'payment_date' => 'datetime',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Check if student can view grades for this payment period
     */
    public function canViewGrades(): bool
    {
        return $this->is_paid;
    }

    /**
     * Record a payment for this period
     */
    public function recordPayment(float $amount): bool
    {
        if ($amount <= 0) {
            return false;
        }

        $this->amount_paid += $amount;
        
        // Check if fully paid
        if ($this->amount_paid >= $this->amount_due) {
            $this->is_paid = true;
            $this->payment_status = 'paid';
            $this->payment_date = now();
        } else {
            $this->payment_status = 'partial';
        }

        return $this->save();
    }

    /**
     * Get balance remaining
     */
    public function getBalanceAttribute(): float
    {
        return max(0, $this->amount_due - $this->amount_paid);
    }

    /**
     * Get payment percentage
     */
    public function getPaymentPercentageAttribute(): float
    {
        if ($this->amount_due == 0) return 100;
        return min(100, ($this->amount_paid / $this->amount_due) * 100);
    }

    /**
     * Scope for paid payments
     */
    public function scopePaid($query)
    {
        return $query->where('is_paid', true);
    }

    /**
     * Scope for unpaid payments
     */
    public function scopeUnpaid($query)
    {
        return $query->where('is_paid', false);
    }

    /**
     * Scope for specific academic period
     */
    public function scopeForPeriod($query, string $academicYear, string $semester)
    {
        return $query->where('academic_year', $academicYear)
                     ->where('semester', $semester);
    }

    /**
     * Get standard period names for education level
     */
    public static function getStandardPeriods(string $educationLevel): array
    {
        return match($educationLevel) {
            'college' => ['prelim', 'midterm', 'prefinal', 'final'],
            'shs' => ['1st_quarter', '2nd_quarter', '3rd_quarter', '4th_quarter'],
            default => []
        };
    }

    /**
     * Create payment records for a student's enrollment
     */
    public static function createPaymentsForStudent(
        int $studentId, 
        string $academicYear, 
        string $semester, 
        string $educationLevel,
        float $totalFee
    ): void {
        $periods = self::getStandardPeriods($educationLevel);
        $amountPerPeriod = $totalFee / count($periods);

        foreach ($periods as $period) {
            self::create([
                'student_id' => $studentId,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'education_level' => $educationLevel,
                'period_name' => $period,
                'amount_due' => $amountPerPeriod,
            ]);
        }
    }
}
