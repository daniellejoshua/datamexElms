<?php

use App\Models\Curriculum;
// Registrar model isn't used in tests; use a User with role 'registrar' instead
// use App\Models\Registrar;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

beforeEach(function () {
    // Registrar model isn't present in the codebase for tests, create a user
    // with 'registrar' role directly for authentication in tests.
    $this->user = User::factory()->create(['role' => 'registrar']);
    $this->program = Program::factory()->create([
        'education_level' => 'college',
        // Ensure program_code uniqueness across test runs/environments
        'program_code' => 'TST-'.uniqid(),
    ]);
    // Ensure there's at least one curriculum for the program so sections can reference it
    $this->curriculum = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => true,
        'status' => 'active',
    ]);

    $this->section = Section::factory()->create([
        'program_id' => $this->program->id,
        'curriculum_id' => $this->curriculum->id,
    ]);
});

it('displays student registration form', function () {
    $this->actingAs($this->user);

    $response = $this->get(route('registrar.students.create'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page
        ->component('Registrar/Students/Create')
        ->has('programs')
        ->has('currentAcademicYear')
        ->has('currentSemester')
    );
});

it('registers a new student with all required information', function () {
    // Set current semester to 1st to allow new student enrollment
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $studentData = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => 'Smith',
        'birth_date' => '2000-01-15',
        'address' => '123 Main St, City',
        'phone' => '09123456789',
        'email' => 'john.doe.'.uniqid().'@example.com',
        'parent_contact' => '09987654321',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 5000.00,
        'payment_amount' => 2000.00,
        'confirm_course_shift' => false,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);
    $responseErrors = session('errors') ? session('errors')->getBag('default')->getMessages() : [];
    if (! empty($responseErrors)) {
        $this->fail('Registration returned errors: '.json_encode($responseErrors));
    }

    $response->assertRedirect(route('registrar.students'));
    $response->assertSessionHas('success');

    // Assert user account was created
    $this->assertDatabaseHas('users', [
        'email' => $studentData['email'],
        'role' => 'student',
        'is_active' => true,
    ]);

    // Assert student record was created
    $student = Student::where('first_name', 'John')
        ->where('last_name', 'Doe')
        ->first();

    expect($student)->not->toBeNull();
    expect($student->student_type)->toBe('regular');
    expect($student->status)->toBe('active');
    expect($student->student_number)->toContain('COL');

    // Assert payment record was created
    $payment = StudentSemesterPayment::where('student_id', $student->id)->first();
    expect($payment)->not->toBeNull();
    expect((float) $payment->enrollment_fee)->toBe(5000.00);
    expect((float) $payment->total_paid)->toBe(2000.00);
    expect((float) $payment->balance)->toBe(3000.00);
    expect($payment->status)->toBe('partial');
});

it('charges SHS Grade 12 new student and does not apply voucher', function () {
    // Set current semester to 1st so student qualifies as new SHS
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $shsProgram = Program::factory()->create(['education_level' => 'senior_high']);

    $studentData = [
        'first_name' => 'SHS',
        'last_name' => 'Grade12',
        'birth_date' => '2008-07-01',
        'address' => '123 SHS St',
        'phone' => '09120001122',
        'email' => 'shs.grade12.'.uniqid().'@example.com',
        'parent_contact' => '09330004455',
        'program_id' => $shsProgram->id,
        'year_level' => 'Grade 12',
        'student_type' => 'regular',
        'education_level' => 'senior_high',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 12000.00,
        'payment_amount' => 6000.00,
        'confirm_course_shift' => false,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);
    $response->assertRedirect(route('registrar.students'));
    $response->assertSessionHas('success');

    $student = Student::where('last_name', 'Grade12')->first();
    expect($student)->not->toBeNull();
    expect($student->education_level)->toBe('senior_high');

    $payment = StudentSemesterPayment::where('student_id', $student->id)->first();
    expect($payment)->not->toBeNull();
    expect((float) $payment->enrollment_fee)->toBe(12000.00);
    expect((float) $payment->total_paid)->toBe(6000.00);
    expect((float) $payment->balance)->toBe(6000.00);
});

