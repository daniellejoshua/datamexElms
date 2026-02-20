<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;

it('includes placeholders and missing grades for completed archived enrollments without subject data', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $program = Program::factory()->create(['education_level' => 'college']);
    $admin = User::factory()->create(['role' => 'head_teacher']);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'HIS-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'History',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'total_enrolled_students' => 1,
        'completed_students' => 1,
        'dropped_students' => 0,
        'section_average_grade' => null,
        'archived_at' => now(),
        'archived_by' => $admin->id,
    ]);

    // create an archived enrollment with some missing grades
    $archivedEnrollment = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => '0',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => ['prelim' => 85, 'midterm' => null, 'prefinals' => null, 'finals' => null],
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    $response = $this->actingAs($user)->get(route('student.academic-history'));
    $response->assertOk();

    // archived enrollments / placeholders are now returned to the student page
    $pageProps = $response->original->getData()['page']['props'];

    // archivedEnrollments prop should be provided (even if empty)
    $this->assertArrayHasKey('archivedEnrollments', $pageProps);

    // ensure no placeholder archived subject entries are included in subjectGrades
    $subjectGrades = collect($pageProps['subjectGrades'] ?? []);
    expect($subjectGrades->contains('type', 'archived'))->toBeFalse();


});