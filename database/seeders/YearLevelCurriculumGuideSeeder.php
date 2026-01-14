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
     * Creates year level guides for all programs and all year levels using their current curriculum
     */
    public function run(): void
    {
        $programs = Program::with('currentCurriculum')->get();

        foreach ($programs as $program) {
            if (! $program->currentCurriculum) {
                $this->command->warn("Program {$program->program_name} has no current curriculum. Skipping.");
                continue;
            }

            $curriculum = $program->currentCurriculum;
            
            // Determine year levels based on education level
            if ($program->education_level === 'college') {
                // College: Years 1-4
                $yearLevels = [1, 2, 3, 4];
            } elseif ($program->education_level === 'senior_high') {
                // Senior High: Grade 11-12 (year levels 11 and 12)
                $yearLevels = [11, 12];
            } else {
                continue;
            }

            // Create guides for all year levels
            foreach ($yearLevels as $yearLevel) {
                YearLevelCurriculumGuide::updateOrCreate([
                    'program_id' => $program->id,
                    'year_level' => $yearLevel,
                ], [
                    'curriculum_id' => $curriculum->id,
                ]);

                $this->command->info("✓ {$program->program_code} Year {$yearLevel} → {$curriculum->curriculum_name}");
            }
        }

        $this->command->info("\n✅ Year Level Curriculum Guides seeded successfully!");
    }
}
