<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

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
            'password' => 'required|string|min:8',
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        try {
            // Handle profile picture upload (if provided)
            $profilePictureUrl = null;
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $cloudinaryResponse = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'teachers/profile-pictures',
                    'public_id' => 'headteacher_'.time().'_'.uniqid(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $cloudinaryResponse['secure_url'] ?? null;
            }

            // create user account with provided password
            $user = User::create([
                'name' => trim($validated['first_name'].' '.(($validated['middle_name'] ?? null) ? ($validated['middle_name'].' ') : '').$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'head_teacher',
            ]);

            // ensure employee_number is set on user
            $user->update(['employee_number' => $user->formatted_employee_number]);

            // create teacher record linked to user
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_number' => $user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'department' => $validated['department'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'hire_date' => $validated['hire_date'] ?? null,
                'status' => $validated['status'] ?? 'active',
                'profile_picture' => $profilePictureUrl,
            ]);

            return redirect()->route('superadmin.users')->with('success', 'Head Teacher created successfully.');
        } catch (\Exception $e) {
            Log::error('Failed creating head teacher', ['error' => $e->getMessage(), 'data' => $validated]);

            return back()->withErrors(['error' => 'Failed to create head teacher.'])->withInput();
        }
    }

    public function show(User $user)
    {
        if ($user->role !== 'head_teacher') {
            abort(404);
        }

        $user->load('teacher');

        return Inertia::render('SuperAdmin/HeadTeachers/Show', [
            'user' => $user,
            'teacher' => $user->teacher,
        ]);
    }

    public function edit(User $user)
    {
        if ($user->role !== 'head_teacher') {
            abort(404);
        }

        $user->load('teacher');

        return Inertia::render('SuperAdmin/HeadTeachers/Edit', [
            'user' => $user,
            'teacher' => $user->teacher,
        ]);
    }

    public function update(Request $request, User $user)
    {
        if ($user->role !== 'head_teacher') {
            abort(404);
        }

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => ['required','email','max:255', Rule::unique('users','email')->ignore($user->id)],
            'password' => 'nullable|string|min:8',
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'nullable|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        try {
            // Update user
            $user->update([
                'name' => trim($validated['first_name'].' '.(($validated['middle_name'] ?? null) ? ($validated['middle_name'].' ') : '').$validated['last_name']),
                'email' => $validated['email'],
            ]);

            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            // Handle profile picture upload for teacher profile
            $profilePictureUrl = $user->teacher->profile_picture ?? null;
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $cloudinaryResponse = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'teachers/profile-pictures',
                    'public_id' => 'headteacher_'.time().'_'.uniqid(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $cloudinaryResponse['secure_url'] ?? $profilePictureUrl;
            }

            // Update or create teacher profile
            $teacher = $user->teacher ?? new Teacher(['user_id' => $user->id]);
            $teacher->first_name = $validated['first_name'];
            $teacher->last_name = $validated['last_name'];
            $teacher->middle_name = $validated['middle_name'] ?? null;
            $teacher->department = $validated['department'] ?? $teacher->department;
            $teacher->specialization = $validated['specialization'] ?? $teacher->specialization;
            $teacher->hire_date = $validated['hire_date'] ?? $teacher->hire_date;
            $teacher->status = $validated['status'] ?? $teacher->status ?? 'active';
            $teacher->profile_picture = $profilePictureUrl;
            $teacher->save();

            return redirect()->route('superadmin.users')->with('success', 'Head Teacher updated successfully.');
        } catch (\Exception $e) {
            Log::error('Failed updating head teacher', ['error' => $e->getMessage(), 'data' => $validated]);

            return back()->withErrors(['error' => 'Failed to update head teacher.'])->withInput();
        }
    }

    public function destroy(User $user)
    {
        if ($user->role !== 'head_teacher') {
            abort(404);
        }

        try {
            $user->teacher?->delete();
            $user->delete();

            return redirect()->route('superadmin.users')->with('success', 'Head Teacher removed.');
        } catch (\Exception $e) {
            Log::error('Failed deleting head teacher', ['error' => $e->getMessage(), 'user_id' => $user->id]);

            return back()->withErrors(['error' => 'Failed to delete head teacher.']);
        }
    }
}
