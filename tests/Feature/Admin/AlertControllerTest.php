<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\User;

it('does not duplicate a teacher when they have pending grades across SHS and College', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'super_admin']);
    $this->actingAs($admin);

    $teacher = Teacher::factory()->create();

    $collegeProgram = Program::factory()->create(['education_level' => 'college', 'program_code' => 'COL']);
    $collegeSection = Section::factory()->create([
        'program_id' => $collegeProgram->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 1,
        'section_name' => 'A',
    ]);

    $shsProgram = Program::factory()->create(['education_level' => 'senior_high', 'program_code' => 'SHS']);
    $shsSection = Section::factory()->create([
        'program_id' => $shsProgram->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 11,
        'section_name' => 'A',
    ]);

    $subject1 = \App\Models\Subject::factory()->create();
    $subject2 = \App\Models\Subject::factory()->create();

    SectionSubject::factory()->create([
        'section_id' => $collegeSection->id,
        'subject_id' => $subject1->id,
        'teacher_id' => $teacher->id,
        'status' => 'active',
    ]);

    SectionSubject::factory()->create([
        'section_id' => $shsSection->id,
        'subject_id' => $subject2->id,
        'teacher_id' => $teacher->id,
        'status' => 'active',
    ]);

    $student1 = Student::factory()->create(['program_id' => $collegeProgram->id, 'education_level' => 'college']);
    StudentEnrollment::factory()->create([
        'student_id' => $student1->id,
        'section_id' => $collegeSection->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $student2 = Student::factory()->create(['program_id' => $shsProgram->id, 'education_level' => 'senior_high']);
    StudentEnrollment::factory()->create([
        'student_id' => $student2->id,
        'section_id' => $shsSection->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $response = $this->get(route('admin.alerts.index'));

    $response->assertOk()->assertInertia(fn ($page) => $page->has('pendingGradeTeachers', 1)
        ->where('pendingGradeTeachers.0.id', $teacher->id)
        ->where('pendingGradeTeachers.0.education_levels', ['college', 'senior_high'])
    );
});

it('shows only SHS for a teacher who only teaches SHS and returns student counts for sections', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'super_admin']);
    $this->actingAs($admin);

    $teacher = Teacher::factory()->create();

    $shsProgram = Program::factory()->create(['education_level' => 'senior_high', 'program_code' => 'SHS']);
    $shsSection = Section::factory()->create([
        'program_id' => $shsProgram->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 11,
        'section_name' => 'B',
    ]);

    $subject = \App\Models\Subject::factory()->create();

    SectionSubject::factory()->create([
        'section_id' => $shsSection->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status' => 'active',
    ]);

    // create two SHS students enrolled in the SHS section
    $student1 = Student::factory()->create(['program_id' => $shsProgram->id, 'education_level' => 'senior_high']);
    $student2 = Student::factory()->create(['program_id' => $shsProgram->id, 'education_level' => 'senior_high']);

    StudentEnrollment::factory()->create([
        'student_id' => $student1->id,
        'section_id' => $shsSection->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    StudentEnrollment::factory()->create([
        'student_id' => $student2->id,
        'section_id' => $shsSection->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $response = $this->get(route('admin.alerts.index'));

    $response->assertOk()->assertInertia(fn ($page) => $page->has('pendingGradeTeachers', 1)
        ->where('pendingGradeTeachers.0.id', $teacher->id)
        ->where('pendingGradeTeachers.0.education_levels', ['senior_high'])
        ->where('pendingGradeTeachers.0.sections.0.student_count', 2)
    );
});
