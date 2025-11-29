<?php

use App\Http\Controllers\Test;
use Illuminate\Notifications\RoutesNotifications;
use Illuminate\Support\Facades\Route;
use PHPUnit\Metadata\Group;

// Grouped routes with middleware (e.g., auth:sanctum)
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });
});

route::apiResource('/test', Test::class);