<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaymentItem extends Model
{
    /** @use HasFactory<\Database\Factories\PaymentItemFactory> */
    use HasFactory;

    protected $fillable = [
        'payment_id',
        'item_name',
        'amount',
        'paid_amount',
        'description',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'paid_amount' => 'decimal:2',
            'is_required' => 'boolean',
        ];
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function getRemainingBalanceAttribute(): float
    {
        return $this->amount - $this->paid_amount;
    }

    public function getPaymentProgressAttribute(): float
    {
        if ($this->amount == 0) {
            return 100;
        }

        return ($this->paid_amount / $this->amount) * 100;
    }

    public function isPaid(): bool
    {
        return $this->paid_amount >= $this->amount;
    }
}
