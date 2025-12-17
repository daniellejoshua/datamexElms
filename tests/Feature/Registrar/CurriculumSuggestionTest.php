<?php

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\User;
use App\Models\YearLevelCurriculumGuide;

it('returns guide when present for suggested curriculum', function () {
    $user = User::factory()->create(['role' => 'registrar']);

    $program = Program::create([
        'program_code' => 'TST-'.uniqid(),
        'program_name' => 'Test Program',
        'education_level' => 'college',
        'total_years' => 4,
        'status' => 'active',
    ]);

    $current = Curriculum::factory()->create([
        'program_id' => $program->id,
        'is_current' => true,
        'status' => 'active',
    ]);

    YearLevelCurriculumGuide::create([
        'program_id' => $program->id,
        'academic_year' => '2025-2026',
        'year_level' => 2,
        'curriculum_id' => $current->id,
    ]);

    $this->actingAs($user)
        ->getJson("/api/programs/{$program->id}/suggested-curriculum?year_level=2nd%20Year&academic_year=2025-2026&education_level=college")
        ->assertJsonStructure(['curriculum' => ['id', 'curriculum_code', 'curriculum_name'], 'source'])
        ->assertJson(['source' => 'guide', 'curriculum' => ['id' => $current->id]]);
});