<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(LoginRequest $request): JsonResponse
    {
        $request->authenticate();

        $user = Auth::user();
        $request->session()->regenerate();

        return response()->json([
            'user' => $user,
            'role' => $user->role,
            'abilities' => $this->getUserAbilities($user->role),
            'message' => 'Login successful',
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'user' => $user,
            'role' => $user->role,
            'abilities' => $this->getUserAbilities($user->role),
        ]);
    }

    protected function getUserAbilities(string $role): array
    {
        return match ($role) {
            'super_admin' => [
                'system:full-access',
                'database:manage',
                'users:manage-all',
                'maintenance:perform',
                'logs:view',
                'backups:manage',
                'settings:modify',
                'security:audit',
            ],
            'head_teacher' => [
                'announcements:create',
                'announcements:update',
                'announcements:delete',
                'teachers:manage',
                'grades:view-all',
                'students:manage',
                'system:admin',
            ],
            'registrar' => [
                'students:create',
                'students:update',
                'enrollments:manage',
                'payments:manage',
                'grades:view-all',
                'transcripts:generate',
                'academic-records:manage',
            ],
            'teacher' => [
                'grades:create',
                'grades:update',
                'grades:view-assigned',
                'materials:upload',
                'students:view-assigned',
                'sections:view-assigned',
            ],
            'student' => [
                'grades:view-own',
                'materials:download',
                'announcements:read',
                'payments:view-own',
            ],
            default => []
        };
    }
}
