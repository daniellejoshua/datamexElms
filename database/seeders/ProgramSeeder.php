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
            // College Programs
            [
                'program_code' => 'BSIT',
                'program_name' => 'Bachelor of Science in Information Technology',
                'description' => 'A comprehensive program covering computer systems, programming, and information management.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'BSCS',
                'program_name' => 'Bachelor of Science in Computer Science',
                'description' => 'A program focused on computational theory, algorithms, and software development.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'BSA',
                'program_name' => 'Bachelor of Science in Accountancy',
                'description' => 'Professional accounting education preparing students for CPA certification.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'BSBA',
                'program_name' => 'Bachelor of Science in Business Administration',
                'description' => 'Comprehensive business education covering management, marketing, and finance.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],

            // SHS Tracks
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
    }
}
