<?php

use App\Http\Controllers\Admin\AcademicYearController;
use App\Http\Controllers\Admin\AdminDashboardController;
use App\Http\Controllers\Admin\ClassScheduleController;
use App\Http\Controllers\Admin\CollegeSectionController;
use App\Http\Controllers\Admin\CollegeSubjectController;
use App\Http\Controllers\Admin\CurriculumController;
use App\Http\Controllers\Admin\ProgramCurriculumController;
use App\Http\Controllers\Admin\SectionController;
use App\Http\Controllers\Admin\ShsSectionController;
use App\Http\Controllers\Admin\ShsSubjectController;
use App\Http\Controllers\Admin\SubjectController;
use App\Http\Controllers\Admin\TeacherController;
use App\Http\Controllers\Admin\YearLevelCurriculumGuideController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Registrar\CollegePaymentController;
use App\Http\Controllers\Registrar\ProgramController;
use App\Http\Controllers\Registrar\ShsPaymentController;
use App\Http\Controllers\RegistrarController;
use App\Http\Controllers\Student\StudentDashboardController;
use App\Http\Controllers\Student\SubjectController as StudentSubjectController;
use App\Http\Controllers\Teacher\CourseMaterialController;
use App\Http\Controllers\Teacher\DashboardController as TeacherDashboardController;
use App\Http\Controllers\Teacher\GradeController;
use App\Http\Controllers\Teacher\SectionController as TeacherSectionController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return redirect()->route('login');
});

Route::middleware(['auth', 'verified', 'role:student'])->prefix('student')->group(function () {
    Route::get('/dashboard', [StudentDashboardController::class, 'index'])->name('student.dashboard');
    Route::get('/subjects', [StudentSubjectController::class, 'index'])->name('student.subjects');
    Route::get('/grades', [\App\Http\Controllers\Student\GradesController::class, 'index'])->name('student.grades');
    Route::get('/payments', [\App\Http\Controllers\Student\PaymentsController::class, 'index'])->name('student.payments');
    Route::get('/materials/{material}/download', [StudentSubjectController::class, 'downloadMaterial'])->name('student.materials.download');
    Route::post('/materials/{material}/mark-viewed', [StudentSubjectController::class, 'markMaterialAsViewed'])->name('student.materials.mark-viewed');
    Route::get('/archived-grades', [\App\Http\Controllers\Student\ArchivedGradesController::class, 'index'])->name('student.archived-grades');
});

// Registrar Routes
Route::middleware(['auth', 'verified', 'role:registrar'])->prefix('registrar')->name('registrar.')->group(function () {
    Route::get('/dashboard', [RegistrarController::class, 'dashboard'])->name('dashboard');
    Route::get('/students', [RegistrarController::class, 'students'])->name('students');
    Route::get('/students/create', [RegistrarController::class, 'create'])->name('students.create');
    Route::post('/students', [RegistrarController::class, 'store'])->name('students.store');
    Route::get('/students/{student}/edit', [RegistrarController::class, 'edit'])->name('students.edit');
    Route::put('/students/{student}', [RegistrarController::class, 'update'])->name('students.update');
    Route::get('/teachers', [RegistrarController::class, 'teachers'])->name('teachers');
    Route::get('/sections', [RegistrarController::class, 'sections'])->name('sections');
    Route::get('/enrollments', [RegistrarController::class, 'students'])->name('enrollments.index');

    // College Payment Routes
    Route::prefix('payments/college')->name('payments.college.')->group(function () {
        Route::get('/', [CollegePaymentController::class, 'index'])->name('index');
        Route::get('/student/{student}', [CollegePaymentController::class, 'show'])->name('show');
        Route::post('/', [CollegePaymentController::class, 'store'])->name('store');
        Route::post('/payment/{payment}/record', [CollegePaymentController::class, 'recordPayment'])->name('record');
    });

    // SHS Payment Routes
    Route::prefix('payments/shs')->name('payments.shs.')->group(function () {
        Route::get('/', [ShsPaymentController::class, 'index'])->name('index');
        Route::get('/student/{student}', [ShsPaymentController::class, 'show'])->name('show');
        Route::post('/', [ShsPaymentController::class, 'store'])->name('store');
        Route::post('/payment/{payment}/record', [ShsPaymentController::class, 'recordPayment'])->name('record');
        Route::get('/fee-structure', [ShsPaymentController::class, 'getFeeStructure'])->name('fee-structure');
    });

    // Program Management Routes
    Route::prefix('programs')->name('programs.')->group(function () {
        Route::get('/', [ProgramController::class, 'index'])->name('index');
        Route::get('/create', [ProgramController::class, 'create'])->name('create');
        Route::post('/', [ProgramController::class, 'store'])->name('store');
        Route::get('/{program}', [ProgramController::class, 'show'])->name('show');
        Route::get('/{program}/edit', [ProgramController::class, 'edit'])->name('edit');
        Route::put('/{program}', [ProgramController::class, 'update'])->name('update');
        Route::delete('/{program}', [ProgramController::class, 'destroy'])->name('destroy');

        // Subject Management within Programs
        Route::post('/{program}/subjects', [ProgramController::class, 'storeSubject'])->name('subjects.store');
        Route::get('/subjects/{educationLevel}', [ProgramController::class, 'getSubjectsByEducationLevel'])->name('subjects.by-education-level');
    });

    // Student Progression Routes
    Route::prefix('progression')->name('progression.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Registrar\StudentProgressionController::class, 'index'])->name('index');
        Route::post('/student/{student}/progress', [\App\Http\Controllers\Registrar\StudentProgressionController::class, 'progressStudent'])->name('student.progress');
        Route::post('/batch-progress', [\App\Http\Controllers\Registrar\StudentProgressionController::class, 'batchProgress'])->name('batch.progress');
        Route::post('/finalize-semester', [\App\Http\Controllers\Registrar\StudentProgressionController::class, 'finalizeSemester'])->name('finalize.semester');
        Route::get('/student/{student}/history', [\App\Http\Controllers\Registrar\StudentProgressionController::class, 'studentHistory'])->name('student.history');
    });
});

