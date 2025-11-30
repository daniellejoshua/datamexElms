<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassSchedule extends Model
{
    /** @use HasFactory<\Database\Factories\ClassScheduleFactory> */
    use HasFactory;

    protected $fillable = [
        'section_subject_id',
        'day_of_week',
        'start_time',
        'end_time',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'start_time' => 'time',
            'end_time' => 'time',
        ];
    }

    public function sectionSubject(): BelongsTo
    {
        return $this->belongsTo(SectionSubject::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the section through the section_subject relationship
     */
    public function section(): BelongsTo
    {
        return $this->sectionSubject()->with('section');
    }

    /**
     * Get the subject through the section_subject relationship
     */
    public function subject(): BelongsTo
    {
        return $this->sectionSubject()->with('subject');
    }

    /**
     * Get the teacher through the section_subject relationship
     */
    public function teacher(): BelongsTo
    {
        return $this->sectionSubject()->with('teacher');
    }
}
