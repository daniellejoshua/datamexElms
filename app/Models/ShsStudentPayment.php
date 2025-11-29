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

    protected function casts(): array
    {
        return [
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
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Calculate total paid amount
     */
    public function calculateTotalPaid(): float
    {
        $total = 0;
        
        if ($this->first_quarter_paid) $total += $this->first_quarter_amount;
        if ($this->second_quarter_paid) $total += $this->second_quarter_amount;
        if ($this->third_quarter_paid) $total += $this->third_quarter_amount;
        if ($this->fourth_quarter_paid) $total += $this->fourth_quarter_amount;
        
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
