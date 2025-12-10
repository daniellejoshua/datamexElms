<?php

use App\Models\Program;
use App\Models\ProgramFee;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));
});

it('updates program fees correctly', function () {
    // Create a program with initial fees
    $program = Program::factory()->create([
        'education_level' => 'college',
    ]);

    // Create initial program fees
    $initialFees = [
        ['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 10000],
        ['year_level' => 2, 'fee_type' => 'regular', 'semester_fee' => 11000],
        ['year_level' => 3, 'fee_type' => 'regular', 'semester_fee' => 12000],
        ['year_level' => 4, 'fee_type' => 'regular', 'semester_fee' => 13000],
    ];

    foreach ($initialFees as $fee) {
        ProgramFee::create(array_merge($fee, ['program_id' => $program->id]));
    }

    // Updated fees data
    $updatedFees = [
        ['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 15000],
        ['year_level' => 2, 'fee_type' => 'regular', 'semester_fee' => 16000],
        ['year_level' => 3, 'fee_type' => 'regular', 'semester_fee' => 17000],
        ['year_level' => 4, 'fee_type' => 'regular', 'semester_fee' => 18000],
    ];

    // Update the program
    $response = $this->put(route('registrar.programs.update', $program), [
        'program_name' => $program->program_name,
        'program_code' => $program->program_code,
        'description' => $program->description,
        'education_level' => $program->education_level,
        'program_fees' => $updatedFees,
    ]);

    // Assert the response redirects to show page
    $response->assertRedirect(route('registrar.programs.show', $program));

    // Assert the fees were updated in the database
    foreach ($updatedFees as $fee) {
        expect(ProgramFee::where(array_merge($fee, ['program_id' => $program->id]))->exists())->toBeTrue();
    }

    // Assert the old fees are gone
    foreach ($initialFees as $fee) {
        expect(ProgramFee::where(array_merge($fee, ['program_id' => $program->id]))->exists())->toBeFalse();
    }
});
