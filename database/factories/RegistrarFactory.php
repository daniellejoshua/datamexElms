<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Registrar>
 */
class RegistrarFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory()->create(['role' => 'registrar'])->id,
            'employee_number' => 'REG-'.fake()->unique()->numerify('####'),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'middle_name' => fake()->optional(0.7)->firstName(),
            'department' => fake()->randomElement([
                'Academic Affairs',
                'Student Services',
                'Records and Registration',
                'Admissions Office',
            ]),
            'position' => 'Registrar',
            'hire_date' => fake()->dateTimeBetween('-5 years', 'now'),
            'status' => fake()->randomElement(['active', 'inactive']),
        ];
    }
}
