<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Program extends Model
{
    use HasFactory;

    protected $fillable = [
        'program_code',
        'program_name',
        'description',
        'education_level',
        'track',
        'total_years',
        'semester_fee',
        'status',
    ];

    public function sections(): HasMany
    {
        return $this->hasMany(Section::class);
    }

    public function students(): HasMany
    {
        return $this->hasMany(Student::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class);
    }

    public function curriculums(): HasMany
    {
        return $this->hasMany(Curriculum::class);
    }

    public function programCurricula(): HasMany
    {
        return $this->hasMany(\App\Models\ProgramCurriculum::class);
    }

    public function yearLevelGuides(): HasMany
    {
        return $this->hasMany(YearLevelCurriculumGuide::class);
    }

    /**
     * Match a curriculum for a transferee based on batch start year and year level.
     *
     * Logic:
     * 1. If year level <= 1, return the program's current curriculum.
     * 2. Try to find a ProgramCurriculum entry that contains the batch start year.
     * 3. If none, pick the curriculum most commonly used by existing cohort members
     *    (same program, same batch_year, same current_year_level).
     * 4. Fallback to the program's current curriculum.
     */
    public function matchCurriculumForTransferee(int $numericYearLevel, string $batchYear): ?\App\Models\Curriculum
    {
        if ($numericYearLevel <= 1) {
            return $this->currentCurriculum;
        }

        $targetStart = (string) $batchYear;

        // Check for a year-level guide first (explicit mapping provided by admin)
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $guide = YearLevelCurriculumGuide::where('program_id', $this->id)
            ->where('academic_year', $currentAcademicYear)
            ->where('year_level', $numericYearLevel)
            ->with('curriculum')
            ->first();

        if ($guide && $guide->curriculum) {
            return $guide->curriculum;
        }

        $programCurriculum = \App\Models\ProgramCurriculum::where('program_id', $this->id)
            ->where('academic_year', 'like', '%'.$targetStart.'%')
            ->with('curriculum')
            ->first();

        if ($programCurriculum && $programCurriculum->curriculum) {
            return $programCurriculum->curriculum;
        }

        $existingCurriculumId = \App\Models\Student::where('program_id', $this->id)
            ->where('batch_year', $targetStart)
            ->where('current_year_level', $numericYearLevel)
            ->whereNotNull('curriculum_id')
            ->select('curriculum_id', DB::raw('count(*) as ct'))
            ->groupBy('curriculum_id')
            ->orderByDesc('ct')
            ->pluck('curriculum_id')
            ->first();

        if ($existingCurriculumId) {
            return \App\Models\Curriculum::find($existingCurriculumId);
        }

        return $this->currentCurriculum;
    }

    public function currentCurriculum()
    {
        return $this->hasOne(Curriculum::class)->isCurrent();
    }

    public function programFees(): HasMany
    {
        return $this->hasMany(ProgramFee::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByEducationLevel($query, string $level)
    {
        return $query->where('education_level', $level);
    }
}
