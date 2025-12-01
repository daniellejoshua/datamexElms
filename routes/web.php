<?php

<<<<<<< Updated upstream
=======
use App\Http\Controllers\Admin\AcademicYearController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ClassScheduleController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\BulkStudentController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Registrar\EnrollmentController;
use App\Http\Controllers\Registrar\PaymentController;
use App\Http\Controllers\Student\StudentDashboardController;
use Illuminate\Foundation\Application;
>>>>>>> Stashed changes
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome');
});
<<<<<<< Updated upstream
=======

Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', [StudentDashboardController::class, 'index'])->name('student.dashboard');
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

// Registrar Routes
Route::middleware(['auth', 'verified', 'role:admin,registrar'])->prefix('registrar')->name('registrar.')->group(function () {
    // Enrollment Management
    Route::resource('enrollments', EnrollmentController::class);
    Route::get('students/search', [EnrollmentController::class, 'search'])->name('students.search');
    Route::post('students/{student}/enroll', [EnrollmentController::class, 'enrollExisting'])->name('students.enroll-existing');
    
    // Bulk Student Management
    Route::get('bulk-students', [BulkStudentController::class, 'index'])->name('bulk-students.index');
    Route::post('bulk-students/upload', [BulkStudentController::class, 'uploadCsv'])->name('bulk-students.upload');
    Route::get('bulk-students/template', [BulkStudentController::class, 'downloadTemplate'])->name('bulk-students.template');
    
    // Payment Management
    Route::resource('payments', PaymentController::class)->only(['index', 'show', 'store']);
    Route::get('students/{student}/payments', [PaymentController::class, 'show'])->name('students.payments');
    Route::get('payments/{payment}/details', [PaymentController::class, 'showPayment'])->name('payments.show');
    Route::post('payments/{payment}/record', [PaymentController::class, 'recordPayment'])->name('payments.record');
    Route::get('payments/report', [PaymentController::class, 'report'])->name('payments.report');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
>>>>>>> Stashed changes
