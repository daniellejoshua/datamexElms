<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Super Admin
        $superAdmin = User::updateOrCreate(
            ['email' => 'superadmin@datamex.edu'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('password'),
                'role' => 'super_admin',
                'is_active' => true,
            ]
        );

        // Ensure email is verified even if not mass-assignable
        $superAdmin->email_verified_at = now();
        $superAdmin->save();

        // Create Head Teacher
        $headUser = User::updateOrCreate(
            ['email' => 'headteacher@datamex.edu'],
            [
                'name' => 'Dr. Maria Santos',
                'password' => Hash::make('password'),
                'role' => 'head_teacher',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Ensure there's a Teacher profile for the seeded head teacher so SuperAdmin listings show it
        \App\Models\Teacher::updateOrCreate(
            ['user_id' => $headUser->id],
            [
                'employee_number' => $headUser->formatted_employee_number,
                'first_name' => 'Maria',
                'last_name' => 'Santos',
                'middle_name' => null,
                'department' => 'Administration',
                'hire_date' => now()->toDateString(),
                'status' => 'active',
            ]
        );

        // Create Registrar
        User::updateOrCreate(
            ['email' => 'registrar@datamex.edu'],
            [
                'name' => 'John Rodriguez',
                'password' => Hash::make('password'),
                'role' => 'registrar',
                'is_active' => true,
                'email_verified_at' => now(),
            ]
        );

        // Create Sample Teachers
        $teachers = [
            ['name' => 'Prof. Ana Cruz', 'email' => 'ana.cruz@datamex.edu'],
            ['name' => 'Prof. Carlos Lopez', 'email' => 'carlos.lopez@datamex.edu'],
            ['name' => 'Prof. Elena Reyes', 'email' => 'elena.reyes@datamex.edu'],
            ['name' => 'Prof. Miguel Torres', 'email' => 'miguel.torres@datamex.edu'],
            ['name' => 'Prof. Sofia Gonzalez', 'email' => 'sofia.gonzalez@datamex.edu'],
        ];

        foreach ($teachers as $teacher) {
            User::updateOrCreate(
                ['email' => $teacher['email']],
                [
                    'name' => $teacher['name'],
                    'password' => Hash::make('password'),
                    'role' => 'teacher',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ]
            );
        }

        // Create Sample Students - COMMENTED OUT as per user request
        /*
        $students = [
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@student.datamex.edu'],
            ['name' => 'Maria Garcia', 'email' => 'maria.garcia@student.datamex.edu'],
            ['name' => 'Jose Martinez', 'email' => 'jose.martinez@student.datamex.edu'],
            ['name' => 'Ana Villanueva', 'email' => 'ana.villanueva@student.datamex.edu'],
            ['name' => 'Pedro Santos', 'email' => 'pedro.santos@student.datamex.edu'],
            ['name' => 'Lisa Fernandez', 'email' => 'lisa.fernandez@student.datamex.edu'],
            ['name' => 'Roberto Kim', 'email' => 'roberto.kim@student.datamex.edu'],
            ['name' => 'Carmen Flores', 'email' => 'carmen.flores@student.datamex.edu'],
        ];

        foreach ($students as $student) {
            User::create([
                'name' => $student['name'],
                'email' => $student['email'],
                'password' => Hash::make('password'),
                'role' => 'student',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }
        */
    }
}
