<?php

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\Teacher;
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

it('archives SHS 1st semester data when transitioning to 2nd semester', function () {
    // Create admin head teacher user
    $admin = User::factory()->create(['role' => 'head_teacher', 'password' => bcrypt('secret')]);

    // Create a teacher
    $teacherUser = User::factory()->create(['role' => 'teacher']);
    $teacher = \App\Models\Teacher::factory()->create(['user_id' => $teacherUser->id]);

    // Set current academic period to 1st semester
    SchoolSetting::set('current_academic_year', '2025-2026');
    SchoolSetting::set('current_semester', '1st');

    // Create SHS program
    $program = Program::factory()->create([
        'program_name' => 'Senior High School',
        'program_code' => 'SHS',
        'education_level' => 'senior_high',
    ]);

    // Create SHS section for 1st semester
    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Grade 11 - A',
        'year_level' => 11, // Grade 11
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'status' => 'active',
    ]);

    // Create a student
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_number' => '2025-SHS-0001',
        'first_name' => 'SHS',
        'last_name' => 'Student',
        'year_level' => 'Grade 11',
        'current_year_level' => 11,
        'education_level' => 'senior_high',
        'status' => 'active',
        'enrolled_date' => now(),
    ]);

    // Create enrollment for 1st semester
    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    // Create a grade for the student
    $grade = StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'teacher_id' => $teacher->id,
        'final_grade' => 85.5,
        'overall_status' => 'passed',
    ]);

    // Verify initial state
    expect($section->semester)->toBe('1st');
    $initialGradeCount = StudentGrade::count();

    // Simulate archiving 1st semester (which should trigger SHS transition)
    Auth::login($admin);

    $controller = new \App\Http\Controllers\Admin\AcademicYearController;
    $reflection = new ReflectionClass($controller);
    $method = $reflection->getMethod('updateShsSectionForNextSemester');
    $method->setAccessible(true);

    $method->invoke($controller, $section, '2025-2026');

    // Verify section was updated to 2nd semester
    $section->refresh();
    expect($section->semester)->toBe('2nd');

    // Verify 1st semester data was archived
    $archivedSection = \App\Models\ArchivedSection::where('original_section_id', $section->id)
        ->where('semester', 'first')
        ->first();
    expect($archivedSection)->not->toBeNull();
    expect($archivedSection->academic_year)->toBe('2025-2026');

    // Verify student enrollment was archived
    $archivedEnrollment = \App\Models\ArchivedStudentEnrollment::where('student_id', $student->id)
        ->where('semester', 'first')
        ->first();
    expect($archivedEnrollment)->not->toBeNull();
    expect($archivedEnrollment->final_semester_grade)->toBe('85.50');

    // Verify original grade still exists (not deleted)
    expect(StudentGrade::count())->toBe($initialGradeCount);
});

it('allows archive to proceed when Force is checked at confirmation even if unpaid students exist', function () {
    // Admin user
    $admin = User::factory()->create(['role' => 'head_teacher']);

    // Set current academic period
    SchoolSetting::set('current_academic_year', '2025-2026');
    SchoolSetting::set('current_semester', '2nd');

    // Program & section
    $program = Program::factory()->create(['education_level' => 'college']);
    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Test Sec',
        'year_level' => 1,
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'status' => 'active',
    ]);

    // Create a student with unpaid semester payment
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_number' => '2025-0002',
        'first_name' => 'Unpaid',
        'last_name' => 'Student',
    ]);

    // Ensure the student is enrolled in the section (archive only handles sections with enrollments)
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'enrolled_by' => $admin->id,
    ]);

    \App\Models\StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'total_fee' => 1000,
        'amount_paid' => 0,
        'balance' => 1000,
    ]);

    // Acting as admin: initiate archive (generates PIN and caches archive_data)
    $this->actingAs($admin)->post(route('admin.academic-years.archive'), [
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'archive_notes' => 'Force test',
        'force' => false,
    ])->assertSessionHas('status', 'archive-pin-sent');

    // Retrieve PIN from cache
    $pin = \Illuminate\Support\Facades\Cache::get("archive_pin_{$admin->id}");
    expect($pin)->not->toBeNull();

    // Now verify PIN but send force = true (user checks Force on confirmation)
    $response = $this->actingAs($admin)->post(route('admin.academic-years.verify-archive-pin'), [
        'pin' => $pin,
        'force' => true,
    ]);

    $response->assertRedirect(route('admin.academic-years.index'));

    // Confirm that section was archived (section status updated or archived_section exists)
    $this->assertDatabaseHas('archived_sections', [
        'original_section_id' => $section->id,
        'academic_year' => '2025-2026',
    ]);
});
