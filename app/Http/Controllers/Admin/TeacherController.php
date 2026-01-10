<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Teacher::with('user')
            ->withCount(['sectionSubjects as active_subjects_count' => function ($query) {
                $query->active();
            }]);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%'.$search.'%')
                    ->orWhere('last_name', 'like', '%'.$search.'%')
                    ->orWhere('middle_name', 'like', '%'.$search.'%')
                    ->orWhere('department', 'like', '%'.$search.'%')
                    ->orWhere('specialization', 'like', '%'.$search.'%')
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('email', 'like', '%'.$search.'%')
                            ->orWhere('employee_number', 'like', '%'.$search.'%');
                    });
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply department filter
        if ($request->has('department') && $request->department && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        $teachers = $query->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(15)
            ->withQueryString();

        // Get unique departments for filter dropdown
        $departments = Teacher::whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values();

        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => $teachers,
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'department']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Teachers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        try {
            // Handle profile picture upload
            $profilePictureUrl = null;
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $cloudinaryResponse = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'teachers/profile-pictures',
                    'public_id' => 'teacher_'.time().'_'.uniqid(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $cloudinaryResponse['secure_url'];
            }

            // Create user account
            $user = User::create([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make('password123'), // Default password
                'role' => 'teacher',
            ]);

            // Set formatted employee number
            $user->update([
                'employee_number' => $user->formatted_employee_number,
            ]);

            // Create teacher record
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_number' => $user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'department' => $validated['department'],
                'specialization' => $validated['specialization'],
                'hire_date' => $validated['hire_date'],
                'status' => $validated['status'],
                'profile_picture' => $profilePictureUrl,
            ]);

            Log::info('Teacher created successfully', [
                'teacher_id' => $teacher->id,
                'user_id' => $user->id,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('success', 'Teacher created successfully');

        } catch (\Exception $e) {
            Log::error('Failed to create teacher', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Oops! Something went wrong while creating the teacher account. Please double-check your details and try again.']);
        }
    }

    public function show(Teacher $teacher): Response
    {
        $teacher->load([
            'user',
            'sectionSubjects' => function ($query) {
                $query->with(['subject', 'section' => function ($sectionQuery) {
                    $sectionQuery->with(['program', 'studentEnrollments.student.user']);
                }, 'classSchedules'])
                    ->active()
                    ->orderBy('created_at', 'desc');
            },
        ]);

        return Inertia::render('Admin/Teachers/Show', [
            'teacher' => $teacher,
        ]);
    }

    public function edit(Teacher $teacher): Response
    {
        $teacher->load('user');

        Log::info('Teacher edit data:', $teacher->toArray());

        return Inertia::render('Admin/Teachers/Edit', [
            'teacher' => $teacher,
        ]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        Log::info('Teacher update method called for teacher '.$teacher->id);

        Log::info('Teacher update request data:', $request->all());
        Log::info('Teacher update files:', $request->allFiles());
        Log::info('Teacher update method: '.$request->method());
        Log::info('Teacher update headers:', $request->headers->all());

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($teacher->user_id)],
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        try {
            // Handle profile picture upload
            $profilePictureUrl = $teacher->profile_picture; // Keep existing if no new upload
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $uploadResult = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'datamex_elms/teachers',
                    'public_id' => 'teacher_'.$teacher->id.'_'.time(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $uploadResult['secure_url'];
            }

            // Update user account
            $teacher->user->update([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
            ]);

            // Update teacher record
            $teacher->update([
                'employee_number' => $teacher->user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'department' => $validated['department'],
                'specialization' => $validated['specialization'],
                'hire_date' => $validated['hire_date'],
                'status' => $validated['status'],
                'profile_picture' => $profilePictureUrl,
            ]);

            Log::info('Teacher updated successfully', [
                'teacher_id' => $teacher->id,
                'updated_by' => Auth::id(),
            ]);

            return redirect()->route('admin.teachers.show', $teacher->id)
                ->with('success', 'Teacher updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update teacher', [
                'teacher_id' => $teacher->id,
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Failed to update teacher. Please try again.']);
        }
    }

    public function destroy(Teacher $teacher)
    {
        try {
            // Check if teacher has active assignments
            $activeSections = $teacher->sections()
                ->whereHas('studentEnrollments', function ($query) {
                    $query->where('status', 'active');
                })
                ->count();

            if ($activeSections > 0) {
                return back()->withErrors([
                    'error' => 'Cannot delete teacher with active section assignments. Please reassign sections first.',
                ]);
            }

            // Delete teacher (this will also delete the user due to cascade)
            $teacher->delete();

            Log::info('Teacher deleted successfully', [
                'teacher_id' => $teacher->id,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->route('admin.teachers.index')
                ->with('success', 'Teacher deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to delete teacher', [
                'teacher_id' => $teacher->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete teacher. Please try again.']);
        }
    }

    public function teachersPdf()
    {
        // Get all teachers with their user data
        $teachers = Teacher::with('user')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // Get current date and time in Asia/Manila timezone
        $currentDateTime = now('Asia/Manila')->format('F j, Y g:i A');

        $data = [
            'teachers' => $teachers,
            'currentDateTime' => $currentDateTime,
            'totalTeachers' => $teachers->count(),
        ];

        $pdf = Pdf::loadView('pdf.teachers', $data);

        return $pdf->download('teachers-report-'.now('Asia/Manila')->format('Y-m-d-H-i-s').'.pdf');
    }
}
