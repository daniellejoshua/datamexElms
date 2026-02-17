<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSemesterPayment;

beforeEach(function () {
    // Ensure we act as a student user for these tests
    \App\Models\SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');
});

it('shows only prelim when only prelim is paid', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

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
        'balance' => 1000,
        'prelim_paid' => true,
        'midterm_paid' => false,
        'prefinal_paid' => false,
        'final_paid' => false,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades'));

    $response->assertOk()->assertInertia(fn ($page) =>
        $page->where('visibleGradePeriods.prelim', true)
             ->where('visibleGradePeriods.midterm', false)
             ->where('visibleGradePeriods.prefinal', false)
             ->where('visibleGradePeriods.final', false)
             ->where('visibleGradePeriods.semester', false)
    );
});

it('shows prelim and midterm when midterm is paid', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

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
        'balance' => 500,
        'prelim_paid' => false,
        'midterm_paid' => true,
        'prefinal_paid' => false,
        'final_paid' => false,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades'));

    $response->assertOk()->assertInertia(fn ($page) =>
        $page->where('visibleGradePeriods.prelim', true)
             ->where('visibleGradePeriods.midterm', true)
             ->where('visibleGradePeriods.prefinal', false)
             ->where('visibleGradePeriods.final', false)
             ->where('visibleGradePeriods.semester', false)
    );
});

it('shows prelim, midterm and prefinal when prefinal is paid', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

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
        'balance' => 200,
        'prelim_paid' => false,
        'midterm_paid' => false,
        'prefinal_paid' => true,
        'final_paid' => false,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades'));

    $response->assertOk()->assertInertia(fn ($page) =>
        $page->where('visibleGradePeriods.prelim', true)
             ->where('visibleGradePeriods.midterm', true)
             ->where('visibleGradePeriods.prefinal', true)
             ->where('visibleGradePeriods.final', false)
             ->where('visibleGradePeriods.semester', false)
    );
});

it('shows all period grades (but not semester) when final is paid', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

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
        'balance' => 150,
        'prelim_paid' => false,
        'midterm_paid' => false,
        'prefinal_paid' => false,
        'final_paid' => true,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades'));

    $response->assertOk()->assertInertia(fn ($page) =>
        $page->where('visibleGradePeriods.prelim', true)
             ->where('visibleGradePeriods.midterm', true)
             ->where('visibleGradePeriods.prefinal', true)
             ->where('visibleGradePeriods.final', true)
             ->where('visibleGradePeriods.semester', false)
    );
});

it('shows semester grade when balance is zero', function () {
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

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
        'balance' => 0,
        'prelim_paid' => true,
        'midterm_paid' => true,
        'prefinal_paid' => true,
        'final_paid' => true,
    ]);

    $response = $this->actingAs($student->user)->get(route('student.grades'));

    $response->assertOk()->assertInertia(fn ($page) =>
        $page->where('visibleGradePeriods.prelim', true)
             ->where('visibleGradePeriods.midterm', true)
             ->where('visibleGradePeriods.prefinal', true)
             ->where('visibleGradePeriods.final', true)
             ->where('visibleGradePeriods.semester', true)
    );
});
