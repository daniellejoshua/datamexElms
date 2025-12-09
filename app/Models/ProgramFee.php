<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProgramFee extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_id',
        'year_level',
        'education_level',
        'semester_fee',
        'fee_type',
    ];

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function scopeForProgram($query, $programId)
    {
        return $query->where('program_id', $programId);
    }

    public function scopeForYearLevel($query, $yearLevel)
    {
        return $query->where('year_level', $yearLevel);
    }

    public function scopeForEducationLevel($query, $educationLevel)
    {
        return $query->where('education_level', $educationLevel);
    }

    public function scopeRegular($query)
    {
        return $query->where('fee_type', 'regular');
    }

    public function scopeIrregular($query)
    {
        return $query->where('fee_type', 'irregular');
    }
}
