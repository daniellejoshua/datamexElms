<?php

use App\Models\User;

it('can login with valid credentials and receive abilities', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
        'role' => 'registrar',
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@exsample.com',
        'password' => 'password123',
    ]);

    $response->assertSuccessful()
        ->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'role'],
            'role',
            'abilities',
            'message',
        ])
        ->assertJson([
            'role' => 'registrar',
            'user' => [
                'email' => 'test@example.com',
            ],
            'message' => 'Login successful',
        ]);

    expect($response->json('abilities'))->toContain('grades:view-all', 'students:create');
});

it('returns different abilities for different roles', function (string $role, array $expectedAbilities) {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('password123'),
        'role' => $role,
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@example.com',
        'password' => 'password123',
    ]);

    $response->assertSuccessful();

    $abilities = $response->json('abilities');

    foreach ($expectedAbilities as $ability) {
        expect($abilities)->toContain($ability);
    }
})->with([
    'head_teacher' => ['head_teacher', ['system:admin', 'teachers:manage', 'students:manage']],
    'registrar' => ['registrar', ['grades:view-all', 'students:create', 'payments:manage']],
    'teacher' => ['teacher', ['grades:create', 'grades:view-assigned', 'materials:upload']],
    'student' => ['student', ['grades:view-own', 'announcements:read', 'payments:view-own']],
]);

it('rejects invalid credentials', function () {
    $user = User::factory()->create([
        'email' => 'test@example.com',
        'password' => bcrypt('correct-password'),
    ]);

    $response = $this->postJson('/api/login', [
        'email' => 'test@example.com',
        'password' => 'wrong-password',
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['email']);
});

it('can access protected endpoints when authenticated', function () {
    $user = User::factory()->create(['role' => 'teacher']);

    // Login first
    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $response = $this->getJson('/api/me');

    $response->assertSuccessful()
        ->assertJson([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => 'teacher',
            ],
            'role' => 'teacher',
        ]);
});

it('rejects access to protected endpoints without authentication', function () {
    $response = $this->getJson('/api/me');

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthenticated.']);
});

it('can logout successfully', function () {
    $user = User::factory()->create();

    // Login first
    $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    // Logout should succeed
    $logoutResponse = $this->postJson('/api/logout');
    $logoutResponse->assertSuccessful()
        ->assertJson(['message' => 'Logged out successfully']);

    // Verify session is invalidated
    $response = $this->getJson('/api/me');
    $response->assertStatus(401);
});

it('maintains session state between requests', function () {
    $user = User::factory()->create(['role' => 'registrar']);

    // Login
    $loginResponse = $this->postJson('/api/login', [
        'email' => $user->email,
        'password' => 'password',
    ]);

    $loginResponse->assertSuccessful();

    // Make multiple authenticated requests in the same test session
    $response1 = $this->getJson('/api/me');
    $response1->assertSuccessful()
        ->assertJson(['role' => 'registrar']);

    $response2 = $this->getJson('/api/me');
    $response2->assertSuccessful()
        ->assertJson(['role' => 'registrar']);
});
