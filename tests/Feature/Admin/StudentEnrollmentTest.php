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

    it('applies irregular availability rules', function () {
        $program = Program::factory()->create();
        $sectionHigh = Section::factory()->create([
            'program_id' => $program->id,
            'year_level' => 3,
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

        $responseSame = $this->get(route('admin.sections.students', $sectionSame->id));
        $responseSame->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        $responseHigher = $this->get(route('admin.sections.students', $sectionHigh->id));
        $responseHigher->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 0));

        $responseLower = $this->get(route('admin.sections.students', $sectionLower->id));
        $responseLower->assertOk()->assertInertia(fn ($page) => $page->has('availableStudents', 1)->where('availableStudents.0.id', $student->id));
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
