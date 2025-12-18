<?php

namespace Database\Seeders;

use App\Models\Program;
use Illuminate\Database\Seeder;

class ProgramSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = [
            [
                'program_code' => 'BSIT',
                'program_name' => 'Bachelor of Science in Information Technology',
                'description' => 'A program focused on information technology and computer science.',
                'education_level' => 'college',
                'track' => null,
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'ACT',
                'program_name' => 'Associate in Computer Technology',
                'description' => 'A two-year program focused on computer technology fundamentals.',
                'education_level' => 'college',
                'track' => null,
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'A program focused on hospitality and tourism management.',
                'education_level' => 'college',
                'track' => null,
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'STEM',
                'program_name' => 'Science, Technology, Engineering, and Mathematics',
                'description' => 'Senior High School STEM track.',
                'education_level' => 'senior_high',
                'track' => 'STEM',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'ABM',
                'program_name' => 'Accountancy, Business, and Management',
                'description' => 'Senior High School ABM track.',
                'education_level' => 'senior_high',
                'track' => 'ABM',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'HUMSS',
                'program_name' => 'Humanities and Social Sciences',
                'description' => 'Senior High School HUMSS track.',
                'education_level' => 'senior_high',
                'track' => 'HUMSS',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'GAS',
                'program_name' => 'General Academic Strand',
                'description' => 'Senior High School General Academic Strand.',
                'education_level' => 'senior_high',
                'track' => 'GAS',
                'total_years' => 2,
                'status' => 'active',
            ],
        ];

        foreach ($programs as $program) {
            Program::updateOrCreate(
                ['program_code' => $program['program_code']],
                $program
            );
        }
    }
}
