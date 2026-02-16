<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->actingAs(User::factory()->create(['role' => 'super_admin']));
});

describe('Remove student from subject (admin)', function () {
    it('prevents removing subject for irregular student in same program/year (treated as regular)', function () {
        $program = \App\Models\Program::factory()->create(['education_level' => 'college']);
        $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

        $subject = \App\Models\Subject::factory()->create();
        $sectionSubject = \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subject->id, 'status' => 'active']);

        $student = Student::factory()->create([
            'program_id' => $program->id,
            'student_type' => 'irregular',
            'current_year_level' => 2,
        ]);

        StudentSubjectEnrollment::create([
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'enrollment_type' => 'irregular',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'status' => 'active',
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
        ]);

        $response = $this->delete(route('admin.sections.remove-from-subject', ['section' => $section->id, 'student' => $student->id]), [
            'section_subject_id' => $sectionSubject->id,
        ]);

        $response->assertStatus(422)->assertJsonStructure(['error']);

        // still active
        $this->assertDatabaseHas('student_subject_enrollments', [
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'status' => 'active',
        ]);
    });

    it('prevents removal when student already has regular grades', function () {
        $program = \App\Models\Program::factory()->create(['education_level' => 'college']);
        $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 2]);

        $subject = \App\Models\Subject::factory()->create();
        $sectionSubject = \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subject->id, 'status' => 'active']);

        $student = Student::factory()->create(['program_id' => $program->id, 'student_type' => 'irregular', 'current_year_level' => 2]);

        $studentEnrollment = StudentEnrollment::create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
            'status' => 'active',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
        ]);

        StudentSubjectEnrollment::create([
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'enrollment_type' => 'irregular',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'status' => 'active',
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
        ]);

        // create a regular StudentGrade record (prelim)
        $teacher = Teacher::factory()->create();

        \App\Models\StudentGrade::create([
            'student_enrollment_id' => $studentEnrollment->id,
            'section_subject_id' => $sectionSubject->id,
            'teacher_id' => $teacher->id,
            'prelim_grade' => 85,
        ]);

        $response = $this->delete(route('admin.sections.remove-from-subject', ['section' => $section->id, 'student' => $student->id]), [
            'section_subject_id' => $sectionSubject->id,
        ]);

        $response->assertStatus(422)->assertJsonStructure(['error']);

        $this->assertDatabaseHas('student_subject_enrollments', [
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'status' => 'active',
        ]);
    });

    it('prevents removal when SHS grades exist', function () {
        $program = \App\Models\Program::factory()->create(['education_level' => 'senior_high']);
        $section = Section::factory()->create(['program_id' => $program->id, 'year_level' => 11]);

        $subject = \App\Models\Subject::factory()->create();
        $sectionSubject = \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subject->id, 'status' => 'active']);

        $student = Student::factory()->create(['program_id' => $program->id, 'student_type' => 'irregular', 'current_year_level' => 11]);

        $studentEnrollment = StudentEnrollment::create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
            'status' => 'active',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
        ]);

        StudentSubjectEnrollment::create([
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'enrollment_type' => 'irregular',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'status' => 'active',
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
        ]);

        $teacher = Teacher::factory()->create();

        \App\Models\ShsStudentGrade::create([
            'student_enrollment_id' => $studentEnrollment->id,
            'section_subject_id' => $sectionSubject->id,
            'teacher_id' => $teacher->id,
            'first_quarter_grade' => 88,
        ]);

        $response = $this->delete(route('admin.sections.remove-from-subject', ['section' => $section->id, 'student' => $student->id]), [
            'section_subject_id' => $sectionSubject->id,
        ]);

        $response->assertStatus(422)->assertJsonStructure(['error']);

        $this->assertDatabaseHas('student_subject_enrollments', [
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'status' => 'active',
        ]);
    });

    it('allows removal for irregular from different program/no grades', function () {
        $programA = Program::factory()->create(['education_level' => 'college']);
        $programB = Program::factory()->create(['education_level' => 'college']);

        $section = Section::factory()->create(['program_id' => $programB->id, 'year_level' => 2]);
        $subject = \App\Models\Subject::factory()->create();
        $sectionSubject = \App\Models\SectionSubject::factory()->create(['section_id' => $section->id, 'subject_id' => $subject->id, 'status' => 'active']);

        $student = Student::factory()->create(['program_id' => $programA->id, 'student_type' => 'irregular', 'current_year_level' => 2]);

        StudentSubjectEnrollment::create([
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'enrollment_type' => 'irregular',
            'academic_year' => $section->academic_year,
            'semester' => $section->semester,
            'status' => 'active',
            'enrollment_date' => now(),
            'enrolled_by' => auth()->id(),
        ]);

        $response = $this->delete(route('admin.sections.remove-from-subject', ['section' => $section->id, 'student' => $student->id]), [
            'section_subject_id' => $sectionSubject->id,
        ]);

        $response->assertOk()->assertJsonStructure(['message']);

        $this->assertDatabaseHas('student_subject_enrollments', [
            'student_id' => $student->id,
            'section_subject_id' => $sectionSubject->id,
            'status' => 'dropped',
        ]);
    });
});