it('registers an irregular student', function () {
    // Set current semester to 1st to allow new student enrollment
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $studentData = [
        'first_name' => 'Jane',
        'last_name' => 'Smith',
        'middle_name' => null,
        'birth_date' => '1999-05-20',
        'address' => '456 Oak Ave',
        'phone' => '09111222333',
        'email' => 'jane.smith.'.uniqid().'@example.com',
        'parent_contact' => '09444555666',
        'program_id' => $this->program->id,
        'year_level' => '2nd Year',
        'student_type' => 'irregular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 4500.00,
        'payment_amount' => 4500.00,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertRedirect(route('registrar.students'));

    $student = Student::where('first_name', 'Jane')
        ->where('last_name', 'Smith')
        ->first();

    expect($student)->not->toBeNull();
    expect($student->student_type)->toBe('irregular');

    // Assert fully paid enrollment
    $payment = StudentSemesterPayment::where('student_id', $student->id)->first();
    expect($payment)->not->toBeNull();
    expect((float) $payment->enrollment_fee)->toBe(4500.00);
    expect((float) $payment->total_paid)->toBe(4500.00);
    expect((float) $payment->balance)->toBe(0.00);
    expect($payment->enrollment_paid)->toBeTrue();
    expect($payment->status)->toBe('completed');
});

it('returns normalized year_level label for existing student check', function () {
    $this->actingAs($this->user);

    $student = Student::factory()->create([
        'student_number' => 'TEST-COL-0001',
        'current_year_level' => 3,
        'education_level' => 'college',
        'program_id' => $this->program->id,
    ]);

    $response = $this->getJson(route('api.students.check', ['student_number' => $student->student_number]));
    $response->assertSuccessful();

    $payload = $response->json();
    expect($payload['exists'])->toBeTrue();
    expect($payload['student']['year_level'])->toBe('3rd Year');

    // SHS mapping
    $shsProgram = Program::factory()->create(['education_level' => 'senior_high']);
    $shsStudent = Student::factory()->create([
        'student_number' => 'TEST-SHS-0001',
        'current_year_level' => 11,
        'education_level' => 'senior_high',
        'program_id' => $shsProgram->id,
    ]);

    $resp2 = $this->getJson(route('api.students.check', ['student_number' => $shsStudent->student_number]));
    $resp2->assertSuccessful();
    expect($resp2->json('student.year_level'))->toBe('Grade 11');
});

it('creates user account with password123 as default password', function () {
    // Set current semester to 1st to allow new student enrollment
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $studentData = [
        'first_name' => 'Test',
        'last_name' => 'Student',
        'middle_name' => null,
        'birth_date' => '2001-03-10',
        'address' => '123 Test St, City',
        'phone' => '09123456789',
        'email' => 'test.student.'.uniqid().'@example.com',
        'parent_contact' => '09987654321',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 3000.00,
        'payment_amount' => 1000.00,
        'confirm_course_shift' => false,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertRedirect(route('registrar.students'));
    $response->assertSessionHas('success');

    $user = User::where('email', $studentData['email'])->first();
    expect(Hash::check('password123', $user->password))->toBeTrue();
});

it('generates unique student numbers', function () {
    // Set current semester to 1st to allow new student enrollment
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $studentData1 = [
        'first_name' => 'Student',
        'last_name' => 'One',
        'middle_name' => null,
        'birth_date' => '2000-01-01',
        'email' => 'student1@example.com',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_fee' => 5000.00,
        'payment_amount' => 5000.00,
    ];

    $studentData2 = [
        'first_name' => 'Student',
        'last_name' => 'Two',
        'middle_name' => null,
        'birth_date' => '2000-02-02',
        'email' => 'student2@example.com',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_fee' => 5000.00,
        'payment_amount' => 5000.00,
    ];

    $this->post(route('registrar.students.store'), $studentData1);
    $this->post(route('registrar.students.store'), $studentData2);

    $student1 = Student::where('first_name', 'Student')
        ->where('last_name', 'One')
        ->first();
    $student2 = Student::where('first_name', 'Student')
        ->where('last_name', 'Two')
        ->first();

    expect($student1->student_number)->not->toBe($student2->student_number);
    expect($student1->student_number)->toContain(date('Y'));
    expect($student2->student_number)->toContain(date('Y'));
});

it('validates required fields', function () {
    $this->actingAs($this->user);

    $response = $this->post(route('registrar.students.store'), []);

    $response->assertSessionHasErrors([
        'first_name',
        'last_name',
        'birth_date',
        'email',
        'program_id',
        'year_level',
        'student_type',
        'education_level',
        'enrollment_fee',
        'payment_amount',
    ]);
});

it('accepts enrollment fee for transferee determined regular', function () {
    // Ensure first semester so transferees are allowed
    SchoolSetting::setCurrentAcademicPeriod('2024-2025', '1st');

    $this->actingAs($this->user);

    $studentData = [
        'first_name' => 'Transferee',
        'last_name' => 'Regularized',
        'birth_date' => '2000-06-15',
        'email' => 'transferee.regularized.'.uniqid().'@example.com',
        'program_id' => $this->program->id,
        'year_level' => '2nd Year',
        'student_type' => 'regular',
        'enrollment_type' => 'transferee',
        'education_level' => 'college',
        'enrollment_fee' => 4500.00,
        'payment_amount' => 0.00,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertRedirect(route('registrar.students'));
    $response->assertSessionHas('success');

    $student = Student::whereHas('user', fn ($q) => $q->where('email', $studentData['email']))->first();
    expect($student)->not->toBeNull();
    expect($student->student_type)->toBe('regular');

    $payment = StudentSemesterPayment::where('student_id', $student->id)->first();
    expect($payment)->not->toBeNull();
    expect((float) $payment->enrollment_fee)->toBe(4500.00);
});

it('assigns older curriculum to transfer student when batch matches', function () {
    $this->actingAs($this->user);

    // Set current academic period to a known value
    SchoolSetting::setCurrentAcademicPeriod('2025-2026', '1st');

    // Create older and current curricula for the program
    $old = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => false,
        'status' => 'active',
    ]);

    $current = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => true,
        'status' => 'active',
    ]);

    // Create program-curriculum mappings with academic_year values
    \App\Models\ProgramCurriculum::create([
        'program_id' => $this->program->id,
        'curriculum_id' => $old->id,
        'academic_year' => '2023-2024',
    ]);

    \App\Models\ProgramCurriculum::create([
        'program_id' => $this->program->id,
        'curriculum_id' => $current->id,
        'academic_year' => '2025-2026',
    ]);

    // Register a new transfer student who is entering 3rd Year
    $studentData = [
        'first_name' => 'Transferee',
        'last_name' => 'OldBatch',
        'middle_name' => null,
        'birth_date' => '2000-01-01',
        'email' => 'transferee.oldbatch.'.uniqid().'@example.com',
        'program_id' => $this->program->id,
        'year_level' => '3rd Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_fee' => 4000.00,
        'payment_amount' => 0.00,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertRedirect(route('registrar.students'));

    $student = Student::whereHas('user', fn ($query) => $query->where('email', $studentData['email']))->first();

    expect($student)->not->toBeNull();
    // The student should be assigned to the older curriculum that started in 2023
    expect($student->curriculum_id)->toBe($old->id);
    // Batch year should be the start year string (e.g., '2023')
    expect($student->batch_year)->toBe('2023');
});

