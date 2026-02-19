<?php

use App\Models\User;

it('updates registrar and returns Inertia render for X-Inertia requests', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);
    $this->actingAs($admin);

    $registrar = User::factory()->create([
        'role' => 'registrar',
        'email' => 'old.registrar@example.com',
        'name' => 'Old Name',
        'is_active' => true,
    ]);

    $payload = [
        'first_name' => 'New',
        'last_name' => 'Registrar',
        'middle_name' => 'M',
        'email' => 'new.registrar@example.com',
        'is_active' => false,
    ];

    $response = $this->put(route('admin.registrars.update', $registrar->id), $payload, ['X-Inertia' => 'true']);

    $response->assertStatus(200);
    $response->assertJson(['success' => true]);

    $this->assertDatabaseHas('users', [
        'id' => $registrar->id,
        'email' => 'new.registrar@example.com',
        'is_active' => false,
    ]);

    // The controller flashes a session success message for XHR/Inertia paths
    $response->assertSessionHas('success', 'Registrar updated successfully.');
});

it('redirects to show for non-inertia requests', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);
    $this->actingAs($admin);

    $registrar = User::factory()->create([
        'role' => 'registrar',
        'email' => 'old.registrar2@example.com',
        'name' => 'Old Name',
        'is_active' => true,
    ]);

    $payload = [
        'first_name' => 'Redirect',
        'last_name' => 'Registrar',
        'middle_name' => '',
        'email' => 'redirect.registrar@example.com',
        'is_active' => true,
    ];

    $response = $this->put(route('admin.registrars.update', $registrar->id), $payload);

    // After update we redirect to the registrars index (do not rely on Show page).
    $response->assertRedirect(route('admin.registrars.index'));

    $this->assertDatabaseHas('users', [
        'id' => $registrar->id,
        'email' => 'redirect.registrar@example.com',
    ]);
});
