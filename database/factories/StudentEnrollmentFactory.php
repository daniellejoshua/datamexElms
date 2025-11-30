<?php

namespace Database\Factories;

use App\Models\Student;
use App\Models\Section;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\StudentEnrollment>
 */
class StudentEnrollmentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'student_id' => Student::factory(),
            'section_id' => Section::factory(),
            'enrollment_date' => $this->faker->dateTimeBetween('-1 year', 'now'),
            'enrolled_by' => User::factory(),
            'status' => $this->faker->randomElement(['active', 'dropped', 'transferred']),
            'academic_year' => '2024-2025',
            'semester' => $this->faker->randomElement(['1st', '2nd', 'summer']),
        ];
    }
}
