<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\ProgramFee;
use Illuminate\Database\Seeder;

class ProgramFeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $programs = Program::all();

        foreach ($programs as $program) {
            // Create fees for each year level
            for ($yearLevel = 1; $yearLevel <= $program->total_years; $yearLevel++) {
                // Regular fee - use the program's semester_fee as base
                ProgramFee::create([
                    'program_id' => $program->id,
                    'year_level' => $yearLevel,
                    'education_level' => $program->education_level,
                    'semester_fee' => $program->semester_fee,
                    'fee_type' => 'regular',
                ]);

                // Irregular fee - can be set higher for irregular students
                ProgramFee::create([
                    'program_id' => $program->id,
                    'year_level' => $yearLevel,
                    'education_level' => $program->education_level,
                    'semester_fee' => $program->semester_fee * 1.2, // 20% higher for irregular
                    'fee_type' => 'irregular',
                ]);
            }
        }
    }
}