it('assigns cohort majority curriculum to transfer student when no program mapping exists', function () {
    $this->actingAs($this->user);

    // Set current academic period to a known value
    SchoolSetting::setCurrentAcademicPeriod('2025-2026', '1st');

    // Create older and current curricula for the program
    $old = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => false,
        'status' => 'active',
    ]);

    $current = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => true,
        'status' => 'active',
    ]);

    // Only map the current curriculum (for 2025-2026), leave no mapping for 2024
    \App\Models\ProgramCurriculum::create([
        'program_id' => $this->program->id,
        'curriculum_id' => $current->id,
        'academic_year' => '2025-2026',
    ]);

    // Create cohort students (2nd Year) that use the older curriculum (batch_year = 2024)
    Student::factory()->count(3)->create([
        'program_id' => $this->program->id,
        'curriculum_id' => $old->id,
        'batch_year' => '2024',
        'current_year_level' => 2,
    ]);

    // Register a new transfer student who is entering 2nd Year
    $email = 'cohort.transferee+'.uniqid().'@example.com';
    $studentData = [
        'first_name' => 'CohortTransferee',
        'last_name' => 'Match',
        'middle_name' => null,
        'birth_date' => '2001-01-01',
        'email' => $email,
        'program_id' => $this->program->id,
        'year_level' => '2nd Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_fee' => 4000.00,
        'payment_amount' => 0.00,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertRedirect(route('registrar.students'));

    $student = Student::whereHas('user', fn ($q) => $q->where('email', $email))->first();

    expect($student)->not->toBeNull();
    // Should match the old curriculum used by cohort members
    expect($student->curriculum_id)->toBe($old->id);
    expect($student->batch_year)->toBe('2024');
});

