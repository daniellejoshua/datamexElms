<?php

use App\Models\Program;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\User;
use App\Models\Teacher;

it('allows registrar to download a student academic history as pdf', function () {
    $program = Program::factory()->create();

    $student = Student::factory()->create(['program_id' => $program->id, 'current_year_level' => 2]);

    // create an enrollment + grade so PDF contains at least one subject
    $section = \App\Models\Section::factory()->create(['program_id' => $program->id, 'year_level' => 2, 'semester' => '1st']);
    $sectionSubject = SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => \App\Models\Subject::factory()->create()->id, 'status' => 'active']);

    StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active',
        'academic_year' => $section->academic_year,
        'semester' => $section->semester,
    ]);

    StudentGrade::create([
        'student_enrollment_id' => \App\Models\StudentEnrollment::where('student_id', $student->id)->first()->id,
        'section_subject_id' => $sectionSubject->id,
        'prelim_grade' => 85,
        'midterm_grade' => 86,
        'prefinal_grade' => 87,
        'final_grade' => 88,
        'semester_grade' => 86,
        'teacher_id' => Teacher::factory()->create()->id,
        'overall_status' => 'passed',
    ]);

    $registrar = User::factory()->create(['role' => 'registrar']);

    $response = $this->actingAs($registrar)->get(route('registrar.students.academic-history.export', $student));

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'application/pdf');
    $response->assertHeader('content-disposition');
});
