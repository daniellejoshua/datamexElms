<?php

namespace Database\Seeders;

use App\Models\Registrar;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RegistrarSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Check if registrar user already exists
        $existingUser = User::where('email', 'registrar@datamex.com')->first();

        if ($existingUser) {
            $this->command->info('Registrar account already exists:');
            $this->command->info('Email: registrar@datamex.com');
            $this->command->info('Password: password');

            return;
        }

        // Create a test registrar user
        $user = User::create([
            'name' => 'Test Registrar',
            'email' => 'registrar@datamex.com',
            'password' => Hash::make('password'),
            'role' => 'registrar',
            'email_verified_at' => now(),
        ]);

        // Create registrar profile
        Registrar::create([
            'user_id' => $user->id,
            'employee_number' => 'REG001',
            'first_name' => 'Test',
            'last_name' => 'Registrar',
            'middle_name' => 'Admin',
            'department' => 'Registrar Office',
            'position' => 'Registrar',
            'hire_date' => now()->subYears(2)->format('Y-m-d'),
            'status' => 'active',
        ]);

        $this->command->info('Created test registrar account:');
        $this->command->info('Email: registrar@datamex.com');
        $this->command->info('Password: password');
    }
}