it('program::matchCurriculumForTransferee returns cohort curriculum when present', function () {
    // Create an older curriculum and some cohort students
    $old = Curriculum::factory()->create([
        'program_id' => $this->program->id,
        'is_current' => false,
        'status' => 'active',
    ]);

    Student::factory()->count(4)->create([
        'program_id' => $this->program->id,
        'curriculum_id' => $old->id,
        'batch_year' => '2024',
        'current_year_level' => 2,
    ]);

    $found = $this->program->matchCurriculumForTransferee(2, '2024');

    expect($found)->not->toBeNull();
    expect($found->id)->toBe($old->id);
});

it('validates email uniqueness', function () {
    $this->actingAs($this->user);

    // Create existing user
    $existingUser = User::factory()->create(['email' => 'existing.'.uniqid().'@example.com']);
    expect(User::where('email', $existingUser->email)->exists())->toBeTrue();

    $studentData = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => null,
        'birth_date' => '2000-01-15',
        'email' => $existingUser->email,
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'enrollment_fee' => 5000.00,
        'payment_amount' => 2000.00,
    ];

    $response = $this->post(route('registrar.students.store'), $studentData);

    $response->assertSessionHasErrors(['email']);
});

it('calculates enrollment balance correctly', function () {
    $this->actingAs($this->user);

    $testCases = [
        ['fee' => 10000.00, 'payment' => 5000.00, 'expected_balance' => 5000.00, 'expected_status' => 'partial'],
        ['fee' => 3000.00, 'payment' => 3000.00, 'expected_balance' => 0.00, 'expected_status' => 'completed'],
        ['fee' => 8000.00, 'payment' => 0.00, 'expected_balance' => 8000.00, 'expected_status' => 'pending'],
    ];

    foreach ($testCases as $index => $testCase) {
        $studentData = [
            'first_name' => "Test{$index}",
            'last_name' => "Student{$index}",
            'middle_name' => null,
            'birth_date' => '2000-01-01',
            'email' => "test{$index}@example.com",
            'program_id' => $this->program->id,
            'year_level' => '1st Year',
            'student_type' => 'regular',
            'education_level' => 'college',
            'enrollment_fee' => $testCase['fee'],
            'payment_amount' => $testCase['payment'],
        ];

        $this->post(route('registrar.students.store'), $studentData);

        $student = Student::whereHas('user', fn ($query) => $query->where('email', "test{$index}@example.com")
        )->first();

        $payment = StudentSemesterPayment::where('student_id', $student->id)->first();

        expect((float) $payment->balance)->toBe($testCase['expected_balance']);
        expect($payment->status)->toBe($testCase['expected_status']);
    }
});

