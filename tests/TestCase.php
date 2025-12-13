<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

// use Illuminate\Foundation\Testing\RefreshDatabase; // Disabled - data persists

abstract class TestCase extends BaseTestCase
{
    // use RefreshDatabase; // Disabled - data persists

    protected function setUp(): void
    {
        parent::setUp();

        // Only seed if database is empty
        if (\App\Models\User::count() === 0) {
            $this->seed();
        }
    }
}
