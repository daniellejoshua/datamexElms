<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Public authentication routes with session support
Route::middleware('web')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes with web session authentication
Route::middleware(['web', 'auth:web'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (\Illuminate\Http\Request $request) {
        return $request->user();
    });
});
