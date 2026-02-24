<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Models\SchoolSetting;
use App\Models\ArchivedSection;
use Inertia\Testing\AssertableInertia as Assert;

it('shows transferred subject as partial with missing grades on student academic history', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    // set up programs and curricula
    $programA = Program::factory()->create(['education_level' => 'college']);
    $currA = \App\Models\Curriculum::factory()->create(['program_id' => $programA->id, 'is_current' => true]);
    $programB = Program::factory()->create(['education_level' => 'college']);
    $currB = \App\Models\Curriculum::factory()->create(['program_id' => $programB->id, 'is_current' => true]);

    // subjects have different codes but similar names to allow fuzzy matching
    $subjectA = Subject::factory()->create([
        'program_id' => $programA->id,
        'subject_code' => 'A101',
        'subject_name' => 'Shifted Subject Old',
    ]);
    // add to old curriculum
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $currA->id,
        'subject_id' => $subjectA->id,
        'subject_code' => $subjectA->subject_code,
        'subject_name' => $subjectA->subject_name,
        'units' => $subjectA->units ?? 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);
    $subjectB = Subject::factory()->create([
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
        $studentData['transfer_type'] = 'shiftee';
    }
    $student = Student::factory()->create($studentData);

    // ensure new curriculum has the target subject so comparison can insert it
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $currB->id,
        'subject_id' => $subjectB->id,
        'subject_code' => $subjectB->subject_code,
        'subject_name' => $subjectB->subject_name,
        'units' => $subjectB->units ?? 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // enroll and give partial grade in old program
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
        'enrolled_by' => User::factory()->create()->id,
    ]);

    $gradeTeacher = Teacher::factory()->create();
    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSub->id,
        'teacher_id' => $gradeTeacher->id,
        'prelim_grade' => 85,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
    ]);

    // perform course shift
    $student->update([
        'previous_program_id' => $programA->id,
        'previous_curriculum_id' => $currA->id,
        'program_id' => $programB->id,
        'curriculum_id' => $currB->id,
        'course_shifted_at' => now(),
    ]);

    $response = $this->actingAs($studentUser)->get(route('student.academic-history'));
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) =>
        $page->component('Student/AcademicHistory')
            ->has('curriculumSubjects.0')
            ->where('curriculumSubjects.0.subject_code', 'B101')
    );

    $props = $response->original->getData()['page']['props'];
    $grades = collect($props['subjectGrades']);
    $entry = $grades->first(fn($g) => ($g['type'] === 'credited')
        && ($g['missing_grades'] ?? []) === ['Prelim','Midterm','Prefinal','Final']
    );
    expect($entry)->not->toBeNull();
    expect($entry['teacher_name'] ?? null)->not->toBeNull();

});

// ensure archived subject entries also carry professor info for students
it('includes teacher name for archived subjects on student academic history', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

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
    $teacher = Teacher::factory()->create();

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
        'teacher_id' => $teacher->id,
    ]);

    $response = $this->actingAs($user)->get(route('student.academic-history'));
    $response->assertSuccessful();

    $props = $response->original->getData()['page']['props'];
    $grades = collect($props['subjectGrades']);
    $entry = $grades->first(fn($g) => ($g['teacher_name'] ?? null) === $teacher->user->name);
    expect($entry)->not->toBeNull();
});
