<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Registrar;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\TeacherAssignment;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComprehensiveDummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating comprehensive dummy data...');

        // Create Super Admin
        $superAdmin = User::create([
            'name' => 'System Administrator',
            'email' => 'admin@datamex.edu.ph',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        // Create Admin Users (using super_admin role since admin doesn't exist)
        $admin1 = User::create([
            'name' => 'Maria Santos',
            'email' => 'maria.santos@datamex.edu.ph',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        $admin2 = User::create([
            'name' => 'Jose Reyes',
            'email' => 'jose.reyes@datamex.edu.ph',
            'password' => Hash::make('admin123'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        // Create Registrars
        $registrar1 = User::create([
            'name' => 'Anna Cruz',
            'email' => 'anna.cruz@datamex.edu.ph',
            'password' => Hash::make('registrar123'),
            'role' => 'registrar',
            'email_verified_at' => now(),
        ]);

        Registrar::create([
            'user_id' => $registrar1->id,
            'employee_id' => 'REG001',
            'department' => 'Academic Records',
            'hire_date' => '2022-08-15',
        ]);

        $registrar2 = User::create([
            'name' => 'Patricia Gonzales',
            'email' => 'patricia.gonzales@datamex.edu.ph',
            'password' => Hash::make('registrar123'),
            'role' => 'registrar',
            'email_verified_at' => now(),
        ]);

        Registrar::create([
            'user_id' => $registrar2->id,
            'employee_id' => 'REG002',
            'department' => 'Student Services',
            'hire_date' => '2023-01-10',
        ]);

        // Create Head Teachers
        $headTeacher1 = User::create([
            'name' => 'Dr. Robert Martinez',
            'email' => 'robert.martinez@datamex.edu.ph',
            'password' => Hash::make('teacher123'),
            'role' => 'head_teacher',
            'email_verified_at' => now(),
        ]);

        Teacher::create([
            'user_id' => $headTeacher1->id,
            'employee_id' => 'HT001',
            'department' => 'Computer Science',
            'specialization' => 'Software Engineering, Database Systems',
            'hire_date' => '2020-06-01',
            'education_level' => 'college',
        ]);

        $headTeacher2 = User::create([
            'name' => 'Prof. Jennifer Lopez',
            'email' => 'jennifer.lopez@datamex.edu.ph',
            'password' => Hash::make('teacher123'),
            'role' => 'head_teacher',
            'email_verified_at' => now(),
        ]);

        Teacher::create([
            'user_id' => $headTeacher2->id,
            'employee_id' => 'HT002',
            'department' => 'Senior High School',
            'specialization' => 'STEM, Mathematics',
            'hire_date' => '2019-08-15',
            'education_level' => 'shs',
        ]);

        // Create Regular Teachers
        $teacherData = [
            ['name' => 'Prof. Michael Garcia', 'email' => 'michael.garcia@datamex.edu.ph', 'dept' => 'Computer Science', 'spec' => 'Programming, Web Development', 'level' => 'college'],
            ['name' => 'Dr. Sarah Johnson', 'email' => 'sarah.johnson@datamex.edu.ph', 'dept' => 'Information Technology', 'spec' => 'Network Security, Systems Administration', 'level' => 'college'],
            ['name' => 'Prof. Carlos Rivera', 'email' => 'carlos.rivera@datamex.edu.ph', 'dept' => 'Computer Science', 'spec' => 'Data Structures, Algorithms', 'level' => 'college'],
            ['name' => 'Ms. Diana Flores', 'email' => 'diana.flores@datamex.edu.ph', 'dept' => 'Senior High School', 'spec' => 'Mathematics, Statistics', 'level' => 'shs'],
            ['name' => 'Mr. James Wilson', 'email' => 'james.wilson@datamex.edu.ph', 'dept' => 'Senior High School', 'spec' => 'Science, Research', 'level' => 'shs'],
            ['name' => 'Prof. Lisa Chen', 'email' => 'lisa.chen@datamex.edu.ph', 'dept' => 'Senior High School', 'spec' => 'Business, Entrepreneurship', 'level' => 'shs'],
        ];

        foreach ($teacherData as $index => $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make('teacher123'),
                'role' => 'teacher',
                'email_verified_at' => now(),
            ]);

            Teacher::create([
                'user_id' => $user->id,
                'employee_id' => 'T'.str_pad($index + 1, 3, '0', STR_PAD_LEFT),
                'department' => $data['dept'],
                'specialization' => $data['spec'],
                'hire_date' => fake()->dateTimeBetween('2019-01-01', '2023-12-31')->format('Y-m-d'),
                'education_level' => $data['level'],
            ]);
        }

        // Ensure Programs exist
        if (Program::count() === 0) {
            $this->call(ProgramSeeder::class);
        }

        // Ensure Subjects exist
        if (Subject::count() === 0) {
            $this->call(SubjectSeeder::class);
        }

        $programs = Program::all();

        // Create Students
        $this->command->info('Creating student dummy data...');

        foreach ($programs as $program) {
            // Create 15 students per program
            for ($i = 1; $i <= 15; $i++) {
                $firstName = fake()->firstName();
                $lastName = fake()->lastName();
                $yearLevel = fake()->numberBetween(1, 4);

                $user = User::create([
                    'name' => $firstName.' '.$lastName,
                    'email' => strtolower($firstName.'.'.$lastName.$i).'@student.datamex.edu.ph',
                    'password' => Hash::make('student123'),
                    'role' => 'student',
                    'email_verified_at' => now(),
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'student_number' => $program->program_code.'-'.date('Y').'-'.str_pad($i, 4, '0', STR_PAD_LEFT),
                    'program_id' => $program->id,
                    'current_year_level' => $yearLevel,
                    'education_level' => $program->education_level,
                    'student_type' => fake()->randomElement(['regular', 'irregular']),
                    'enrollment_status' => 'active',
                    'contact_number' => fake()->numerify('09#########'),
                    'address' => fake()->address(),
                    'birth_date' => fake()->dateTimeBetween('1995-01-01', '2005-12-31')->format('Y-m-d'),
                    'gender' => fake()->randomElement(['male', 'female']),
                    'emergency_contact' => fake()->name(),
                    'emergency_phone' => fake()->numerify('09#########'),
                ]);

                // Create payment records for active students
                $academicYear = '2024-2025';
                $semesters = ['1st', '2nd'];

                foreach ($semesters as $semester) {
                    $tuitionFee = $program->education_level === 'college' ? 25000 : 15000;
                    $miscFee = 5000;
                    $labFee = fake()->randomElement([2000, 3000, 0]);
                    $totalAmount = $tuitionFee + $miscFee + $labFee;
                    $amountPaid = fake()->randomElement([0, $totalAmount / 2, $totalAmount]);

                    StudentSemesterPayment::create([
                        'student_id' => $student->id,
                        'academic_year' => $academicYear,
                        'semester' => $semester,
                        'education_level' => $program->education_level,
                        'tuition_fee' => $tuitionFee,
                        'miscellaneous_fee' => $miscFee,
                        'laboratory_fee' => $labFee,
                        'total_amount' => $totalAmount,
                        'amount_paid' => $amountPaid,
                        'balance' => max(0, $totalAmount - $amountPaid),
                        'payment_status' => $amountPaid >= $totalAmount ? 'paid' : ($amountPaid > 0 ? 'partial' : 'pending'),
                        'due_date' => fake()->dateTimeBetween('now', '+3 months')->format('Y-m-d'),
                    ]);
                }
            }
        }

        // Create Sections and Enrollments
        $this->command->info('Creating sections and enrollments...');

        foreach ($programs as $program) {
            // Create 2-3 sections per year level
            for ($yearLevel = 1; $yearLevel <= 4; $yearLevel++) {
                $sectionsCount = fake()->numberBetween(2, 3);

                for ($s = 1; $s <= $sectionsCount; $s++) {
                    $sectionName = chr(64 + $s); // A, B, C

                    $section = Section::create([
                        'section_name' => $sectionName,
                        'program_id' => $program->id,
                        'year_level' => $yearLevel,
                        'academic_year' => '2024-2025',
                        'semester' => '1st',
                        'max_students' => fake()->numberBetween(25, 35),
                        'status' => 'active',
                    ]);

                    // Assign subjects to section
                    $subjects = Subject::where('education_level', $program->education_level)
                        ->where('year_level', $yearLevel)
                        ->take(fake()->numberBetween(5, 8))
                        ->get();

                    foreach ($subjects as $subject) {
                        SectionSubject::create([
                            'section_id' => $section->id,
                            'subject_id' => $subject->id,
                            'academic_year' => '2024-2025',
                            'semester' => '1st',
                            'status' => 'active',
                        ]);
                    }

                    // Enroll some students in this section
                    $students = Student::where('program_id', $program->id)
                        ->where('current_year_level', $yearLevel)
                        ->take(fake()->numberBetween(15, 25))
                        ->get();

                    foreach ($students as $student) {
                        $enrollment = StudentEnrollment::create([
                            'student_id' => $student->id,
                            'section_id' => $section->id,
                            'enrollment_date' => fake()->dateTimeBetween('2024-08-01', '2024-09-30')->format('Y-m-d'),
                            'enrolled_by' => $headTeacher1->id,
                            'status' => 'active',
                            'academic_year' => '2024-2025',
                            'semester' => '1st',
                        ]);

                        // Enroll student in section subjects
                        $sectionSubjects = SectionSubject::where('section_id', $section->id)->get();
                        foreach ($sectionSubjects as $sectionSubject) {
                            StudentSubjectEnrollment::create([
                                'student_id' => $student->id,
                                'section_subject_id' => $sectionSubject->id,
                                'enrollment_date' => $enrollment->enrollment_date,
                                'academic_year' => '2024-2025',
                                'semester' => '1st',
                                'status' => 'active',
                            ]);
                        }
                    }
                }
            }
        }

        // Assign teachers to sections
        $this->command->info('Assigning teachers to sections...');

        $teachers = Teacher::with('user')->get();
        $sections = Section::with('sectionSubjects.subject')->get();

        foreach ($sections as $section) {
            foreach ($section->sectionSubjects as $sectionSubject) {
                // Find appropriate teacher based on education level and subject
                $availableTeachers = $teachers->filter(function ($teacher) use ($section) {
                    return $teacher->education_level === $section->program->education_level;
                });

                if ($availableTeachers->isNotEmpty()) {
                    $teacher = $availableTeachers->random();

                    TeacherAssignment::create([
                        'teacher_id' => $teacher->id,
                        'section_subject_id' => $sectionSubject->id,
                        'academic_year' => '2024-2025',
                        'semester' => '1st',
                        'status' => 'active',
                        'assigned_by' => $headTeacher1->id,
                        'assigned_date' => fake()->dateTimeBetween('2024-07-01', '2024-08-31')->format('Y-m-d'),
                    ]);
                }
            }
        }

        $this->command->info('Comprehensive dummy data creation completed!');
        $this->command->line('');
        $this->command->info('Created Users:');
        $this->command->line('Super Admin: admin@datamex.edu.ph / admin123');
        $this->command->line('Super Admins: maria.santos@datamex.edu.ph / admin123, jose.reyes@datamex.edu.ph / admin123');
        $this->command->line('Registrars: anna.cruz@datamex.edu.ph / registrar123, patricia.gonzales@datamex.edu.ph / registrar123');
        $this->command->line('Head Teachers: robert.martinez@datamex.edu.ph / teacher123, jennifer.lopez@datamex.edu.ph / teacher123');
        $this->command->line('Teachers: Various teachers with email pattern: firstname.lastname@datamex.edu.ph / teacher123');
        $this->command->line('Students: Various students with email pattern: firstname.lastname#@student.datamex.edu.ph / student123');
        $this->command->line('');
        $this->command->info('Total Created:');
        $this->command->line('- '.User::where('role', 'super_admin')->count().' Super Admins');
        $this->command->line('- '.User::where('role', 'registrar')->count().' Registrars');
        $this->command->line('- '.User::where('role', 'head_teacher')->count().' Head Teachers');
        $this->command->line('- '.User::where('role', 'teacher')->count().' Teachers');
        $this->command->line('- '.User::where('role', 'student')->count().' Students');
        $this->command->line('- '.Section::count().' Sections');
        $this->command->line('- '.StudentEnrollment::count().' Student Enrollments');
        $this->command->line('- '.TeacherAssignment::count().' Teacher Assignments');
    }
}