it('only allows registrars to access registration form', function () {
    $student = Student::factory()->create();

    $this->actingAs($student->user);

    $response = $this->get(route('registrar.students.create'));

    $response->assertForbidden();
});

it('prevents duplicate enrollment in the same semester', function () {
    $this->actingAs($this->user);

    // Create a student first
    $studentData = [
        'first_name' => 'John',
        'last_name' => 'Doe',
        'middle_name' => 'Middle',
        'birth_date' => '2000-01-01',
        'address' => '123 Main St, City, Province',
        'phone' => '1234567890',
        'email' => 'john.doe.'.uniqid().'@example.com',
        'parent_contact' => '0987654321',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 1000,
        'payment_amount' => 1000,
        'confirm_course_shift' => false,
    ];

    // First enrollment should succeed
    $this->post(route('registrar.students.store'), $studentData)
        ->assertRedirect(route('registrar.students'))
        ->assertSessionHas('success');

    // Get the created student
    $student = Student::whereHas('user', fn ($query) => $query->where('email', $studentData['email']))->first();
    expect($student)->not->toBeNull();

    // Verify that enrollment record was created
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    $enrollment = StudentEnrollment::where([
        'student_id' => $student->id,
        'academic_year' => $academicYear,
        'semester' => $semester,
    ])->first();

    expect($enrollment)->not->toBeNull();
    expect($enrollment->status)->toBe('active');
    expect($enrollment->section_id)->toBeNull(); // Should be null initially

    // Create an enrollment record for the current semester to simulate existing enrollment
    $academicYear = SchoolSetting::getCurrentAcademicYear();
    $semester = SchoolSetting::getCurrentSemester();

    StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $this->section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => $academicYear,
        'semester' => $semester,
        'enrolled_by' => $this->user->id,
    ]);

    // Try to enroll the same student again in the same semester
    // Even though they paid their balance, they should still be blocked
    // because they're already enrolled in the current semester
    $studentData['student_number'] = $student->student_number;
    $response = $this->post(route('registrar.students.store'), $studentData);

    // Should redirect back with error
    $response->assertRedirect()
        ->assertSessionHasErrors(['student']);

    // Check that the error message mentions duplicate enrollment
    $response->assertSessionHasErrors([
        'student' => "Student is already enrolled in the current semester ({$academicYear} - {$semester}). Cannot enroll again.",
    ]);
});

it('prevents duplicate enrollment when using email lookup', function () {
    $this->actingAs($this->user);

    // Create a student first
    $studentData = [
        'first_name' => 'Alice',
        'last_name' => 'Wonder',
        'middle_name' => 'Middle',
        'birth_date' => '2000-01-01',
        'address' => '123 Wonderland St, City, Province',
        'phone' => '1234567890',
        'email' => 'alice.wonder.'.uniqid().'@example.com',
        'parent_contact' => '0987654321',
        'program_id' => $this->program->id,
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 1000,
        'payment_amount' => 1000,
        'confirm_course_shift' => false,
    ];

    // First enrollment should succeed
    $this->post(route('registrar.students.store'), $studentData)
        ->assertRedirect(route('registrar.students'))
        ->assertSessionHas('success');

    // Get the created student
    $student = Student::whereHas('user', fn ($query) => $query->where('email', $studentData['email']))->first();
    expect($student)->not->toBeNull();

    // Now try to enroll the same student again using the same email (without student_number)
    // This should find the existing student and prevent duplicate enrollment
    $response = $this->post(route('registrar.students.store'), $studentData);

    // Should redirect back with error
    $response->assertRedirect()
        ->assertSessionHasErrors(['student']);

    // Check that the error message mentions duplicate enrollment
    $currentSemester = SchoolSetting::getCurrentSemester();
    $response->assertSessionHasErrors([
        'student' => "Student is already enrolled in the current semester (2025-2026 - {$currentSemester}). Cannot enroll again.",
    ]);
});

