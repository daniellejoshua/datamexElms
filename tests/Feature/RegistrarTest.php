<?php

use App\Models\User;
use App\Models\SchoolSetting;

// use Illuminate\Foundation\Testing\RefreshDatabase;

// uses(RefreshDatabase::class);

it('can create a registrar account', function () {
    $registrarData = [
        'name' => 'John Registrar',
        'email' => 'registrar@example.com',
        'employee_number' => 'EMP001',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ];

    $response = $this->post(route('registrar.register'), $registrarData);

    $response->assertRedirect(route('registrar.dashboard'));

    $this->assertDatabaseHas('users', [
        'name' => 'John Registrar',
        'email' => 'registrar@example.com',
        'role' => 'registrar',
        'is_active' => true,
    ]);

    // Check that employee_number follows the format EMP-XXX
    $user = User::where('email', 'registrar@example.com')->first();
    expect($user->employee_number)->toMatch('/^EMP-\d{3}$/');
});

it('requires authentication to access registrar dashboard', function () {
    $response = $this->get(route('registrar.dashboard'));

    $response->assertRedirect(route('login'));
});

it('requires registrar role to access registrar dashboard', function () {
    $user = User::factory()->create(['role' => 'student']);

    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    $response->assertStatus(403);
});

it('allows registrar to access dashboard', function () {
    $user = User::factory()->create(['role' => 'registrar']);

    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Registrar/Dashboard'));
});

it('allows registrar to view students list', function () {
    $user = User::factory()->create(['role' => 'registrar']);

    $response = $this->actingAs($user)->get(route('registrar.students'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Registrar/Students/Index'));
});

it('does not expose a section when year levels mismatch', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);

    $currentYear = SchoolSetting::getCurrentAcademicYear();
    $currentSem = SchoolSetting::getCurrentSemester();

    // create a section with a different year level than the student
    $section = \App\Models\Section::factory()->create([
        'year_level' => '12',
        'academic_year' => $currentYear,
        'semester' => $currentSem,
    ]);

    $student = \App\Models\Student::factory()->create([
        'year_level' => '11',
        'student_type' => 'irregular',
    ]);

    // enrollment tying the student to the mismatched section
    \App\Models\StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'academic_year' => $currentYear,
        'semester' => $currentSem,
        'status' => 'active',
    ]);

    $response = $this->actingAs($registrar)->get(route('registrar.students'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) =>
        $page->where('students.data', function ($students) use ($student) {
            $found = collect($students)->firstWhere('id', $student->id);
            // student should exist and have no current_section due to year mismatch
            return $found && $found['current_section'] === null;
        })
    );
});

it('redirects to registrar dashboard after login for registrar users', function () {
    $user = User::factory()->create(['role' => 'registrar']);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect(route('registrar.dashboard'));
});

it('validates required fields in registrar registration', function () {
    $response = $this->post(route('registrar.register'), []);

    $response->assertSessionHasErrors([
        'name',
        'email',
        'password',
    ]);
});

it('prevents duplicate employee numbers', function () {
    // Registrar model removed - skipping test
    $this->assertTrue(true);
})->skip('Registrar model removed');

it('creates user with registrar relationship through factory', function () {
    // Registrar model removed - skipping test
    $this->assertTrue(true);
})->skip('Registrar model removed');
