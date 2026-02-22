<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;
use App\Traits\SyncsToCloud;

class PaymentTransaction extends Model
{
    use SyncsToCloud;

    protected static function booted(): void
    {
        static::creating(function (PaymentTransaction $tx) {
            if (empty($tx->uuid)) {
                $tx->uuid = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'student_id',
        'payable_type',
        'payable_id',
        'amount',
        'payment_type',
        'payment_method',
        'reference_number',
        'description',
        'processed_by',
        'payment_date',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'payment_date' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function payable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get formatted payment method
     */
    public function getFormattedPaymentMethodAttribute(): string
    {
        return match ($this->payment_method) {
            'cash' => 'Cash Payment',
            'check' => 'Check Payment',
            'bank_transfer' => 'Bank Transfer',
            'online' => 'Online Payment',
            'installment' => 'Installment Payment',
            default => ucfirst($this->payment_method),
        };
    }

    /**
     * Scope for successful payments
     */
    public function scopeSuccessful($query)
    {
        return $query->where('status', 'completed');
    }

    /**
     * Scope for pending payments
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}
