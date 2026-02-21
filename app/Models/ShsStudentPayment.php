<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ShsStudentPayment extends Model
{
    protected $fillable = [
        'student_id',
        'academic_year',
        'semester',
        'first_quarter_amount',
        'first_quarter_paid',
        'first_quarter_payment_date',
        'second_quarter_amount',
        'second_quarter_paid',
        'second_quarter_payment_date',
        'third_quarter_amount',
        'third_quarter_paid',
        'third_quarter_payment_date',
        'fourth_quarter_amount',
        'fourth_quarter_paid',
        'fourth_quarter_payment_date',
        'total_semester_fee',
        'total_paid',
        'balance',
    ];

    protected $casts = [
        'first_quarter_amount' => 'decimal:2',
        'second_quarter_amount' => 'decimal:2',
        'third_quarter_amount' => 'decimal:2',
        'fourth_quarter_amount' => 'decimal:2',
        'total_semester_fee' => 'decimal:2',
        'total_paid' => 'decimal:2',
        'balance' => 'decimal:2',
        'first_quarter_paid' => 'boolean',
        'second_quarter_paid' => 'boolean',
        'third_quarter_paid' => 'boolean',
        'fourth_quarter_paid' => 'boolean',
        'first_quarter_payment_date' => 'date',
        'second_quarter_payment_date' => 'date',
        'third_quarter_payment_date' => 'date',
        'fourth_quarter_payment_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function paymentTransactions()
    {
        return $this->morphMany(PaymentTransaction::class, 'payable');
    }

    /**
     * Calculate total paid amount
     */
    public function calculateTotalPaid(): float
    {
        // Prefer summing completed payment transactions as the source of truth
        try {
            $transactionsTotal = (float) $this->paymentTransactions()->where('status', 'completed')->sum('amount');
        } catch (\Throwable $e) {
            // In rare cases when model isn't persisted yet, fall back to quarter flags
            $transactionsTotal = 0.0;
        }

        if ($transactionsTotal > 0) {
            return $transactionsTotal;
        }

        // Fallback to quarter flags for legacy/quarter-based records
        $total = 0.0;
        if ($this->first_quarter_paid) {
            $total += (float) $this->first_quarter_amount;
        }
        if ($this->second_quarter_paid) {
            $total += (float) $this->second_quarter_amount;
        }
        if ($this->third_quarter_paid) {
            $total += (float) $this->third_quarter_amount;
        }
        if ($this->fourth_quarter_paid) {
            $total += (float) $this->fourth_quarter_amount;
        }

        return $total;
    }

    /**
     * Calculate remaining balance
     */
    public function calculateBalance(): float
    {
        return $this->total_semester_fee - $this->calculateTotalPaid();
    }

    /**
     * Accessor for `total_paid` that prefers summing completed payment transactions.
     * Falls back to existing stored value or quarter-based calculation.
     */
    public function getTotalPaidAttribute(): float
    {
        // Determine student (use loaded relation or lazy-load) so we can detect voucher status
        $student = $this->relationLoaded('student') ? $this->student : $this->student()->first();

        if ($student && isset($student->has_voucher) && $student->has_voucher && isset($student->voucher_status) && $student->voucher_status === 'active') {
            return 0.0;
        }
        // If transactions are already loaded, use the collection to avoid extra queries
        if ($this->relationLoaded('paymentTransactions') && is_callable([$this, 'paymentTransactions'])) {
            $collection = $this->paymentTransactions;

            if ($collection instanceof \Illuminate\Support\Collection) {
                $transactionsTotal = (float) $collection->filter(function ($t) {
                    $isCompleted = isset($t->status) && $t->status === 'completed';
                    $isVoucherType = (isset($t->payment_type) && $t->payment_type === 'voucher') || (isset($t->type) && $t->type === 'voucher');
                    $hasVoucherDesc = isset($t->description) && stripos($t->description, 'voucher') !== false;

                    return $isCompleted && ! $isVoucherType && ! $hasVoucherDesc;
                })->sum('amount');

                if ($transactionsTotal > 0) {
                    return $transactionsTotal;
                }
            }
        }

        // If model exists in DB, query transactions directly
        if ($this->exists) {
            try {
                $transactionsTotal = (float) $this->paymentTransactions()
                    ->where('status', 'completed')
                    ->where(function ($q) {
                        $q->where('payment_type', '<>', 'voucher')->orWhereNull('payment_type');
                    })
                    ->where('description', 'not like', '%voucher%')
                    ->sum('amount');

                if ($transactionsTotal > 0) {
                    return $transactionsTotal;
                }
            } catch (\Throwable $e) {
                // ignore and fall back
            }
        }

        // Fall back to stored attribute or legacy quarter-based calculation
        return isset($this->attributes['total_paid']) ? (float) $this->attributes['total_paid'] : $this->calculateTotalPaid();
    }

    /**
     * Accessor for `balance` that derives from `total_semester_fee` minus `total_paid`.
     */
    public function getBalanceAttribute(): float
    {
        // Determine student (use loaded relation or lazy-load) so we can detect voucher status
        $student = $this->relationLoaded('student') ? $this->student : $this->student()->first();

        if ($student && isset($student->has_voucher) && $student->has_voucher && isset($student->voucher_status) && $student->voucher_status === 'active') {
            return 0.0;
        }

        $totalPaid = (float) $this->total_paid;

        return (float) $this->total_semester_fee - $totalPaid;
    }

    /**
     * Auto-update totals when payment status changes
     */
    protected static function booted(): void
    {
        static::saving(function (ShsStudentPayment $payment) {
            $payment->total_paid = $payment->calculateTotalPaid();
            $payment->balance = $payment->calculateBalance();
        });
    }
}
