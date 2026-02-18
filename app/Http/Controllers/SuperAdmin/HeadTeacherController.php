<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

class HeadTeacherController extends Controller
{
    /**
     * Store a new head teacher (creates User + Teacher record).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => ['required','email','max:255', Rule::unique('users','email')],
            'department' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
        ]);

        try {
            // create user account
            $user = User::create([
                'name' => trim($validated['first_name'].' '.(($validated['middle_name'] ?? null) ? ($validated['middle_name'].' ') : '').$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make('password123'),
                'role' => 'head_teacher',
            ]);

            // ensure employee_number is set on user (uses existing accessor on User)
            $user->update(['employee_number' => $user->formatted_employee_number]);

            // create teacher record linked to user
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_number' => $user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'department' => $validated['department'] ?? null,
                'hire_date' => $validated['hire_date'] ?? null,
                'status' => $validated['status'],
            ]);

            return redirect()->route('superadmin.users')->with('success', 'Head Teacher created successfully. Default password: password123');
        } catch (\Exception $e) {
            Log::error('Failed creating head teacher', ['error' => $e->getMessage(), 'data' => $validated]);

            return back()->withErrors(['error' => 'Failed to create head teacher.'])->withInput();
        }
    }
}
