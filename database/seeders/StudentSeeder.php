<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $studentUsers = User::where('role', 'student')->get();

        // Get programs
        $csProgram = Program::where('program_code', 'BSCS')->first();
        $itProgram = Program::where('program_code', 'BSIT')->first();
        $stemProgram = Program::where('program_code', 'STEM')->first();
        $abmProgram = Program::where('program_code', 'ABM')->first();

        $studentData = [
            [
                'student_number' => '2024-001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Santos',
                'birth_date' => '2005-03-15',
                'address' => '123 Rizal Street, Manila',
                'phone' => '09171234567',
                'year_level' => 1,
                'program_id' => $csProgram->id,
                'parent_contact' => '09171234568',
                'student_type' => 'regular',
                'status' => 'active',
            ],
            [
                'student_number' => '2024-002',
                'first_name' => 'Maria',
                'last_name' => 'Garcia',
                'middle_name' => 'Lopez',
                'birth_date' => '2005-07-20',
                'address' => '456 Del Pilar Street, Quezon City',
                'phone' => '09182345678',
                'year_level' => 1,
                'program_id' => $itProgram->id,
                'parent_contact' => '09182345679',
                'student_type' => 'regular',
                'status' => 'active',
            ],
            [
                'student_number' => '2023-003',
                'first_name' => 'Jose',
                'last_name' => 'Martinez',
                'middle_name' => 'Reyes',
                'birth_date' => '2004-11-08',
                'address' => '789 Mabini Street, Pasig City',
                'phone' => '09193456789',
                'year_level' => 2,
                'program_id' => $csProgram->id,
                'parent_contact' => '09193456790',
                'student_type' => 'irregular',
                'status' => 'active',
            ],
            [
                'student_number' => '2024-004',
                'first_name' => 'Ana',
                'last_name' => 'Villanueva',
                'middle_name' => 'Cruz',
                'birth_date' => '2005-01-12',
                'address' => '321 Bonifacio Avenue, Makati City',
                'phone' => '09204567890',
                'year_level' => 1,
                'program_id' => $itProgram->id,
                'parent_contact' => '09204567891',
                'student_type' => 'regular',
                'status' => 'active',
            ],
            [
                'student_number' => '2025-005',
                'first_name' => 'Carlos',
                'last_name' => 'Rodriguez',
                'middle_name' => 'Santos',
                'birth_date' => '2006-04-25',
                'address' => '654 Aguinaldo Highway, Cavite',
                'phone' => '09215678901',
                'year_level' => 1,
                'program_id' => $stemProgram->id,
                'parent_contact' => '09215678902',
                'student_type' => 'regular',
                'status' => 'active',
            ],
            [
                'student_number' => '2025-006',
                'first_name' => 'Carmen',
                'last_name' => 'Flores',
                'middle_name' => 'Rivera',
                'birth_date' => '2005-06-14',
                'address' => '258 Escolta Street, Binondo',
                'phone' => '09248901234',
                'year_level' => 1,
                'program_id' => $abmProgram->id,
                'parent_contact' => '09248901235',
                'student_type' => 'regular',
                'status' => 'active',
            ],
        ];

        foreach ($studentUsers as $index => $user) {
            if (isset($studentData[$index])) {
                Student::create(array_merge(
                    ['user_id' => $user->id],
                    $studentData[$index],
                    ['enrolled_date' => now()]
                ));
            }
        }
    }
}
