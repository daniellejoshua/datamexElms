<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            ProgramSeeder::class,
            UserSeeder::class,
            TeacherSeeder::class,
            SubjectSeeder::class,
            BSITCurriculumSeeder::class,
            BSHMCurriculumSeeder::class,
            STEMCurriculumSeeder::class,
            HUMSSCurriculumSeeder::class,
            ABMCurriculumSeeder::class,
            ICTCurriculumSeeder::class,
            HomeEconomicsCurriculumSeeder::class,
            YearLevelCurriculumGuideSeeder::class,
        ]);
    }
}
