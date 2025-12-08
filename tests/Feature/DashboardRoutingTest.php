<?php

use App\Models\Student;
use App\Models\User;

uses()->group('dashboard');

it('redirects student to student dashboard when accessing main dashboard', function () {
    // Create a user with student role
    $user = User::factory()->create(['role' => 'student']);

    // Create student profile
    $student = Student::factory()->create(['user_id' => $user->id]);

    // Access main dashboard route
    $response = test()->actingAs($user)->get('/dashboard');

    // Should redirect to student dashboard
    $response->assertRedirect(route('student.dashboard'));
});
