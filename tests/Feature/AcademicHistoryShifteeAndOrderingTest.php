<?php

use App\Models\Curriculum;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentSubjectCredit;
use App\Models\Subject;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('orders semesters correctly in academic history regardless of insertion order', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);
    $program = Program::factory()->create(['education_level' => 'college']);
    $curriculum = Curriculum::factory()->create(['program_id' => $program->id, 'is_current' => true]);

    // create two subjects but deliberately insert second-semester first
    $sub2 = Subject::factory()->create(['program_id' => $program->id, 'subject_code' => 'SUB2', 'subject_name' => 'Second']);
    $sub1 = Subject::factory()->create(['program_id' => $program->id, 'subject_code' => 'SUB1', 'subject_name' => 'First']);

    // link them to curriculum with appropriate semesters
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curriculum->id,
        'subject_id' => $sub2->id,
        'subject_code' => $sub2->subject_code,
        'subject_name' => $sub2->subject_name,
        'program_id' => $program->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '2nd',
    ]);
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curriculum->id,
        'subject_id' => $sub1->id,
        'subject_code' => $sub1->subject_code,
        'subject_name' => $sub1->subject_name,
        'program_id' => $program->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
    ]);

    $response = $this->actingAs($registrar)
        ->get(route('registrar.students.academic-history', $student));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Students/AcademicHistory')
        ->has('curriculumSubjects', 2)
        ->where('curriculumSubjects.0.semester', '1st')
        ->where('curriculumSubjects.1.semester', '2nd')
    );
});

it('displays progress statistics for shiftee with multiple credited subjects', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);

    // original and new programs/curricula
    $progA = Program::factory()->create(['education_level' => 'college']);
    $curA = Curriculum::factory()->create(['program_id' => $progA->id, 'is_current' => true]);
    $progB = Program::factory()->create(['education_level' => 'college']);
    $curB = Curriculum::factory()->create(['program_id' => $progB->id, 'is_current' => true]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $progA->id,
        'curriculum_id' => $curA->id,
    ]);

    // create 11 credits associated with subjects in new program
    for ($i = 1; $i <= 11; $i++) {
        $subject = Subject::factory()->create([
            'program_id' => $progB->id,
            'subject_code' => "CRED{$i}",
            'subject_name' => "Credit {$i}",
        ]);
        StudentSubjectCredit::create([
            'student_id' => $student->id,
            'subject_id' => $subject->id,
            'subject_code' => $subject->subject_code,
            'subject_name' => $subject->subject_name,
            'units' => 3,
            'year_level' => 1,
            'semester' => '1st',
            'credit_status' => 'credited',
            'credit_type' => 'transfer',
        ]);
    }

    // simulate course shift
    $student->update([
        'previous_program_id' => $progA->id,
        'previous_curriculum_id' => $curA->id,
        'program_id' => $progB->id,
        'curriculum_id' => $curB->id,
        'course_shifted_at' => now(),
    ]);

    $response = $this->actingAs($registrar)
        ->get(route('registrar.students.academic-history', $student));

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Students/AcademicHistory')
        ->where('completionStats.totalSubjects', 11)
        ->where('completionStats.completedSubjects', 11)
        ->where('completionStats.completionPercentage', 100)
    );
});