// Teacher Routes
Route::middleware(['auth', 'verified', 'role:teacher'])->prefix('teacher')->name('teacher.')->group(function () {
    Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('dashboard');

    // Section Management
    Route::get('/sections/college', [TeacherSectionController::class, 'collegeSections'])->name('sections.college');
    Route::get('/sections/shs', [TeacherSectionController::class, 'shsSections'])->name('sections.shs');

    // Grade Management
    Route::get('/sections/{section}/grades', [GradeController::class, 'show'])->name('grades.show');
    Route::post('/sections/{section}/grades', [GradeController::class, 'updateGrades'])->name('grades.update');
    Route::post('/sections/{section}/grades/import', [GradeController::class, 'importGrades'])->name('grades.import');
    Route::get('/sections/{section}/grades/template', [GradeController::class, 'downloadTemplate'])->name('grades.template');

    // Course Materials Management
    Route::get('/sections/{section}/materials', [CourseMaterialController::class, 'index'])->name('materials.index');
    Route::post('/sections/{section}/materials', [CourseMaterialController::class, 'store'])->name('materials.store');
    Route::delete('/sections/{section}/materials/{material}', [CourseMaterialController::class, 'destroy'])->name('materials.destroy');
    Route::get('/sections/{section}/materials/{material}/download', [CourseMaterialController::class, 'download'])->name('materials.download');

    // Archived Grades
    Route::get('/archived-sections', [\App\Http\Controllers\Teacher\ArchivedSectionsController::class, 'index'])->name('archived-sections');
    Route::get('/archived-sections/{archivedSection}', [\App\Http\Controllers\Teacher\ArchivedSectionsController::class, 'show'])->name('archived-sections.show');
});

