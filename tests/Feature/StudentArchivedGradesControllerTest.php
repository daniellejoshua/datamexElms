<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;

it('shows archived subject rows from `archived_student_subjects` to the student', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $program = Program::factory()->create(['education_level' => 'college']);

    $admin = User::factory()->create(['role' => 'head_teacher']);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'S-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'ASec',
        'academic_year' => '2024-2025',
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

    $archivedEnrollment = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => '0',
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => null,
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    $subject = Subject::factory()->create(['subject_code' => 'AS101', 'subject_name' => 'Archived Subject']);

    ArchivedStudentSubject::create([
        'archived_student_enrollment_id' => $archivedEnrollment->id,
        'student_id' => $student->id,
        'original_enrollment_id' => $archivedEnrollment->original_enrollment_id,
        'section_subject_id' => null,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'units' => 3.0,
        'prelim_grade' => 88,
        'midterm_grade' => 90,
        'prefinal_grade' => 92,
        'final_grade' => 93,
        'semester_grade' => 93,
        'teacher_id' => null,
    ]);

    $response = $this->actingAs($user)->get(route('student.archived-grades.section', ['section' => $archivedSection->id, 'academic_year' => '2024-2025', 'semester' => 'first']));

    // section page now redirects back to the period overview
    $response->assertRedirect(route('student.archived-grades.period', ['academic_year' => '2024-2025', 'semester' => 'first']));
});

it('includes section/program metadata on subjects for period view', function () {
    /**
     * Reuse setup above but hit the period route and inspect props
     */
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $program = Program::factory()->create(['education_level' => 'college']);
    $admin = User::factory()->create(['role' => 'head_teacher']);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'S-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'ASec',
        'academic_year' => '2024-2025',
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

    $archivedEnrollment = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => '0',
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => null,
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    $subject = Subject::factory()->create(['subject_code' => 'AS101', 'subject_name' => 'Archived Subject']);

    ArchivedStudentSubject::create([
        'archived_student_enrollment_id' => $archivedEnrollment->id,
        'student_id' => $student->id,
        'original_enrollment_id' => $archivedEnrollment->original_enrollment_id,
        'section_subject_id' => null,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'units' => 3.0,
        'prelim_grade' => 88,
        'midterm_grade' => 90,
        'prefinal_grade' => 92,
        'final_grade' => 93,
        'semester_grade' => 93,
        'teacher_id' => null,
    ]);

    $response = $this->actingAs($user)->get(route('student.archived-grades.period', ['academic_year' => '2024-2025', 'semester' => 'first']));

    $response->assertSuccessful();
    $response->assertInertia(fn ($page) =>
        $page->has('subjects', 1)
             ->where('subjects.0.program_code', $program->program_code)
             ->where('subjects.0.year_level', 1)
             ->where('subjects.0.archived_section.section_name', 'ASec')
             ->has('subjects.0.teacher_name')
    );
});