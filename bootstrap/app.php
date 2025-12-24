<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Register role middleware
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
        'throttle.api' => \App\Http\Middleware\CustomThrottleRequests::class.':120,1',
        'throttle.searches' => \App\Http\Middleware\CustomThrottleRequests::class.':30,1',
        'throttle.uploads' => \App\Http\Middleware\CustomThrottleRequests::class.':10,1',
        'throttle.data-heavy' => \App\Http\Middleware\CustomThrottleRequests::class.':50,1',
        ]);

        // Exempt API authentication endpoints from CSRF protection
        $middleware->validateCsrfTokens(except: [
            'api/login',
            'api/logout',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Http\Exceptions\ThrottleRequestsException $e, $request) {
            // For API requests, return custom JSON response
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'message' => 'Too many requests. Please try again later.',
                    'error' => 'rate_limit_exceeded',
                    'retry_after' => $e->getHeaders()['Retry-After'] ?? 60,
                ], 429, $e->getHeaders());
            }

            // For web requests (non-Inertia), return custom HTML page
            if (!$request->header('X-Inertia')) {
                return response()->view('errors.429', [
                    'message' => 'Too many requests. Please try again later.',
                    'retry_after' => $e->getHeaders()['Retry-After'] ?? 60,
                ], 429)->withHeaders($e->getHeaders());
            }
        });
    })->create();
