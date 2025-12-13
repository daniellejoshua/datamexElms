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
            // Senior High School Tracks
            [
                'program_code' => 'STEM',
                'program_name' => 'Science, Technology, Engineering and Mathematics',
                'description' => 'STEM track focusing on science, technology, engineering, and mathematics subjects.',
                'education_level' => 'senior_high',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'ABM',
                'program_name' => 'Accountancy, Business and Management',
                'description' => 'ABM track preparing students for business, finance, and entrepreneurship careers.',
                'education_level' => 'senior_high',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'HUMSS',
                'program_name' => 'Humanities and Social Sciences',
                'description' => 'HUMSS track focusing on humanities, social sciences, and communication subjects.',
                'education_level' => 'senior_high',
                'total_years' => 2,
                'status' => 'active',
            ],
            [
                'program_code' => 'TVL-ICT',
                'program_name' => 'Technical-Vocational Livelihood - Information and Communications Technology',
                'description' => 'TVL-ICT track for technical skills in information technology and computer systems.',
                'education_level' => 'senior_high',
                'total_years' => 2,
                'status' => 'active',
            ],
            // Associate Programs
            [
                'program_code' => 'ACT',
                'program_name' => 'Associate in Computer Technology',
                'description' => 'A two-year associate program in computer technology and information systems.',
                'education_level' => 'associate',
                'total_years' => 2,
                'status' => 'active',
            ],
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
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'A program focused on hospitality industry management, operations, and service excellence.',
                'education_level' => 'college',
                'total_years' => 4,
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
