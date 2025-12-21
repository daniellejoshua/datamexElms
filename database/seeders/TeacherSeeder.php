<?php

namespace Database\Seeders;

use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teachers = [
            [
                'email' => 'ana.cruz@datamex.edu',
                'first_name' => 'Ana',
                'last_name' => 'Cruz',
                'middle_name' => 'M.',
                'employee_number' => 'T001',
                'department' => 'Computer Science',
                'specialization' => 'Software Engineering',
            ],
            [
                'email' => 'carlos.lopez@datamex.edu',
                'first_name' => 'Carlos',
                'last_name' => 'Lopez',
                'middle_name' => 'R.',
                'employee_number' => 'T002',
                'department' => 'Computer Science',
                'specialization' => 'Database Systems',
            ],
            [
                'email' => 'elena.reyes@datamex.edu',
                'first_name' => 'Elena',
                'last_name' => 'Reyes',
                'middle_name' => 'S.',
                'employee_number' => 'T003',
                'department' => 'Information Technology',
                'specialization' => 'Network Administration',
            ],
            [
                'email' => 'miguel.torres@datamex.edu',
                'first_name' => 'Miguel',
                'last_name' => 'Torres',
                'middle_name' => 'A.',
                'employee_number' => 'T004',
                'department' => 'Computer Science',
                'specialization' => 'Web Development',
            ],
            [
                'email' => 'sofia.gonzalez@datamex.edu',
                'first_name' => 'Sofia',
                'last_name' => 'Gonzalez',
                'middle_name' => 'L.',
                'employee_number' => 'T005',
                'department' => 'Information Technology',
                'specialization' => 'Cybersecurity',
            ],
        ];

        foreach ($teachers as $teacherData) {
            $user = User::where('email', $teacherData['email'])->first();

            if ($user) {
                Teacher::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'employee_number' => $teacherData['employee_number'],
                        'first_name' => $teacherData['first_name'],
                        'last_name' => $teacherData['last_name'],
                        'middle_name' => $teacherData['middle_name'],
                        'department' => $teacherData['department'],
                        'specialization' => $teacherData['specialization'],
                        'hire_date' => now()->subYears(rand(1, 10)),
                        'status' => 'active',
                    ]
                );
            }
        }
    }
}
