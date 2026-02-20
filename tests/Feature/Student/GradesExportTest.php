<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSemesterPayment;

beforeEach(function () {
    \App\Models\SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');
});

it('allows student to download a pdf of their current grades', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2, 'semester' => '1st']);

    $sectionSubject = SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => \App\Models\Subject::factory()->create()->id, 'status' => 'active']);

    $student = Student::factory()->create(['program_id' => $program->id, 'current_year_level' => 2]);

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
        'teacher_id' => \App\Models\Teacher::factory()->create()->id,
        'overall_status' => 'passed',
    ]);

    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $section->academic_year,
        'semester' => $section->semester,
        'total_semester_fee' => 1000,
        'balance' => 0,
        'prelim_paid' => true,
        'midterm_paid' => true,
        'prefinal_paid' => true,
        'final_paid' => true,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades.export'));

    $response->assertSuccessful();
    $response->assertHeader('content-type', 'application/pdf');
    // ensure download header contains grades
    $response->assertHeader('content-disposition');
});

it('shows "Grade hidden" text when a period is not visible due to unpaid term', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2, 'semester' => '1st']);
    $sectionSubject = SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => \App\Models\Subject::factory()->create()->id, 'status' => 'active']);
    $student = Student::factory()->create(['program_id' => $program->id, 'current_year_level' => 2]);
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
        'teacher_id' => \App\Models\Teacher::factory()->create()->id,
        'overall_status' => 'passed',
    ]);

    // create payment only for prelim
    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $section->academic_year,
        'semester' => $section->semester,
        'total_semester_fee' => 1000,
        'balance' => 1000,
        'prelim_paid' => true,
        'midterm_paid' => false,
        'prefinal_paid' => false,
        'final_paid' => false,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades.export'));
    $response->assertSuccessful();
    // pdf should contain "Grade hidden" string
    $response->assertSee('Grade hidden');
});
