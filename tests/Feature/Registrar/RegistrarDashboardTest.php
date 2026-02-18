<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

// uses(RefreshDatabase::class); // Commented out to preserve existing data

it('displays registrar dashboard with payment and enrollment statistics', function () {
    // Create a registrar user
    $user = \App\Models\User::factory()->create(['role' => 'registrar']);

    // Act as registrar and visit dashboard
    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    // Assert successful response
    $response->assertSuccessful();

    // Assert Inertia component and data structure
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Registrar/Dashboard')
        ->has('stats')
        ->has('stats.total_students')
        ->has('stats.active_students')
        ->has('stats.payment_stats')
        ->has('stats.enrollment_alerts')
        ->has('stats.kpi_trends')
        ->whereType('stats.total_students', 'integer')
        ->whereType('stats.active_students', 'integer')
    );
});

it('includes formatted section in payment-details response', function () {
    $registrar = \App\Models\User::factory()->create(['role' => 'registrar']);

    $program = \App\Models\Program::factory()->create(['program_code' => uniqid('BSIT-')]);

    $section = \App\Models\Section::factory()->create([
        'program_id' => $program->id,
        'year_level' => 3,
        'section_name' => 'D',
        'academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
        'semester' => \App\Models\SchoolSetting::getCurrentSemester(),
    ]);

    $student = \App\Models\Student::factory()->create([
        'program_id' => $program->id,
        'current_year_level' => 3,
        'student_type' => 'regular',
        'education_level' => 'college',
    ]);

    \App\Models\StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active',
        'academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
        'semester' => \App\Models\SchoolSetting::getCurrentSemester(),
    ]);

    $response = $this->actingAs($registrar)->getJson(route('registrar.dashboard.payment-details', [
        'year_level' => 3,
        'period' => 'prelim_payment',
        'status' => 'unpaid',
    ]));

    $response->assertSuccessful();

    $payload = $response->json();

    expect($payload['students'][0]['section'])->toBe($section->formatted_name);
});

it('prefers an active enrollment that already has a section assigned', function () {
    $registrar = \App\Models\User::factory()->create(['role' => 'registrar']);

    $program = \App\Models\Program::factory()->create(['program_code' => uniqid('BSIT-')]);

    $section = \App\Models\Section::factory()->create([
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'A',
        'academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
        'semester' => \App\Models\SchoolSetting::getCurrentSemester(),
    ]);

    $student = \App\Models\Student::factory()->create([
        'program_id' => $program->id,
        'current_year_level' => 1,
        'student_type' => 'regular',
        'education_level' => 'college',
    ]);

    // older active enrollment without a section
    \App\Models\StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => null,
        'status' => 'active',
        'academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
        'semester' => \App\Models\SchoolSetting::getCurrentSemester(),
    ]);

    // a second active enrollment that has a section
    \App\Models\StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active',
        'academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
        'semester' => \App\Models\SchoolSetting::getCurrentSemester(),
    ]);

    $response = $this->actingAs($registrar)->getJson(route('registrar.dashboard.payment-details', [
        'year_level' => 1,
        'period' => 'prelim_payment',
        'status' => 'unpaid',
    ]));

    $response->assertSuccessful();

    $payload = $response->json();

    // the API should return the formatted name of the section (prefer the enrollment with section)
    expect($payload['students'][0]['section'])->toBe($section->program->program_code.'-'.$section->year_level.$section->section_name);
});

it('requires registrar role to access dashboard', function () {
    $user = \App\Models\User::factory()->create();

    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    $response->assertForbidden();
});

it('requires authentication to access dashboard', function () {
    $response = $this->get(route('registrar.dashboard'));

    $response->assertRedirect(route('login'));
});
