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

    // head_teacher can access alerts
    $admin = User::factory()->create(['role' => 'head_teacher']);
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

    $response->assertOk()->assertInertia(fn ($page) => $page->has('pendingGradeTeachers.data', 1)
        ->where('pendingGradeTeachers.data.0.id', $teacher->id)
        ->where('pendingGradeTeachers.data.0.education_levels', ['college', 'senior_high'])
        ->where('pendingGradeTeachers.per_page', 3)
    );
});

it('shows only SHS for a teacher who only teaches SHS and returns student counts for sections', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'head_teacher']);
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

    $response->assertOk()->assertInertia(fn ($page) => $page->has('pendingGradeTeachers.data', 1)
        ->where('pendingGradeTeachers.data.0.id', $teacher->id)
        ->where('pendingGradeTeachers.data.0.education_levels', ['senior_high'])
        ->where('pendingGradeTeachers.data.0.sections.0.student_count', 2)
        ->where('pendingGradeTeachers.per_page', 3)
    );
});


it('limits alerts to the configured academic year and semester', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'head_teacher']);
    $this->actingAs($admin);

    // section in current term with low enrollment (should appear)
    $program = Program::factory()->create(['education_level' => 'college']);
    $currentSection = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 1,
        'section_name' => 'C',
    ]);
    StudentEnrollment::factory()->count(5)->create([
        'section_id' => $currentSection->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    // section in previous term with low enrollment (should be ignored)
    $oldSection = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2023-2024',
        'semester' => '2nd',
        'year_level' => 1,
        'section_name' => 'D',
    ]);
    StudentEnrollment::factory()->count(3)->create([
        'section_id' => $oldSection->id,
        'status' => 'active',
        'academic_year' => '2023-2024',
        'semester' => '2nd',
    ]);

    // unassigned student with no enrollments (now ignored by the query)
    $unassigned = Student::factory()->create();

    // student with only old-term enrollment (should also be ignored)
    $otherStudent = Student::factory()->create();
    StudentEnrollment::factory()->create([
        'student_id' => $otherStudent->id,
        'section_id' => $oldSection->id,
        'status' => 'active',
        'academic_year' => '2023-2024',
        'semester' => '2nd',
    ]);

    // section with unassigned subject in current term
    $sectionWithNoTeacher = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 1,
        'section_name' => 'E',
    ]);
    SectionSubject::factory()->create([
        'section_id' => $sectionWithNoTeacher->id,
        'teacher_id' => null,
        'status' => 'active',
    ]);

    // section with unassigned subject in old term (should be ignored)
    $oldSectionWithNoTeacher = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2023-2024',
        'semester' => '2nd',
        'year_level' => 1,
        'section_name' => 'F',
    ]);
    SectionSubject::factory()->create([
        'section_id' => $oldSectionWithNoTeacher->id,
        'teacher_id' => null,
        'status' => 'active',
    ]);

    $response = $this->get(route('admin.alerts.index'));
    $response->assertOk()->assertInertia(fn ($page) =>
        // we should see two low-enrollment sections, no unassigned students
        // (none with a current-term enrollment), and one section with missing teacher
        $page->has('lowEnrollmentSections.data', 2)
            ->has('studentsWithoutSections.data', 0)
            ->has('sectionsWithoutTeachers.data', 1)
    );
});

it('returns incomplete grade rows for a teacher (used by admin pending-grades modal)', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'head_teacher']);
    $this->actingAs($admin);

    $teacher = Teacher::factory()->create();

    $program = Program::factory()->create(['education_level' => 'college', 'program_code' => 'COL']);
    $section = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 1,
        'section_name' => 'A',
    ]);

    $subject = \App\Models\Subject::factory()->create();

    $sectionSubject = SectionSubject::factory()->create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status' => 'active',
    ]);

    $student = Student::factory()->create(['program_id' => $program->id, 'education_level' => 'college']);

    $enrollment = StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    // Create a StudentGrade with missing prelim (null) to simulate incomplete grades
    \App\Models\StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'prelim_grade' => null,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
    ]);

    $response = $this->getJson(route('admin.alerts.pending-grades.show', ['teacher' => $teacher->id]));

    $response->assertOk();
    $payload = $response->json();

    // Paginated response
    expect(array_key_exists('data', $payload))->toBeTrue();
    expect($payload['per_page'])->toBe(5);
    expect($payload['total'])->toBeGreaterThanOrEqual(1);
    expect(count($payload['data']))->toBeGreaterThanOrEqual(1);
    expect($payload['data'][0])->toHaveKey('student');
    expect($payload['data'][0])->toHaveKey('subject');
    expect($payload['data'][0])->toHaveKey('missing_grades');
    expect(str_contains($payload['data'][0]['missing_grades'], 'P') || str_contains($payload['data'][0]['missing_grades'], 'F'))->toBeTrue();

});

it('paginates pending grades modal with 5 items per page', function () {
    config(['school_settings.current_academic_year' => '2024-2025']);
    config(['school_settings.current_semester' => '1st']);

    $admin = User::factory()->create(['role' => 'head_teacher']);
    $this->actingAs($admin);

    $teacher = Teacher::factory()->create();

    $program = Program::factory()->create(['education_level' => 'college', 'program_code' => 'COL']);
    $section = Section::factory()->create([
        'program_id' => $program->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'year_level' => 1,
        'section_name' => 'A',
    ]);

    $subject = \App\Models\Subject::factory()->create();

    $sectionSubject = SectionSubject::factory()->create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'status' => 'active',
    ]);

    // create 7 students with incomplete grades
    $students = \App\Models\Student::factory()->count(7)->create(['program_id' => $program->id, 'education_level' => 'college']);

    foreach ($students as $student) {
        $enrollment = StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
            'academic_year' => '2024-2025',
            'semester' => '1st',
        ]);

        \App\Models\StudentGrade::create([
            'student_enrollment_id' => $enrollment->id,
            'section_subject_id' => $sectionSubject->id,
            'teacher_id' => $teacher->id,
            'prelim_grade' => null,
            'midterm_grade' => null,
            'prefinal_grade' => null,
            'final_grade' => null,
        ]);
    }

    $page1 = $this->getJson(route('admin.alerts.pending-grades.show', ['teacher' => $teacher->id, 'page' => 1]));
    $page1->assertOk();
    $p1 = $page1->json();
    expect($p1['per_page'])->toBe(5);
    expect($p1['total'])->toBe(7);
    expect(count($p1['data']))->toBe(5);

    $page2 = $this->getJson(route('admin.alerts.pending-grades.show', ['teacher' => $teacher->id, 'page' => 2]));
    $page2->assertOk();
    $p2 = $page2->json();
    expect($p2['per_page'])->toBe(5);
    expect($p2['total'])->toBe(7);
    expect(count($p2['data']))->toBe(2);

});
