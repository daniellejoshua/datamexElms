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
    $response->assertOk()->assertInertia(fn ($page) =>
        $page->has('subjectGrades', 1) // at least the archived placeholder
            ->where('subjectGrades.0.type', 'archived')
            ->where('subjectGrades.0.subject_code', 'ARCHIVED')
            ->where('subjectGrades.0.missing_grades', ['Midterm', 'Prefinals', 'Finals'])
    );

    // also timeline should carry prop for missing_grades
    $pageProps = $response->original->getData()['page']['props'];
    $timeline = collect($pageProps['archivedEnrollments']);
    expect($timeline->first()['missing_grades'])->toEqual(['Midterm', 'Prefinals', 'Finals']);
});