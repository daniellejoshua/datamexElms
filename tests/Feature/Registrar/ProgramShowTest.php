<?php

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Illuminate\Foundation\Testing\DatabaseTransactions;

uses(DatabaseTransactions::class);

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));
});

it('shows program with correct enrolled students count', function () {
    // Create a program
    $program = Program::factory()->create();

    // Create school settings for current academic year and semester
    $currentYear = '2024-2025';
    $currentSemester = '1st';

    SchoolSetting::create([
        'key' => 'current_academic_year',
        'value' => $currentYear,
    ]);

    SchoolSetting::create([
        'key' => 'current_semester',
        'value' => $currentSemester,
    ]);

    // Create a section for the program
    $section = Section::factory()->create([
        'program_id' => $program->id,
    ]);

    // Create a user for enrolled_by
    $user = User::factory()->create();

    // Create students
    $enrolledStudent = Student::factory()->create([
        'program_id' => $program->id,
    ]);
    $notEnrolledStudent = Student::factory()->create([
        'program_id' => $program->id,
    ]);

    // Create enrollments - only one student is enrolled for current period
    StudentEnrollment::create([
        'student_id' => $enrolledStudent->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'academic_year' => $currentYear,
        'semester' => $currentSemester,
        'status' => 'active',
        'enrolled_by' => $user->id,
    ]);

    // The not enrolled student should not have an enrollment for current period
    // or have a different status

    // Make request to show program
    $response = $this->get(route('registrar.programs.show', $program));

    $response->assertStatus(200);

    // Check that the response contains enrolled_students_count
    $response->assertInertia(function ($page) {
        $page->component('Registrar/Programs/Show')
            ->has('program')
            ->where('enrolled_students_count', 1); // Only 1 enrolled student
    });
});

it('shows program with zero enrolled students when no current enrollments exist', function () {
    // Create a program
    $program = Program::factory()->create();

    // Create school settings
    SchoolSetting::create([
        'key' => 'current_academic_year',
        'value' => '2024-2025',
    ]);

    SchoolSetting::create([
        'key' => 'current_semester',
        'value' => '1st',
    ]);

    // Create students but no enrollments for current period
    Student::factory()->count(3)->create([
        'program_id' => $program->id,
    ]);

    // Make request to show program
    $response = $this->get(route('registrar.programs.show', $program));

    $response->assertStatus(200);

    // Check that enrolled_students_count is 0
    $response->assertInertia(function ($page) {
        $page->component('Registrar/Programs/Show')
            ->has('program')
            ->where('enrolled_students_count', 0);
    });
});
