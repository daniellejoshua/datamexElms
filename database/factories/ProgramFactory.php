<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Program>
 */
class ProgramFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'program_code' => $this->faker->randomElement(['BSIT', 'BSCS', 'BSA', 'BSBA', 'STEM', 'ABM', 'HUMSS']),
            'program_name' => $this->faker->randomElement([
                'Bachelor of Science in Information Technology',
                'Bachelor of Science in Computer Science',
                'Bachelor of Science in Accountancy',
                'Bachelor of Science in Business Administration',
                'Science, Technology, Engineering, and Mathematics',
                'Accountancy, Business and Management',
                'Humanities and Social Sciences',
            ]),
            'education_level' => $this->faker->randomElement(['college', 'shs']),
            'description' => $this->faker->optional()->sentence(),
            'total_years' => $this->faker->numberBetween(2, 4),
            'status' => 'active',
        ];
    }
}
