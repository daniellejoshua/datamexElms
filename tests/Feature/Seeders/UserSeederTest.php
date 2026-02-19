<?php

use App\Models\User;

it('creates a super admin when the UserSeeder runs', function () {
    // Ensure the user does not already exist
    User::where('email', 'superadmin@datamex.edu')->delete();

    // Run the seeder directly
    (new \Database\Seeders\UserSeeder)->run();

    $user = User::where('email', 'superadmin@datamex.edu')->first();

    expect($user)->not->toBeNull();
    expect($user->role)->toBe('super_admin');
    expect($user->is_active)->toBe(1);
    expect($user->email_verified_at)->not->toBeNull();
});
