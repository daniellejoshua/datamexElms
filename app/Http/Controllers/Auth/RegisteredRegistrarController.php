<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredRegistrarController extends Controller
{
    /**
     * Display the registrar registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/RegistrarRegister');
    }

    /**
     * Handle an incoming registrar registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ]);

        // Create user account with registrar role
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'registrar',
            'is_active' => true,
        ]);

        // Set formatted employee number
        $user->update([
            'employee_number' => $user->formatted_employee_number,
        ]);

        event(new Registered($user));

        Auth::login($user);

        $redirect = redirect(route('registrar.dashboard', absolute: false))
            ->with('success', "Welcome, {$user->name}!");

        if ($request->header('X-Inertia')) {
            return $redirect->header('X-Inertia-Location', $redirect->getTargetUrl());
        }

        return $redirect;
    }
}
