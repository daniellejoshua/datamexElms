<?php

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\User;

test('admin can view curriculums index', function () {
    $admin = User::where('role', 'head_teacher')->first();

    $response = $this->actingAs($admin)->get('/admin/curriculum');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Curriculum/Index')
        ->has('curriculums')
    );
});

test('admin can create curriculum', function () {
    $admin = User::where('role', 'head_teacher')->first();
    $program = Program::first();

    $curriculumData = [
        'program_id' => $program->id,
        'curriculum_code' => 'TEST-'.now()->timestamp,
        'curriculum_name' => 'Test Curriculum '.now()->timestamp,
        'academic_year' => '2024-2025',
        'status' => 'active',
    ];

    $response = $this->actingAs($admin)->withoutMiddleware()->post('/admin/curriculum', $curriculumData);

    $response->assertStatus(302); // Redirect status
    $this->assertDatabaseHas('curriculum', $curriculumData);
});

test('admin can view curriculum details', function () {
    $admin = User::where('role', 'head_teacher')->first();
    $curriculum = Curriculum::first();

    $response = $this->actingAs($admin)->get("/admin/curriculum/{$curriculum->id}");

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) => $page
        ->component('Admin/Curriculum/Show')
        ->has('curriculum')
    );
});

test('curriculum belongs to program', function () {
    $curriculum = Curriculum::with('program')->first();

    expect($curriculum->program)->toBeInstanceOf(Program::class);
    expect($curriculum->program->id)->toBe($curriculum->program_id);
});

test('curriculum has many curriculum subjects', function () {
    $curriculum = Curriculum::with('curriculumSubjects')->first();

    expect($curriculum->curriculumSubjects)->toBeInstanceOf(\Illuminate\Database\Eloquent\Collection::class);
    expect($curriculum->curriculumSubjects->count())->toBeGreaterThan(0);
});

test('curriculum code must be unique', function () {
    $program = Program::first();
    $existingCurriculum = Curriculum::first();

    expect(function () use ($program, $existingCurriculum) {
        Curriculum::create([
            'program_id' => $program->id,
            'curriculum_code' => $existingCurriculum->curriculum_code, // Same code should fail
            'curriculum_name' => 'Duplicate Test Curriculum',
            'academic_year' => '2024-2025',
            'status' => 'active',
        ]);
    })->toThrow(\Illuminate\Database\QueryException::class);
});

test('active scope returns only active curriculums', function () {
    $activeCount = Curriculum::active()->count();
    $totalCount = Curriculum::count();

    // Should have at least some active curriculums from our seed data
    expect($activeCount)->toBeGreaterThan(0);
    expect($activeCount)->toBeLessThanOrEqual($totalCount);
});

test('student curriculum assignment works correctly', function () {
    $program = Program::first();
    $curriculum = Curriculum::first();

    // Create a test student with unique academic year
    $academicYear = '2023-2024-'.now()->timestamp;
    $student = \App\Models\Student::factory()->create([
        'program_id' => $program->id,
        'current_academic_year' => $academicYear,
        'curriculum_id' => null,
    ]);

    // Create a program curriculum mapping
    \App\Models\ProgramCurriculum::create([
        'program_id' => $program->id,
        'academic_year' => $academicYear,
        'curriculum_id' => $curriculum->id,
    ]);

    // Assign initial curriculum
    $student->assignInitialCurriculum();

    // Verify curriculum was assigned
    expect($student->fresh()->curriculum_id)->toBe($curriculum->id);
    expect($student->fresh()->curriculum->id)->toBe($curriculum->id);
});

test('student curriculum is locked after initial assignment', function () {
    $program = Program::first();
    $curriculum1 = Curriculum::first();
    $curriculum2 = Curriculum::skip(1)->first();

    // Create a test student with unique academic year
    $academicYear = '2024-2025-'.now()->timestamp;
    $student = \App\Models\Student::factory()->create([
        'program_id' => $program->id,
        'current_academic_year' => $academicYear,
        'curriculum_id' => null,
    ]);

    // Create a program curriculum mapping
    \App\Models\ProgramCurriculum::create([
        'program_id' => $program->id,
        'academic_year' => $academicYear,
        'curriculum_id' => $curriculum1->id,
    ]);

    // Assign initial curriculum
    $student->assignInitialCurriculum();
    expect($student->fresh()->curriculum_id)->toBe($curriculum1->id);

    // Try to assign again - should not change even if we create a new mapping
    if ($curriculum2) {
        \App\Models\ProgramCurriculum::create([
            'program_id' => $program->id,
            'academic_year' => $academicYear.'-updated',
            'curriculum_id' => $curriculum2->id,
        ]);

        $student->assignInitialCurriculum(); // Should not change
        expect($student->fresh()->curriculum_id)->toBe($curriculum1->id);
    }
});
