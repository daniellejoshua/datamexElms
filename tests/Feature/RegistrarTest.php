<?php

use App\Models\Registrar;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can create a registrar account', function () {
    $registrarData = [
        'name' => 'John Registrar',
        'email' => 'registrar@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'employee_number' => 'REG-001',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => 'Smith',
        'department' => 'Academic Affairs',
        'position' => 'Registrar',
        'hire_date' => '2024-01-15',
    ];

    $response = $this->post(route('registrar.register'), $registrarData);

    $response->assertRedirect(route('registrar.dashboard'));

    $this->assertDatabaseHas('users', [
        'email' => 'registrar@example.com',
        'role' => 'registrar',
    ]);

    $this->assertDatabaseHas('registrars', [
        'employee_number' => 'REG-001',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'department' => 'Academic Affairs',
    ]);
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
    Registrar::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Registrar/Dashboard'));
});

it('allows registrar to view students list', function () {
    $user = User::factory()->create(['role' => 'registrar']);
    Registrar::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get(route('registrar.students'));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) => $page->component('Registrar/Students/Index'));
});

it('redirects to registrar dashboard after login for registrar users', function () {
    $user = User::factory()->create(['role' => 'registrar']);
    Registrar::factory()->create(['user_id' => $user->id]);

    $response = $this->actingAs($user)->get('/dashboard');

    $response->assertRedirect(route('registrar.dashboard'));
});

it('validates required fields in registrar registration', function () {
    $response = $this->post(route('registrar.register'), []);

    $response->assertSessionHasErrors([
        'name',
        'email',
        'password',
        'employee_number',
        'first_name',
        'last_name',
        'department',
        'position',
        'hire_date',
    ]);
});

it('prevents duplicate employee numbers', function () {
    Registrar::factory()->create(['employee_number' => 'REG-001']);

    $registrarData = [
        'name' => 'Jane Registrar',
        'email' => 'jane@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'employee_number' => 'REG-001', // Duplicate
        'first_name' => 'Jane',
        'last_name' => 'Doe',
        'department' => 'Academic Affairs',
        'position' => 'Registrar',
        'hire_date' => '2024-01-15',
    ];

    $response = $this->post(route('registrar.register'), $registrarData);

    $response->assertSessionHasErrors(['employee_number']);
});

it('creates user with registrar relationship through factory', function () {
    $registrar = Registrar::factory()->create();

    expect($registrar->user)->toBeInstanceOf(User::class);
    expect($registrar->user->role)->toBe('registrar');
    expect($registrar->user_id)->toBe($registrar->user->id);
});
