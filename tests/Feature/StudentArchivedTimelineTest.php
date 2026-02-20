<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Models\SchoolSetting;

it('highlights archived curriculum subject with missing grades on student timeline', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $program = Program::factory()->create(['education_level' => 'college']);
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
    ]);

    $admin = User::factory()->create(['role' => 'head_teacher']);

    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'ArchTest',
        'year_level' => 1,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $code = 'ARCH' . \Illuminate\Support\Str::upper(\Illuminate\Support\Str::random(5));
    $subject = Subject::factory()->create(['subject_code' => $code, 'subject_name' => 'Archived One']);
    $sectionSub = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => Teacher::factory()->create()->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    // enrollment plus subject but no grade -> archived should match
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'completed',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $sectionSub->id,
        'enrollment_type' => 'regular',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
        'enrollment_date' => now(),
        'enrolled_by' => $admin->id,
    ]);

    StudentGrade::create([
        'student_enrollment_id' => 1,
        'section_subject_id' => $sectionSub->id,
        'prelim_grade' => null,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
        'teacher_id' => Teacher::factory()->create()->id,
    ]);

    // archive the section & student enrollment (simulate observer)
    $archSection = ArchivedSection::create([
        'original_section_id' => 'S1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'ArchTest',
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

    $arch = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => (string)1,
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => [],
        'student_data' => ['name' => $studentUser->name],
    ]);

    ArchivedStudentSubject::firstOrCreate([
        'archived_student_enrollment_id' => $arch->id,
        'subject_code' => $code,
    ], [
        'student_id' => $student->id,
        'subject_name' => 'Archived One',
        'prelim_grade' => null,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
    ]);

    $response = $this->actingAs($studentUser)->get(route('student.academic-history'));
    $response->assertOk();

    $props = $response->original->getData()['page']['props'];
    $grades = collect($props['subjectGrades']);

    expect($grades->where('subject_code',$code)->first()['type'])->toBe('archived');
    expect($grades->where('subject_code',$code)->first()['missing_grades'])->not->toBeEmpty();
});