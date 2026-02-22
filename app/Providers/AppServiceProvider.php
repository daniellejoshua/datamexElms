<?php

namespace App\Providers;

use App\Models\ArchivedStudentEnrollment;
use App\Observers\ArchivedStudentEnrollmentObserver;
use App\Observers\StudentObserver;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Register model observers
        ArchivedStudentEnrollment::observe(ArchivedStudentEnrollmentObserver::class);
        \App\Models\Student::observe(StudentObserver::class);

        // forward socket events to external server if running
        Event::listen(\App\Events\PaymentRecorded::class, \App\Listeners\EmitToSocketServer::class);
    }
}
