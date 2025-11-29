<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Teacher;
use App\Models\User;

class TeacherSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $teacherUsers = User::where('role', 'teacher')->get();
        
        $teacherData = [
            [
                'employee_number' => 'DMXFAC001',
                'first_name' => 'Ana',
                'last_name' => 'Cruz',
                'middle_name' => 'Santos',
                'department' => 'Computer Science Department',
                'specialization' => 'Programming and Software Development',
                'hire_date' => '2020-08-15',
                'status' => 'active'
            ],
            [
                'employee_number' => 'DMXFAC002',
                'first_name' => 'Carlos',
                'last_name' => 'Lopez',
                'middle_name' => 'Rivera',
                'department' => 'Information Technology Department',
                'specialization' => 'Database Management and Systems Analysis',
                'hire_date' => '2019-06-01',
                'status' => 'active'
            ],
            [
                'employee_number' => 'DMXFAC003',
                'first_name' => 'Elena',
                'last_name' => 'Reyes',
                'middle_name' => 'Garcia',
                'department' => 'General Education Department',
                'specialization' => 'Mathematics and Statistics',
                'hire_date' => '2021-03-10',
                'status' => 'active'
            ],
            [
                'employee_number' => 'DMXFAC004',
                'first_name' => 'Miguel',
                'last_name' => 'Torres',
                'middle_name' => 'Fernandez',
                'department' => 'General Education Department',
                'specialization' => 'Communication and Language Arts',
                'hire_date' => '2018-09-05',
                'status' => 'active'
            ],
            [
                'employee_number' => 'DMXFAC005',
                'first_name' => 'Sofia',
                'last_name' => 'Gonzalez',
                'middle_name' => 'Martinez',
                'department' => 'Physical Education Department',
                'specialization' => 'Sports Science and Physical Fitness',
                'hire_date' => '2022-01-20',
                'status' => 'active'
            ]
        ];

        foreach ($teacherUsers as $index => $user) {
            if (isset($teacherData[$index])) {
                Teacher::create(array_merge(
                    ['user_id' => $user->id],
                    $teacherData[$index]
                ));
            }
        }
    }
}
