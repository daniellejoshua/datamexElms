<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Section>
 */
class SectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'section_name' => $this->faker->randomElement(['A', 'B', 'C', 'D']),
            'academic_year' => '2024-2025',
            'semester' => $this->faker->randomElement(['1st', '2nd', 'summer']),
            'room' => $this->faker->randomElement(['Room 101', 'Room 102', 'Room 201', 'Lab A']),
            'status' => 'active',
        ];
    }
}