// Admin Routes
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    Route::middleware('role:head_teacher,super_admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index'])->name('dashboard');

        // Section Management
        Route::resource('sections', SectionController::class);
        Route::get('sections/{section}/students', [SectionController::class, 'students'])->name('sections.students');
        Route::post('sections/{section}/students', [SectionController::class, 'enrollStudent'])->name('sections.enroll');
        Route::delete('sections/{section}/students', [SectionController::class, 'removeStudent'])->name('sections.remove-student');

        // Enrollment Management
        Route::patch('enrollments/{enrollment}/unenroll', [SectionController::class, 'unenrollStudent'])->name('enrollments.unenroll');

        // Subject-level Enrollment for Irregular Students
        Route::get('sections/{section}/students/{student}/subjects', [SectionController::class, 'subjectEnrollment'])->name('sections.subject-enrollment');

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

        // College Management Routes
        Route::prefix('college')->name('college.')->group(function () {
            // College Sections
            Route::resource('sections', CollegeSectionController::class);
            Route::get('sections/{section}/subjects', [CollegeSectionController::class, 'subjects'])->name('sections.subjects');
            Route::post('sections/{section}/subjects', [CollegeSectionController::class, 'attachSubject'])->name('sections.attach-subject');

            // College Subjects
            Route::resource('subjects', CollegeSubjectController::class);
        });

        // SHS Management Routes
        Route::prefix('shs')->name('shs.')->group(function () {
            // SHS Sections
            Route::resource('sections', ShsSectionController::class);
            Route::get('sections/{section}/subjects', [ShsSectionController::class, 'subjects'])->name('sections.subjects');
            Route::post('sections/{section}/subjects', [ShsSectionController::class, 'attachSubject'])->name('sections.attach-subject');

            // SHS Subjects
            Route::resource('subjects', ShsSubjectController::class);
        });

        // General Subject Management Routes
        Route::prefix('subjects')->name('subjects.')->group(function () {
            Route::get('/', [SubjectController::class, 'index'])->name('index');
            Route::get('/create', [SubjectController::class, 'create'])->name('create');
            Route::post('/', [SubjectController::class, 'store'])->name('store');
            Route::get('/{subject}/edit', [SubjectController::class, 'edit'])->name('edit');
            Route::put('/{subject}', [SubjectController::class, 'update'])->name('update');
            Route::delete('/{subject}', [SubjectController::class, 'destroy'])->name('destroy');
        });

        // Curriculum Management Routes
        Route::resource('curriculum', CurriculumController::class)->except(['destroy']);
        Route::get('curriculum/majors-for-program', [CurriculumController::class, 'getMajorsForProgram'])->name('curriculum.majors-for-program');
        Route::get('curriculum-api/subjects-for-program', [CurriculumController::class, 'getSubjectsForProgram'])->name('curriculum.api.subjects-for-program');

        // Program Curriculum Mapping Routes
        Route::resource('program-curricula', ProgramCurriculumController::class);

        // Year Level Curriculum Guide Routes
        Route::get('year-level-curriculum-guides', [YearLevelCurriculumGuideController::class, 'index'])->name('year-level-curriculum-guides.index');
        Route::get('year-level-curriculum-guides/create', [YearLevelCurriculumGuideController::class, 'create'])->name('year-level-curriculum-guides.create');
        Route::post('year-level-curriculum-guides', [YearLevelCurriculumGuideController::class, 'store'])->name('year-level-curriculum-guides.store');
        Route::get('year-level-curriculum-guides/{programId}/{yearLevel}/edit', [YearLevelCurriculumGuideController::class, 'edit'])->name('year-level-curriculum-guides.edit');
        Route::put('year-level-curriculum-guides/{programId}/{yearLevel}', [YearLevelCurriculumGuideController::class, 'update'])->name('year-level-curriculum-guides.update');
        Route::delete('year-level-curriculum-guides/{programId}/{yearLevel}', [YearLevelCurriculumGuideController::class, 'destroy'])->name('year-level-curriculum-guides.destroy');

        // Teacher Management Routes
        Route::resource('teachers', TeacherController::class);
    });
});

// Registrar Routes (Payment & Enrollment Management)
Route::prefix('registrar')->name('registrar.')->middleware(['auth'])->group(function () {
    // Payment Management
    Route::get('payments', [App\Http\Controllers\Registrar\PaymentController::class, 'index'])->name('payments.index');
    Route::get('payments/report', [App\Http\Controllers\Registrar\PaymentController::class, 'report'])->name('payments.report');
    Route::get('students/{student}/payments', [App\Http\Controllers\Registrar\PaymentController::class, 'show'])->name('payments.show');
    Route::get('students/{student}/payments/create', [App\Http\Controllers\Registrar\PaymentController::class, 'create'])->name('payments.create');
    Route::post('students/{student}/payments', [App\Http\Controllers\Registrar\PaymentController::class, 'store'])->name('payments.store');
    Route::post('payments/{payment}/process', [App\Http\Controllers\Registrar\PaymentController::class, 'processPayment'])->name('payments.process');
    Route::get('transactions/{transaction}/receipt', [App\Http\Controllers\Registrar\PaymentController::class, 'receipt'])->name('payments.receipt');

    // Clear hold on student (after payment reconciliation)
    Route::post('students/{student}/clear-hold', [App\Http\Controllers\RegistrarController::class, 'clearHold'])->name('students.clear_hold');
});

Route::get('/dashboard', [DashboardController::class, 'index'])->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
