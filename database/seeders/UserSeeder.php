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
        // Create Head Teacher
        User::create([
            'name' => 'Dr. Maria Santos',
            'email' => 'headteacher@datamex.edu',
            'password' => Hash::make('password'),
            'role' => 'head_teacher',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create Registrar
        User::create([
            'name' => 'John Rodriguez',
            'email' => 'registrar@datamex.edu',
            'password' => Hash::make('password'),
            'role' => 'registrar',
            'is_active' => true,
            'email_verified_at' => now(),
        ]);

        // Create Sample Teachers
        $teachers = [
            ['name' => 'Prof. Ana Cruz', 'email' => 'ana.cruz@datamex.edu'],
            ['name' => 'Prof. Carlos Lopez', 'email' => 'carlos.lopez@datamex.edu'],
            ['name' => 'Prof. Elena Reyes', 'email' => 'elena.reyes@datamex.edu'],
            ['name' => 'Prof. Miguel Torres', 'email' => 'miguel.torres@datamex.edu'],
            ['name' => 'Prof. Sofia Gonzalez', 'email' => 'sofia.gonzalez@datamex.edu'],
        ];

        foreach ($teachers as $teacher) {
            User::create([
                'name' => $teacher['name'],
                'email' => $teacher['email'],
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'is_active' => true,
                'email_verified_at' => now(),
            ]);
        }

        // Create Sample Students
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
    }
}
