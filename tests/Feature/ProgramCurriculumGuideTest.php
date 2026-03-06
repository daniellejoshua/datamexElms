<?php

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\ProgramCurriculum;
use App\Models\YearLevelCurriculumGuide;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('creates year level guides for all levels when setting curriculum on program with none', function () {
    $head = User::factory()->create(['role' => 'head_teacher']);

    // create program with known years
    $program = Program::factory()->create(['education_level' => 'college', 'total_years' => 4]);

    // make a curriculum and map it to program
    $curriculum = Curriculum::factory()->create(['status' => 'active']);
    $pc = ProgramCurriculum::create([
        'program_id' => $program->id,
        'academic_year' => '2025-2026',
        'curriculum_id' => $curriculum->id,
        'is_current' => false,
    ]);

    // confirm no guides exist initially
    expect(YearLevelCurriculumGuide::where('program_id', $program->id)->count())->toBe(0);

    $response = actingAs($head)
        ->put(route('admin.program-curricula.update-current', $program), [
            'curriculum_id' => $curriculum->id,
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('message');

    // guides should now exist for levels 1..4
    $guides = YearLevelCurriculumGuide::where('program_id', $program->id)->get();
    expect($guides)->toHaveCount(4);
    foreach (range(1, 4) as $level) {
        expect($guides->where('year_level', $level)->first())->not->toBeNull();
        expect($guides->where('year_level', $level)->first()->curriculum_id)->toBe($curriculum->id);
    }
});

it('does not overwrite existing guides when they are present', function () {
    $head = User::factory()->create(['role' => 'head_teacher']);
    $program = Program::factory()->create(['education_level' => 'college', 'total_years' => 4]);
    $curriculum1 = Curriculum::factory()->create(['status' => 'active']);
    $curriculum2 = Curriculum::factory()->create(['status' => 'active']);

    // seed one guide manually
    YearLevelCurriculumGuide::create([
        'program_id' => $program->id,
        'academic_year' => '2025-2026',
        'year_level' => 1,
        'curriculum_id' => $curriculum1->id,
    ]);

    // assign new program curriculum record
    $pc = ProgramCurriculum::create([
        'program_id' => $program->id,
        'academic_year' => '2025-2026',
        'curriculum_id' => $curriculum2->id,
        'is_current' => false,
    ]);

    actingAs($head)
        ->put(route('admin.program-curricula.update-current', $program), [
            'curriculum_id' => $curriculum2->id,
        ])
        ->assertRedirect();

    // should still only have the original guide (no creation for absent levels)
    $guides = YearLevelCurriculumGuide::where('program_id', $program->id)->get();
    expect($guides)->toHaveCount(1);
    expect($guides->first()->curriculum_id)->toBe($curriculum1->id);
});
