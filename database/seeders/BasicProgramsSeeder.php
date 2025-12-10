<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class BasicProgramsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            // College Programs (3)
            [
                'program_code' => 'BSIT',
                'program_name' => 'Bachelor of Science in Information Technology',
                'description' => 'A comprehensive program covering computer systems, programming, and information management.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'ACT',
                'program_name' => 'Associate in Computer Technology',
                'description' => 'Two-year program focused on computer technology fundamentals.',
                'education_level' => 'college',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'Four-year program in hospitality and tourism management.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],

            // SHS Programs (3)
            [
                'program_code' => 'STEM',
                'program_name' => 'Science, Technology, Engineering and Mathematics',
                'description' => 'Prepares students for college courses in science and technology fields.',
                'education_level' => 'shs',
                'track' => 'STEM',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'ABM',
                'program_name' => 'Accountancy, Business and Management',
                'description' => 'Focuses on business and entrepreneurship skills.',
                'education_level' => 'shs',
                'track' => 'ABM',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'HUMSS',
                'program_name' => 'Humanities and Social Sciences',
                'description' => 'Liberal arts education with focus on humanities and social sciences.',
                'education_level' => 'shs',
                'track' => 'HUMSS',
                'total_years' => 2,
                'status' => 'active',
            ],
        ];

        foreach ($programs as $program) {
            Program::create($program);
        }

        $this->command->info('✅ Created ' . count($programs) . ' programs:');
        $this->command->info('📚 College: BSIT, ACT, BSHM');
        $this->command->info('🏫 SHS: STEM, ABM, HUMSS');
    }
}
