<?php

namespace Database\Factories;

use App\Models\ShsStudentPayment;
use Illuminate\Database\Eloquent\Factories\Factory;

class ShsStudentPaymentFactory extends Factory
{
    protected $model = ShsStudentPayment::class;

    public function definition(): array
    {
        return [
            'student_id' => \App\Models\Student::factory(),
            'academic_year' => '2025-2026',
            'semester' => 'annual',
            'first_quarter_amount' => 0,
            'first_quarter_paid' => false,
            'second_quarter_amount' => 0,
            'second_quarter_paid' => false,
            'third_quarter_amount' => 0,
            'third_quarter_paid' => false,
            'fourth_quarter_amount' => 0,
            'fourth_quarter_paid' => false,
            'total_semester_fee' => 1000,
            'total_paid' => 0,
            'balance' => 1000,
        ];
    }
}