// verify that a shiftee tagged via enrollment_type still triggers history comparison
it('shows credits when enrollment_type is shiftee but previous_program_id missing', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);
    $progA = Program::factory()->create(['education_level' => 'college']);
    $curA = Curriculum::factory()->create(['program_id' => $progA->id, 'is_current' => true]);
    $progB = Program::factory()->create(['education_level' => 'college']);
    $curB = Curriculum::factory()->create(['program_id' => $progB->id, 'is_current' => true]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $progB->id,
        'curriculum_id' => $curB->id,
    ]);

    // add an older enrollment in the previous program so controller can infer it
    $oldSection = \App\Models\Section::factory()->create([
        'program_id' => $progA->id,
        'curriculum_id' => $curA->id,
        'year_level' => 1,
        'academic_year' => '2023-2024',
        'semester' => '1st',
    ]);
    \App\Models\StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $oldSection->id,
        'enrollment_date' => now(),
        'academic_year' => '2023-2024',
        'semester' => '1st',
        'status' => 'completed',
        'enrolled_by' => $registrar->id,
    ]);

    // create matching subject codes in both curricula
    $subject = Subject::factory()->create(['program_id' => $progA->id, 'subject_code' => 'ABC123']);
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curA->id,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'program_id' => $progA->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curB->id,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'program_id' => $progB->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // pretend the student actually completed the ABC123 subject in the previous
    // program so the credit comparison will have something to work with.
    \App\Models\StudentSubjectCredit::create([
        'student_id' => $student->id,
        'subject_id' => $subject->id,
        'subject_code' => $subject->subject_code,
        'subject_name' => $subject->subject_name,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
        'credit_status' => 'credited',
        'credit_type' => 'transfer',
        'final_grade' => 85,
    ]);

    $response = $this->actingAs($registrar)
        ->get(route('registrar.students.academic-history', $student));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Students/AcademicHistory')
        ->has('subjectGrades')
        ->where('subjectGrades.0.subject_code', 'ABC123')
    );
});

// ensure mismatched subject codes/names still result in a credit entry and
// that the original code is preserved for clarity in the UI
it('preserves original subject details when codes differ between programs', function () {
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $registrar = User::factory()->create(['role' => 'registrar']);

    $progA = Program::factory()->create(['education_level' => 'college']);
    $curA = Curriculum::factory()->create(['program_id' => $progA->id, 'is_current' => true]);
    $progB = Program::factory()->create(['education_level' => 'college']);
    $curB = Curriculum::factory()->create(['program_id' => $progB->id, 'is_current' => true]);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $progB->id,
        'curriculum_id' => $curB->id,
    ]);

    // old program subject has different code but same name
    $oldSub = Subject::factory()->create([
        'program_id' => $progA->id,
        'subject_code' => 'OLD101',
        'subject_name' => 'Common Name',
    ]);

    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curA->id,
        'subject_id' => $oldSub->id,
        'subject_code' => $oldSub->subject_code,
        'subject_name' => $oldSub->subject_name,
        'program_id' => $progA->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // new program subject uses a different code but same name
    $newSub = Subject::factory()->create([
        'program_id' => $progB->id,
        'subject_code' => 'NEW202',
        'subject_name' => 'Common Name',
    ]);
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curB->id,
        'subject_id' => $newSub->id,
        'subject_code' => $newSub->subject_code,
        'subject_name' => $newSub->subject_name,
        'program_id' => $progB->id,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // simulate previous enrollment to trigger inference
    $oldSection = \App\Models\Section::factory()->create([
        'program_id' => $progA->id,
        'curriculum_id' => $curA->id,
        'year_level' => 1,
        'academic_year' => '2023-2024',
        'semester' => '1st',
    ]);
    \App\Models\StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $oldSection->id,
        'enrollment_date' => now(),
        'academic_year' => '2023-2024',
        'semester' => '1st',
        'status' => 'completed',
        'enrolled_by' => $registrar->id,
    ]);

    // add a credit record for the old subject
    \App\Models\StudentSubjectCredit::create([
        'student_id' => $student->id,
        'subject_id' => $oldSub->id,
        'subject_code' => $oldSub->subject_code,
        'subject_name' => $oldSub->subject_name,
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
        'credit_status' => 'credited',
        'credit_type' => 'transfer',
        'final_grade' => 85,
    ]);

    $response = $this->actingAs($registrar)
        ->get(route('registrar.students.academic-history', $student));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Students/AcademicHistory')
        ->has('subjectGrades', 1)
        ->where('subjectGrades.0.subject_code', 'NEW202')
        ->where('subjectGrades.0.original_subject_code', 'OLD101')
    );
});
