<?php

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;

beforeEach(function () {
    $this->registrar = User::factory()->create(['role' => 'registrar']);
    $teacherUser = User::factory()->create(['role' => 'teacher']);
    $this->teacher = Teacher::factory()->create(['user_id' => $teacherUser->id]);

    $this->program = Program::factory()->create([
        'program_code' => 'BSCS-'.fake()->unique()->randomNumber(5),
        'program_name' => 'Bachelor of Science in Computer Science',
        'education_level' => 'college',
    ]);

    $this->curriculum = Curriculum::factory()->create([
        'curriculum_name' => 'BSCS Curriculum 2026',
        'curriculum_code' => 'BSCS-2026-'.fake()->unique()->randomNumber(5),
        'program_id' => $this->program->id,
        'is_current' => true,
    ]);

    $this->subjects = [];
    $this->curriculumSubjects = [];

    $subjectData = [
        ['code' => 'CS101', 'name' => 'Intro to Programming', 'year' => 1, 'semester' => '1st'],
        ['code' => 'CS102', 'name' => 'Data Structures', 'year' => 1, 'semester' => '2nd'],
        ['code' => 'CS201', 'name' => 'Database Systems', 'year' => 2, 'semester' => '1st'],
    ];

    foreach ($subjectData as $data) {
        $subject = Subject::factory()->create([
            'subject_code' => $data['code'],
            'subject_name' => $data['name'],
        ]);

        $curriculumSubject = CurriculumSubject::create([
            'curriculum_id' => $this->curriculum->id,
            'subject_id' => $subject->id,
            'subject_code' => $data['code'],
            'subject_name' => $data['name'],
            'units' => 3,
            'year_level' => $data['year'],
            'semester' => $data['semester'],
        ]);

        $this->subjects[] = $subject;
        $this->curriculumSubjects[] = $curriculumSubject;
    }
});

test('all students get subject credits tracked automatically', function () {
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->program->id,
        'curriculum_id' => $this->curriculum->id,
        'student_number' => '2026-'.fake()->unique()->randomNumber(5),
        'student_type' => 'regular',
    ]);

    echo "\n📚 SUBJECT CREDIT TRACKING (ALL STUDENTS)\n";
    echo "==========================================\n";
    echo "Student Type: REGULAR (not irregular/transferee)\n";
    echo "Curriculum: 3 subjects required\n\n";

    $section = Section::factory()->create([
        'program_id' => $this->program->id,
        'year_level' => 1,
    ]);

    $sectionSubject = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $this->subjects[0]->id,
        'teacher_id' => $this->teacher->id,
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

    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $this->teacher->id,
        'prelim_grade' => 88,
        'midterm_grade' => 90,
        'prefinal_grade' => 87,
        'final_grade' => 92,
        'semester_grade' => 89.25,
    ]);

    echo "✅ Subject Completed: CS101 (Grade: 89.25)\n";

    $credit = StudentSubjectCredit::where('student_id', $student->id)->first();
    expect($credit)->not->toBeNull();
    expect($credit->credit_status)->toBe('credited');

    echo "✅ Credit automatically created: {$credit->credit_status}\n";
    echo "📊 Completion: {$student->getCurriculumCompletionPercentage()}%\n";
})->uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('student eligible for graduation after completing all subjects', function () {
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $this->program->id,
        'curriculum_id' => $this->curriculum->id,
        'student_number' => '2026-'.fake()->unique()->randomNumber(5),
    ]);

    echo "\n🎓 GRADUATION ELIGIBILITY\n";
    echo "=========================\n";

    foreach ($this->subjects as $index => $subject) {
        $section = Section::factory()->create(['program_id' => $this->program->id, 'year_level' => 1]);
        $sectionSubject = SectionSubject::create([
            'section_id' => $section->id,
            'subject_id' => $subject->id,
            'teacher_id' => $this->teacher->id,
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
        StudentGrade::create([
            'student_enrollment_id' => $enrollment->id,
            'section_subject_id' => $sectionSubject->id,
            'teacher_id' => $this->teacher->id,
            'prelim_grade' => 85, 'midterm_grade' => 87, 'prefinal_grade' => 86, 'final_grade' => 88,
            'semester_grade' => 86.5,
        ]);
        echo "✅ {$subject->subject_code}\n";
    }

    $student = $student->fresh();
    echo "\n🎉 Completion: {$student->getCurriculumCompletionPercentage()}%\n";
    expect($student->isEligibleForGraduation())->toBeTrue();
    echo "✅ ELIGIBLE FOR GRADUATION!\n";
})->uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);
