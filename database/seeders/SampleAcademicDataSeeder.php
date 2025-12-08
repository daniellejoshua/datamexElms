<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SampleAcademicDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create a sample program if not exists
        $program = Program::firstOrCreate([
            'program_code' => 'BSIT',
        ], [
            'program_name' => 'Bachelor of Science in Information Technology',
            'description' => 'IT Program',
        ]);

        // Create sample students
        for ($i = 1; $i <= 5; $i++) {
            $user = User::firstOrCreate([
                'email' => "student{$i}@example.com",
            ], [
                'name' => "Student {$i}",
                'password' => Hash::make('password'),
            ]);

            $student = Student::firstOrCreate([
                'user_id' => $user->id,
            ], [
                'student_number' => "2025-{$i}",
                'program_id' => $program->id,
                'year_level' => 1,
                'current_academic_year' => '2025-2026',
                'current_semester' => '1st',
                'first_name' => "First{$i}",
                'last_name' => "Last{$i}",
            ]);
        }

        // Create a sample section
        $section = Section::firstOrCreate([
            'section_name' => 'IT-1A',
            'academic_year' => '2025-2026',
            'semester' => '1st',
        ], [
            'program_id' => $program->id,
            'status' => 'active',
        ]);

        // Enroll students in the section
        $students = Student::all();
        foreach ($students as $student) {
            StudentEnrollment::firstOrCreate([
                'student_id' => $student->id,
                'section_id' => $section->id,
                'academic_year' => '2025-2026',
                'semester' => '1st',
            ], [
                'enrollment_date' => now(),
                'status' => 'active',
                'enrolled_by' => 1, // Assume admin user id 1
            ]);
        }
    }
}
