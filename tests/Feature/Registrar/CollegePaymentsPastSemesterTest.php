<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('adds a past-semester notice when filters point to an earlier academic period', function () {
    $registrar = \App\Models\User::factory()->create(['role' => 'registrar']);

    // choose an academic year/semester that is definitely not current
    $oldYear = '2000-2001';
    $oldSem = '1st';

    $response = $this->actingAs($registrar)->get(route('registrar.payments.college.index', [
        'academic_year' => $oldYear,
        'semester' => $oldSem,
    ]));

    $response->assertSuccessful();

    // server indicates past filter via prop; frontend renders hidden notice
    $response->assertInertia(fn ($page) => $page->where('isPastFilter', true));
});
