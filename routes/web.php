<?php

use App\Http\Controllers\Admin\AcademicYearController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ClassScheduleController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboardController;
use App\Http\Controllers\Teacher\GradeController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', [StudentDashboardController::class, 'index'])->name('student.dashboard');
});

// Teacher Routes
Route::middleware(['auth', 'verified', 'role:teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('dashboard');
    
    // Grade Management
    Route::get('/sections/{section}/grades', [GradeController::class, 'show'])->name('grades.show');
    Route::post('/sections/{section}/grades', [GradeController::class, 'updateGrades'])->name('grades.update');
    Route::post('/sections/{section}/grades/import', [GradeController::class, 'importGrades'])->name('grades.import');
    Route::get('/sections/{section}/grades/template', [GradeController::class, 'downloadTemplate'])->name('grades.template');
});

// Admin Routes
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('role:head_teacher,super_admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Section Management
        Route::resource('sections', SectionController::class);
        Route::get('sections/{section}/students', [SectionController::class, 'students'])->name('sections.students');
        Route::post('sections/{section}/enroll', [SectionController::class, 'enrollStudent'])->name('sections.enroll');
        Route::patch('enrollments/{enrollment}/unenroll', [SectionController::class, 'unenrollStudent'])->name('enrollments.unenroll');

        // Subject Scheduling
        Route::get('sections/{section}/subjects', [SectionController::class, 'subjects'])->name('sections.subjects');
        Route::post('sections/{section}/subjects', [SectionController::class, 'attachSubject'])->name('sections.attach-subject');
        Route::patch('sections/{section}/subjects/{subject}', [SectionController::class, 'updateSubject'])->name('sections.update-subject');
        Route::delete('sections/{section}/subjects/{subject}', [SectionController::class, 'detachSubject'])->name('sections.detach-subject');

        // Schedule Management
        Route::resource('schedules', ClassScheduleController::class);

        // Academic Year Management
        Route::get('academic-years', [AcademicYearController::class, 'index'])->name('academic-years.index');
        Route::get('academic-years/{archivedSection}', [AcademicYearController::class, 'show'])->name('academic-years.show');
        Route::post('academic-years/archive', [AcademicYearController::class, 'archiveSemester'])->name('academic-years.archive');
    });
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
