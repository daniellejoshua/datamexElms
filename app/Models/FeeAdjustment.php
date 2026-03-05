<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FeeAdjustment extends Model
{
    use HasFactory;

    protected $fillable = [
        'effective_date',
        'type',
        'term',
        'amount',
        'notes',
        'college_only',
    ];

    protected $casts = [
        'effective_date' => 'date',
        'amount' => 'decimal:2',
        'college_only' => 'boolean',
        'term' => 'string',
    ];
}
