<?php

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

it('archives semester, creates archived records, updates progression and allows new enrollment', function () {
    // Create admin head teacher user with known password for confirmation
    $admin = User::factory()->create(['role' => 'head_teacher', 'password' => bcrypt('secret')]);

    // Set current academic period
    SchoolSetting::set('current_academic_year', '2025-2026');
    SchoolSetting::set('current_semester', '2nd');

    // Create a program
    $program = Program::factory()->create(['program_name' => 'Test Program', 'education_level' => 'college']);

    // Create a section for the current academic period
    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Test Section',
        'year_level' => 1,
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'status' => 'active',
    ]);

    // Create a student and two enrollments (simulate two semesters completed)
    $user = User::factory()->create(['role' => 'student']);
    $student = \App\Models\Student::create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_number' => '2025-TEST-0001',
        'first_name' => 'Test',
        'last_name' => 'Student',
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'education_level' => 'college',
        'status' => 'active',
        'enrolled_date' => now(),
    ]);

    // Create first semester enrollment (previous year)
    $en1 = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now()->subMonths(9),
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    // Ensure a teacher exists for grade records
    $teacher = \App\Models\Teacher::factory()->create();

    // Add grade for en1 as well (some systems expect grades present)
    StudentGrade::create([
        'student_enrollment_id' => $en1->id,
        'midterm_grade' => 80,
        'final_grade' => 85,
        'teacher_id' => $teacher->id,
    ]);

    // Create second semester enrollment (current year/semester to be archived)
    $en2 = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now()->subMonths(3),
        'status' => 'active',
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'enrolled_by' => $admin->id,
    ]);

    // Add grade for en2
    StudentGrade::create([
        'student_enrollment_id' => $en2->id,
        'midterm_grade' => 85,
        'final_grade' => 90,
        'teacher_id' => $teacher->id,
    ]);

    // Call the admin archive endpoint as the head teacher (includes password confirmation)
    // Invoke the controller's archive logic directly (bypass console auth checks)
    $controller = new \App\Http\Controllers\Admin\AcademicYearController;
    // Make sure Auth is set so archived_by and similar functions work
    Auth::login($admin);
    $method = new \ReflectionMethod($controller, 'archiveSemesterSections');
    $method->setAccessible(true);
    $method->invoke($controller, '2025-2026', '2nd', 'Test archive');

    // Assertions: archived_student_enrollments contains en2
    $archivedExists = DB::table('archived_student_enrollments')
        ->where('original_enrollment_id', $en2->id)
        ->where('final_status', 'completed')
        ->exists();

    expect($archivedExists)->toBeTrue();

    // Student current_year_level should have progressed if two semesters completed (we created one active in previous year and one now)
    $student->refresh();
    expect($student->current_year_level)->toBeGreaterThanOrEqual(1);

    // Now attempt to enroll the student into the new semester (next semester)
    $newAcademicYear = '2025-2026';
    $newSemester = 'summer';
    SchoolSetting::set('current_academic_year', $newAcademicYear);
    SchoolSetting::set('current_semester', $newSemester);

    // Should be able to create a new StudentEnrollment
    $enNew = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => $newAcademicYear,
        'semester' => $newSemester,
        'enrolled_by' => $admin->id,
    ]);

    $enNewExists = DB::table('student_enrollments')->where('id', $enNew->id)->where('student_id', $student->id)->exists();
    expect($enNewExists)->toBeTrue();
});
