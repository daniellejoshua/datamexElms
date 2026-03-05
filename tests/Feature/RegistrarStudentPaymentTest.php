<?php

use App\Models\Program;
use App\Models\ProgramFee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('rejects a payment amount that exceeds the program fee', function () {
    // registrar is a user with registrar role
    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);
    ProgramFee::create([
        'program_id' => $program->id,
        'year_level' => 1,
        'education_level' => 'college',
        'semester_fee' => 5000,
        'fee_type' => 'regular',
    ]);

    $data = [
        'first_name' => 'Test',
        'last_name' => 'Student',
        'birth_date' => '2000-01-01',
        'email' => 'test1@example.com',
        'program_id' => $program->id,
        'year_level' => '1',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_type' => 'new',
        'enrollment_fee' => '5000',
        'payment_amount' => '6000',
    ];

    $response = actingAs($registrar)
        ->post(route('registrar.students.store'), $data);

    $response->assertSessionHasErrors('payment_amount');
});

it('rejects an enrollment fee that exceeds the program fee', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);
    ProgramFee::create([
        'program_id' => $program->id,
        'year_level' => 1,
        'education_level' => 'college',
        'semester_fee' => 5000,
        'fee_type' => 'regular',
    ]);

    $data = [
        'first_name' => 'Test',
        'last_name' => 'Student',
        'birth_date' => '2000-01-01',
        'email' => 'test2@example.com',
        'program_id' => $program->id,
        'year_level' => '1',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_type' => 'new',
        'enrollment_fee' => '6000',
        'payment_amount' => '3000',
    ];

    $response = actingAs($registrar)
        ->post(route('registrar.students.store'), $data);

    $response->assertSessionHasErrors('enrollment_fee');
});

it('allows irregular registration with zero fee/payment', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);
    ProgramFee::create([
        'program_id' => $program->id,
        'year_level' => 1,
        'education_level' => 'college',
        'semester_fee' => 0,
        'fee_type' => 'regular',
    ]);

    $data = [
        'first_name' => 'Irregular',
        'last_name' => 'Learner',
        'birth_date' => '2000-01-01',
        'email' => 'irregular@example.com',
        'program_id' => $program->id,
        'year_level' => '1',
        'student_type' => 'irregular',
        'education_level' => 'college',
        'enrollment_type' => 'new',
        'enrollment_fee' => '0',
        'payment_amount' => '0',
    ];

    $response = actingAs($registrar)
        ->post(route('registrar.students.store'), $data);

    $response->assertSessionDoesntHaveErrors();
    $response->assertRedirect();
});

it('saves numeric transferee credited grade', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);
    ProgramFee::create([
        'program_id' => $program->id,
        'year_level' => 1,
        'education_level' => 'college',
        'semester_fee' => 5000,
        'fee_type' => 'regular',
    ]);

    // create a subject that will be credited
    $subject = \App\Models\Subject::factory()->create();

    $data = [
        'first_name' => 'Transferee',
        'last_name' => 'Student',
        'birth_date' => '2000-01-01',
        'email' => 'transferee@example.com',
        'program_id' => $program->id,
        'year_level' => '2nd Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_type' => 'transferee',
        'transfer_type' => 'transferee',
        'grading_type' => 'numeric',
        'previous_school' => 'Other USchool',
        'credited_subjects' => [
            [
                'subject_id' => $subject->id,
                'subject_code' => $subject->subject_code,
                'subject_name' => $subject->subject_name,
                'grade' => '100',
                'units' => 3,
                'year_level' => 1,
                'semester' => '1st',
            ],
        ],
        'enrollment_fee' => '5000',
        'payment_amount' => '5000',
    ];

    actingAs($registrar)
        ->post(route('registrar.students.store'), $data)
        ->assertSessionDoesntHaveErrors()
        ->assertRedirect();

    // Expect a credit transfer record with the numeric grade
    $this->assertDatabaseHas('student_credit_transfers', [
        'subject_id' => $subject->id,
        'verified_semester_grade' => 100.00,
        'transfer_type' => 'transferee',
    ]);
});
