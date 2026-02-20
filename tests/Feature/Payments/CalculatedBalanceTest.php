<?php

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentSemesterPayment;
use App\Models\User;
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

    $response->assertInertia(fn (Assert $page) =>
        $page->component('Registrar/Payments/College/Index')
            ->has('payments')
            ->where('payments.data.0.calculated_total_amount', fn ($v) => is_numeric($v))
    );
});