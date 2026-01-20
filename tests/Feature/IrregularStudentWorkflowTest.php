<?php

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentCreditTransfer;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    // Create a registrar user
    $this->registrar = User::factory()->create([
        'name' => 'Test Registrar',
        'email' => 'registrar@test.com',
        'role' => 'registrar',
    ]);

    // Create a teacher user
    $teacherUser = User::factory()->create([
        'name' => 'Test Teacher',
        'email' => 'teacher@test.com',
        'role' => 'teacher',
    ]);

    $this->teacher = Teacher::factory()->create([
        'user_id' => $teacherUser->id,
    ]);

    // Create programs
    $this->bsbaProgram = Program::factory()->create([
        'program_code' => 'BSBA-'.fake()->unique()->randomNumber(5),
        'program_name' => 'Bachelor of Science in Business Administration',
        'education_level' => 'college',
    ]);

    $this->bsitProgram = Program::factory()->create([
        'program_code' => 'BSIT-'.fake()->unique()->randomNumber(5),
        'program_name' => 'Bachelor of Science in Information Technology',
        'education_level' => 'college',
    ]);

    // Create curricula
    $this->bsbaCurriculum = Curriculum::factory()->create([
        'curriculum_name' => 'BSBA Curriculum 2025',
        'curriculum_code' => 'BSBA-2025-'.fake()->unique()->randomNumber(5),
        'program_id' => $this->bsbaProgram->id,
        'is_current' => true,
    ]);

    $this->bsitCurriculum = Curriculum::factory()->create([
        'curriculum_name' => 'BSIT Curriculum 2025',
        'curriculum_code' => 'BSIT-2025-'.fake()->unique()->randomNumber(5),
        'program_id' => $this->bsitProgram->id,
        'is_current' => true,
    ]);

    // Create subjects
    $this->mathSubject = Subject::factory()->create([
        'subject_code' => 'MATH101',
        'subject_name' => 'College Algebra',
    ]);

    $this->englishSubject = Subject::factory()->create([
        'subject_code' => 'ENG101',
        'subject_name' => 'English Communication',
    ]);

    $this->programmingSubject = Subject::factory()->create([
        'subject_code' => 'IT101',
        'subject_name' => 'Introduction to Programming',
    ]);

    // Add subjects to BSBA curriculum (1st year, 1st semester)
    CurriculumSubject::create([
        'curriculum_id' => $this->bsbaCurriculum->id,
        'subject_id' => $this->mathSubject->id,
        'subject_code' => 'MATH101',
        'subject_name' => 'College Algebra',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    CurriculumSubject::create([
        'curriculum_id' => $this->bsbaCurriculum->id,
        'subject_id' => $this->englishSubject->id,
        'subject_code' => 'ENG101',
        'subject_name' => 'English Communication',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    // Add subjects to BSIT curriculum (1st year, 1st semester)
    CurriculumSubject::create([
        'curriculum_id' => $this->bsitCurriculum->id,
        'subject_id' => $this->mathSubject->id,
        'subject_code' => 'MATH101',
        'subject_name' => 'College Algebra',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    CurriculumSubject::create([
        'curriculum_id' => $this->bsitCurriculum->id,
        'subject_id' => $this->englishSubject->id,
        'subject_code' => 'ENG101',
        'subject_name' => 'English Communication',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);

    CurriculumSubject::create([
        'curriculum_id' => $this->bsitCurriculum->id,
        'subject_id' => $this->programmingSubject->id,
        'subject_code' => 'IT101',
        'subject_name' => 'Introduction to Programming',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
    ]);
});

test('irregular student workflow: curriculum comparison identifies credits and catchups', function () {
    $this->actingAs($this->registrar)->withoutMiddleware();

    // Step 1: Compare curricula for a 2nd year student shifting from BSBA to BSIT
    $response = $this->postJson('/registrar/credit-transfers/compare', [
        'previous_program_id' => $this->bsbaProgram->id,
        'new_program_id' => $this->bsitProgram->id,
        'student_year_level' => 2, // 2nd year student
    ]);

    $response->assertSuccessful();
    $data = $response->json('data');

    // For shiftees, curriculum comparison no longer automatically identifies credits
    // Credits are determined during actual enrollment based on academic history
    expect($data['credited_subjects'])->toHaveCount(0);

    echo "\n✅ PHASE 1: Curriculum comparison successful\n";
    echo '   - Credited subjects: '.count($data['credited_subjects'])."\n";
}); // Commented out RefreshDatabase to prevent data deletion

test('irregular student workflow: credit auto-approved when student passes all grading periods', function () {
    $this->actingAs($this->registrar);

    // Step 1: Create a student user
    $studentUser = User::factory()->create([
        'name' => 'John Doe',
        'email' => 'john@student.com',
        'role' => 'student',
    ]);

    // Step 2: Create student record (shifting from BSBA to BSIT)
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->bsitProgram->id,
        'curriculum_id' => $this->bsitCurriculum->id,
        'previous_program_id' => $this->bsbaProgram->id,
        'previous_curriculum_id' => $this->bsbaCurriculum->id,
        'student_number' => '2026-00001',
        'year_level' => '2nd Year',
        'current_year_level' => 2,
        'student_type' => 'irregular',
        'course_shifted_at' => now(),
    ]);

    // Step 3: Create a PENDING credit transfer for Math
    $creditTransfer = StudentCreditTransfer::create([
        'student_id' => $student->id,
        'previous_program_id' => $this->bsbaProgram->id,
        'new_program_id' => $this->bsitProgram->id,
        'previous_curriculum_id' => $this->bsbaCurriculum->id,
        'new_curriculum_id' => $this->bsitCurriculum->id,
        'subject_id' => $this->mathSubject->id,
        'subject_code' => 'MATH101',
        'subject_name' => 'College Algebra',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
        'transfer_type' => 'shiftee',
        'credit_status' => 'pending', // Initially PENDING
        'fee_adjustment' => -300,
        'approved_by' => $this->registrar->id,
        'approved_at' => now(),
    ]);

    echo "\n✅ PHASE 2: Student registered as irregular with PENDING credit\n";
    echo "   - Student: {$student->first_name} {$student->last_name}\n";
    echo "   - Type: Irregular (Shiftee)\n";
    echo "   - Credit Status: PENDING\n";

    expect($creditTransfer->credit_status)->toBe('pending');

    // Step 4: Create a section and enroll student
    $section = Section::factory()->create([
        'program_id' => $this->bsitProgram->id,
        'section_name' => 'BSIT 2-A',
        'year_level' => 2,
    ]);

    $sectionSubject = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $this->mathSubject->id,
        'teacher_id' => $this->teacher->id,
        'academic_year' => '2025-2026',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'enrollment_date' => now(),
        'status' => 'active',
        'enrolled_by' => $this->registrar->id,
    ]);

    echo "\n✅ PHASE 3: Student enrolled in section\n";
    echo "   - Section: {$section->section_name}\n";
    echo "   - Subject: MATH101\n";

    // Step 5: Teacher submits grades progressively
    $grade = StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $this->teacher->id,
        'prelim_grade' => null,
        'midterm_grade' => null,
        'prefinal_grade' => null,
        'final_grade' => null,
        'semester_grade' => null,
    ]);

    echo "\n✅ PHASE 4: Teacher starts grading...\n";

    // Submit Prelim
    $grade->update(['prelim_grade' => 85, 'prelim_submitted_at' => now()]);
    echo "   - Prelim: 85\n";
    $creditTransfer->refresh();
    expect($creditTransfer->credit_status)->toBe('pending');

    // Submit Midterm
    $grade->update(['midterm_grade' => 88, 'midterm_submitted_at' => now()]);
    echo "   - Midterm: 88\n";
    $creditTransfer->refresh();
    expect($creditTransfer->credit_status)->toBe('pending');

    // Submit Prefinal
    $grade->update(['prefinal_grade' => 82, 'prefinal_submitted_at' => now()]);
    echo "   - Prefinal: 82\n";
    $creditTransfer->refresh();
    expect($creditTransfer->credit_status)->toBe('pending');

    // Submit Final (triggers auto-approval)
    $grade->update([
        'final_grade' => 90,
        'final_submitted_at' => now(),
        'semester_grade' => 86.25,
    ]);

    echo "   - Final: 90\n";
    echo "   - Semester Grade: 86.25\n";

    // Step 6: Verify automatic approval
    $creditTransfer->refresh();

    echo "\n🎉 PHASE 5: AUTOMATIC APPROVAL!\n";
    echo "   - Credit Status: {$creditTransfer->credit_status}\n";

    expect($creditTransfer->credit_status)->toBe('credited');
}); // Commented out RefreshDatabase to prevent data deletion

