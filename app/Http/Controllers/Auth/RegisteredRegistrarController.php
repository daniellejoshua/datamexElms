<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Registrar;
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
            'employee_number' => 'required|string|max:255|unique:registrars',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'department' => 'required|string|max:255',
            'position' => 'required|string|max:255',
            'hire_date' => 'required|date',
        ]);

        // Create user account
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'registrar',
        ]);

        // Create registrar profile
        Registrar::create([
            'user_id' => $user->id,
            'employee_number' => $request->employee_number,
            'first_name' => $request->first_name,
            'last_name' => $request->last_name,
            'middle_name' => $request->middle_name,
            'department' => $request->department,
            'position' => $request->position,
            'hire_date' => $request->hire_date,
        ]);

        event(new Registered($user));

        Auth::login($user);

        return redirect(route('registrar.dashboard', absolute: false));
    }
}
