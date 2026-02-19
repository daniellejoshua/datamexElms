<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SuperAdminDashboardController extends Controller
{
    public function index(Request $request)
    {
        // System statistics
        $stats = [
            'total_users' => User::count(),
            'active_sessions' => DB::table('sessions')->count(),
            'database_size' => $this->getDatabaseSize(),
            'system_health' => $this->getSystemHealth(),
        ];

        // Recent user activity
        $recentUsers = User::with(['student', 'teacher'])
            ->latest('updated_at')
            ->limit(10)
            ->get();

        // User role distribution
        $roleDistribution = User::select('role', DB::raw('count(*) as count'))
            ->groupBy('role')
            ->get()
            ->keyBy('role');

        return Inertia::render('SuperAdmin/Dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
            'roleDistribution' => $roleDistribution,
        ]);
    }

    private function getDatabaseSize()
    {
        try {
            $size = DB::select('
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            ');

            return $size[0]->size_mb ?? 0;
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    private function getSystemHealth()
    {
        $health = [];

        // Database connectivity
        try {
            DB::connection()->getPdo();
            $health['database'] = 'online';
        } catch (\Exception $e) {
            $health['database'] = 'offline';
        }

        // Storage space
        $health['storage'] = disk_free_space(storage_path()) > 1024 * 1024 * 100 ? 'healthy' : 'low';

        // Memory usage
        $health['memory'] = memory_get_usage(true) < 128 * 1024 * 1024 ? 'healthy' : 'high';

        return $health;
    }

    public function users(Request $request)
    {
        // Query Users with role head_teacher and eager-load the teacher profile (may be null)
        $query = \App\Models\User::where('role', 'head_teacher')->with('teacher');

        // Apply search filter (user name/email OR teacher fields)
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%')
                    ->orWhereHas('teacher', function ($t) use ($search) {
                        $t->where('first_name', 'like', '%'.$search.'%')
                          ->orWhere('last_name', 'like', '%'.$search.'%')
                          ->orWhere('department', 'like', '%'.$search.'%')
                          ->orWhere('employee_number', 'like', '%'.$search.'%');
                    });
            });
        }

        // Status filter (falls back to 'active' when teacher profile is missing)
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->whereHas('teacher', function ($t) use ($request) {
                $t->where('status', $request->status);
            });
        }

        // Department filter applies only when teacher profile exists
        if ($request->has('department') && $request->department && $request->department !== 'all') {
            $query->whereHas('teacher', function ($t) use ($request) {
                $t->where('department', $request->department);
            });
        }

        $headTeachers = $query->orderBy('name')->paginate(15)->withQueryString();

        // Departments available from teacher profiles
        $departments = \App\Models\Teacher::whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values();

        return Inertia::render('SuperAdmin/Users', [
            'teachers' => $headTeachers,
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'department']),
        ]);
    }

    public function systemLogs(Request $request)
    {
        $logs = DB::table('sessions')
            ->join('users', 'sessions.user_id', '=', 'users.id')
            ->select('users.name', 'users.email', 'users.role', 'sessions.ip_address', 'sessions.last_activity')
            ->orderBy('sessions.last_activity', 'desc')
            ->paginate(50);

        return Inertia::render('SuperAdmin/SystemLogs', [
            'logs' => $logs,
        ]);
    }
}
