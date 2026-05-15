<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Auth\EmailVerificationRequest;
use Illuminate\Http\RedirectResponse;

class VerifyEmailController extends Controller
{
    /**
     * Mark the authenticated user's email address as verified.
     */
    public function __invoke(EmailVerificationRequest $request): RedirectResponse
    {
        $redirect = redirect()->intended(route('dashboard', absolute: false).'?verified=1');

        if ($request->user()->hasVerifiedEmail()) {
            // already verified — still show a friendly toast
            $redirect->with('success', 'Your email is already verified.');

            if ($request->header('X-Inertia')) {
                return $redirect->header('X-Inertia-Location', $redirect->getTargetUrl());
            }

            return $redirect;
        }

        if ($request->user()->markEmailAsVerified()) {
            event(new Verified($request->user()));
            $redirect->with('success', 'Email verified — welcome!');
        }

        if ($request->header('X-Inertia')) {
            return $redirect->header('X-Inertia-Location', $redirect->getTargetUrl());
        }

        return $redirect;
    }
}
