<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;
use App\Models\YearLevelCurriculumGuide;
use App\Models\SchoolSetting;

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
        $guide = YearLevelCurriculumGuide::where('program_id', $this->id)
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

    protected static function booted(): void
    {
        // Ensure newly created programs have year-level curriculum guides for the
        // current academic year. If guides already exist for the program, do nothing.
        static::created(function (self $program) {
            $academicYear = SchoolSetting::getCurrentAcademicYear();

            // Only skip if guides already exist for the current academic year.
            if ($program->yearLevelGuides()->where('academic_year', $academicYear)->exists()) {
                return;
            }

            if (strtolower($program->education_level ?? '') === 'shs') {
                // For SHS, we create guides for Grade 11 and 12 mapped to year_level 11/12
                $yearLevels = [11, 12];
            } else {
                $total = (int) ($program->total_years ?? 1);
                $yearLevels = range(1, max(1, $total));
            }

            // Only create guides if there is an existing current curriculum to
            // reference. Do not auto-create a Curriculum here.
            $existingCurriculumId = null;

            try {
                // Prefer explicit ProgramCurriculum marked as current
                $existingCurriculumId = \App\Models\ProgramCurriculum::where('program_id', $program->id)
                    ->where('is_current', true)
                    ->value('curriculum_id');
            } catch (\Throwable $e) {
                // ignore and try alternative lookup
            }

            if (! $existingCurriculumId) {
                try {
                    // Fallback: any Curriculum row marked as current
                    $existingCurriculumId = \App\Models\Curriculum::where('program_id', $program->id)
                        ->where('is_current', true)
                        ->value('id');
                } catch (\Throwable $e) {
                    // ignore — if schema differs we will simply not create guides
                }
            }

            // If we still don't have a curriculum id, do not create guides here.
            if (! $existingCurriculumId) {
                return;
            }

            $toCreate = [];
            foreach ($yearLevels as $yl) {
                $toCreate[] = [
                    'program_id' => $program->id,
                    'academic_year' => $academicYear,
                    'year_level' => $yl,
                    'curriculum_id' => $existingCurriculumId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            if (! empty($toCreate)) {
                YearLevelCurriculumGuide::insert($toCreate);
            }
        });
    }
}
