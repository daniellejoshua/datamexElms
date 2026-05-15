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
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'A program focused on hospitality and tourism management.',
                'education_level' => 'college',
                'track' => null,
                'total_years' => 4,
                'status' => 'active',
            ],
            [
                'program_code' => 'ICT',
                'program_name' => 'Information and Communications Technology',
                'description' => 'Senior High School ICT track.',
                'education_level' => 'senior_high',
                'track' => 'ICT',
                'total_years' => 2,
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
                'program_code' => 'HE',
                'program_name' => 'Home Economics',
                'description' => 'Senior High School Home Economics track.',
                'education_level' => 'senior_high',
                'track' => 'HE',
                'total_years' => 2,
                'status' => 'active',
            ],
        ];

        foreach ($programs as $program) {
            $prog = Program::updateOrCreate(
                ['program_code' => $program['program_code']],
                $program
            );

            // ensure default regular fees: 10k per semester/year level
            $years = $prog->total_years ?? 1;
            for ($yr = 1; $yr <= $years; $yr++) {
                $prog->programFees()->updateOrCreate(
                    ['year_level' => $yr, 'fee_type' => 'regular'],
                    ['education_level' => $prog->education_level === 'senior_high' ? 'shs' : 'college', 'semester_fee' => 10000]
                );
            }
        }
    }
}
