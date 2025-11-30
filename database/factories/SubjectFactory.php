<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Subject>
 */
class SubjectFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_code' => $this->faker->unique()->bothify('##???###'),
            'subject_name' => $this->faker->words(3, true),
            'description' => $this->faker->optional()->sentence(),
            'units' => $this->faker->numberBetween(1, 5),
            'year_level' => $this->faker->numberBetween(1, 4),
            'semester' => $this->faker->randomElement([1, 2]),
            'subject_type' => $this->faker->randomElement(['major', 'minor', 'general']),
            'status' => 'active',
        ];
    }
}
