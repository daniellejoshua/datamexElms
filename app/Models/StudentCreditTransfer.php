<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentCreditTransfer extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'previous_program_id',
        'new_program_id',
        'previous_curriculum_id',
        'new_curriculum_id',
        'subject_id',
        'subject_code',
        'subject_name',
        'original_subject_code',
        'original_subject_name',
        'units',
        'year_level',
        'semester',
        'transfer_type',
        'credit_status',
        'fee_adjustment',
        'notes',
        'previous_school',
        'approved_by',
        'approved_at',
        'grade_verified_at',
        'verified_semester_grade',
        'rejection_reason',
    ];

    protected function casts(): array
    {
        return [
            'units' => 'decimal:2',
            'fee_adjustment' => 'decimal:2',
            'verified_semester_grade' => 'decimal:2',
            'approved_at' => 'datetime',
            'grade_verified_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function previousProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'previous_program_id');
    }

    public function newProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'new_program_id');
    }

    public function previousCurriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class, 'previous_curriculum_id');
    }

    public function newCurriculum(): BelongsTo
    {
        return $this->belongsTo(Curriculum::class, 'new_curriculum_id');
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }
}
