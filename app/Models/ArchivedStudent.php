<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ArchivedStudent extends Model
{
    protected $fillable = [
        'original_student_id',
        'user_id',
        'program_id',
        'student_number',
        'first_name',
        'last_name',
        'middle_name',
        'birth_date',
        'address',
        'phone',
        'year_level',
        'program',
        'parent_contact',
        'student_type',
        'education_level',
        'track',
        'strand',
        'status',
        'enrolled_date',
        'academic_year',
        'semester',
        'archived_at',
        'archived_by',
        'archive_notes',
        'student_data',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'enrolled_date' => 'date',
            'archived_at' => 'datetime',
            'student_data' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function archivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }

    public function archivedEnrollments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ArchivedStudentEnrollment::class, 'student_id', 'original_student_id');
    }
}
