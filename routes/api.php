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

    // Student check route for registrars
    Route::get('/students/check/{student_number}', function ($studentNumber) {
        $student = \App\Models\Student::with(['user', 'program'])
            ->where('student_number', $studentNumber)
            ->first();

        if ($student) {
            return response()->json([
                'exists' => true,
                'student' => [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'email' => $student->user->email,
                    'student_number' => $student->student_number,
                    'year_level' => $student->current_year_level,
                    'program' => $student->program,
                    'education_level' => $student->education_level,
                ],
            ]);
        }

        return response()->json(['exists' => false]);
    })->middleware('role:registrar');
});
