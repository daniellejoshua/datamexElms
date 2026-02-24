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
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Models\SchoolSetting;
use Inertia\Testing\AssertableInertia as Assert;

it('returns archived enrollments with subjects for registrar academic history', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);
    $program = Program::factory()->create(['education_level' => 'college']);
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
    ]);

    $admin = User::factory()->create(['role' => 'head_teacher']);

    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Hist',
        'year_level' => 1,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $subject = Subject::factory()->create(['subject_code' => 'TEST', 'subject_name' => 'Test Subject']);
    $sectionSub = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => Teacher::factory()->create()->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'completed',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    // ensure duplicate rows are removed when running tests repeatedly
    \App\Models\StudentSubjectEnrollment::where('student_id',$student->id)
        ->where('section_subject_id',$sectionSub->id)
        ->delete();

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
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSub->id,
        'teacher_id' => Teacher::factory()->create()->id,
        'prelim_grade' => null,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
    ]);

    $archSection = ArchivedSection::create([
        'original_section_id' => 'S1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'Hist',
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
        'original_enrollment_id' => (string)$enrollment->id,
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => [],
        'student_data' => ['name' => $studentUser->name],
    ]);

    // create subject row manually (remove any duplicates to avoid constraint errors)
    ArchivedStudentSubject::where('archived_student_enrollment_id', $arch->id)
        ->where('subject_code', 'TEST')
        ->delete();

    $archTeacher = Teacher::factory()->create();
    ArchivedStudentSubject::create([
        'archived_student_enrollment_id' => $arch->id,
        'student_id' => $student->id,
        'subject_code' => 'TEST',
        'subject_name' => 'Test Subject',
        'teacher_id' => $archTeacher->id,
    ]);

    // when we assert later we expect the teacher_name to be included

    $response = $this->actingAs($registrar)->get(route('registrar.students.academic-history', $student));
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) =>
        $page->component('Registrar/Students/AcademicHistory')
            ->has('archivedEnrollments.0.subjects')
            ->where('archivedEnrollments.0.subjects.0.subject_code', 'TEST')
            ->where('archivedEnrollments.0.subjects.0.teacher_name', $archTeacher->user->name)
            // archived enrollments subject record should also report missing_grades
            ->where('archivedEnrollments.0.subjects.0.missing_grades', ['Prelim','Midterm','Prefinal','Final'])
    );
});

it('still shows credits in the curriculum grid after a course shift (shiftee)', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);

    // original program/curriculum has nothing special
    $programA = Program::factory()->create(['education_level' => 'college']);
    $currA = \App\Models\Curriculum::factory()->create(['program_id' => $programA->id, 'is_current' => true]);

    // new program has an empty curriculum (no subjects)
    $programB = Program::factory()->create(['education_level' => 'college']);
    $currB = \App\Models\Curriculum::factory()->create(['program_id' => $programB->id, 'is_current' => true]);

    // create a subject in the old program with a different code; names are similar so
    // the compare logic should match by token overlap rather than exact code
    $subjectA = \App\Models\Subject::factory()->create([
        'program_id' => $programA->id,
        'subject_code' => 'A101',
        'subject_name' => 'Shifted Subject Old',
    ]);
    // make sure it appears in the old curriculum
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $currA->id,
        'subject_id' => $subjectA->id,
        'subject_code' => $subjectA->subject_code,
        'subject_name' => $subjectA->subject_name,
        'units' => $subjectA->units ?? 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    $subjectB = \App\Models\Subject::factory()->create([
        'program_id' => $programB->id,
        'subject_code' => 'B101',
        'subject_name' => 'Shifted Subject',
    ]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $studentData = [
        'user_id' => $studentUser->id,
        'program_id' => $programA->id,
        'curriculum_id' => $currA->id,
    ];
    if (\Illuminate\Support\Facades\Schema::hasColumn('students','transfer_type')) {
        $studentData['transfer_type'] = 'shiftee'; // needed for UI column logic
    }
    $student = Student::factory()->create($studentData);

    // make sure new program curriculum actually contains the shifted subject
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $currB->id,
        'subject_id' => $subjectB->id,
        'subject_code' => $subjectB->subject_code,
        'subject_name' => $subjectB->subject_name,
        'units' => $subjectB->units ?? 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // enrol the student in a section for the old subject and give a partial grade
    $section = Section::create([
        'program_id' => $programA->id,
        'section_name' => 'A1',
        'year_level' => 1,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $sectionSub = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subjectA->id,
        'teacher_id' => Teacher::factory()->create()->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'completed',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $registrar->id,
    ]);

    $gradeTeacher = Teacher::factory()->create();
    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSub->id,
        'teacher_id' => $gradeTeacher->id,
        'prelim_grade' => 85, // partial but no final
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
    ]);

    // perform course shift by updating primary program/curriculum fields
    $student->update([
        'previous_program_id' => $programA->id,
        'previous_curriculum_id' => $currA->id,
        'program_id' => $programB->id,
        'curriculum_id' => $currB->id,
        'course_shifted_at' => now(),
    ]);

    $response = $this->actingAs($registrar)->get(route('registrar.students.academic-history', $student));
    $response->assertSuccessful();

    // curriculumSubjects should now include the credited B101 subject with missing grades
    $response->assertInertia(fn (Assert $page) =>
        $page->component('Registrar/Students/AcademicHistory')
            ->has('curriculumSubjects.0')
            ->where('curriculumSubjects.0.subject_code', 'B101')
    );

    // extra manual checks on props
    $props = $response->original->getData()['page']['props'];
    $grades = collect($props['subjectGrades']);
    // find the credited record (B101) and ensure it includes a teacher_name and missing flags
    $entry = $grades->first(fn($g) => ($g['type'] === 'credited')
        && ($g['missing_grades'] ?? []) === ['Prelim','Midterm','Prefinal','Final']
    );
    expect($entry)->not->toBeNull();
    expect($entry['teacher_name'] ?? null)->not->toBeNull();


});
