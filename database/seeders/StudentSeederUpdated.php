<?php

namespace Database\Seeders;

use App\Models\Student;
use App\Models\User;
use Illuminate\Database\Seeder;

class StudentSeederUpdated extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $studentUsers = User::where('role', 'student')->get();

        $studentData = [
            // College Students
            [
                'student_number' => '2024-001',
                'first_name' => 'Juan',
                'last_name' => 'Dela Cruz',
                'middle_name' => 'Santos',
                'birth_date' => '2005-03-15',
                'address' => '123 Rizal Street, Manila',
                'phone' => '09171234567',
                'year_level' => '1st Year',
                'program' => 'Bachelor of Science in Computer Science',
                'parent_contact' => '09171234568',
                'student_type' => 'regular',
                'education_level' => 'college',
                'track' => null,
                'strand' => null,
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
                'year_level' => '1st Year',
                'program' => 'Bachelor of Science in Information Technology',
                'parent_contact' => '09182345679',
                'student_type' => 'regular',
                'education_level' => 'college',
                'track' => null,
                'strand' => null,
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
                'year_level' => '2nd Year',
                'program' => 'Bachelor of Science in Computer Science',
                'parent_contact' => '09193456790',
                'student_type' => 'irregular',
                'education_level' => 'college',
                'track' => null,
                'strand' => null,
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
                'year_level' => '1st Year',
                'program' => 'Bachelor of Science in Information Technology',
                'parent_contact' => '09204567891',
                'student_type' => 'regular',
                'education_level' => 'college',
                'track' => null,
                'strand' => null,
                'status' => 'active',
            ],
            [
                'student_number' => '2024-005',
                'first_name' => 'Pedro',
                'last_name' => 'Santos',
                'middle_name' => 'Torres',
                'birth_date' => '2005-08-30',
                'address' => '654 Luna Street, Mandaluyong City',
                'phone' => '09215678901',
                'year_level' => '1st Year',
                'program' => 'Bachelor of Science in Computer Science',
                'parent_contact' => '09215678902',
                'student_type' => 'regular',
                'education_level' => 'college',
                'track' => null,
                'strand' => null,
                'status' => 'active',
            ],

            // SHS Students
            [
                'student_number' => 'SHS2024-001',
                'first_name' => 'Miguel',
                'last_name' => 'Torres',
                'middle_name' => 'Santos',
                'birth_date' => '2007-02-14',
                'address' => '123 STEM Avenue, Pasig',
                'phone' => '09259012345',
                'year_level' => 11,
                'program' => 'STEM Strand',
                'parent_contact' => '09259012346',
                'student_type' => 'regular',
                'education_level' => 'shs',
                'track' => 'STEM',
                'strand' => 'Science, Technology, Engineering and Mathematics',
                'status' => 'active',
            ],
            [
                'student_number' => 'SHS2024-002',
                'first_name' => 'Sofia',
                'last_name' => 'Hernandez',
                'middle_name' => 'Cruz',
                'birth_date' => '2007-05-18',
                'address' => '456 HUMSS Street, Quezon City',
                'phone' => '09260123456',
                'year_level' => 11,
                'program' => 'HUMSS Strand',
                'parent_contact' => '09260123457',
                'student_type' => 'regular',
                'education_level' => 'shs',
                'track' => 'HUMSS',
                'strand' => 'Humanities and Social Sciences',
                'status' => 'active',
            ],
            [
                'student_number' => 'SHS2024-003',
                'first_name' => 'Diego',
                'last_name' => 'Morales',
                'middle_name' => 'Rivera',
                'birth_date' => '2007-08-22',
                'address' => '789 ABM Boulevard, Makati',
                'phone' => '09271234567',
                'year_level' => 11,
                'program' => 'ABM Strand',
                'parent_contact' => '09271234568',
                'student_type' => 'regular',
                'education_level' => 'shs',
                'track' => 'ABM',
                'strand' => 'Accountancy, Business and Management',
                'status' => 'active',
            ],
            [
                'student_number' => 'SHS2023-004',
                'first_name' => 'Luna',
                'last_name' => 'Pascual',
                'middle_name' => 'Gutierrez',
                'birth_date' => '2006-12-05',
                'address' => '321 Grade 12 Street, Manila',
                'phone' => '09282345678',
                'year_level' => 12,
                'program' => 'STEM Strand',
                'parent_contact' => '09282345679',
                'student_type' => 'regular',
                'education_level' => 'shs',
                'track' => 'STEM',
                'strand' => 'Science, Technology, Engineering and Mathematics',
                'status' => 'active',
            ],
            [
                'student_number' => 'SHS2023-005',
                'first_name' => 'Carlos',
                'last_name' => 'Jimenez',
                'middle_name' => 'Valdez',
                'birth_date' => '2006-10-30',
                'address' => '654 Senior High Lane, Taguig',
                'phone' => '09293456789',
                'year_level' => 12,
                'program' => 'HUMSS Strand',
                'parent_contact' => '09293456780',
                'student_type' => 'irregular', // Retaking some subjects
                'education_level' => 'shs',
                'track' => 'HUMSS',
                'strand' => 'Humanities and Social Sciences',
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
