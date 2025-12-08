<?php

namespace Database\Seeders;

use App\Models\ShsStudentPayment;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class RegistrarSampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create sample programs (assuming Program model exists)
        $programs = [
            [
                'program_code' => 'BSIT',
                'program_name' => 'Bachelor of Science in Information Technology',
                'description' => 'A comprehensive program covering software development, systems analysis, and IT management.',
                'total_years' => 4,
                'education_level' => 'college',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'program_code' => 'BSN',
                'program_name' => 'Bachelor of Science in Nursing',
                'description' => 'Professional nursing program preparing students for healthcare careers.',
                'total_years' => 4,
                'education_level' => 'college',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'program_code' => 'BSBA',
                'program_name' => 'Bachelor of Science in Business Administration',
                'description' => 'Business management and administration program.',
                'total_years' => 4,
                'education_level' => 'college',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'program_code' => 'ABM',
                'program_name' => 'Accountancy, Business and Management',
                'description' => 'Senior High School track focusing on business and accounting.',
                'total_years' => 2,
                'education_level' => 'shs',
                'track' => 'Academic Track',
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        // Insert programs
        foreach ($programs as $program) {
            DB::table('programs')->insertOrIgnore($program);
        }

        $programRecords = DB::table('programs')->get();

        // Create sample students with different scenarios
        $studentsData = [
            // Regular students
            [
                'first_name' => 'John',
                'last_name' => 'Doe',
                'middle_name' => 'Michael',
                'email' => 'john.doe@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSIT')->first()->id,
                'student_type' => 'regular',
                'year_level' => 2,
                'semester' => '1',
                'status' => 'enrolled',
            ],
            [
                'first_name' => 'Jane',
                'last_name' => 'Smith',
                'middle_name' => 'Rose',
                'email' => 'jane.smith@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSN')->first()->id,
                'student_type' => 'regular',
                'year_level' => 3,
                'semester' => '1',
                'status' => 'enrolled',
            ],
            // Irregular students
            [
                'first_name' => 'Carlos',
                'last_name' => 'Rodriguez',
                'middle_name' => 'Antonio',
                'email' => 'carlos.rodriguez@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSIT')->first()->id,
                'student_type' => 'irregular',
                'year_level' => 3,
                'semester' => '1',
                'status' => 'enrolled',
            ],
            // Transferee
            [
                'first_name' => 'Maria',
                'last_name' => 'Garcia',
                'middle_name' => 'Elena',
                'email' => 'maria.garcia@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSBA')->first()->id,
                'student_type' => 'transferee',
                'year_level' => 2,
                'semester' => '1',
                'status' => 'enrolled',
            ],
            // SHS students
            [
                'first_name' => 'Alex',
                'last_name' => 'Johnson',
                'middle_name' => 'David',
                'email' => 'alex.johnson@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'ABM')->first()->id,
                'student_type' => 'regular',
                'year_level' => 1,
                'semester' => '1',
                'status' => 'enrolled',
            ],
            // Graduated student
            [
                'first_name' => 'Sarah',
                'last_name' => 'Williams',
                'middle_name' => 'Anne',
                'email' => 'sarah.williams@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSIT')->first()->id,
                'student_type' => 'regular',
                'year_level' => 4,
                'semester' => '2',
                'status' => 'graduated',
            ],
            // Dropped student
            [
                'first_name' => 'Michael',
                'last_name' => 'Brown',
                'middle_name' => 'James',
                'email' => 'michael.brown@student.datamex.edu',
                'program_id' => $programRecords->where('program_code', 'BSN')->first()->id,
                'student_type' => 'regular',
                'year_level' => 1,
                'semester' => '2',
                'status' => 'dropped',
            ],
        ];

        foreach ($studentsData as $studentData) {
            // Check if user already exists
            $existingUser = User::where('email', $studentData['email'])->first();
            if ($existingUser) {
                $this->command->info("User {$studentData['email']} already exists, skipping...");

                continue;
            }

            // Create user account
            $user = User::create([
                'name' => $studentData['first_name'].' '.$studentData['last_name'],
                'email' => $studentData['email'],
                'password' => Hash::make('password123'),
                'role' => 'student',
                'email_verified_at' => now(),
            ]);

            // Generate student number
            $year = date('Y');
            $programCode = $programRecords->where('id', $studentData['program_id'])->first()->program_code;
            $lastStudent = Student::where('student_number', 'like', $year.$programCode.'%')->latest('id')->first();
            $sequence = $lastStudent ? (int) substr($lastStudent->student_number, -4) + 1 : 1;
            $studentNumber = $year.$programCode.str_pad($sequence, 4, '0', STR_PAD_LEFT);

            // Create student record
            $student = Student::create([
                'user_id' => $user->id,
                'student_number' => $studentNumber,
                'first_name' => $studentData['first_name'],
                'last_name' => $studentData['last_name'],
                'middle_name' => $studentData['middle_name'],
                'program_id' => $studentData['program_id'],
                'current_year_level' => $studentData['year_level'],
                'year_level' => (string) $studentData['year_level'],
                'birth_date' => Carbon::now()->subYears(rand(18, 25))->format('Y-m-d'),
                'address' => fake()->address(),
                'phone' => fake()->phoneNumber(),
                'parent_contact' => fake()->phoneNumber(),
                'status' => $studentData['status'] === 'enrolled' ? 'active' : ($studentData['status'] === 'graduated' ? 'graduated' : 'inactive'),
                'student_type' => $studentData['student_type'] === 'transferee' ? 'irregular' : $studentData['student_type'],
                'education_level' => str_contains($programCode, 'ABM') ? 'shs' : 'college',
                'enrolled_date' => Carbon::now()->subDays(rand(1, 60))->format('Y-m-d'),
            ]);

            // Create enrollment record (skip for now due to section requirement)
            // $enrollment = StudentEnrollment::create([
            //     'student_id' => $student->id,
            //     'section_id' => 1, // Would need actual section
            //     'academic_year' => '2024',
            //     'semester' => $studentData['semester'] === '1' ? '1st' : '2nd',
            //     'enrollment_date' => Carbon::now()->subDays(rand(1, 60)),
            //     'enrolled_by' => 1, // Would need actual registrar user
            //     'status' => $studentData['status'] === 'enrolled' ? 'active' : 'dropped',
            // ]);

            // Create payment records based on program type
            $isProgramSHS = str_contains($programCode, 'ABM');

            if ($isProgramSHS) {
                // SHS Payment
                $totalAmount = match ($studentData['student_type']) {
                    'irregular' => 28000,
                    'transferee' => 26000,
                    default => 25000
                };

                $amountPaid = match ($studentData['status']) {
                    'active' => $totalAmount * (rand(0, 8) / 10), // 0-80% paid
                    'graduated' => $totalAmount,
                    'inactive' => $totalAmount * (rand(1, 3) / 10), // 10-30% paid
                    default => 0
                };

                $balance = $totalAmount - $amountPaid;

                // Calculate quarterly payments
                $firstQuarterAmount = $totalAmount * 0.25;
                $secondQuarterAmount = $totalAmount * 0.25;
                $thirdQuarterAmount = $totalAmount * 0.25;
                $fourthQuarterAmount = $totalAmount * 0.25;

                $firstQuarterPaid = $amountPaid >= $firstQuarterAmount;
                $secondQuarterPaid = $amountPaid >= ($firstQuarterAmount + $secondQuarterAmount);
                $thirdQuarterPaid = $amountPaid >= ($firstQuarterAmount + $secondQuarterAmount + $thirdQuarterAmount);
                $fourthQuarterPaid = $amountPaid >= $totalAmount;

                ShsStudentPayment::create([
                    'student_id' => $student->id,
                    'academic_year' => '2024',
                    'semester' => $studentData['semester'] === '1' ? '1st' : '2nd',
                    'first_quarter_amount' => $firstQuarterAmount,
                    'first_quarter_paid' => $firstQuarterPaid,
                    'first_quarter_payment_date' => $firstQuarterPaid ? Carbon::now()->subDays(rand(60, 120)) : null,
                    'second_quarter_amount' => $secondQuarterAmount,
                    'second_quarter_paid' => $secondQuarterPaid,
                    'second_quarter_payment_date' => $secondQuarterPaid ? Carbon::now()->subDays(rand(40, 90)) : null,
                    'third_quarter_amount' => $thirdQuarterAmount,
                    'third_quarter_paid' => $thirdQuarterPaid,
                    'third_quarter_payment_date' => $thirdQuarterPaid ? Carbon::now()->subDays(rand(20, 60)) : null,
                    'fourth_quarter_amount' => $fourthQuarterAmount,
                    'fourth_quarter_paid' => $fourthQuarterPaid,
                    'fourth_quarter_payment_date' => $fourthQuarterPaid ? Carbon::now()->subDays(rand(1, 30)) : null,
                    'total_semester_fee' => $totalAmount,
                    'total_paid' => $amountPaid,
                    'balance' => $balance,
                ]);
            } else {
                // College Payment
                $baseAmount = match ($programCode) {
                    'BSIT' => 35000,
                    'BSN' => 45000,
                    'BSBA' => 30000,
                    default => 32000
                };

                $totalAmount = match ($studentData['student_type']) {
                    'irregular' => $baseAmount * 1.15, // 15% surcharge
                    'transferee' => $baseAmount * 0.9, // 10% discount due to credits
                    default => $baseAmount
                };

                $amountPaid = match ($studentData['status']) {
                    'active' => $totalAmount * (rand(2, 9) / 10), // 20-90% paid
                    'graduated' => $totalAmount,
                    'inactive' => $totalAmount * (rand(1, 4) / 10), // 10-40% paid
                    default => 0
                };

                $balance = $totalAmount - $amountPaid;

                // Calculate periodic payments
                $prelimAmount = $totalAmount * 0.25;
                $midtermAmount = $totalAmount * 0.25;
                $prefinalAmount = $totalAmount * 0.25;
                $finalAmount = $totalAmount * 0.25;

                $prelimPaid = $amountPaid >= $prelimAmount;
                $midtermPaid = $amountPaid >= ($prelimAmount + $midtermAmount);
                $prefinalPaid = $amountPaid >= ($prelimAmount + $midtermAmount + $prefinalAmount);
                $finalPaid = $amountPaid >= $totalAmount;

                StudentSemesterPayment::create([
                    'student_id' => $student->id,
                    'academic_year' => '2024',
                    'semester' => $studentData['semester'] === '1' ? '1st' : '2nd',
                    'prelim_amount' => $prelimAmount,
                    'prelim_paid' => $prelimPaid,
                    'prelim_payment_date' => $prelimPaid ? Carbon::now()->subDays(rand(30, 90)) : null,
                    'midterm_amount' => $midtermAmount,
                    'midterm_paid' => $midtermPaid,
                    'midterm_payment_date' => $midtermPaid ? Carbon::now()->subDays(rand(15, 60)) : null,
                    'prefinal_amount' => $prefinalAmount,
                    'prefinal_paid' => $prefinalPaid,
                    'prefinal_payment_date' => $prefinalPaid ? Carbon::now()->subDays(rand(5, 30)) : null,
                    'final_amount' => $finalAmount,
                    'final_paid' => $finalPaid,
                    'final_payment_date' => $finalPaid ? Carbon::now()->subDays(rand(1, 15)) : null,
                    'total_semester_fee' => $totalAmount,
                    'total_paid' => $amountPaid,
                    'balance' => $balance,
                ]);
            }

            $this->command->info("Created student: {$student->student_number} - {$student->first_name} {$student->last_name} ({$studentData['student_type']})");
        }

        $this->command->info('Sample registrar data created successfully!');
        $this->command->info('');
        $this->command->info('Sample accounts created:');
        $this->command->info('- Regular students: John Doe, Jane Smith');
        $this->command->info('- Irregular student: Carlos Rodriguez');
        $this->command->info('- Transferee: Maria Garcia');
        $this->command->info('- SHS student: Alex Johnson');
        $this->command->info('- Graduated: Sarah Williams');
        $this->command->info('- Dropped: Michael Brown');
        $this->command->info('');
        $this->command->info('All students have login: email / password: password123');
        $this->command->info('Visit /registrar/enrollments to see the data!');
    }
}
