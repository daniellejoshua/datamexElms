<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Student;
use App\Models\AuditLog;
use App\Models\StudentEnrollment;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redis;

class SchoolHealthCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:health
                           {--detailed : Show detailed metrics}
                           {--alerts : Show performance alerts only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Health check and performance monitoring for large school (5K+ students)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $detailed = $this->option('detailed');
        $alertsOnly = $this->option('alerts');
        
        if (!$alertsOnly) {
            $this->info('🏫 ELMS Health Check - Large School Operations (5K+ Students)');
            $this->newLine();
        }
        
        // Student and user metrics
        $totalStudents = Student::count();
        $activeStudents = StudentEnrollment::where('status', 'active')
            ->distinct('student_id')
            ->count();
        $totalUsers = User::count();
        $activeSessions = DB::table('sessions')->count();
        
        if (!$alertsOnly) {
            $this->info('👥 User Metrics:');
            $this->table(['Metric', 'Count', 'Status'], [
                ['Total Students', number_format($totalStudents), $this->getStatusIcon($totalStudents, 5000)],
                ['Active Students', number_format($activeStudents), $this->getStatusIcon($activeStudents, 3000)],
                ['Total Users', number_format($totalUsers), $this->getStatusIcon($totalUsers, 500)],
                ['Active Sessions', number_format($activeSessions), $this->getStatusIcon($activeSessions, 1000, true)],
            ]);
        }
        
        // Database performance metrics
        $auditLogs = DB::table('audit_logs')->count();
        $gradeVersions = DB::table('grade_versions')->count();
        $studentGrades = DB::table('student_grades')->count();
        $shsGrades = DB::table('shs_student_grades')->count();
        
        if ($detailed || !$alertsOnly) {
            $this->newLine();
            $this->info('📊 Database Metrics:');
            $this->table(['Table', 'Records', 'Status'], [
                ['Audit Logs', number_format($auditLogs), $this->getDbStatusIcon($auditLogs, 100000)],
                ['Grade Versions', number_format($gradeVersions), $this->getDbStatusIcon($gradeVersions, 50000)],
                ['Student Grades', number_format($studentGrades), '✅'],
                ['SHS Grades', number_format($shsGrades), '✅'],
                ['Student Enrollments', number_format(DB::table('student_enrollments')->count()), '✅'],
            ]);
        }
        
        // Performance alerts
        $alerts = [];
        
        if ($auditLogs > 100000) {
            $alerts[] = ["⚠️ Large audit log table ({$auditLogs} records)", "Run: php artisan enterprise:cleanup"];
        }
        
        if ($gradeVersions > 50000) {
            $alerts[] = ["⚠️ Large grade versions table ({$gradeVersions} records)", "Run: php artisan grades:cleanup-versions"];
        }
        
        if ($activeSessions > 1500) {
            $alerts[] = ["⚠️ High session count ({$activeSessions} sessions)", "Monitor server resources"];
        }
        
        if ($totalStudents > 6000) {
            $alerts[] = ["📈 Very high student count ({$totalStudents} students)", "Consider scaling infrastructure"];
        }
        
        // Redis connection check
        try {
            Redis::ping();
            $redisStatus = '✅ Connected';
        } catch (\Exception $e) {
            $redisStatus = '❌ Disconnected';
            $alerts[] = ["❌ Redis connection failed", "Check Redis server status"];
        }
        
        if ($detailed && !$alertsOnly) {
            $this->newLine();
            $this->info('🔧 System Status:');
            $this->table(['Component', 'Status'], [
                ['Database', '✅ Connected'],
                ['Redis Cache', $redisStatus],
                ['Queue System', $this->checkQueueStatus()],
                ['Session Storage', 'Redis'],
                ['Environment', config('app.env')],
            ]);
        }
        
        // Show alerts
        if (!empty($alerts)) {
            $this->newLine();
            $this->warn('🚨 Performance Alerts:');
            $this->table(['Alert', 'Recommendation'], $alerts);
        } elseif (!$alertsOnly) {
            $this->newLine();
            $this->info('✅ All systems operating within normal parameters');
        }
        
        if (!$alertsOnly) {
            $this->newLine();
            $this->comment('💡 Run with --alerts to show only performance warnings');
            $this->comment('💡 Run with --detailed for comprehensive system information');
        }
        
        return empty($alerts) ? 0 : 1;
    }
    
    private function getStatusIcon(int $count, int $threshold, bool $reverse = false): string
    {
        if ($reverse) {
            return $count > $threshold ? '⚠️' : '✅';
        }
        return $count >= $threshold ? '✅' : '📈';
    }
    
    private function getDbStatusIcon(int $count, int $warningThreshold): string
    {
        if ($count > $warningThreshold * 2) {
            return '🔴';
        } elseif ($count > $warningThreshold) {
            return '🟡';
        }
        return '✅';
    }
    
    private function checkQueueStatus(): string
    {
        try {
            $failedJobs = DB::table('failed_jobs')->count();
            return $failedJobs > 10 ? "⚠️ {$failedJobs} failed jobs" : '✅ Running';
        } catch (\Exception $e) {
            return '❌ Error checking';
        }
    }
}
