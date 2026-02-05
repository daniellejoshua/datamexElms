<?php

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;

test('password update sends PIN and requires verification', function () {
    Mail::fake();
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->withoutMiddleware([\Illuminate\Routing\Middleware\ThrottleRequests::class, \App\Http\Middleware\CustomThrottleRequests::class])
        ->put('/password', [
            'current_password' => 'password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertRedirect()
        ->assertSessionHas('requires_pin', true)
        ->assertSessionHas('pin_message');

    // Check that PIN was stored in cache
    expect(Cache::has("password_reset_pin_{$user->id}"))->toBeTrue();
    expect(Cache::has("password_reset_data_{$user->id}"))->toBeTrue();

    // Check that email was sent
    Mail::assertSent(\App\Mail\PasswordResetPin::class, function ($mail) use ($user) {
        return $mail->hasTo($user->email);
    });
});

test('PIN verification completes password update', function () {
    $user = User::factory()->create();
    $pin = '123456';

    // Simulate PIN being stored
    Cache::put("password_reset_pin_{$user->id}", $pin, now()->addMinutes(10));
    Cache::put("password_reset_data_{$user->id}", [
        'password' => Hash::make('new-password'),
        'expires_at' => now()->addMinutes(10),
    ], now()->addMinutes(10));

    $response = $this
        ->actingAs($user)
        ->withoutMiddleware([\Illuminate\Routing\Middleware\ThrottleRequests::class, \App\Http\Middleware\CustomThrottleRequests::class])
        ->post('/password/verify-pin', [
            'pin' => $pin,
        ]);

    $response
        ->assertRedirect()
        ->assertSessionHas('success', 'Password updated successfully!');

    // Check that password was updated
    $this->assertTrue(Hash::check('new-password', $user->refresh()->password));

    // Check that cache was cleared
    expect(Cache::has("password_reset_pin_{$user->id}"))->toBeFalse();
    expect(Cache::has("password_reset_data_{$user->id}"))->toBeFalse();

    // Check that session data was cleared
    expect(session()->has('requires_pin'))->toBeFalse();
    expect(session()->has('pin_message'))->toBeFalse();
});

test('invalid PIN fails verification', function () {
    $user = User::factory()->create();

    // Simulate PIN being stored
    Cache::put("password_reset_pin_{$user->id}", '123456', now()->addMinutes(10));
    Cache::put("password_reset_data_{$user->id}", [
        'password' => Hash::make('new-password'),
        'expires_at' => now()->addMinutes(10),
    ], now()->addMinutes(10));

    $response = $this
        ->actingAs($user)
        ->withoutMiddleware([\Illuminate\Routing\Middleware\ThrottleRequests::class, \App\Http\Middleware\CustomThrottleRequests::class])
        ->post('/password/verify-pin', [
            'pin' => '999999', // Wrong PIN
        ]);

    $response
        ->assertRedirect()
        ->assertSessionHasErrors('pin', 'Invalid PIN. Please check your email and try again.');

    // Check that password was NOT updated
    $this->assertFalse(Hash::check('new-password', $user->refresh()->password));
});

test('correct password must be provided to initiate password update', function () {
    $user = User::factory()->create();

    $response = $this
        ->actingAs($user)
        ->withoutMiddleware([\Illuminate\Routing\Middleware\ThrottleRequests::class, \App\Http\Middleware\CustomThrottleRequests::class])
        ->put('/password', [
            'current_password' => 'wrong-password',
            'password' => 'new-password',
            'password_confirmation' => 'new-password',
        ]);

    $response
        ->assertRedirect()
        ->assertSessionHasErrors('current_password');
});
