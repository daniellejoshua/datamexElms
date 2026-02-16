<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/LoginNew', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $request->authenticate();

        $request->session()->regenerate();

        // Flash a welcome message so the front-end (AuthenticatedLayout) shows
        // a sonner toast after the redirect.
        $redirect = redirect()->intended(route('dashboard', absolute: false))
            ->with('success', "Welcome back, {$request->user()->name}!");

        // For Inertia requests return X-Inertia-Location so the client performs a
        // full page reload and picks up a fresh CSRF token (prevents 419s).
        if ($request->header('X-Inertia')) {
            return $redirect->header('X-Inertia-Location', $redirect->getTargetUrl());
        }

        return $redirect;
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        // Logout the user
        Auth::guard('web')->logout();

        // Invalidate the session
        $request->session()->invalidate();

        // Regenerate the CSRF token
        $request->session()->regenerateToken();

        // Always include X-Inertia-Location on logout so clients will perform a
        // full reload and receive a fresh CSRF meta tag. This is defensive
        // (harmless for non-Inertia clients) and prevents stale-token races.
        return redirect()->route('login')
            ->header('X-Inertia-Location', route('login'));

    }
}
