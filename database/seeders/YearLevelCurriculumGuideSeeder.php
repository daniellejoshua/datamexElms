<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\YearLevelCurriculumGuide;
use Illuminate\Database\Seeder;

class YearLevelCurriculumGuideSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $programs = Program::with('currentCurriculum')->get();

        foreach ($programs as $program) {
            if (! $program->currentCurriculum) {
                continue;
            }

            if ($program->education_level === 'college') {
                YearLevelCurriculumGuide::updateOrCreate([
                    'program_id' => $program->id,
                    'academic_year' => $currentAcademicYear,
                    'year_level' => 2,
                ], [
                    'curriculum_id' => $program->currentCurriculum->id,
                ]);
            } elseif ($program->education_level === 'senior_high') {
                YearLevelCurriculumGuide::updateOrCreate([
                    'program_id' => $program->id,
                    'academic_year' => $currentAcademicYear,
                    'year_level' => 12,
                ], [
                    'curriculum_id' => $program->currentCurriculum->id,
                ]);
            }
        }
    }
}
