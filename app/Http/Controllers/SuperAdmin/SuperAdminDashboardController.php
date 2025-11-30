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
            $size = DB::select("
                SELECT 
                    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
                FROM information_schema.tables 
                WHERE table_schema = DATABASE()
            ");
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
        $users = User::query()
            ->when($request->search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            })
            ->when($request->role, function ($query, $role) {
                $query->where('role', $role);
            })
            ->with(['student', 'teacher'])
            ->paginate(20);

        return Inertia::render('SuperAdmin/Users', [
            'users' => $users,
            'filters' => $request->only(['search', 'role']),
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
