<?php

use App\Models\ArchivedStudentSubject;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedSection;
use App\Models\Program;
use App\Models\Student;
use App\Models\User;

it('auto-computes semester_grade when all period grades are present on the model', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $program = Program::factory()->create(['education_level' => 'college']);

    $admin = User::factory()->create(['role' => 'head_teacher']);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'AUTO-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'Auto',
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

    $row = ArchivedStudentSubject::create([
        'archived_student_enrollment_id' => $archivedEnrollment->id,
        'student_id' => $student->id,
        'subject_code' => 'AC101',
        'subject_name' => 'Auto Compute',
        'prelim_grade' => 80,
        'midterm_grade' => 82,
        'prefinal_grade' => 84,
        'final_grade' => 86,
    ]);

    // Average = (80 + 82 + 84 + 86) / 4 = 83.00
    $row->refresh();
    expect((float) $row->semester_grade)->toBe(83.0);

    // Update one component and ensure semester_grade recalculates
    $row->update(['final_grade' => 90]);
    $row->refresh();
    // New average = (80 + 82 + 84 + 90) / 4 = 84.00
    expect((float) $row->semester_grade)->toBe(84.0);
});