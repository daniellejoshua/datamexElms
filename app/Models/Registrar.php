<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Registrar extends Model
{
    /** @use HasFactory<\Database\Factories\RegistrarFactory> */
    use HasFactory;

    protected $fillable = [
        'user_id',
        'employee_number',
        'first_name',
        'last_name',
        'middle_name',
        'department',
        'position',
        'hire_date',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'hire_date' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getFullNameAttribute(): string
    {
        return trim($this->first_name.' '.$this->middle_name.' '.$this->last_name);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }
}
