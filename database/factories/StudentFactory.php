<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Student>
 */
class StudentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_number' => $this->faker->unique()->numerify('2024-####'),
            'first_name' => $this->faker->firstName(),
            'last_name' => $this->faker->lastName(),
            'middle_name' => $this->faker->optional()->firstName(),
            'birth_date' => $this->faker->date('Y-m-d', '2005-12-31'),
            'address' => $this->faker->address(),
            'phone' => $this->faker->phoneNumber(),
            'year_level' => $this->faker->randomElement(['1st', '2nd', '3rd', '4th']),
            'current_year_level' => $this->faker->numberBetween(1, 4),
            'program' => $this->faker->randomElement(['BSIT', 'BSCS', 'BSIS', 'BSBA']),
            'program_id' => \App\Models\Program::factory(),
            'parent_contact' => $this->faker->phoneNumber(),
            'student_type' => $this->faker->randomElement(['regular', 'irregular']),
            'education_level' => 'college',
            'track' => null,
            'strand' => null,
            'status' => 'active',
            'enrolled_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}
