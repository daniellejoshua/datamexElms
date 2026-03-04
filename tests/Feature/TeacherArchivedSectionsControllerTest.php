<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;

it('updates archived_student_subject when teacher updates archived grades', function () {
    $teacherUser = User::factory()->create(['role' => 'teacher']);
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);

    $program = Program::factory()->create(['education_level' => 'college']);
    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'T-Section',
        'year_level' => 1,
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $subject = Subject::factory()->create(['subject_code' => 'TG101', 'subject_name' => 'Teacher Test']);

    $sectionSubject = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'academic_year' => '2025-2026',
        'semester' => '1st',
    ]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $studentUser->id]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'enrolled_by' => $teacherUser->id,
    ]);

    // Create a StudentGrade that the observer/backfill will use
    $studentGrade = StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'prelim_grade' => 70,
        'final_grade' => 72,
        'teacher_id' => $teacher->id,
    ]);

    // Archive the section and enrollment (simulate)
    $archivedSection = ArchivedSection::create([
        'original_section_id' => $section->id,
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [
            [
                'id' => $sectionSubject->id,
                'course_code' => $subject->subject_code,
                'subject_name' => $subject->subject_name,
                'credits' => $subject->units ?? 0,
                'teacher_id' => $teacher->id,
                'teacher_name' => $teacher->user->name ?? null,
                'room' => null,
                'schedule_days' => null,
                'start_time' => null,
                'end_time' => null,
            ],
        ],
        'total_enrolled_students' => 1,
        'completed_students' => 1,
        'dropped_students' => 0,
        'section_average_grade' => null,
        'archived_at' => now(),
        'archived_by' => $teacherUser->id,
    ]);

    $archivedEnrollment = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => (string) $enrollment->id,
        'academic_year' => '2025-2026',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => ['prelim' => 70, 'midterm' => null, 'prefinals' => null, 'finals' => 72],
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    // Observer should have created ArchivedStudentSubject; if not, create manually to simulate legacy/missing state
    $subjectRow = ArchivedStudentSubject::firstOrCreate([
        'archived_student_enrollment_id' => $archivedEnrollment->id,
        'section_subject_id' => $sectionSubject->id,
    ], [
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'units' => $subject->units ?? null,
        'prelim_grade' => 70,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => 72,
        'semester_grade' => 72,
        'teacher_id' => $teacher->id,
    ]);

    // Teacher updates archived grades via controller route
    $this->actingAs($teacherUser)
        ->post(route('teacher.archived-sections.update-grades', $archivedSection->id), [
            'enrollment_id' => $archivedEnrollment->id,
            'grades' => [
                'prelim' => 90,
                'midterm' => 92,
                'prefinals' => 93,
                'finals' => 94,
            ],
            'section_subject_id' => $sectionSubject->id,
        ])->assertRedirect();

    // Assert normalized archived subject row was updated
    $updated = DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archivedEnrollment->id)
        ->where('section_subject_id', $sectionSubject->id)
        ->first();

    expect((float) $updated->prelim_grade)->toBe(90.0);
    expect((float) $updated->midterm_grade)->toBe(92.0);
    expect((float) $updated->prefinal_grade)->toBe(93.0);
    expect((float) $updated->final_grade)->toBe(94.0);
});
