<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentBalance extends Model
{
    /** @use HasFactory<\Database\Factories\StudentBalanceFactory> */
    use HasFactory;

    protected $fillable = [
        'student_id',
        'program_id',
        'course_code',
        'course_name',
        'education_level',
        'academic_year',
        'semester',
        'total_fee',
        'paid_amount',
        'balance',
        'status',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'total_fee' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'balance' => 'decimal:2',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeCollege($query)
    {
        return $query->where('education_level', 'college');
    }

    public function scopeShs($query)
    {
        return $query->where('education_level', 'senior_high');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeWithBalance($query)
    {
        return $query->where('balance', '>', 0);
    }

    public function getStatusColorAttribute(): string
    {
        return match ($this->status) {
            'cleared' => 'green',
            'hold' => 'red',
            default => 'blue'
        };
    }

    public function getPaymentProgressAttribute(): float
    {
        if ($this->total_fee == 0) {
            return 100;
        }

        return ($this->paid_amount / $this->total_fee) * 100;
    }

    public function updateBalance(): void
    {
        $this->balance = $this->total_fee - $this->paid_amount;
        $this->status = $this->balance <= 0 ? 'cleared' : 'active';
        $this->save();
    }
}
