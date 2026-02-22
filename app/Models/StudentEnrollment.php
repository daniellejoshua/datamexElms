<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;
use App\Traits\SyncsToCloud;

class StudentEnrollment extends Model
{
    use SyncsToCloud;
    /** @use HasFactory<\Database\Factories\StudentEnrollmentFactory> */
    use HasFactory;

    protected static function booted(): void
    {
        static::creating(function (StudentEnrollment $e) {
            if (empty($e->uuid)) {
                $e->uuid = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'student_id',
        'section_id',
        'enrollment_date',
        'status',
        'academic_year',
        'semester',
        'enrolled_by',
    ];

    protected function casts(): array
    {
        return [
            'enrollment_date' => 'date',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function studentGrades(): HasMany
    {
        return $this->hasMany(StudentGrade::class);
    }

    public function shsStudentGrades(): HasMany
    {
        return $this->hasMany(ShsStudentGrade::class);
    }
}
