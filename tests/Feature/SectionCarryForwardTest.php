<?php

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;

// ensure carry-forward ignores enrollments with null section_id
it('does not treat null-section enrollments as conflicts when carrying forward', function () {
    // prepare environment
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    // create a section for current semester
    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    // archive a matching section with same name/year for previous semester
    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    // create student with null-section active enrollment for current semester
    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
    ]);

    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    // also add archived enrollment for the same student
    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    // null-section enrollment should still count as enrolled and not as conflict
    $ids = collect($data['enrolled'])->pluck('id');
    expect($ids)->toContain($student->id);
    expect($data['skipped'])->toBeEmpty();
});

it('allows irregular students to import despite year level mismatch', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 2,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    // create irregular student with higher year level
    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '2nd Year',
        'current_year_level' => 2,
        'student_type' => 'irregular',
    ]);

    // ensure the student has an active enrollment so carry-forward logic sees them
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    // irregular student should be enrolled
    expect(collect($data['enrolled'])->pluck('id'))->toContain($student->id);
});

it('imports irregular student even if currently enrolled in a different section', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $otherSection = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 2,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 2,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '2nd Year',
        'current_year_level' => 2,
        'student_type' => 'irregular',
    ]);

    // already enrolled in otherSection
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $otherSection->id,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    expect(collect($data['enrolled'])->pluck('id'))->toContain($student->id);
    expect(collect($data['skipped'])->pluck('id'))->not->toContain($student->id);

    // subject enrollments should not have been created for the irregular student
    $subjectCount = \App\Models\StudentSubjectEnrollment::where(
        'student_id', $student->id
    )->count();
    expect($subjectCount)->toBe(0);
});

it('ignores archived enrollments marked as dropped', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    $student1 = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
    ]);

    $student2 = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
    ]);

    StudentEnrollment::create([
        'student_id' => $student1->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    StudentEnrollment::create([
        'student_id' => $student2->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student1->id,
        'student_number' => $student1->student_number,
        'final_status' => 'dropped',
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student2->id,
        'student_number' => $student2->student_number,
        'final_status' => 'completed',
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    // only student2 should show up in archived_students and possibly enrolled
    $ids = collect($data['archived_students'])->pluck('id');
    expect($ids)->toContain($student2->id);
    expect($ids)->not->toContain($student1->id);
});

it('skips irregular students who have already completed all subjects for the year level', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'student_type' => 'irregular',
    ]);

    // enrollment for current semester
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    // simulate completed subjects for year level 1
    $subject = \App\Models\Subject::factory()->create();
    \App\Models\CurriculumSubject::create([
        'curriculum_id' => $curriculum->id,
        'subject_id' => $subject->id,
        'year_level' => 1,
        'semester' => '1st',
        'status' => 'active',
    ]);

    $sectionSubject = \App\Models\SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'status' => 'active',
    ]);

    \App\Models\StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $sectionSubject->id,
        'enrollment_type' => 'irregular',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'completed',
        'enrollment_date' => now(),
        'enrolled_by' => auth()->id(),
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    expect(collect($data['skipped'])->pluck('id'))->toContain($student->id);
});

it('auto-enrolls imported irregular same-year student in only available section subjects', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'student_type' => 'irregular',
    ]);

    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    $availableSubject = \App\Models\Subject::factory()->create([
        'program_id' => $program->id,
        'subject_code' => 'IT101',
    ]);
    $creditedSubject = \App\Models\Subject::factory()->create([
        'program_id' => $program->id,
        'subject_code' => 'IT102',
    ]);

    $availableSectionSubject = \App\Models\SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $availableSubject->id,
        'status' => 'active',
    ]);

    $creditedSectionSubject = \App\Models\SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $creditedSubject->id,
        'status' => 'active',
    ]);

    \App\Models\StudentSubjectCredit::create([
        'student_id' => $student->id,
        'subject_id' => $creditedSubject->id,
        'subject_code' => 'IT102',
        'credit_status' => 'credited',
        'academic_year' => '2025-2026',
        'semester' => '2nd',
        'credited_at' => now(),
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $subjectEnrollments = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)
        ->where('academic_year', '2026-2027')
        ->where('semester', '1st')
        ->pluck('section_subject_id')
        ->toArray();

    expect($subjectEnrollments)->toContain($availableSectionSubject->id);
    expect($subjectEnrollments)->not->toContain($creditedSectionSubject->id);
});

it('observer does not auto-enroll irregular students when a new enrollment is created', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'student_type' => 'irregular',
    ]);

    // create enrollment manually which triggers observer
    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    $count = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)->count();
    expect($count)->toBe(0);
});

it('does not import irregular student when no section subjects remain available', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code', 'BSIT')->first();
    $curriculum = $program->curriculums()->where('is_current', true)->first();

    $section = Section::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '1st',
        'academic_year' => '2026-2027',
    ]);

    // create one section subject and then credit the student for it later
    $subject = \App\Models\Subject::factory()->create(['subject_code' => 'S1']);
    $sectionSubject = \App\Models\SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'status' => 'active',
    ]);

    $archived = ArchivedSection::create([
        'original_section_id' => null,
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => 1,
        'semester' => '2nd',
        'section_name' => $section->section_name,
        'academic_year' => '2025-2026',
        'status' => 'archived',
        'archived_at' => now()->subYear(),
        'archived_by' => auth()->id(),
    ]);

    $student = Student::factory()->create([
        'program_id' => $program->id,
        'curriculum_id' => $curriculum->id,
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'student_type' => 'irregular',
    ]);

    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => null,
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'active',
        'enrolled_by' => auth()->id(),
        'enrollment_date' => now(),
    ]);

    ArchivedStudentEnrollment::create([
        'archived_section_id' => $archived->id,
        'student_id' => $student->id,
        'student_number' => $student->student_number,
    ]);

    // credit student for the only section subject so none remain available
    \App\Models\StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $sectionSubject->id,
        'enrollment_type' => 'irregular',
        'academic_year' => '2026-2027',
        'semester' => '1st',
        'status' => 'completed',
        'enrollment_date' => now(),
        'enrolled_by' => auth()->id(),
    ]);

    $response = $this->postJson(route('sections.carry-forward-students', $section));
    $response->assertSuccessful();

    $data = $response->json('data');
    expect(collect($data['skipped'])->pluck('id'))->toContain($student->id);
});
