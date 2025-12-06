<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\StudentSubjectEnrollment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class FocusedStudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Clear existing student data
        $this->command->info('Clearing existing student data...');
        StudentSemesterPayment::where('id', '>', 0)->delete();
        StudentSubjectEnrollment::where('id', '>', 0)->delete();
        StudentEnrollment::where('id', '>', 0)->delete();
        Student::where('id', '>', 0)->delete();
        User::where('role', 'student')->delete();

        $this->command->info('Creating focused student data (10 students per program)...');

        // Get existing programs and ensure we have proper sections
        $programs = Program::where('education_level', 'college')->get();

        if ($programs->isEmpty()) {
            $this->command->error('No college programs found. Please run ProgramSeeder first.');

            return;
        }

        $studentCounter = 1;

        foreach ($programs as $program) {
            $this->command->info("Creating students for {$program->name}...");

            // Create 10 students per program (8 regular + 2 irregular)
            for ($i = 1; $i <= 10; $i++) {
                $isIrregular = $i > 8; // Last 2 students are irregular
                $yearLevel = $isIrregular ? rand(2, 4) : (($i - 1) % 4) + 1; // Mix year levels for irregular

                $firstName = fake()->firstName();
                $lastName = fake()->lastName();
                $fullName = "$firstName $lastName";

                // Create user
                $user = User::create([
                    'name' => $fullName,
                    'email' => strtolower(str_replace(' ', '.', $fullName)).$studentCounter.'@test.com',
                    'password' => Hash::make('password123'),
                    'role' => 'student',
                    'email_verified_at' => now(),
                ]);

                // Create student
                $student = Student::create([
                    'user_id' => $user->id,
                    'student_number' => $program->program_code.date('y').str_pad($studentCounter, 3, '0', STR_PAD_LEFT),
                    'program_id' => $program->id,
                    'current_year_level' => $yearLevel,
                    'year_level' => (string) $yearLevel,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => fake()->optional(0.3)->firstName(),
                    'birth_date' => fake()->dateTimeBetween('-25 years', '-18 years'),
                    'address' => fake()->address(),
                    'phone' => fake()->phoneNumber(),
                    'parent_contact' => fake()->phoneNumber(),
                    'student_type' => $isIrregular ? 'irregular' : 'regular',
                    'education_level' => 'college',
                    'status' => 'active',
                    'enrolled_date' => fake()->dateTimeBetween('-1 year', 'now'),
                ]);

                // Create or get section for this student
                if (! $isIrregular) {
                    $section = $this->getOrCreateSection($program, $yearLevel, $i);
                    $this->createRegularStudentEnrollment($student, $section);
                } else {
                    $this->createIrregularStudentEnrollment($student, $program);
                }

                // Create payment record
                $this->createPaymentRecord($student, $isIrregular);

                $studentCounter++;
            }
        }

        $totalStudents = Student::count();
        $regularCount = Student::where('student_type', 'regular')->count();
        $irregularCount = Student::where('student_type', 'irregular')->count();

        $this->command->info("Created {$totalStudents} students total:");
        $this->command->info("- {$regularCount} regular students with sections");
        $this->command->info("- {$irregularCount} irregular students");
        $this->command->info('Focused student data seeding completed successfully!');
    }

    private function getOrCreateSection($program, $yearLevel, $studentIndex)
    {
        // Create unique sections: A, B, C, D, etc. for variety
        $sectionLetter = chr(65 + (($studentIndex - 1) % 4)); // A, B, C, D rotation

        $section = Section::where([
            'program_id' => $program->id,
            'year_level' => $yearLevel,
            'section_name' => $sectionLetter,
            'academic_year' => '2024-2025',
            'semester' => '1st',
        ])->first();

        if (! $section) {
            $section = Section::create([
                'program_id' => $program->id,
                'year_level' => $yearLevel,
                'section_name' => $sectionLetter,
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'status' => 'active',
            ]);

            // Create some sample section subjects for this section
            $this->createSectionSubjects($section);
        }

        return $section;
    }

    private function createSectionSubjects($section)
    {
        // Get some subjects for this year level
        $subjects = \App\Models\Subject::where('year_level', $section->year_level)->take(5)->get();
        $teachers = \App\Models\Teacher::take(3)->get();

        if ($subjects->isEmpty() || $teachers->isEmpty()) {
            return; // Skip if no subjects or teachers available
        }

        foreach ($subjects as $index => $subject) {
            SectionSubject::create([
                'section_id' => $section->id,
                'subject_id' => $subject->id,
                'teacher_id' => $teachers->random()->id,
                'room' => 'Room '.(201 + $index),
                'schedule_days' => fake()->randomElement(['Monday,Wednesday', 'Tuesday,Thursday', 'Friday']),
                'start_time' => fake()->randomElement(['08:00', '10:00', '13:00', '15:00']),
                'end_time' => fake()->randomElement(['09:30', '11:30', '14:30', '16:30']),
                'status' => 'active',
            ]);
        }
    }

    private function createRegularStudentEnrollment($student, $section)
    {
        // Create enrollment in section
        $enrollment = StudentEnrollment::create([
            'student_id' => $student->id,
            'section_id' => $section->id,
            'enrollment_date' => fake()->dateTimeBetween('-2 months', '-1 month'),
            'status' => 'active',
            'academic_year' => '2024-2025',
            'semester' => '1st',
            'enrolled_by' => 1, // Assuming admin user ID is 1
        ]);

        // Enroll in all section subjects
        $sectionSubjects = SectionSubject::where('section_id', $section->id)->get();
        foreach ($sectionSubjects as $sectionSubject) {
            StudentSubjectEnrollment::create([
                'student_id' => $student->id,
                'section_subject_id' => $sectionSubject->id,
                'enrollment_type' => 'regular',
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'status' => 'active',
                'enrollment_date' => $enrollment->enrollment_date,
                'enrolled_by' => 1,
            ]);
        }
    }

    private function createIrregularStudentEnrollment($student, $program)
    {
        // Find some section subjects from this program (for irregular enrollment)
        $availableSectionSubjects = SectionSubject::whereHas('section', function ($q) use ($program) {
            $q->where('program_id', $program->id);
        })->take(rand(3, 5))->get();

        foreach ($availableSectionSubjects as $sectionSubject) {
            StudentSubjectEnrollment::create([
                'student_id' => $student->id,
                'section_subject_id' => $sectionSubject->id,
                'enrollment_type' => 'irregular',
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'status' => 'active',
                'enrollment_date' => fake()->dateTimeBetween('-1 month', 'now'),
                'enrolled_by' => 1,
            ]);
        }
    }

    private function createPaymentRecord($student, $isIrregular)
    {
        $baseFee = 30000; // Base fee for college students
        $irregularSubjectFee = $isIrregular ? 500 : 0;
        $irregularSubjectsCount = $isIrregular ? rand(3, 5) : 0;
        $totalFee = $baseFee + ($irregularSubjectsCount * $irregularSubjectFee);

        $enrollmentFee = $totalFee * 0.30; // 30% down payment
        $termFee = ($totalFee - $enrollmentFee) / 4; // Remaining split into 4 terms

        // Create realistic payment progress
        $paymentStatuses = ['enrolled_only', 'prelim_paid', 'midterm_paid', 'prefinal_paid', 'fully_paid'];
        $paymentProgress = fake()->randomElement($paymentStatuses);

        $payment = StudentSemesterPayment::create([
            'student_id' => $student->id,
            'academic_year' => '2024-2025',
            'semester' => '1st',
            'enrollment_fee' => $enrollmentFee,
            'enrollment_paid' => true,
            'enrollment_payment_date' => fake()->dateTimeBetween('-3 months', '-2 months'),
            'prelim_amount' => $termFee,
            'prelim_paid' => in_array($paymentProgress, ['prelim_paid', 'midterm_paid', 'prefinal_paid', 'fully_paid']),
            'prelim_payment_date' => in_array($paymentProgress, ['prelim_paid', 'midterm_paid', 'prefinal_paid', 'fully_paid']) ?
                fake()->dateTimeBetween('-2 months', '-1 month') : null,
            'midterm_amount' => $termFee,
            'midterm_paid' => in_array($paymentProgress, ['midterm_paid', 'prefinal_paid', 'fully_paid']),
            'midterm_payment_date' => in_array($paymentProgress, ['midterm_paid', 'prefinal_paid', 'fully_paid']) ?
                fake()->dateTimeBetween('-1 month', 'now') : null,
            'prefinal_amount' => $termFee,
            'prefinal_paid' => in_array($paymentProgress, ['prefinal_paid', 'fully_paid']),
            'prefinal_payment_date' => in_array($paymentProgress, ['prefinal_paid', 'fully_paid']) ?
                fake()->dateTimeBetween('-1 month', 'now') : null,
            'final_amount' => $termFee,
            'final_paid' => $paymentProgress === 'fully_paid',
            'final_payment_date' => $paymentProgress === 'fully_paid' ?
                fake()->dateTimeBetween('-2 weeks', 'now') : null,
            'irregular_subject_fee' => $irregularSubjectFee,
            'irregular_subjects_count' => $irregularSubjectsCount,
            'total_semester_fee' => $totalFee,
            'payment_plan' => fake()->randomElement(['installment', 'full']),
            'status' => $paymentProgress === 'fully_paid' ? 'completed' :
                       ($paymentProgress === 'enrolled_only' ? 'pending' : 'partial'),
        ]);

        // Update calculated fields
        $payment->total_paid = $payment->calculateTotalPaid();
        $payment->balance = $payment->calculateBalance();
        $payment->save();
    }
}
