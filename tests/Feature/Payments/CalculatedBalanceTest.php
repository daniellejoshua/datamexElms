<?php

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentSemesterPayment;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    // Ensure current academic period is set for payment records
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');
});

it('shows calculated balance on student payments page for transferees with credits', function () {
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $program = Program::factory()->create(['education_level' => 'college']);

    $user = User::factory()->create(['role' => 'student']);

    // Student is recorded as `regular` but has a previous_school (transferee)
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
        'previous_school' => 'Previous College',
    ]);

    // Create a semester payment for the current period
    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 5000.00,
        'total_semester_fee' => 15000.00,
        'total_paid' => 2000.00,
        'balance' => 13000.00,
        'status' => 'partial',
    ]);

    $response = $this->actingAs($user)->get(route('student.payments'));

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Student/Payments/Index')
        ->has('paymentHistory')
        ->where('student.student_type', 'regular')
        // previous_school triggers the transferee-calculation path even for `regular`
        ->where('student.previous_school', fn ($v) => ! empty($v))
        ->where('paymentHistory.0.calculated_total_amount', fn ($value) => is_numeric($value))
    );
});

it('does not calculate balance for past semester payments', function () {
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $program = Program::factory()->create(['education_level' => 'college']);
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
        'previous_school' => 'Previous College',
    ]);

    // create a payment from a previous academic period
    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => '2023-2024',
        'semester' => '2nd',
        'enrollment_fee' => 0,
        'total_semester_fee' => 0,
        'total_paid' => 0,
        'balance' => 0,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($user)->get(route('student.payments'));
    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->component('Student/Payments/Index')
        ->has('paymentHistory')
        ->where('paymentHistory.0.calculated_total_amount', null)
    );
});

// regression: regular subjects taken in earlier years should not contribute
// to irregular fee when the student becomes irregular in a later year.
it('does not charge past regular subjects once student becomes irregular', function () {
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $program = Program::factory()->create(['education_level' => 'college']);
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
    ]);

    // create a regular subject enrollment from previous year
    $oldSection = \App\Models\Section::factory()->create([
        'program_id' => $program->id,
        'year_level' => 1,
    ]);
    $oldSectionSubject = \App\Models\SectionSubject::factory()->create([
        'section_id' => $oldSection->id,
        'subject_id' => \App\Models\Subject::factory()->create(['program_id' => $program->id])->id,
        'teacher_id' => \App\Models\Teacher::factory()->create()->id,
        'status' => 'active',
    ]);
    \App\Models\StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $oldSectionSubject->id,
        'academic_year' => '2023-2024',
        'semester' => '1st',
        'status' => 'completed',
        'enrollment_type' => 'regular',
        'enrollment_date' => now(),
        'enrolled_by' => $user->id,
    ]);

    // now mark student irregular and add current payment record
    $student->update(['student_type' => 'irregular']);
    $payment = StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 0,
        'total_semester_fee' => 0,
        'total_paid' => 0,
        'balance' => 0,
        'status' => 'pending',
    ]);

    // instead of inspecting the Inertia props we hit the calculation route directly
    $calc = $this->actingAs($user)->get(route('student.payments.calculate-irregular', $payment->id));
    $calc->assertSuccessful();
    $calc->assertJsonPath('details.past_year_subjects_count', 0);
});

it('shows calculated balance on registrar payment show for transferees with credits', function () {
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
        'previous_school' => 'Previous College',
    ]);

    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 5000.00,
        'total_semester_fee' => 12000.00,
        'total_paid' => 3000.00,
        'balance' => 9000.00,
        'status' => 'partial',
    ]);

    $response = $this->actingAs($registrar)->get(route('registrar.payments.college.show', $student));

    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page
        ->component('Registrar/Payments/College/Show')
        ->has('payments')
        ->where('payments.0.calculated_total_amount', fn ($v) => is_numeric($v))
        ->where('student.previous_school', fn ($v) => ! empty($v))
    );
});

it('shows calculated balance on registrar payments index for transferees', function () {
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $registrar = User::factory()->create(['role' => 'registrar']);

    $program = Program::factory()->create(['education_level' => 'college']);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
        'previous_school' => 'Old School',
    ]);

    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 0,
        'total_semester_fee' => 0, // will trigger calculation path
        'total_paid' => 0,
        'balance' => 0,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($registrar)->get(route('registrar.payments.college.index'));
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Payments/College/Index')
        ->has('payments')
        ->where('payments.data.0.calculated_total_amount', fn ($v) => is_numeric($v))
    );
});

