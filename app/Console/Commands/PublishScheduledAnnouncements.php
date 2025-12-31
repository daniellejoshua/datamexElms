<?php

namespace App\Console\Commands;

use App\Models\Announcement;
use Illuminate\Console\Command;

class PublishScheduledAnnouncements extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'announcements:publish-scheduled';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Publish scheduled announcements and handle expired ones';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔄 Checking for scheduled announcements to publish...');

        // Publish scheduled announcements
        $scheduledToPublish = Announcement::where('is_published', false)
            ->where('is_archived', false)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        if ($scheduledToPublish->count() > 0) {
            $this->info("📅 Found {$scheduledToPublish->count()} scheduled announcements to publish:");
            $publishedCount = 0;
            $expiredCount = 0;

            foreach ($scheduledToPublish as $announcement) {
                $announcement->update([
                    'is_published' => true,
                    'published_at' => now(),
                ]);

                // Check if this announcement is already expired
                if ($announcement->expires_at && $announcement->expires_at <= now()) {
                    $announcement->update(['is_archived' => true, 'archived_at' => now()]);
                    $this->line("  ⚡ Published & Archived: '{$announcement->title}' (expired at: {$announcement->expires_at})");
                    $expiredCount++;
                } else {
                    $this->line("  ✅ Published: '{$announcement->title}' (scheduled for: {$announcement->scheduled_at})");
                    $publishedCount++;
                }
            }

            if ($publishedCount > 0) {
                $this->info("✨ Successfully published {$publishedCount} announcements.");
            }
            if ($expiredCount > 0) {
                $this->info("📁 Archived {$expiredCount} announcements that were already expired.");
            }
        } else {
            $this->info('📭 No scheduled announcements to publish.');
        }

        $this->info('⏰ Checking for expired announcements...');

        // Handle expired announcements (just log for now)
        $expiredAnnouncements = Announcement::where('is_published', true)
            ->where('is_archived', false)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        if ($expiredAnnouncements->count() > 0) {
            $this->info("⏰ Found {$expiredAnnouncements->count()} expired announcements:");
            foreach ($expiredAnnouncements as $announcement) {
                $announcement->update(['is_archived' => true, 'archived_at' => now()]);
                $this->line("  📦 Archived: '{$announcement->title}' (expired at: {$announcement->expires_at})");
            }
            $this->info("📁 Successfully archived {$expiredAnnouncements->count()} expired announcements.");
        } else {
            $this->info('✅ No expired announcements found.');
        }

        $this->info('🎉 Announcement publishing check completed successfully!');
    }
}
