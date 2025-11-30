<?php

namespace App\Console\Commands;

use App\Models\AuditLog;
use Illuminate\Console\Command;

class CleanupAuditLogs extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'audit:cleanup 
                           {--days=365 : Number of days to keep audit logs} 
                           {--dry-run : Show what would be deleted without actually deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up old audit logs to maintain database performance';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $days = (int) $this->option('days');
        $dryRun = $this->option('dry-run');
        
        if ($days < 90) {
            $this->error('Minimum retention period is 90 days for compliance.');
            return 1;
        }

        $this->info("Cleaning up audit logs older than {$days} days...");
        
        $query = AuditLog::olderThan($days);
        $count = $query->count();
        
        if ($count === 0) {
            $this->info('No audit logs found for cleanup.');
            return 0;
        }

        if ($dryRun) {
            $this->warn("DRY RUN: Would delete {$count} audit log entries.");
            
            // Show breakdown by event type
            $breakdown = AuditLog::olderThan($days)
                ->selectRaw('event, COUNT(*) as count')
                ->groupBy('event')
                ->pluck('count', 'event');
                
            $this->table(['Event', 'Count'], $breakdown->map(function ($count, $event) {
                return [$event, $count];
            })->toArray());
            
            return 0;
        }

        if (!$this->confirm("Are you sure you want to delete {$count} audit log entries?")) {
            $this->info('Cleanup cancelled.');
            return 0;
        }

        $deleted = $query->delete();
        
        $this->info("Successfully deleted {$deleted} audit log entries.");
        return 0;
    }
}
