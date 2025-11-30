<?php

use App\Models\Course;
use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use App\Models\User;

uses()->group('admin');

it('allows super admin to access admin dashboard', function () {
    // Create super admin user
    $admin = User::factory()->create(['role' => 'super_admin']);

    $response = test()->actingAs($admin)->get('/admin/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Admin/Dashboard')
        ->has('stats')
    );
});

it('allows head teacher to access admin dashboard', function () {
    // Create head teacher user
    $admin = User::factory()->create(['role' => 'head_teacher']);

    $response = test()->actingAs($admin)->get('/admin/dashboard');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Admin/Dashboard')
        ->has('stats')
    );
});

it('prevents non-admin users from accessing admin dashboard', function () {
    // Create student user
    $student = User::factory()->create(['role' => 'student']);
    Student::factory()->create(['user_id' => $student->id]);

    $response = test()->actingAs($student)->get('/admin/dashboard');

    $response->assertForbidden();
});

it('allows head teacher to view courses index', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);

    // Create some test courses
    Course::factory()->count(3)->create();

    $response = test()->actingAs($admin)->get('/admin/courses');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Admin/Courses/Index')
        ->has('courses')
    );
});

it('allows super admin to view sections index', function () {
    $admin = User::factory()->create(['role' => 'super_admin']);

    // Create test data
    $course = Course::factory()->create();
    Section::factory()->create(['course_id' => $course->id]);

    $response = test()->actingAs($admin)->get('/admin/sections');

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Admin/Sections/Index')
        ->has('sections')
    );
});

it('redirects head teacher to admin dashboard from main dashboard', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);

    $response = test()->actingAs($admin)->get('/dashboard');

    $response->assertRedirect('/admin/dashboard');
});
