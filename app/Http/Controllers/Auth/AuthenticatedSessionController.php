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

        // If the user was attempting to visit an admin URL prior to logging in
        // (stored in the session as the "intended" URL), prefer a role-
        // appropriate dashboard instead of blindly returning them to the
        // previously intended admin page. This prevents a super admin who
        // authenticates from being sent to the head-teacher/admin dashboard.
        $intended = $request->session()->get('url.intended');

        if ($intended && str_starts_with($intended, url('/admin')) && $request->user()->role === 'super_admin') {
            // Clear the intended so redirect()->intended won't use it
            $request->session()->forget('url.intended');

            $targetUrl = route('superadmin.dashboard', absolute: false);
            $redirect = redirect($targetUrl)->with('success', "Welcome back, {$request->user()->name}!");

            if ($request->header('X-Inertia')) {
                return $redirect->header('X-Inertia-Location', $redirect->getTargetUrl());
            }

            return $redirect;
        }

        // Flash a welcome message so the front-end (AuthenticatedLayout) shows
        // a sonner toast after the redirect. Default behaviour still uses the
        // intended URL when present.
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