it('marks student as irregular when shifting courses', function () {
    $this->actingAs($this->user);

    // Create another program for testing course shifting
    $differentProgram = Program::factory()->create([
        'program_name' => 'Different Program',
        'program_code' => 'DIFF3-'.uniqid(),
        'education_level' => 'college',
    ]);

    // Create a student who was enrolled in a previous semester with one program
    $student = Student::factory()->create([
        'program_id' => $this->program->id,
        'student_type' => 'regular',
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'status' => 'active',
    ]);

    // Create an enrollment record for a previous semester (not current)
    StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'academic_year' => '2024-2025', // Previous academic year
        'semester' => '2nd', // Previous semester
    ]);

    // Now try to enroll the same student in the current semester with a different program
    $studentData = [
        'first_name' => $student->first_name,
        'last_name' => $student->last_name,
        'middle_name' => $student->middle_name,
        'birth_date' => $student->birth_date->format('Y-m-d'),
        'address' => $student->address,
        'phone' => $student->phone,
        'email' => $student->user->email,
        'parent_contact' => $student->parent_contact,
        'program_id' => $differentProgram->id, // Different program - this should trigger course shifting
        'year_level' => '1st Year',
        'student_type' => 'regular', // Will be changed to irregular by the controller
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 1000,
        'payment_amount' => 1000,
        'student_number' => $student->student_number, // Use existing student number
        'confirm_course_shift' => true, // Confirm the course shift
    ];

    $response = $this->post(route('registrar.students.store'), $studentData)
        ->assertRedirect(route('registrar.students'))
        ->assertSessionHas('success');

    // Check that the student was updated and marked as irregular
    $updatedStudent = Student::find($student->id);
    expect($updatedStudent->student_type)->toBe('irregular'); // Should now be irregular
    expect($updatedStudent->program_id)->toBe($differentProgram->id); // Should have new program

    // Check that success message mentions course shifting
    $response->assertSessionHas('success', fn ($message) => str_contains($message, 'course shifting'));
});

it('requires confirmation for course shifting', function () {
    $this->actingAs($this->user);

    // Create another program for testing course shifting
    $differentProgram = Program::factory()->create([
        'program_name' => 'Different Program',
        'program_code' => 'DIFF4-'.uniqid(),
        'education_level' => 'college',
    ]);

    // Create a student who was enrolled in a previous semester with one program
    $student = Student::factory()->create([
        'program_id' => $this->program->id,
        'student_type' => 'regular',
        'year_level' => '1st Year',
        'current_year_level' => 1,
        'status' => 'active',
    ]);

    // Create an enrollment record for a previous semester (not current)
    StudentEnrollment::factory()->create([
        'student_id' => $student->id,
        'academic_year' => '2024-2025', // Previous academic year
        'semester' => '2nd', // Previous semester
    ]);

    // Try to enroll the same student in a different program without confirmation
    $studentData = [
        'first_name' => $student->first_name,
        'last_name' => $student->last_name,
        'middle_name' => $student->middle_name,
        'birth_date' => $student->birth_date->format('Y-m-d'),
        'address' => $student->address,
        'phone' => $student->phone,
        'email' => $student->user->email,
        'parent_contact' => $student->parent_contact,
        'program_id' => $differentProgram->id, // Different program - this should trigger course shifting
        'year_level' => '1st Year',
        'student_type' => 'regular',
        'education_level' => 'college',
        'track' => null,
        'strand' => null,
        'enrollment_fee' => 1000,
        'payment_amount' => 1000,
        'student_number' => $student->student_number,
        'confirm_course_shift' => false, // No confirmation
    ];

    $response = $this->post(route('registrar.students.store'), $studentData)
        ->assertInertia(fn ($page) => $page
            ->component('Registrar/Students/Create')
            ->has('course_shift_required')
            ->where('course_shift_required.current_program', $this->program->program_name)
            ->where('course_shift_required.new_program', $differentProgram->program_name)
        );

    // Check that the student was NOT marked as irregular
    $unchangedStudent = Student::find($student->id);
    expect($unchangedStudent->student_type)->toBe('regular'); // Should still be regular
    expect($unchangedStudent->program_id)->toBe($this->program->id); // Should still have original program
});
