<?php

use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('displays student dashboard with enrollment data', function () {
    // Create a student user
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'education_level' => 'college',
        'student_type' => 'regular',
    ]);

    // Create program and section with new structure
    $program = \App\Models\Program::factory()->create();
    $subject = \App\Models\Subject::factory()->create();
    $section = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    // Create section-subject relationship
    $section->subjects()->attach($subject->id, [
        'teacher_id' => null,
        'room' => 'Room 101',
        'status' => 'active',
    ]);

    // Create enrollment
    StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active',
    ]);

    test()->actingAs($user)->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->has('student')
            ->has('enrollments', 1)
            ->has('recentGrades')
            ->has('stats')
            ->has('currentAcademicInfo')
            ->where('stats.completedSubjects', 0)
            ->where('stats.totalCurriculumSubjects', 0)
        );
});

it('shows empty state when student has no enrollments', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'education_level' => 'college',
        'student_type' => 'regular',
    ]);

    test()->actingAs($user)->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('stats.completedSubjects', 0)
            ->where('stats.totalCurriculumSubjects', 0)
            ->has('enrollments', 0)
        );
});

it('requires student role to access dashboard', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    test()->actingAs($user)->get(route('student.dashboard'))
        ->assertStatus(403);
});

it('requires authentication to access dashboard', function () {
    test()->get(route('student.dashboard'))
        ->assertRedirect(route('login'));
});
