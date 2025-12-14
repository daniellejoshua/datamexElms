<?php

namespace Database\Factories;

use App\Models\Program;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Curriculum>
 */
class CurriculumFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'program_id' => Program::factory(),
            'curriculum_code' => $this->faker->unique()->regexify('[A-Z]{4}-[0-9]{4}'),
            'curriculum_name' => $this->faker->sentence(3),
            'status' => $this->faker->randomElement(['active', 'inactive']),
            'is_current' => false,
        ];
    }
}
