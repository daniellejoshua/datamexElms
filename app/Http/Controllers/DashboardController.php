<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request): RedirectResponse
    {
        $user = $request->user();

        // Redirect to appropriate dashboard based on role
        return match ($user->role) {
            'student' => redirect()->route('student.dashboard'),
            'teacher' => redirect()->route('teacher.dashboard'),
            'registrar' => redirect()->route('registrar.dashboard'),
            'head_teacher', 'super_admin' => redirect()->route('admin.dashboard'),
            default => redirect()->route('login'),
        };
    }
}
