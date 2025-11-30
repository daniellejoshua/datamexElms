<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Course>
 */
class CourseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'subject_name' => $this->faker->words(3, true),
            'course_code' => $this->faker->unique()->regexify('[A-Z]{2,4}[0-9]{3}'),
            'description' => $this->faker->paragraph(),
            'units' => $this->faker->numberBetween(1, 6),
            'education_level' => 'college',
            'track' => null,
            'status' => 'active',
        ];
    }
}
