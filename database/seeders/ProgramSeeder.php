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
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'A program focused on hospitality industry management, operations, and service excellence.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ],
        ];

        foreach ($programs as $program) {
            Program::create($program);
        }
    }
}
