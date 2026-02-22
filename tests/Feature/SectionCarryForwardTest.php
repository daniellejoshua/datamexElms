<?php

use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Program;
use App\Models\Curriculum;
use App\Models\User;

// ensure carry-forward ignores enrollments with null section_id
it('does not treat null-section enrollments as conflicts when carrying forward', function () {
    // prepare environment
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    $program = Program::where('program_code','BSIT')->first();
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
