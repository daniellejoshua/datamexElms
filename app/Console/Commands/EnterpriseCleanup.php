<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use App\Models\GradeVersion;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class EnterpriseCleanup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'enterprise:cleanup 
                           {--dry-run : Show what would be cleaned without deleting}
                           {--force : Apply database optimizations}
                           {--batch-size=1000 : Number of records to process per batch}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Enterprise-scale cleanup for 5K+ student ELMS';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $force = $this->option('force');
        $batchSize = (int) $this->option('batch-size');

        $this->info('🏫 Starting enterprise cleanup for large school (5K+ students)...');

        // 1. Aggressive audit log cleanup (90 days for performance)
        $auditCutoff = Carbon::now()->subDays(config('app.audit_retention_days', 90));
        $auditCount = AuditLog::where('created_at', '<', $auditCutoff)->count();

        if ($auditCount > 0) {
            $this->warn("📋 Found {$auditCount} audit logs older than 90 days");
            if (! $dryRun) {
                $this->info('Cleaning audit logs in batches...');
                $deleted = 0;

                AuditLog::where('created_at', '<', $auditCutoff)
                    ->orderBy('id')
                    ->chunk($batchSize, function ($logs) use (&$deleted) {
                        $ids = $logs->pluck('id')->toArray();
                        $count = AuditLog::whereIn('id', $ids)->delete();
                        $deleted += $count;
                        $this->comment("Deleted {$count} audit logs...");
                    });

                $this->info("✅ Cleaned {$deleted} audit log entries");
            }
        } else {
            $this->info('✅ No old audit logs to clean');
        }

        // 2. Clean old sessions (> 7 days inactive for performance)
        $sessionCutoff = Carbon::now()->subDays(7)->timestamp;
        $sessionCount = DB::table('sessions')->where('last_activity', '<', $sessionCutoff)->count();

        if ($sessionCount > 0) {
            $this->warn("💻 Found {$sessionCount} inactive sessions older than 7 days");
            if (! $dryRun) {
                $deleted = DB::table('sessions')->where('last_activity', '<', $sessionCutoff)->delete();
                $this->info("✅ Cleaned {$deleted} old sessions");
            }
        } else {
            $this->info('✅ No old sessions to clean');
        }

        // 3. Clean finalized grade versions (keep only last 2 versions per grade)
        $this->info('🔍 Checking finalized grade versions...');

        $finalizedGrades = DB::table('student_grades')
            ->where('status', 'finalized')
            ->where('finalized_at', '<', Carbon::now()->subMonths(6))
            ->pluck('id');

        $totalVersionsCleaned = 0;

        if ($finalizedGrades->isNotEmpty()) {
            $this->info("Processing {$finalizedGrades->count()} finalized grades...");

            foreach ($finalizedGrades as $gradeId) {
                $versionsToKeep = GradeVersion::where('student_grade_id', $gradeId)
                    ->orderByDesc('version_number')
                    ->limit(2)
                    ->pluck('id');

                $oldVersionsQuery = GradeVersion::where('student_grade_id', $gradeId)
                    ->whereNotIn('id', $versionsToKeep);

                $oldVersionsCount = $oldVersionsQuery->count();

                if ($oldVersionsCount > 0 && ! $dryRun) {
                    $oldVersionsQuery->delete();
                    $totalVersionsCleaned += $oldVersionsCount;
                }
            }

            if ($totalVersionsCleaned > 0) {
                $this->info("✅ Cleaned {$totalVersionsCleaned} old grade versions");
            } else {
                $this->info('✅ No old grade versions to clean');
            }
        }

        // 4. Database optimization for high load
        if ($force && ! $dryRun) {
            $this->info('🔧 Optimizing database tables for enterprise performance...');

            $tables = ['audit_logs', 'grade_versions', 'sessions', 'student_grades', 'shs_student_grades'];
            foreach ($tables as $table) {
                try {
                    DB::statement("OPTIMIZE TABLE {$table}");
                    $this->comment("✅ Optimized {$table}");
                } catch (\Exception $e) {
                    $this->error("❌ Failed to optimize {$table}: {$e->getMessage()}");
                }
            }

            $this->info('✅ Database optimization completed');
        }

        // 5. Performance statistics
        $this->newLine();
        $this->info('📊 Current System Statistics:');
        $this->table(['Metric', 'Count'], [
            ['Active Students', number_format(DB::table('students')->count())],
            ['Total Users', number_format(DB::table('users')->count())],
            ['Audit Logs', number_format(DB::table('audit_logs')->count())],
            ['Grade Versions', number_format(DB::table('grade_versions')->count())],
            ['Active Sessions', number_format(DB::table('sessions')->count())],
        ]);

        if ($dryRun) {
            $this->warn('DRY RUN: No actual cleanup performed. Use --force to apply optimizations.');
        } else {
            $this->info('🎉 Enterprise cleanup completed successfully!');
        }

        return 0;
    }
}
