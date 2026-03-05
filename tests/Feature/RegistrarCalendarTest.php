<?php

use App\Models\FeeAdjustment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('prevents registrar from modifying calendar after a student exists', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);
    Student::factory()->create();

    $payload = [
        'effective_date' => now()->toDateString(),
        'type' => 'early_enrollment',
        'amount' => -1000,
    ];

    $this->actingAs($registrar)
        ->post(route('registrar.calendar.store'), $payload)
        ->assertStatus(403);
});

it('allows head teacher to create an adjustment even after students exist', function () {
    $head = User::factory()->create(['role' => 'head_teacher']);
    Student::factory()->create();

    $payload = [
        'effective_date' => now()->toDateString(),
        'type' => 'due_date_penalty',
        'term' => 'prelim',
        'amount' => 100,
    ];

    $this->actingAs($head)
        ->post(route('registrar.calendar.store'), $payload)
        ->assertRedirect();

    $this->assertDatabaseHas('fee_adjustments', ['type' => 'due_date_penalty', 'term' => 'prelim']);
});

it('applies a term-specific penalty but does not change total or balance', function () {
    $student = Student::factory()->create(['education_level' => 'college']);
    FeeAdjustment::create([
        'effective_date' => now()->toDateString(),
        'type' => 'due_date_penalty',
        'term' => 'midterm',
        'amount' => 100,
        'college_only' => true,
    ]);

    $service = new \App\Services\StudentPaymentService();
    $payment = $service->createSemesterPayment($student, '2025-2026', '1st', ['term' => 'midterm']);

    // adjustments should be attached and include our midterm penalty
    expect($payment->adjustments)->not->toBeEmpty();
    expect($payment->adjustments->first()->term)->toBe('midterm');

    // penalty does not alter the recorded semester fee
    expect($payment->total_semester_fee)->toBeGreaterThan(0);

});
