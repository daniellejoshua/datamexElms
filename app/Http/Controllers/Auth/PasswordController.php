<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\PasswordResetPin;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    /**
     * Update the user's password.
     */
    public function update(Request $request): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', Password::defaults(), 'confirmed'],
        ]);

        $user = $request->user();

        // Generate 6-digit PIN
        $pin = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Store PIN in cache for 10 minutes
        Cache::put("password_reset_pin_{$user->id}", $pin, now()->addMinutes(10));

        // Store the new password temporarily
        Cache::put("password_reset_data_{$user->id}", [
            'password' => Hash::make($validated['password']),
            'expires_at' => now()->addMinutes(10),
        ], now()->addMinutes(10));

        // Send PIN via email
        Mail::to($user->email)->send(new PasswordResetPin($pin));

        // Store PIN requirement in session
        session([
            'requires_pin' => true,
            'pin_message' => 'A 6-digit PIN has been sent to your email. Please enter it to confirm the password change.',
        ]);

        // Return redirect with success message
        return back()->with('status', 'pin-sent');
    }

    /**
     * Verify PIN and complete password update.
     */
    public function verifyPin(Request $request): RedirectResponse
    {
        $request->validate([
            'pin' => ['required', 'digits:6'],
        ]);

        $user = $request->user();
        $cachedPin = Cache::get("password_reset_pin_{$user->id}");
        $passwordData = Cache::get("password_reset_data_{$user->id}");

        if (! $cachedPin || ! $passwordData) {
            return back()->withErrors([
                'pin' => 'PIN has expired. Please try updating your password again.',
            ]);
        }

        if ($cachedPin !== $request->pin) {
            return back()->withErrors([
                'pin' => 'Invalid PIN. Please check your email and try again.',
            ]);
        }

        // Update the password
        $user->update([
            'password' => $passwordData['password'],
        ]);

        // Clear the cached data
        Cache::forget("password_reset_pin_{$user->id}");
        Cache::forget("password_reset_data_{$user->id}");

        // Clear session data
        session()->forget(['requires_pin', 'pin_message']);

        return back()->with('success', 'Password updated successfully!');
    }
}
