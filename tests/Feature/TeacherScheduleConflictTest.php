<?php

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use App\Rules\TeacherScheduleConflict;
// use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;

// uses(RefreshDatabase::class);

it('detects time conflicts for the same teacher', function () {
    // Setup
    $teacherUser = User::factory()->create();
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id]);
    $subject1 = Subject::factory()->create(['units' => 3]);

    // Create existing assignment: Monday 9:00-12:00 (3 hours)
    SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject1->id,
        'teacher_id' => $teacher->id,
        'schedule_days' => json_encode(['monday']),
        'start_time' => '09:00',
        'end_time' => '12:00',
        'status' => 'active',
    ]);

    // Create a different subject and section for the conflict test
    $subject2 = Subject::factory()->create(['units' => 2]);
    $section2 = Section::factory()->create(['program_id' => $program->id]);

    // Test conflicting assignment: Monday 9:30-11:30 (overlaps) - different subject, different section
    $rule = new TeacherScheduleConflict(
        teacherId: $teacher->id,
        subjectId: $subject2->id,
        sectionId: $section2->id,
        scheduleDays: ['monday'],
        startTime: '09:30',
        endTime: '11:30'
    );

    $validator = Validator::make(['teacher_id' => $teacher->id], [
        'teacher_id' => [$rule],
    ]);

    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->first('teacher_id'))->toContain('scheduling conflict');
});

it('validates units match schedule hours', function () {
    // Setup
    $teacherUser = User::factory()->create();
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id]);
    $subject = Subject::factory()->create(['units' => 3]); // Requires 3 hours per week

    // Test schedule that provides only 2 hours: Monday 9:00-11:00
    $rule = new TeacherScheduleConflict(
        teacherId: $teacher->id,
        subjectId: $subject->id,
        sectionId: $section->id,
        scheduleDays: ['monday'],
        startTime: '09:00',
        endTime: '11:00'
    );

    $validator = Validator::make(['teacher_id' => $teacher->id], [
        'teacher_id' => [$rule],
    ]);

    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->first('teacher_id'))->toContain('requires 3 hours per week');
});

it('allows correct hour allocation', function () {
    // Setup
    $teacherUser = User::factory()->create();
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id]);
    $subject = Subject::factory()->create(['units' => 3]); // Requires 3 hours per week

    // Test schedule that provides exactly 3 hours: Monday 9:00-12:00
    $rule = new TeacherScheduleConflict(
        teacherId: $teacher->id,
        subjectId: $subject->id,
        sectionId: $section->id,
        scheduleDays: ['monday'],
        startTime: '09:00',
        endTime: '12:00'
    );

    $validator = Validator::make(['teacher_id' => $teacher->id], [
        'teacher_id' => [$rule],
    ]);

    expect($validator->passes())->toBeTrue();
});

it('allows multiple sessions to meet hour requirements', function () {
    // Setup
    $teacherUser = User::factory()->create();
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id]);
    $subject = Subject::factory()->create(['units' => 4]); // Requires 4 hours per week

    // Test schedule: 2 days × 2 hours = 4 hours total
    $rule = new TeacherScheduleConflict(
        teacherId: $teacher->id,
        subjectId: $subject->id,
        sectionId: $section->id,
        scheduleDays: ['monday', 'wednesday'],
        startTime: '09:00',
        endTime: '11:00'
    );

    $validator = Validator::make(['teacher_id' => $teacher->id], [
        'teacher_id' => [$rule],
    ]);

    expect($validator->passes())->toBeTrue();
});

it('prevents same teacher teaching same subject to same section twice', function () {
    // Setup
    $teacherUser = User::factory()->create();
    $teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);
    $program = Program::factory()->create();
    $section = Section::factory()->create(['program_id' => $program->id]);
    $subject = Subject::factory()->create(['units' => 3]);

    // Create existing assignment
    SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'schedule_days' => json_encode(['monday']),
        'start_time' => '09:00',
        'end_time' => '12:00',
        'status' => 'active',
    ]);

    // Try to assign same teacher to same subject in same section again
    $rule = new TeacherScheduleConflict(
        teacherId: $teacher->id,
        subjectId: $subject->id,
        sectionId: $section->id,
        scheduleDays: ['wednesday'],
        startTime: '13:00',
        endTime: '16:00'
    );

    $validator = Validator::make(['teacher_id' => $teacher->id], [
        'teacher_id' => [$rule],
    ]);

    expect($validator->fails())->toBeTrue();
    expect($validator->errors()->first('teacher_id'))->toContain('already assigned');
});
