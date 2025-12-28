<?php

use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

// uses(RefreshDatabase::class); // Commented out to preserve existing data

it('displays registrar dashboard with payment and enrollment statistics', function () {
    // Create a registrar user
    $user = \App\Models\User::factory()->create(['role' => 'registrar']);

    // Act as registrar and visit dashboard
    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    // Assert successful response
    $response->assertSuccessful();

    // Assert Inertia component and data structure
    $response->assertInertia(fn (Assert $page) => $page
        ->component('Registrar/Dashboard')
        ->has('stats')
        ->has('stats.total_students')
        ->has('stats.active_students')
        ->has('stats.payment_stats')
        ->has('stats.enrollment_alerts')
        ->has('stats.kpi_trends')
        ->whereType('stats.total_students', 'integer')
        ->whereType('stats.active_students', 'integer')
    );
});

it('requires registrar role to access dashboard', function () {
    $user = \App\Models\User::factory()->create();

    $response = $this->actingAs($user)->get(route('registrar.dashboard'));

    $response->assertForbidden();
});

it('requires authentication to access dashboard', function () {
    $response = $this->get(route('registrar.dashboard'));

    $response->assertRedirect(route('login'));
});