it('marks response as past filter when requesting an earlier term', function () {
    $currentYear = SchoolSetting::getCurrentAcademicYear();
    $currentSem = SchoolSetting::getCurrentSemester();

    $registrar = User::factory()->create(['role' => 'registrar']);
    $program = Program::factory()->create(['education_level' => 'college']);
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
    ]);

    StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $currentYear,
        'semester' => $currentSem,
        'enrollment_fee' => 0,
        'total_semester_fee' => 1000,
        'total_paid' => 0,
        'balance' => 1000,
        'status' => 'pending',
    ]);

    // request older term
    $response = $this->actingAs($registrar)->get(route('registrar.payments.college.index', [
        'academic_year' => '2023-2024',
        'semester' => '2nd',
    ]));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page->where('isPastFilter', true));
});
it('reduces balance when a college payment is recorded and updates status', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);
    $program = Program::factory()->create(['education_level' => 'college']);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'student_type' => 'regular',
    ]);

    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $payment = StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 0,
        'total_semester_fee' => 10000.00,
        'total_paid' => 0,
        'balance' => 10000.00,
        'status' => 'pending',
    ]);

    // record a normal prelim payment
    $response = $this->actingAs($registrar)->post(route('registrar.payments.college.record', $payment), [
        'amount_paid' => 2000.00,
        'payment_date' => now()->toDateString(),
        'term' => 'prelim',
        'or_number' => 'OR123',
        'notes' => 'test',
    ]);

    $response->assertRedirect();

    $payment->refresh();
    expect((float) $payment->total_paid)->toBe(2000.00);
    expect((float) $payment->balance)->toBe(8000.00);
    expect($payment->status)->toBe('partial');

    // now submit a follow‑up payment (simulating past-semester mode)
    $response2 = $this->actingAs($registrar)->post(route('registrar.payments.college.record', $payment), [
        'amount_paid' => 1000.00,
        'payment_date' => now()->toDateString(),
        'term' => 'followup',
        'or_number' => 'OR124',
        'notes' => 'follow-up',
    ]);

    $response2->assertRedirect();
    $payment->refresh();
    expect((float) $payment->total_paid)->toBe(3000.00);
    expect((float) $payment->balance)->toBe(7000.00);
    // status stays partial
    expect($payment->status)->toBe('partial');

    // verify the transaction description is correctly labelled as a follow-up
    $transaction = \App\Models\PaymentTransaction::where('payable_id', $payment->id)
        ->latest('id')
        ->first();
    expect($transaction->description)->toBe('Follow-up payment');
});

it('uses effective due instead of stale stored balance when recording irregular payment', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);
    $program = Program::factory()->create(['education_level' => 'college']);

    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $program->id,
        'student_type' => 'irregular',
        'status' => 'active',
    ]);

    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $payment = StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrollment_fee' => 0,
        'total_semester_fee' => 1000.00,
        'calculated_total_amount' => 3000.00,
        'total_paid' => 0,
        'balance' => 1000.00,
        'fee_finalized' => true,
        'status' => 'pending',
    ]);

    $response = $this->actingAs($registrar)->post(route('registrar.payments.college.record', $payment), [
        'amount_paid' => 1500.00,
        'payment_date' => now()->toDateString(),
        'term' => 'prelim',
        'or_number' => 'OR-IRREG-001',
        'notes' => 'irregular stale balance regression',
    ]);

    $response->assertRedirect();
    $response->assertSessionHasNoErrors();

    $payment->refresh();
    expect((float) $payment->total_paid)->toBe(1500.00);
    expect((float) $payment->balance)->toBe(1500.00);
    expect($payment->status)->toBe('partial');
});

