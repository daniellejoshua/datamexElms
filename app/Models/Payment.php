<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Payment extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentFactory> */
    use HasFactory;

    protected $fillable = [
        'student_id',
        'payment_type',
        'education_level',
        'academic_year',
        'semester',
        'amount',
        'total_due',
        'balance',
        'status',
        'due_date',
        'description',
        'payment_plan',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'amount' => 'decimal:2',
            'total_due' => 'decimal:2',
            'balance' => 'decimal:2',
            'payment_plan' => 'array',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function paymentItems(): HasMany
    {
        return $this->hasMany(PaymentItem::class);
    }

    public function scopeCollege($query)
    {
        return $query->where('education_level', 'college');
    }

    public function scopeShs($query)
    {
        return $query->where('education_level', 'senior_high');
    }

    public function scopeCurrentSemester($query, $academicYear, $semester)
    {
        return $query->where('academic_year', $academicYear)
            ->where('semester', $semester);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'paid' => 'green',
            'partial' => 'yellow',
            'overdue' => 'red',
            default => 'gray'
        };
    }

    public function isOverdue(): bool
    {
        return $this->due_date->isPast() && $this->balance > 0;
    }

    public function getPaymentProgressAttribute(): float
    {
        if ($this->total_due == 0) {
            return 100;
        }

        return (($this->total_due - $this->balance) / $this->total_due) * 100;
    }
}
