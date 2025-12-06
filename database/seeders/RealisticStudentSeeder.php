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

class RealisticStudentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing programs and sections
        $programs = Program::all();
        $sections = Section::with('program')->where('status', 'active')->get();

        if ($programs->isEmpty() || $sections->isEmpty()) {
            $this->command->error('Please run ProgramSeeder and create sections first');

            return;
        }

        // Clear existing student data
        $this->command->info('Clearing existing student data...');
        StudentSemesterPayment::where('id', '>', 0)->delete();
        StudentSubjectEnrollment::where('id', '>', 0)->delete();
        StudentEnrollment::where('id', '>', 0)->delete();
        Student::where('id', '>', 0)->delete();
        User::where('role', 'student')->delete();

        $this->command->info('Creating realistic student data...');

        $collegeStudents = $this->createCollegeStudents($programs, $sections);
        $shsStudents = $this->createSHSStudents($programs, $sections);

        $this->command->info('Created '.count($collegeStudents).' college students');
        $this->command->info('Created '.count($shsStudents).' SHS students');

        // Create enrollments and payments
        $this->createEnrollmentsAndPayments($collegeStudents, $sections);
        $this->createEnrollmentsAndPayments($shsStudents, $sections);

        $this->command->info('Student data seeding completed successfully!');
    }

    private function createCollegeStudents($programs, $sections)
    {
        $students = [];
        $collegePrograms = $programs->whereIn('education_level', ['college', 'both']);

        foreach ($collegePrograms as $program) {
            for ($year = 1; $year <= $program->total_years; $year++) {
                // Regular students (majority)
                for ($i = 1; $i <= 25; $i++) {
                    $user = User::create([
                        'name' => fake()->firstName().' '.fake()->lastName(),
                        'email' => fake()->unique()->safeEmail(),
                        'password' => Hash::make('password123'),
                        'role' => 'student',
                        'email_verified_at' => now(),
                    ]);

                    $students[] = Student::create([
                        'user_id' => $user->id,
                        'student_number' => 'C'.date('Y').str_pad(count($students) + 1, 4, '0', STR_PAD_LEFT),
                        'program_id' => $program->id,
                        'current_year_level' => $year,
                        'year_level' => (string) $year,
                        'first_name' => explode(' ', $user->name)[0],
                        'last_name' => explode(' ', $user->name)[1] ?? 'Unknown',
                        'middle_name' => fake()->optional()->firstName(),
                        'birth_date' => fake()->dateTimeBetween('-25 years', '-18 years'),
                        'address' => fake()->address(),
                        'phone' => fake()->phoneNumber(),
                        'parent_contact' => fake()->phoneNumber(),
                        'student_type' => 'regular',
                        'education_level' => 'college',
                        'status' => 'active',
                        'enrolled_date' => fake()->dateTimeBetween('-2 years', 'now'),
                    ]);
                }

                // Irregular students (5-10% of total)
                for ($i = 1; $i <= rand(2, 4); $i++) {
                    $user = User::create([
                        'name' => fake()->firstName().' '.fake()->lastName(),
                        'email' => fake()->unique()->safeEmail(),
                        'password' => Hash::make('password123'),
                        'role' => 'student',
                        'email_verified_at' => now(),
                    ]);

                    $students[] = Student::create([
                        'user_id' => $user->id,
                        'student_number' => 'C'.date('Y').str_pad(count($students) + 1, 4, '0', STR_PAD_LEFT),
                        'program_id' => $program->id,
                        'current_year_level' => $year,
                        'year_level' => (string) $year,
                        'first_name' => explode(' ', $user->name)[0],
                        'last_name' => explode(' ', $user->name)[1] ?? 'Unknown',
                        'middle_name' => fake()->optional()->firstName(),
                        'birth_date' => fake()->dateTimeBetween('-25 years', '-18 years'),
                        'address' => fake()->address(),
                        'phone' => fake()->phoneNumber(),
                        'parent_contact' => fake()->phoneNumber(),
                        'student_type' => 'irregular',
                        'education_level' => 'college',
                        'status' => 'active',
                        'enrolled_date' => fake()->dateTimeBetween('-2 years', 'now'),
                    ]);
                }
            }
        }

        return $students;
    }

    private function createSHSStudents($programs, $sections)
    {
        $students = [];
        $shsPrograms = $programs->whereIn('education_level', ['shs', 'both']);

        foreach ($shsPrograms as $program) {
            for ($year = 11; $year <= 12; $year++) { // SHS is Grade 11-12
                // Regular SHS students
                for ($i = 1; $i <= 20; $i++) {
                    $user = User::create([
                        'name' => fake()->firstName().' '.fake()->lastName(),
                        'email' => fake()->unique()->safeEmail(),
                        'password' => Hash::make('password123'),
                        'role' => 'student',
                        'email_verified_at' => now(),
                    ]);

                    $track = fake()->randomElement(['STEM', 'ABM', 'HUMSS', 'GAS']);
                    $strand = $this->getStrandByTrack($track);

                    $students[] = Student::create([
                        'user_id' => $user->id,
                        'student_number' => 'S'.date('Y').str_pad(count($students) + 1, 4, '0', STR_PAD_LEFT),
                        'program_id' => $program->id,
                        'current_year_level' => $year,
                        'year_level' => (string) $year,
                        'first_name' => explode(' ', $user->name)[0],
                        'last_name' => explode(' ', $user->name)[1] ?? 'Unknown',
                        'middle_name' => fake()->optional()->firstName(),
                        'birth_date' => fake()->dateTimeBetween('-19 years', '-16 years'),
                        'address' => fake()->address(),
                        'phone' => fake()->phoneNumber(),
                        'parent_contact' => fake()->phoneNumber(),
                        'student_type' => 'regular',
                        'education_level' => 'shs',
                        'track' => $track,
                        'strand' => $strand,
                        'status' => 'active',
                        'enrolled_date' => fake()->dateTimeBetween('-2 years', 'now'),
                    ]);
                }
            }
        }

        return $students;
    }

    private function getStrandByTrack($track)
    {
        $strands = [
            'STEM' => ['Science, Technology, Engineering, and Mathematics'],
            'ABM' => ['Accountancy, Business, and Management'],
            'HUMSS' => ['Humanities and Social Sciences'],
            'GAS' => ['General Academic Strand'],
        ];

        return $strands[$track][0] ?? 'General Academic Strand';
    }

    private function createEnrollmentsAndPayments($students, $sections)
    {
        foreach ($students as $student) {
            // Find appropriate sections for this student
            $studentSections = $sections->where('program_id', $student->program_id)
                ->where('year_level', $student->current_year_level);

            if ($studentSections->isEmpty()) {
                continue;
            }

            // Regular students get assigned to sections, irregular students don't
            if ($student->student_type === 'regular') {
                $section = $studentSections->random();

                // Create enrollment
                StudentEnrollment::create([
                    'student_id' => $student->id,
                    'section_id' => $section->id,
                    'enrollment_date' => fake()->dateTimeBetween('-1 month', 'now'),
                    'status' => 'active',
                    'academic_year' => '2024-2025',
                    'semester' => '1st',
                    'enrolled_by' => 1, // Assuming admin user ID is 1
                ]);

                // Enroll in section subjects
                $sectionSubjects = SectionSubject::where('section_id', $section->id)->get();
                foreach ($sectionSubjects as $sectionSubject) {
                    StudentSubjectEnrollment::create([
                        'student_id' => $student->id,
                        'section_subject_id' => $sectionSubject->id,
                        'enrollment_type' => 'regular',
                        'academic_year' => '2024-2025',
                        'semester' => '1st',
                        'status' => 'active',
                        'enrollment_date' => fake()->dateTimeBetween('-1 month', 'now'),
                        'enrolled_by' => 1,
                    ]);
                }
            } else {
                // Irregular students - enroll in random subjects without section assignment
                $allSectionSubjects = SectionSubject::whereHas('section', function ($q) use ($student) {
                    $q->where('program_id', $student->program_id);
                })->take(rand(3, 6))->get();

                foreach ($allSectionSubjects as $sectionSubject) {
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

            // Create payment records
            $this->createPaymentRecord($student);
        }
    }

    private function createPaymentRecord($student)
    {
        $totalFee = $student->education_level === 'college' ?
            fake()->numberBetween(25000, 40000) :
            fake()->numberBetween(15000, 25000);

        $enrollmentFee = $totalFee * 0.30; // 30% down payment
        $termFee = ($totalFee - $enrollmentFee) / 4; // Remaining split into 4 terms

        // Randomize payment progress
        $paymentProgress = fake()->randomElement([
            'enrolled_only',
            'prelim_paid',
            'midterm_paid',
            'prefinal_paid',
            'fully_paid',
        ]);

        $payment = StudentSemesterPayment::create([
            'student_id' => $student->id,
            'academic_year' => '2024-2025',
            'semester' => '1st',
            'enrollment_fee' => $enrollmentFee,
            'enrollment_paid' => true,
            'enrollment_payment_date' => fake()->dateTimeBetween('-2 months', '-1 month'),
            'prelim_amount' => $termFee,
            'prelim_paid' => in_array($paymentProgress, ['prelim_paid', 'midterm_paid', 'prefinal_paid', 'fully_paid']),
            'prelim_payment_date' => in_array($paymentProgress, ['prelim_paid', 'midterm_paid', 'prefinal_paid', 'fully_paid']) ?
                fake()->dateTimeBetween('-1 month', 'now') : null,
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
                fake()->dateTimeBetween('-1 month', 'now') : null,
            'irregular_subject_fee' => $student->student_type === 'irregular' ? 500 : 0,
            'irregular_subjects_count' => $student->student_type === 'irregular' ? rand(1, 3) : 0,
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
