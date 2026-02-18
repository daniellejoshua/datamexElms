<?php

use App\Models\User;
use App\Models\Teacher;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows super admin to view dashboard and users pages', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get(route('superadmin.dashboard'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Dashboard'));

    $response = $this->actingAs($user)->get(route('superadmin.users'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Users'));
});

it('prevents non-super-admin from accessing super admin pages', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    $response = $this->actingAs($user)->get(route('superadmin.dashboard'));
    $response->assertForbidden();
});

it('lets super admin create a head teacher', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $payload = [
        'first_name' => 'Janet',
        'last_name' => 'Smith',
        'email' => 'janet.smith@example.com',
        'department' => 'Math',
        'hire_date' => now()->format('Y-m-d'),
        'status' => 'active',
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
        'department' => 'Math',
    ]);
});

it('shows backup page to super admin (no destructive restore in test)', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get(route('superadmin.backup.index'));
    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('SuperAdmin/Backup'));
});
