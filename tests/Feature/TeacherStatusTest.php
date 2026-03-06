<?php

use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('prevents status change to inactive and does not duplicate students when grades are repeated', function () {
    // use a registrar since they can update teachers
    $actor = User::factory()->create(['role' => 'registrar']);

    // create a teacher with the minimum required fields
    $teacher = Teacher::factory()->create();

    // create a section, subject and assign teacher via section subject
    $section = Section::factory()->create();
    $subject = Subject::factory()->create();

    $sectionSubject = SectionSubject::factory()->create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    // single student with one enrollment
    $student = Student::factory()->create();
    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
    ]);

    // two incomplete grade records that are otherwise identical - this used to
    // surface as duplicated rows in the "cannot change status" modal
    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'prelim_grade' => null,
        // other grades can be anything, not null to avoid additional rows
        'midterm_grade' => 75,
        'prefinal_grade' => 80,
        'final_grade' => 85,
    ]);

    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'prelim_grade' => null,
        'midterm_grade' => 75,
        'prefinal_grade' => 80,
        'final_grade' => 85,
    ]);

    $response = actingAs($actor)
        ->put(route('admin.teachers.update', $teacher->id), [
            'first_name'   => $teacher->first_name,
            'last_name'    => $teacher->last_name,
            'middle_name'  => $teacher->middle_name,
            'email'        => $teacher->user->email,
            'department'   => $teacher->department,
            'specialization' => $teacher->specialization,
            'hire_date'    => $teacher->hire_date,
            'status'       => 'inactive',
        ]);

    // we expect the request to be redirected back with flash data
    $response->assertRedirect();
    $response->assertSessionHas('incomplete_grades');
    $response->assertSessionHas('incomplete_count');

    $grades = session('incomplete_grades');
    $count = session('incomplete_count');

    // both the grade list and count should have been deduplicated
    expect($grades)->toHaveCount(1);
    expect($count)->toBe(1);
});

it('formats SHS missing grades as Q1 and Q2 and deduplicates', function () {
    $actor = User::factory()->create(['role' => 'registrar']);
    $teacher = Teacher::factory()->create();
    $section = Section::factory()->create(['year_level' => 11]);
    $subject = Subject::factory()->create();
    $sectionSubject = SectionSubject::factory()->create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
    ]);

    $student = Student::factory()->create(['first_name' => 'Test', 'last_name' => 'Student']);
    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
    ]);

    // create two incomplete SHS grade records with missing quarter 1 to force
    // duplication scenario and to check label formatting
    \App\Models\ShsStudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'first_quarter_grade' => null,
        'second_quarter_grade' => null,
        'final_grade' => 85, // final present so only q1/q2 show
    ]);
    \App\Models\ShsStudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'first_quarter_grade' => null,
        'second_quarter_grade' => null,
        'final_grade' => 85,
    ]);

    $response = actingAs($actor)
        ->put(route('admin.teachers.update', $teacher->id), [
            'first_name'   => $teacher->first_name,
            'last_name'    => $teacher->last_name,
            'middle_name'  => $teacher->middle_name,
            'email'        => $teacher->user->email,
            'department'   => $teacher->department,
            'specialization' => $teacher->specialization,
            'hire_date'    => $teacher->hire_date,
            'status'       => 'inactive',
        ]);

    $response->assertRedirect();
    $response->assertSessionHas('incomplete_grades');
    $grades = session('incomplete_grades');
    $count = session('incomplete_count');

    expect($grades)->toHaveCount(1);
    expect($count)->toBe(1);

    // ensure the missing grades string uses Q1 and Q2 labels (order may vary)
    $missing = $grades[0]['missing_grades'];
    expect(str_contains($missing, 'Q1'))->toBeTrue();
    expect(str_contains($missing, 'Q2'))->toBeTrue();
});
