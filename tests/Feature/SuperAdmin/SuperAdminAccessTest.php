<?php

use App\Models\Teacher;
use App\Models\User;

it('allows super admin to view dashboard and users pages', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get(route('superadmin.dashboard'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Dashboard'));

    $response = $this->actingAs($user)->get(route('superadmin.users'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Users'));

    // Ensure the users endpoint returns multiple user roles
    // create one teacher with role=teacher and one head teacher
    $teacherUser = User::factory()->create(['role' => 'teacher']);
    $teacher = \App\Models\Teacher::factory()->create(['user_id' => $teacherUser->id, 'department' => 'X']);

    $headUser = User::factory()->create(['role' => 'head_teacher']);
    $head = \App\Models\Teacher::factory()->create(['user_id' => $headUser->id, 'department' => 'Y']);

    $response = $this->actingAs($user)->get(route('superadmin.users', ['search' => $headUser->email]));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->has('users.data')->where('users.data.0.role', 'head_teacher'));
});

it('lets super admin update user account status', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $managedUser = User::factory()->create(['role' => 'student', 'is_active' => true]);

    $response = $this->actingAs($superAdmin)->patch(route('superadmin.users.update-status', $managedUser), [
        'is_active' => false,
    ]);

    $response->assertRedirect(route('superadmin.users'));

    expect($managedUser->fresh()->is_active)->toBeFalse();
});

it('redirects super admin to super-admin dashboard from main dashboard', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect(route('superadmin.dashboard'));
});

it('prevents non-super-admin from accessing super admin pages', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($user)->get(route('superadmin.dashboard'));
    $response->assertForbidden();
});

it('ignores admin intended url and sends super admin to super-admin dashboard after login', function () {
    // Visiting an admin URL while unauthenticated stores the intended URL in session
    $this->get('/admin/dashboard')->assertRedirect(route('login'));

    $user = User::factory()->create(['role' => 'super_admin', 'email' => 'intended.super@datamex.edu']);

    $response = $this->post('/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response->assertRedirect(route('superadmin.dashboard'));
});

it('lets super admin create a head teacher', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $payload = [
        'first_name' => 'Janet',
        'last_name' => 'Smith',
        'email' => 'janet.smith@example.com',
        'password' => 'password123',
    ];

    $response = $this->actingAs($user)->post(route('superadmin.users.head-teacher.store'), $payload);

    $response->assertRedirect();

    $this->assertDatabaseHas('users', [
        'email' => 'janet.smith@example.com',
        'role' => 'head_teacher',
    ]);

    $created = \App\Models\User::where('email', 'janet.smith@example.com')->first();
    $this->assertNotNull($created);
    $this->assertDatabaseHas('teachers', [
        'user_id' => $created->id,
        'status' => 'active',
    ]);
});

it('shows backup page to super admin (no destructive restore in test)', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get(route('superadmin.backup.index'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Backup'));
});