test('irregular student workflow: credit auto-rejected when student fails', function () {
    $this->actingAs($this->registrar);

    $studentUser = User::factory()->create([
        'name' => 'Jane Smith',
        'email' => 'jane@student.com',
        'role' => 'student',
    ]);

    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->bsitProgram->id,
        'student_number' => '2026-00002',
        'student_type' => 'irregular',
    ]);

    $creditTransfer = StudentCreditTransfer::create([
        'student_id' => $student->id,
        'previous_program_id' => $this->bsbaProgram->id,
        'new_program_id' => $this->bsitProgram->id,
        'previous_curriculum_id' => $this->bsbaCurriculum->id,
        'new_curriculum_id' => $this->bsitCurriculum->id,
        'subject_id' => $this->mathSubject->id,
        'subject_code' => 'MATH101',
        'subject_name' => 'College Algebra',
        'units' => 3,
        'year_level' => 1,
        'semester' => '1st',
        'transfer_type' => 'shiftee',
        'credit_status' => 'pending',
        'fee_adjustment' => -300,
    ]);

    $section = Section::factory()->create([
        'program_id' => $this->bsitProgram->id,
        'year_level' => 2,
    ]);

    $sectionSubject = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $this->mathSubject->id,
        'teacher_id' => $this->teacher->id,
        'academic_year' => '2025-2026',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'academic_year' => '2025-2026',
        'semester' => '1st',
        'enrollment_date' => now(),
        'status' => 'active',
        'enrolled_by' => $this->registrar->id,
    ]);

    $grade = StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $this->teacher->id,
        'prelim_grade' => 50,
        'midterm_grade' => 55,
        'prefinal_grade' => 52,
        'final_grade' => 48,
        'semester_grade' => 51.25, // FAILING (< 60)
    ]);

    echo "\n❌ AUTOMATIC REJECTION (Student Failed)\n";

    $creditTransfer->refresh();

    echo "   - Credit Status: {$creditTransfer->credit_status}\n";

    expect($creditTransfer->credit_status)->toBe('rejected');
}); // Commented out RefreshDatabase to prevent data deletion
