<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\ArchivedStudentEnrollment;
use App\Observers\ArchivedStudentEnrollmentObserver;

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
    }
}
