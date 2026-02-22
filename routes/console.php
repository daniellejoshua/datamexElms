<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule audit log cleanup to run monthly
Schedule::command('audit:cleanup --days=365')
    ->monthly()
    ->name('audit-cleanup')
    ->description('Clean up audit logs older than 1 year');

// Schedule announcement publishing to run every minute
Schedule::command('announcements:publish-scheduled')
    ->everyMinute()
    ->name('publish-scheduled-announcements')
    ->description('Publish scheduled announcements and handle expired ones');

// when the machine has connectivity, push any offline changes to the cloud
Schedule::command('sync:push')
    ->everyMinute()
    ->name('sync-push')
    ->description('Push pending offline records up to the cloud instance');
