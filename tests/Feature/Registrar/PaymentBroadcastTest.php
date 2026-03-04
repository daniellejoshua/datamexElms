<?php

use App\Events\PaymentRecorded;
use App\Models\ShsStudentPayment;
use App\Models\Student;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(RefreshDatabase::class);

it('dispatches a PaymentRecorded event when a payment is recorded', function () {
    Event::fake([PaymentRecorded::class]);

    $registrar = User::factory()->create(['role' => 'registrar']);
    $this->actingAs($registrar);

    $student = Student::factory()->create(['education_level' => 'senior_high']);

    // create a payment record for the student
    $payment = ShsStudentPayment::factory()->create([
        'student_id' => $student->id,
        'academic_year' => '2025-2026',
        'semester' => 'annual',
        'total_semester_fee' => 1000,
        'total_paid' => 0,
        'balance' => 1000,
    ]);

    $response = $this->post(route('registrar.payments.shs.record', $payment), [
        'amount_paid' => 200,
        'payment_date' => now()->toDateString(),
        'or_number' => 'OR-123',
        'quarter' => 'yearly',
        'notes' => 'testing',
    ]);

    $response->assertRedirect();

    Event::assertDispatched(PaymentRecorded::class, function ($e) use ($payment) {
        return $e->payment->id === $payment->id;
    });
});
