<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RegistrarController extends Controller
{
    public function __construct()
    {
        $this->middleware('throttle:60,1')->only(['index']);
    }

    public function index(Request $request): Response
    {
        $query = User::where('role', 'registrar');

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhere('employee_number', 'like', '%'.$search.'%');
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('is_active', $request->status === 'active');
        }

        $registrars = $query->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Registrars/Index', [
            'registrars' => $registrars,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Registrars/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
        ]);

        try {
            // Create user account
            $user = User::create([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make('password123'), // Default password
                'role' => 'registrar',
                'is_active' => true,
            ]);

            // Set formatted employee number
            $user->update([
                'employee_number' => $user->formatted_employee_number,
            ]);

            Log::info('Registrar created successfully', [
                'user_id' => $user->id,
                'created_by' => auth()->id(),
            ]);

            return redirect()->route('admin.registrars.index')
                ->with('success', 'Registrar created successfully');

        } catch (\Exception $e) {
            Log::error('Failed to create registrar', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Oops! Something went wrong while creating the registrar account. Please double-check your details and try again.']);
        }
    }

    public function show(User $user): Response
    {
        // Ensure this is a registrar
        if ($user->role !== 'registrar') {
            abort(404);
        }

        return Inertia::render('Admin/Registrars/Show', [
            'registrar' => $user,
        ]);
    }

    public function edit(User $user): Response
    {
        // Ensure this is a registrar
        if ($user->role !== 'registrar') {
            abort(404);
        }

        return Inertia::render('Admin/Registrars/Edit', [
            'registrar' => $user,
        ]);
    }

    public function update(Request $request, User $user)
    {
        // Ensure this is a registrar
        if ($user->role !== 'registrar') {
            abort(404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($user->id)],
            'is_active' => 'required|boolean',
        ]);

        try {
            // Update user account
            $user->update([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
                'is_active' => $validated['is_active'],
            ]);

            Log::info('Registrar updated successfully', [
                'user_id' => $user->id,
                'updated_by' => auth()->id(),
            ]);

            return redirect()->route('admin.registrars.show', $user->id)
                ->with('success', 'Registrar updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update registrar', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Failed to update registrar. Please try again.']);
        }
    }

    public function destroy(User $user)
    {
        // Ensure this is a registrar
        if ($user->role !== 'registrar') {
            abort(404);
        }

        try {
            // Check if registrar has any active responsibilities
            // For now, we'll allow deletion but this could be expanded

            // Delete the user account
            $user->delete();

            Log::info('Registrar deleted successfully', [
                'user_id' => $user->id,
                'deleted_by' => auth()->id(),
            ]);

            return redirect()->route('admin.registrars.index')
                ->with('success', 'Registrar deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to delete registrar', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete registrar. Please try again.']);
        }
    }
}