it('will auto‑convert any term to followup when payment belongs to past semester', function () {
    $registrar = User::factory()->create(['role' => 'registrar']);
    $student = Student::factory()->create();

    $currentYear = SchoolSetting::getCurrentAcademicYear();
    // just pick a different string so the payment record is considered past
    $pastYear = $currentYear.'-past';

    $payment = StudentSemesterPayment::create([
        'student_id' => $student->id,
        'academic_year' => $pastYear,
        'semester' => 1,
        'enrollment_fee' => 0,
        'total_semester_fee' => 5000.00,
        'total_paid' => 0,
        'balance' => 5000.00,
        'status' => 'pending',
    ]);

    // client incorrectly sends 'prelim' because front‑end state was stale
    $response = $this->actingAs($registrar)->post(route('registrar.payments.college.record', $payment), [
        'amount_paid' => 1000.00,
        'payment_date' => now()->toDateString(),
        'term' => 'prelim',
        'or_number' => 'OR999',
        'notes' => 'past semester test',
    ]);

    $response->assertRedirect();

    $payment->refresh();
    expect((float) $payment->total_paid)->toBe(1000.00);
    expect((float) $payment->balance)->toBe(4000.00);

    $transaction = \App\Models\PaymentTransaction::where('payable_id', $payment->id)->latest('id')->first();
    expect($transaction->payment_type)->toBe('followup_payment');
    expect($transaction->description)->toBe('Follow-up payment');
});

