<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;

it('allows student to advance to year 2 after completing both semesters of year 1', function () {
    // Create a user and student
    $user = User::factory()->create(['role' => 'student']);
    $program = Program::factory()->create(['education_level' => 'college']);

    $student = Student::create([
        'user_id' => $user->id,
        'student_number' => 'TEST-2024-001',
        'program_id' => $program->id,
        'year_level' => '1st Year',
        'education_level' => 'college',
        'current_year_level' => 1,
        'enrollment_status' => 'enrolled',
        'academic_status' => 'regular',
        'first_name' => 'John',
        'last_name' => 'Doe',
        'gender' => 'male',
        'date_of_birth' => '2000-01-01',
        'contact_number' => '09123456789',
        'email' => 'test@example.com',
        'address' => 'Test Address',
    ]);

    // Create archived sections
    $archivedSection1 = ArchivedSection::create([
        'original_section_id' => 'SEC-001',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'A',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'archived_at' => now(),
        'archived_by' => 1,
    ]);

    $archivedSection2 = ArchivedSection::create([
        'original_section_id' => 'SEC-002',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'A',
        'academic_year' => '2023-2024',
        'semester' => 'second',
        'status' => 'completed',
        'course_data' => [],
        'archived_at' => now(),
        'archived_by' => 1,
    ]);

    // Simulate completing 1st semester of year 1
    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection1->id,
        'student_id' => $student->id,
        'original_enrollment_id' => 1,
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'enrolled_date' => '2023-08-01',
        'completion_date' => '2023-12-15',
        'final_status' => 'completed',
        'final_semester_grade' => 85.0,
        'student_data' => [
            'name' => 'John Doe',
            'student_number' => 'TEST-2024-001',
        ],
    ]);

    // Simulate completing 2nd semester of year 1
    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection2->id,
        'student_id' => $student->id,
        'original_enrollment_id' => 2,
        'academic_year' => '2023-2024',
        'semester' => 'second',
        'enrolled_date' => '2024-01-08',
        'completion_date' => '2024-05-15',
        'final_status' => 'completed',
        'final_semester_grade' => 87.0,
        'student_data' => [
            'name' => 'John Doe',
            'student_number' => 'TEST-2024-001',
        ],
    ]);

    // Refresh to get updated current_year_level (set by observer)
    $student->refresh();

    // Student should now be allowed to enroll in year 2
    expect($student->current_year_level)->toBe(2);

    // Verify that 2 semesters were completed
    $completedCount = ArchivedStudentEnrollment::where('student_id', $student->id)
        ->where('final_status', 'completed')
        ->whereIn('semester', ['first', 'second'])
        ->count();

    expect($completedCount)->toBe(2);
});

it('prevents student from advancing to year 2 if only 1st semester is completed', function () {
    $user = User::factory()->create(['role' => 'student']);
    $program = Program::factory()->create(['education_level' => 'college']);

    $student = Student::create([
        'user_id' => $user->id,
        'student_number' => 'TEST-2024-002',
        'program_id' => $program->id,
        'year_level' => '1st Year',
        'education_level' => 'college',
        'current_year_level' => 1,
        'enrollment_status' => 'enrolled',
        'academic_status' => 'regular',
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'gender' => 'female',
        'date_of_birth' => '2000-02-01',
        'contact_number' => '09123456788',
        'email' => 'test2@example.com',
        'address' => 'Test Address 2',
    ]);

    // Create archived section
    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'SEC-003',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'B',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'archived_at' => now(),
        'archived_by' => 1,
    ]);

    // Only complete 1st semester
    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => 1,
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'enrolled_date' => '2023-08-01',
        'completion_date' => '2023-12-15',
        'final_status' => 'completed',
        'final_semester_grade' => 85.0,
        'student_data' => [
            'name' => 'Jane Smith',
            'student_number' => 'TEST-2024-002',
        ],
    ]);

    $student->refresh();

    // Student should still be at year 1 (observer won't advance with only 1 semester)
    expect($student->current_year_level)->toBe(1);

    $completedCount = ArchivedStudentEnrollment::where('student_id', $student->id)
        ->where('final_status', 'completed')
        ->whereIn('semester', ['first', 'second'])
        ->count();

    expect($completedCount)->toBe(1);
});
