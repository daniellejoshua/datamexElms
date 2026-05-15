<?php

namespace Database\Seeders;

use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSemesterPayment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CourseShiftTestSeeder extends Seeder
{
    /**
     * Seed test students ready for course shifting scenarios.
     */
    public function run(): void
    {
        $this->command->info('Creating test students for course shifting...');

        // Get programs and curricula
        $bsit = Program::where('program_code', 'BSIT')->first();
        $bshm = Program::where('program_code', 'BSHM')->first();

        if (! $bsit || ! $bshm) {
            $this->command->error('BSIT or BSHM programs not found. Run ProgramSeeder first.');

            return;
        }

        $bsitCurriculum = $bsit->currentCurriculum;
        $bshmCurriculum = $bshm->currentCurriculum;

        $academicYear = SchoolSetting::getCurrentAcademicYear();
        $semester = SchoolSetting::getCurrentSemester();

        // Test Student 1: Regular BSIT student (can shift to BSHM)
        $this->createTestStudent([
            'name' => 'Test Shiftee',
            'email' => 'test.shiftee@example.com',
            'student_number' => 'TEST-2025-001',
            'program' => $bsit,
            'curriculum' => $bsitCurriculum,
            'year_level' => '2nd Year',
            'current_year_level' => 2,
            'student_type' => 'regular',
            'has_grades' => true,
            'has_payment' => true,
        ]);

        // Test Student 2: Irregular BSHM student with some failed subjects
        $this->createTestStudent([
            'name' => 'Test Irregular',
            'email' => 'test.irregular@example.com',
            'student_number' => 'TEST-2025-002',
            'program' => $bshm,
            'curriculum' => $bshmCurriculum,
            'year_level' => '1st Year',
            'current_year_level' => 1,
            'student_type' => 'irregular',
            'has_grades' => true,
            'has_payment' => true,
        ]);

        // Test Student 3: Third year BSIT student (can shift to BSHM)
        $this->createTestStudent([
            'name' => 'Test Senior Shiftee',
            'email' => 'test.senior@example.com',
            'student_number' => 'TEST-2025-003',
            'program' => $bsit,
            'curriculum' => $bsitCurriculum,
            'year_level' => '3rd Year',
            'current_year_level' => 3,
            'student_type' => 'regular',
            'has_grades' => true,
            'has_payment' => true,
        ]);

        $this->command->info('✅ Test students created successfully!');
        $this->command->newLine();
        $this->command->info('Test Credentials:');
        $this->command->info('Email: test.shiftee@example.com | Password: password');
        $this->command->info('Email: test.irregular@example.com | Password: password');
        $this->command->info('Email: test.senior@example.com | Password: password');
        $this->command->newLine();
        $this->command->info('Login as registrar and navigate to Students > Create to test course shifting!');
    }

    private function createTestStudent(array $data): void
    {
        $academicYear = SchoolSetting::getCurrentAcademicYear();
        $semester = SchoolSetting::getCurrentSemester();

        // Create user
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make('password'),
            'role' => 'student',
            'is_active' => true,
        ]);

        // Create student
        $student = Student::create([
            'user_id' => $user->id,
            'student_number' => $data['student_number'],
            'first_name' => explode(' ', $data['name'])[0],
            'last_name' => explode(' ', $data['name'])[1] ?? 'Student',
            'program_id' => $data['program']->id,
            'curriculum_id' => $data['curriculum']->id,
            'year_level' => $data['year_level'],
            'current_year_level' => $data['current_year_level'],
            'student_type' => $data['student_type'],
            'education_level' => $data['program']->education_level,
            'status' => 'active',
            'batch_year' => '2024',
            'birth_date' => '2000-01-01',
            'address' => '123 Test Street, Test City',
            'phone' => '09123456789',
        ]);

        // Create enrollment
        if ($data['has_grades']) {
            $adminUser = User::where('role', 'admin')->first();

            $enrollment = StudentEnrollment::create([
                'student_id' => $student->id,
                'section_id' => null,
                'enrollment_date' => now(),
                'status' => 'active',
                'academic_year' => $academicYear,
                'semester' => $semester,
                'enrolled_by' => $adminUser?->id,
            ]);

            // Add some grades
            $subjects = CurriculumSubject::where('curriculum_id', $data['curriculum']->id)
                ->where('year_level', $data['current_year_level'])
                ->where('semester', '1st')
                ->take(5)
                ->get();

            foreach ($subjects as $index => $subject) {
                StudentGrade::create([
                    'student_id' => $student->id,
                    'student_enrollment_id' => $enrollment->id,
                    'subject_id' => $subject->subject_id,
                    'final_grade' => $data['student_type'] === 'irregular' && $index < 2 ? 74 : 85,
                    'completion_status' => $data['student_type'] === 'irregular' && $index < 2 ? 'failed' : 'passed',
                ]);
            }
        }

        // Create payment
        if ($data['has_payment']) {
            StudentSemesterPayment::create([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'enrollment_fee' => 5000,
                'enrollment_paid' => true,
                'enrollment_payment_date' => now(),
                'total_semester_fee' => 5000,
                'payment_plan' => 'full',
            ]);
        }

        $this->command->info("✓ Created {$data['name']} ({$data['student_number']})");
    }
}
