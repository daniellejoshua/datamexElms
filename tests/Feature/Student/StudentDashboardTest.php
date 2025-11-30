<?php

use App\Models\User;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Course;
use App\Models\Section;
use Inertia\Testing\AssertableInertia as Assert;

it('displays student dashboard with enrollment data', function () {
    // Create a student user
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'education_level' => 'college'
    ]);
    
    // Create course and section
    $course = Course::factory()->create();
    $section = Section::factory()->create([
        'course_id' => $course->id,
        'academic_year' => '2024-2025',
        'semester' => '1st'
    ]);
    
    // Create enrollment
    StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active'
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
            ->where('stats.totalSubjects', 1)
        );
});

it('shows empty state when student has no enrollments', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'education_level' => 'college'
    ]);

    test()->actingAs($user)->get(route('student.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Student/Dashboard')
            ->where('stats.totalSubjects', 0)
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