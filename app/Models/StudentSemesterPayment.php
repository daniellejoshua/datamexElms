<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StudentSemesterPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year', 
        'semester',
        'total_semester_fee',
        'prelim_amount',
        'prelim_paid',
        'midterm_amount', 
        'midterm_paid',
        'prefinal_amount',
        'prefinal_paid',
        'final_amount',
        'final_paid',
        'notes',
    ];

    protected $casts = [
        'prelim_paid' => 'boolean',
        'midterm_paid' => 'boolean', 
        'prefinal_paid' => 'boolean',
        'final_paid' => 'boolean',
        'total_semester_fee' => 'decimal:2',
        'prelim_amount' => 'decimal:2',
        'midterm_amount' => 'decimal:2',
        'prefinal_amount' => 'decimal:2',
        'final_amount' => 'decimal:2',
    ];

    protected $appends = ['total_paid', 'balance', 'payment_status'];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    // Computed attributes
    public function getTotalPaidAttribute(): float
    {
        return ($this->prelim_paid ? $this->prelim_amount : 0) +
               ($this->midterm_paid ? $this->midterm_amount : 0) +
               ($this->prefinal_paid ? $this->prefinal_amount : 0) +
               ($this->final_paid ? $this->final_amount : 0);
    }

    public function getBalanceAttribute(): float
    {
        return $this->total_semester_fee - $this->total_paid;
    }

    public function getPaymentStatusAttribute(): string
    {
        return $this->balance <= 0 ? 'paid' : ($this->total_paid > 0 ? 'partial' : 'pending');
    }

    public function payPeriod(string $period, float $amount): bool
    {
        if ($amount <= 0 || !in_array($period, ['prelim', 'midterm', 'prefinal', 'final'])) {
            return false;
        }
        
        $amountField = "{$period}_amount";
        $paidField = "{$period}_paid";
        
        if ($this->$paidField || $amount < $this->$amountField) {
            return false;
        }
        
        $this->update([$paidField => true]);
        return true;
    }
}
