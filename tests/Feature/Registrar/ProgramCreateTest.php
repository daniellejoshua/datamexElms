<?php

use App\Models\Program;
use App\Models\ProgramFee;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));
});

it('creates a program with per-year fees when semester_fee is not provided', function () {
    $payload = [
        'program_code' => 'BSPH',
        'program_name' => 'Bachelor of Sample Program',
        'education_level' => 'college',
        'total_years' => 4,
        'status' => 'active',
        // intentionally omit top-level semester_fee to reproduce/fix the bug
        'program_fees' => [
            ['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 10000],
            ['year_level' => 2, 'fee_type' => 'regular', 'semester_fee' => 11000],
            ['year_level' => 3, 'fee_type' => 'regular', 'semester_fee' => 12000],
            ['year_level' => 4, 'fee_type' => 'regular', 'semester_fee' => 13000],
        ],
    ];

    $response = $this->post(route('registrar.programs.store'), $payload);

    $response->assertRedirect(route('registrar.programs.index'));

    $program = Program::where('program_code', 'BSPH')->first();
    expect($program)->not->toBeNull();

    // program.semester_fee should default to first program fee
    expect((float) $program->semester_fee)->toBe(10000.0);

    foreach ($payload['program_fees'] as $fee) {
        expect(ProgramFee::where(array_merge($fee, ['program_id' => $program->id]))->exists())->toBeTrue();
    }
});
