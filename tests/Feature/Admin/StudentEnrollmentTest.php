<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => 'super_admin']));
});

describe('Student Enrollment Management', function () {
    it('displays students page for a section', function () {
        $program = Program::factory()->create(['program_name' => 'Bachelor of Science in Information Technology']);
        $section = Section::factory()->create(['program_id' => $program->id]);

        $response = $this->get(route('admin.sections.students', $section->id));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page->component('Admin/Sections/Students')
                ->has('section')
                ->has('enrolledStudents')
                ->has('availableStudents')
            );
    });

    it('enrolls students in a section successfully', function () {
        $program = Program::factory()->create();
        $section = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 2,
        ]);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'current_year_level' => 2,
        ]);

        $response = $this->post(route('admin.sections.enroll', $section->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect();

        $this->assertDatabaseHas('student_enrollments', [
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
        ]);
    });

    it('prevents enrolling students from different programs', function () {
        $program1 = Program::factory()->create([
            'program_name' => 'Program 1',
            'program_code' => 'PROG1',
        ]);
        $program2 = Program::factory()->create([
            'program_name' => 'Program 2',
            'program_code' => 'PROG2',
        ]);

        $section = Section::factory()->create(['program_id' => $program1->id]);
        $student = Student::factory()->create(['program_id' => $program2->id]);

        $response = $this->post(route('admin.sections.enroll', $section->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()
            ->assertSessionHas('warning');

        $this->assertDatabaseMissing('student_enrollments', [
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
        ]);
    });

    it('prevents students with different year levels from enrolling', function () {
        $program = Program::factory()->create();
        $section = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 2, // Second year section
        ]);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'current_year_level' => 1, // First year student
            'student_type' => 'regular', // Explicitly set as regular
        ]);

        $response = $this->post(route('admin.sections.enroll', $section->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()
            ->assertSessionHas('warning');

        $this->assertDatabaseMissing('student_enrollments', [
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
        ]);
    });

    it('prevents regular students from enrolling in multiple sections', function () {
        $program = Program::factory()->create();
        $academicYear = '2024-2025';
        $semester = '1st';
        $yearLevel = 2;

        $section1 = Section::factory()->create([
            'program_id' => $program->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'year_level' => $yearLevel,
        ]);
        $section2 = Section::factory()->create([
            'program_id' => $program->id,
            'academic_year' => $academicYear,
            'semester' => $semester,
            'year_level' => $yearLevel,
        ]);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'student_type' => 'regular',
            'current_year_level' => $yearLevel,
        ]);

        // Enroll in first section
        StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section1->id,
            'status' => 'active',
            'academic_year' => $academicYear,
            'semester' => $semester,
        ]);

        // Try to enroll in second section
        $response = $this->post(route('admin.sections.enroll', $section2->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()
            ->assertSessionHas('warning');

        $this->assertDatabaseMissing('student_enrollments', [
            'student_id' => $student->id,
            'section_id' => $section2->id,
            'status' => 'active',
        ]);
    });

    it('allows irregular students to enroll in multiple sections', function () {
        $program = Program::factory()->create();
        $yearLevel = 2;
        $section1 = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => $yearLevel,
        ]);
        $section2 = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => $yearLevel,
        ]);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'student_type' => 'irregular',
            'current_year_level' => $yearLevel,
        ]);

        // Enroll in first section
        StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section1->id,
            'status' => 'active',
        ]);

        // Try to enroll in second section
        $response = $this->post(route('admin.sections.enroll', $section2->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()
            ->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'student_id' => $student->id,
            'section_id' => $section2->id,
            'status' => 'active',
        ]);
    });

    it('does not auto-enroll irregulars from different programs into non-overlapping subjects', function () {
        // Set up programs, curricula, subjects, and section with overlapping & non-overlapping subjects
        $programA = Program::factory()->create();
        $programB = Program::factory()->create();

        $studentCurriculum = \App\Models\Curriculum::factory()->create();
        $sectionCurriculum = \App\Models\Curriculum::factory()->create();

        $commonSubject = \App\Models\Subject::factory()->create(['subject_code' => 'COMMON101']);
        $sectionOnlySubject = \App\Models\Subject::factory()->create(['subject_code' => 'SECTION201']);

        \App\Models\CurriculumSubject::create([
            'curriculum_id' => $studentCurriculum->id,
            'subject_id' => $commonSubject->id,
            'subject_code' => $commonSubject->subject_code,
            'subject_name' => $commonSubject->subject_name,
            'year_level' => 2,
            'semester' => 1,
            'units' => 3,
        ]);

        \App\Models\CurriculumSubject::create([
            'curriculum_id' => $sectionCurriculum->id,
            'subject_id' => $commonSubject->id,
            'subject_code' => $commonSubject->subject_code,
            'subject_name' => $commonSubject->subject_name,
            'year_level' => 2,
            'semester' => 1,
            'units' => 3,
        ]);

        \App\Models\CurriculumSubject::create([
            'curriculum_id' => $sectionCurriculum->id,
            'subject_id' => $sectionOnlySubject->id,
            'subject_code' => $sectionOnlySubject->subject_code,
            'subject_name' => $sectionOnlySubject->subject_name,
            'year_level' => 2,
            'semester' => 1,
            'units' => 3,
        ]);

        $section = Section::factory()->create([
            'program_id' => $programB->id,
            'curriculum_id' => $sectionCurriculum->id,
            'year_level' => 2,
        ]);

        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => $commonSubject->id,
            'status' => 'active',
        ]);

        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => $sectionOnlySubject->id,
            'status' => 'active',
        ]);

        $student = Student::factory()->create([
            'program_id' => $programA->id,
            'curriculum_id' => $studentCurriculum->id,
            'student_type' => 'irregular',
            'current_year_level' => 2,
        ]);

        $response = $this->post(route('admin.sections.enroll', $section->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()->assertSessionHas('success');

        $enrollments = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->get();

        // Cross-program irregulars should NOT be auto-enrolled into any subjects
        expect($enrollments->count())->toBe(0);
    });

    it('does not show irregulars with no available subjects even if they have active enrollments', function () {
        $programA = Program::factory()->create(['education_level' => 'college']);
        $programB = Program::factory()->create(['education_level' => 'college']);

        $studentCurriculum = \App\Models\Curriculum::factory()->create();
        $sectionCurriculum = \App\Models\Curriculum::factory()->create();

        $sectionOnlySubject = \App\Models\Subject::factory()->create(['subject_code' => 'SECTION201']);

        \App\Models\CurriculumSubject::create([
            'curriculum_id' => $sectionCurriculum->id,
            'subject_id' => $sectionOnlySubject->id,
            'subject_code' => $sectionOnlySubject->subject_code,
            'subject_name' => $sectionOnlySubject->subject_name,
            'year_level' => 2,
            'semester' => 1,
            'units' => 3,
        ]);

        $section = Section::factory()->create([
            'program_id' => $programB->id,
            'curriculum_id' => $sectionCurriculum->id,
            'year_level' => 2,
        ]);

        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => $sectionOnlySubject->id,
            'status' => 'active',
        ]);

        $student = Student::factory()->create([
            'program_id' => $programA->id,
            'curriculum_id' => $studentCurriculum->id,
            'student_type' => 'irregular',
            'current_year_level' => 2,
        ]);

        // give the student an active enrollment (same academic period)
        $adminUser = \App\Models\User::factory()->create();
        \App\Models\StudentEnrollment::create([
            'student_id' => $student->id,
            'section_id' => null,
            'enrollment_date' => now(),
            'enrolled_by' => $adminUser->id,
            'status' => 'active',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
        ]);

        $response = $this->get(route('admin.sections.students', $section->id));
        $response->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        // If we create a section subject that matches the student's curriculum, they will be available
        \App\Models\CurriculumSubject::create([
            'curriculum_id' => $studentCurriculum->id,
            'subject_id' => $sectionOnlySubject->id,
            'subject_code' => $sectionOnlySubject->subject_code,
            'subject_name' => $sectionOnlySubject->subject_name,
            'year_level' => 2,
            'semester' => 1,
            'units' => 3,
        ]);

        $responseAfter = $this->get(route('admin.sections.students', $section->id));
        $responseAfter->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 1));
    });

    it('applies irregular availability rules', function () {
        $program = Program::factory()->create();
        $sectionHigh = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 4,
        ]);
        $sectionSame = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 3,
        ]);
        $sectionLower = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 2,
        ]);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'student_type' => 'irregular',
            'current_year_level' => 3,
        ]);

        StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $sectionHigh->id,
            'status' => 'active',
            'academic_year' => $sectionHigh->academic_year,
            'semester' => $sectionHigh->semester,
        ]);

        // Irregular students can enroll in same year level sections (unless they've completed all subjects)
        $responseSame = $this->get(route('admin.sections.students', $sectionSame->id));
        $responseSame->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 1)->where('availableStudents.0.id', $student->id));

        // Irregular students cannot enroll in higher year level sections
        $responseHigher = $this->get(route('admin.sections.students', $sectionHigh->id));
        $responseHigher->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        // If an irregular student has NO current enrollments, still prevent showing them on a higher year-level section
        $studentNoEnroll = Student::factory()->create([
            'program_id' => $program->id,
            'student_type' => 'irregular',
            'current_year_level' => 3,
        ]);

        $responseHigherNoEnroll = $this->get(route('admin.sections.students', $sectionHigh->id));
        $responseHigherNoEnroll->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        // If the lower-year section has no subjects, irregular should NOT be shown
        $responseLower = $this->get(route('admin.sections.students', $sectionLower->id));
        $responseLower->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        // If the section has subjects available for the irregular student, they should be shown
        $subject = \App\Models\Subject::factory()->create(['subject_code' => 'LOWER101']);
        \App\Models\SectionSubject::factory()->create([
            'section_id' => $sectionLower->id,
            'subject_id' => $subject->id,
            'status' => 'active',
        ]);

        $responseLowerWithSubjects = $this->get(route('admin.sections.students', $sectionLower->id));
        $responseLowerWithSubjects->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 1)->where('availableStudents.0.id', $student->id));
    });

    it('shows section-relevant credited subjects whether matched by code or subject id', function () {
        $program = Program::factory()->create();
        $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

        $subjectA = \App\Models\Subject::factory()->create(['subject_code' => 'CORE1-'.rand(1000,9999)]);
        $subjectB = \App\Models\Subject::factory()->create(['subject_code' => 'MISSID-'.rand(1000,9999)]);
        $subjectC = \App\Models\Subject::factory()->create(['subject_code' => 'ITE1-'.rand(1000,9999)]);

        \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subjectA->id, 'status' => 'active']);
        \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subjectB->id, 'status' => 'active']);
        \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subjectC->id, 'status' => 'active']);

        $student = Student::factory()->create(['program_id' => $program->id]);

        // Credit by subject_code (should match subjectA)
        \App\Models\StudentSubjectCredit::create([
            'student_id' => $student->id,
            'subject_id' => $subjectA->id,
            'subject_code' => $subjectA->subject_code,
            'subject_name' => $subjectA->subject_name,
            'units' => 3,
            'year_level' => 2,
            'semester' => '1',
            'credit_status' => 'credited',
        ]);

        // Credit by subject_id (should match subjectB)
        \App\Models\StudentSubjectCredit::create([
            'student_id' => $student->id,
            'subject_id' => $subjectB->id,
            'subject_code' => $subjectB->subject_code,
            'subject_name' => $subjectB->subject_name,
            'units' => 3,
            'year_level' => 2,
            'semester' => '1',
            'credit_status' => 'credited',
        ]);

        // Credit via credit transfer (subject_id -> should match subjectC)
        $curr = \App\Models\Curriculum::factory()->create(['program_id' => $program->id]);

        \App\Models\StudentCreditTransfer::create([
            'student_id' => $student->id,
            'previous_program_id' => null,
            'new_program_id' => $program->id,
            'previous_curriculum_id' => null,
            'new_curriculum_id' => $curr->id,
            'subject_id' => $subjectC->id,
            'subject_code' => $subjectC->subject_code,
            'subject_name' => $subjectC->subject_name,
            'transfer_type' => 'shiftee',
            'units' => 3,
            'year_level' => 2,
            'semester' => '1',
            'credit_status' => 'credited',
        ]);

        $response = $this->get(route('admin.sections.subject-enrollment', ['section' => $section->id, 'student' => $student->id]));

        $response->assertOk()->assertInertia(fn ($page) => $page->has('creditedSubjects', 3));
    });

    it('unenrolls a student successfully', function () {
        // Use existing data to avoid unique constraint violations
        $program = Program::factory()->create([
            'program_code' => 'UNENROLL-TEST-'.rand(1000, 9999),
            'program_name' => 'Unenroll Test Program',
        ]);
        $section = Section::factory()->create(['program_id' => $program->id]);
        $student = Student::factory()->create(['program_id' => $program->id]);

        $enrollment = StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
        ]);

        $response = $this->patch(route('admin.enrollments.unenroll', $enrollment->id));

        $response->assertRedirect()
            ->assertSessionHas('success');

        $enrollment->refresh();
        expect($enrollment->status)->toBe('dropped');
    });

    it('removing a student from a section drops their active subject enrollments', function () {
        $program = Program::factory()->create();
        $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

        $subject = \App\Models\Subject::factory()->create();
        $sectionSubject = \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'status' => 'active',
        ]);

        $student = Student::factory()->create(['program_id' => $program->id]);

        $enrollment = StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
        ]);

        \App\Models\StudentSubjectEnrollment::create([
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'enrollment_type' => 'regular',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'status' => 'active',
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
        ]);

        $response = $this->delete(route('admin.sections.remove-student', $section->id), [
            'student_id' => $student->id,
        ]);

        $response->assertRedirect()->assertSessionHas('success');

        $this->assertDatabaseHas('student_enrollments', [
            'id' => $enrollment->id,
            'status' => 'dropped',
        ]);

        $this->assertDatabaseHas('student_subject_enrollments', [
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'status' => 'dropped',
        ]);
    });

    it('prevents enrolling students who are already in the section', function () {
        $program = Program::factory()->create();
        $section = Section::factory()->create(['program_id' => $program->id]);
        $student = Student::factory()->create(['program_id' => $program->id]);

        // Student already enrolled
        StudentEnrollment::factory()->create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'status' => 'active',
        ]);

        $response = $this->post(route('admin.sections.enroll', $section->id), [
            'student_ids' => [$student->id],
        ]);

        $response->assertRedirect()
            ->assertSessionHas('warning');
    });

    it('only shows students from the same program as available', function () {
        $program1 = Program::factory()->create([
            'program_name' => 'Information Technology',
            'program_code' => 'IT-TEST',
        ]);
        $program2 = Program::factory()->create([
            'program_name' => 'Engineering Technology',
            'program_code' => 'ENG-TEST',
        ]);

        $yearLevel = 2;
        $section = Section::factory()->create([
            'program_id' => $program1->id,
            'year_level' => $yearLevel,
        ]);

        $studentSameProgram = Student::factory()->create([
            'program_id' => $program1->id,
            'current_year_level' => $yearLevel,
        ]);

        // Create an active enrollment for the student in the section's academic period
        $adminUser = \App\Models\User::factory()->create();
        \App\Models\StudentEnrollment::create([
            'student_id' => $studentSameProgram->id,
            'section_id' => null,
            'enrollment_date' => now(),
            'enrolled_by' => $adminUser->id,
            'status' => 'active',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
        ]);

        $studentDifferentProgram = Student::factory()->create([
            'program_id' => $program2->id,
            'current_year_level' => $yearLevel,
            'student_type' => 'regular', // ensure deterministic behavior in test
        ]);

        $response = $this->get(route('admin.sections.students', $section->id));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->has('availableStudents', 1)
                ->where('availableStudents.0.id', $studentSameProgram->id)
                ->missing('availableStudents.1')
            );
    });
});
