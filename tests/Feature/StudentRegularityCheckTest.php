<?php

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCreditTransfer;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\User;
use App\Services\StudentRegularityCheckService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = app(StudentRegularityCheckService::class);

    // Create test program and curriculum with unique code
    $this->program = Program::factory()->create([
        'program_code' => 'BSIT-'.uniqid(),
        'program_name' => 'Bachelor of Science in Information Technology',
        'education_level' => 'college',
    ]);

    $this->curriculum = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'curriculum_name' => 'BSIT 2024',
        'is_current' => true,
    ]);

    // Create test subjects for 1st year, 1st semester
    $this->subjects = collect([
        Subject::factory()->create(['subject_code' => 'PROG1', 'subject_name' => 'Programming 1', 'units' => 3]),
        Subject::factory()->create(['subject_code' => 'MATH1', 'subject_name' => 'Mathematics 1', 'units' => 3]),
        Subject::factory()->create(['subject_code' => 'ENG1', 'subject_name' => 'English 1', 'units' => 3]),
        Subject::factory()->create(['subject_code' => 'FIL1', 'subject_name' => 'Filipino 1', 'units' => 3]),
    ]);

    // Add subjects to curriculum
    foreach ($this->subjects as $subject) {
        CurriculumSubject::create([
            'curriculum_id' => $this->curriculum->id,
            'subject_id' => $subject->id,
            'subject_code' => $subject->subject_code,
            'subject_name' => $subject->subject_name,
            'units' => $subject->units,
            'year_level' => 1,
            'semester' => '1st',
        ]);
    }

    // Create irregular student
    $user = User::factory()->create(['role' => 'student']);
    $this->student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $this->program->id,
        'curriculum_id' => $this->curriculum->id,
        'student_type' => 'irregular',
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'education_level' => 'college',
    ]);
});

test('irregular student becomes regular after completing all required subjects', function () {
    // Create passing grades for all subjects
    foreach ($this->subjects as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeTrue()
        ->and($this->student->fresh()->student_type)->toBe('regular');
});

test('irregular student stays irregular if not all subjects completed', function () {
    // Create passing grades for only 3 out of 4 subjects
    foreach ($this->subjects->take(3) as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeFalse()
        ->and($this->student->fresh()->student_type)->toBe('irregular');
});

test('irregular student stays irregular if subjects failed', function () {
    // Create grades with one failing
    foreach ($this->subjects->take(3) as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    // One failing grade
    StudentGrade::create([
        'student_id' => $this->student->id,
        'subject_id' => $this->subjects->last()->id,
        'final_grade' => 65,
        'completion_status' => 'failed',
    ]);

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeFalse()
        ->and($this->student->fresh()->student_type)->toBe('irregular');
});

test('regular student stays regular', function () {
    $this->student->update(['student_type' => 'regular']);

    // Create passing grades for all subjects
    foreach ($this->subjects as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeFalse() // Returns false because no change was made
        ->and($this->student->fresh()->student_type)->toBe('regular');
});

test('shiftee with credited subjects becomes regular after completing catch-up subjects', function () {
    // Mark student as shiftee
    $oldProgram = Program::factory()->create(['program_code' => 'BSHM-'.uniqid()]);
    $this->student->update([
        'previous_program_id' => $oldProgram->id,
        'course_shifted_at' => now(),
    ]);

    // Credit 2 subjects
    foreach ($this->subjects->take(2) as $subject) {
        StudentCreditTransfer::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'new_program_id' => $this->program->id,
            'new_curriculum_id' => $this->curriculum->id,
            'credit_status' => 'credited',
            'transfer_type' => 'shiftee',
        ]);
    }

    // Complete remaining 2 subjects
    foreach ($this->subjects->skip(2) as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeTrue()
        ->and($this->student->fresh()->student_type)->toBe('regular');
});

test('batch checking all irregular students works correctly', function () {
    // Create another irregular student
    $user2 = User::factory()->create(['role' => 'student']);
    $student2 = Student::factory()->create([
        'user_id' => $user2->id,
        'program_id' => $this->program->id,
        'curriculum_id' => $this->curriculum->id,
        'student_type' => 'irregular',
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'education_level' => 'college',
    ]);

    // First student completes all subjects
    foreach ($this->subjects as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    // Second student only completes 2 subjects
    foreach ($this->subjects->take(2) as $subject) {
        StudentGrade::create([
            'student_id' => $student2->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $count = $this->service->checkAllIrregularStudents();

    expect($count)->toBe(1) // Only first student should be promoted
        ->and($this->student->fresh()->student_type)->toBe('regular')
        ->and($student2->fresh()->student_type)->toBe('irregular');
});

test('student without curriculum stays irregular', function () {
    $this->student->update(['curriculum_id' => null]);

    // Create passing grades for all subjects
    foreach ($this->subjects as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeFalse()
        ->and($this->student->fresh()->student_type)->toBe('irregular');
});

test('first year student can become regular', function () {
    $this->student->update([
        'year_level' => '1st Year',
        'current_year_level' => 1,
    ]);

    // Complete all 1st year, 1st semester subjects
    foreach ($this->subjects as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $result = $this->service->checkAndUpdateRegularity($this->student);

    expect($result)->toBeTrue()
        ->and($this->student->fresh()->student_type)->toBe('regular');
});

test('irregularity details show missing subjects', function () {
    // Complete only 2 out of 4 subjects
    foreach ($this->subjects->take(2) as $subject) {
        StudentGrade::create([
            'student_id' => $this->student->id,
            'subject_id' => $subject->id,
            'final_grade' => 85,
            'completion_status' => 'passed',
        ]);
    }

    $details = $this->service->getIrregularityDetails($this->student);

    expect($details['is_irregular'])->toBeTrue()
        ->and($details['completed_subjects'])->toBe(2)
        ->and($details['required_subjects'])->toBe(4)
        ->and($details['missing_subjects'])->toHaveCount(2)
        ->and($details['missing_subjects'][0]['subject_code'])->toBe('ENG1')
        ->and($details['missing_subjects'][1]['subject_code'])->toBe('FIL1');
});