it('keeps original fees on student payment even after program fee is updated', function () {
    $program = \App\Models\Program::factory()->create(['semester_fee' => 10000]);
    $program->programFees()->create(['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 10000]);

    $student = Student::factory()->create(['program_id' => $program->id]);
    $year = SchoolSetting::getCurrentAcademicYear();
    $sem = SchoolSetting::getCurrentSemester();

    // generate payment record via service
    (new \App\Services\StudentPaymentService)->createSemesterPayment($student, $year, $sem);

    $payment = $student->studentSemesterPayments()->first();
    expect((float) $payment->total_semester_fee)->toBe(10000.00);
    expect((float) $payment->balance)->toBe(10000.00);

    // now change program fee as registrar would
    $program->update(['semester_fee' => 15000]);
    $program->programFees()->where('year_level', 1)->update(['semester_fee' => 15000]);

    // refresh payment and assert values unchanged
    $payment->refresh();
    expect((float) $payment->total_semester_fee)->toBe(10000.00);
    expect((float) $payment->balance)->toBe(10000.00);

    // calling createSemesterPayment again should return same record without modification
    $again = (new \App\Services\StudentPaymentService)->createSemesterPayment($student, $year, $sem);
    expect($again->id)->toBe($payment->id);
});

it('fix command only updates fees for students with active status', function () {
    $program = \App\Models\Program::factory()->create(['semester_fee' => 8000]);
    $program->programFees()->create(['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 8000]);

    $activeStudent = Student::factory()->create(['program_id' => $program->id, 'status' => 'active']);
    $inactiveStudent = Student::factory()->create(['program_id' => $program->id, 'status' => 'dropped']);

    $year = SchoolSetting::getCurrentAcademicYear();
    $sem = SchoolSetting::getCurrentSemester();

    (new \App\Services\StudentPaymentService)->createSemesterPayment($activeStudent, $year, $sem);
    (new \App\Services\StudentPaymentService)->createSemesterPayment($inactiveStudent, $year, $sem);

    $activePayment = $activeStudent->studentSemesterPayments()->first();
    $inactivePayment = $inactiveStudent->studentSemesterPayments()->first();

    expect((float) $activePayment->total_semester_fee)->toBe(8000.00);
    expect((float) $inactivePayment->total_semester_fee)->toBe(8000.00);

    // update program fee
    $program->update(['semester_fee' => 9000]);
    $program->programFees()->where('year_level', 1)->update(['semester_fee' => 9000]);

    // run fix command
    Artisan::call('app:fix-student-payment-fees');

    $activePayment->refresh();
    $inactivePayment->refresh();

    // active student should be corrected
    expect((float) $activePayment->total_semester_fee)->toBe(9000.00);
    // inactive student must remain unchanged
    expect((float) $inactivePayment->total_semester_fee)->toBe(8000.00);
});

it('does not recalc a dropped student payment when program fee changes and page is viewed', function () {
    $program = \App\Models\Program::factory()->create(['semester_fee' => 11000]);
    $program->programFees()->create(['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 11000]);

    // irregular student gets calculated immediately
    $student = Student::factory()->create([
        'program_id' => $program->id,
        'student_type' => 'irregular',
        'status' => 'active',
    ]);

    $year = SchoolSetting::getCurrentAcademicYear();
    $sem = SchoolSetting::getCurrentSemester();

    (new \App\Services\StudentPaymentService)->createSemesterPayment($student, $year, $sem);
    $payment = $student->studentSemesterPayments()->first();

    // payment should have original amount
    $originalFee = (float) $payment->total_semester_fee;
    expect($originalFee)->toBe(11000.00);

    // mark student dropped, change program fee
    $student->update(['status' => 'dropped']);
    $program->update(['semester_fee' => 13000]);
    $program->programFees()->where('year_level', 1)->update(['semester_fee' => 13000]);

    // fetch index via controller as registrar
    $registrar = User::factory()->create(['role' => 'registrar']);
    $response = $this->actingAs($registrar)->get(route('registrar.payments.college.index'));
    $response->assertSuccessful();

    $response->assertInertia(fn (Assert $page) => $page->component('Registrar/Payments/College/Index')
        ->has('payments.data', 1)
        ->where('payments.data.0.total_semester_fee', fn ($value) => is_numeric($value) && (float) $value === (float) $originalFee
        )
    );

    // the payment record should now be finalized since we dropped the student
    $payment->refresh();
    expect($payment->fee_finalized)->toBeTrue();

    // simulate calling the irregular calculate route after fee change; it should
    // return the same fee and not modify the record
    $calcResponse = $this->actingAs($registrar)->getJson(route('registrar.payments.college.calculate-irregular', $payment));
    $calcResponse->assertSuccessful();
    $data = $calcResponse->json();
    expect((float) $data['calculated_balance'])->toBe($originalFee);

    $payment->refresh();
    expect((float) $payment->total_semester_fee)->toBe($originalFee);

    // also verify the show page uses the frozen value
    $showResp = $this->actingAs($registrar)->get(route('registrar.payments.college.show', $student));
    $showResp->assertSuccessful();
    $showResp->assertInertia(fn (Assert $page) => $page->component('Registrar/Payments/College/Show')
        ->has('payments', 1)
        ->where('payments.0.total_semester_fee', fn ($v) => is_numeric($v) && (float) $v === $originalFee)
    );
});

it('also preserves SHS payment fees after drop even if program fee changes', function () {
    $program = \App\Models\Program::factory()->create(['semester_fee' => 7000]);
    $program->programFees()->create(['year_level' => 1, 'fee_type' => 'regular', 'semester_fee' => 7000]);

    $student = Student::factory()->create([
        'education_level' => 'senior_high',
        'program_id' => $program->id,
        'status' => 'active',
    ]);

    // create SHS payment manually to simulate non-voucher record
    $payment = \App\Models\ShsStudentPayment::factory()->create([
        'student_id' => $student->id,
        'academic_year' => SchoolSetting::getCurrentAcademicYear(),
        'total_semester_fee' => 7000,
        'balance' => 7000,
    ]);

    $original = (float) $payment->total_semester_fee;
    expect($original)->toBe(7000.0);

    // drop student and change program fee
    $student->update(['status' => 'dropped']);
    $program->update(['semester_fee' => 9000]);
    $program->programFees()->where('year_level', 1)->update(['semester_fee' => 9000]);

    // run fix command, should skip finalized record (all should be finalized due to drop)
    Artisan::call('app:fix-student-payment-fees');

    $payment->refresh();
    expect((float) $payment->total_semester_fee)->toBe($original);

    // index and show pages should display the frozen amount
    $registrar = User::factory()->create(['role' => 'registrar']);
    $idx = $this->actingAs($registrar)->get(route('registrar.payments.shs.index'));
    $idx->assertSuccessful();
    $idx->assertInertia(fn (Assert $page) => $page->component('Registrar/Payments/Shs/Index')
        ->where('payments.data.0.total_semester_fee', fn ($v) => (float) $v === $original)
    );

    $show = $this->actingAs($registrar)->get(route('registrar.payments.shs.show', $student));
    $show->assertSuccessful();
    $show->assertInertia(fn (Assert $page) => $page->component('Registrar/Payments/Shs/Show')
        ->where('payments.0.total_semester_fee', fn ($v) => (float) $v === $original)
    );
});
