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
    $entry = $grades->first(fn($g) => ($g['teacher_name'] ?? null) === $gradeTeacher->user->name
        && ($g['missing_grades'] ?? []) === ['Prelim','Midterm','Prefinal','Final']
        && ($g['is_complete'] ?? true) === false
    );
    expect($entry)->not->toBeNull();

});
