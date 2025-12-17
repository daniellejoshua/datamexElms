<?php

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\User;
use App\Models\YearLevelCurriculumGuide;

it('creates a year level curriculum guide when registrar chooses so during transferee registration', function () {
    $this->withoutExceptionHandling();

    $user = User::factory()->create(['role' => 'registrar']);

    $program = Program::create([
        'program_code' => 'GUIDE-'.uniqid(),
        'program_name' => 'Guide Program',
        'education_level' => 'college',
        'total_years' => 4,
        'status' => 'active',
    ]);

    $current = Curriculum::factory()->create([
        'program_id' => $program->id,
        'is_current' => true,
        'status' => 'active',
    ]);

    // Ensure no existing guide
    expect(YearLevelCurriculumGuide::where('program_id', $program->id)->where('year_level', 2)->exists())->toBeFalse();

    $this->actingAs($user)
        ->post(route('registrar.students.store'), [
            'first_name' => 'Test',
            'last_name' => 'Transferee',
            'birth_date' => now()->subYears(20)->toDateString(),
            'email' => 'transferee+'.uniqid().'@example.com',
            'program_id' => $program->id,
            'year_level' => '2nd Year',
            'education_level' => 'college',
            'student_type' => 'regular',
            'enrollment_fee' => 1000,
            'payment_amount' => 1000,
            'create_year_level_guide' => true,
        ])
        ->assertRedirect(route('registrar.students'));

    expect(YearLevelCurriculumGuide::where('program_id', $program->id)->where('year_level', 2)->exists())->toBeTrue();
});