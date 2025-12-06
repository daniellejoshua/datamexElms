<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Registrar;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class RoleBasedDummyDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating 15 dummy users for each role...');

        // Ensure Programs exist
        if (Program::count() === 0) {
            $this->call(ProgramSeeder::class);
        }

        // Ensure Subjects exist
        if (Subject::count() === 0) {
            $this->call(SubjectSeeder::class);
        }

        $programs = Program::all();

        // Create 1 Super Admin
        $this->command->info('Creating Super Admin...');
        for ($i = 1; $i <= 1; $i++) {
            $email = 'superadmin'.$i.'@datamex.edu.ph';
            if (! User::where('email', $email)->exists()) {
                User::create([
                    'name' => fake()->name(),
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'super_admin',
                    'email_verified_at' => now(),
                ]);
            }
        }

        // Create 1 Registrar
        $this->command->info('Creating Registrar...');
        for ($i = 1; $i <= 1; $i++) {
            $email = 'registrar'.$i.'@datamex.edu.ph';
            if (! User::where('email', $email)->exists()) {
                $user = User::create([
                    'name' => fake()->name(),
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'registrar',
                    'email_verified_at' => now(),
                ]);

                $firstName = fake()->firstName();
                $lastName = fake()->lastName();

                Registrar::create([
                    'user_id' => $user->id,
                    'employee_number' => 'REG'.str_pad($i, 3, '0', STR_PAD_LEFT),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => fake()->optional()->firstName(),
                    'department' => fake()->randomElement(['Academic Records', 'Student Services', 'Admissions', 'Finance']),
                    'position' => fake()->randomElement(['Registrar I', 'Registrar II', 'Senior Registrar', 'Chief Registrar']),
                    'hire_date' => fake()->dateTimeBetween('2018-01-01', '2024-12-31')->format('Y-m-d'),
                    'status' => 'active',
                ]);
            }
        }

        // Create 1 Head Teacher
        $this->command->info('Creating Head Teacher...');
        for ($i = 1; $i <= 1; $i++) {
            $email = 'headteacher'.$i.'@datamex.edu.ph';
            if (! User::where('email', $email)->exists()) {
                $user = User::create([
                    'name' => fake()->name(),
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'head_teacher',
                    'email_verified_at' => now(),
                ]);

                $educationLevel = fake()->randomElement(['college', 'shs']);
                $departments = $educationLevel === 'college'
                    ? ['Computer Science', 'Information Technology', 'Business Administration', 'Engineering']
                    : ['Senior High School - STEM', 'Senior High School - ABM', 'Senior High School - HUMSS', 'Senior High School - GAS'];

                $firstName = fake()->firstName();
                $lastName = fake()->lastName();

                Teacher::create([
                    'user_id' => $user->id,
                    'employee_number' => 'HT'.str_pad($i, 3, '0', STR_PAD_LEFT),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => fake()->optional()->firstName(),
                    'department' => fake()->randomElement($departments),
                    'specialization' => $this->getSpecialization($educationLevel),
                    'hire_date' => fake()->dateTimeBetween('2015-01-01', '2024-12-31')->format('Y-m-d'),
                    'status' => 'active',
                ]);
            }
        }

        // Create 5 Regular Teachers
        $this->command->info('Creating Teachers...');
        for ($i = 1; $i <= 5; $i++) {
            $email = 'teacher'.$i.'@datamex.edu.ph';
            if (! User::where('email', $email)->exists()) {
                $user = User::create([
                    'name' => fake()->name(),
                    'email' => $email,
                    'password' => Hash::make('password123'),
                    'role' => 'teacher',
                    'email_verified_at' => now(),
                ]);

                $educationLevel = fake()->randomElement(['college', 'shs']);
                $departments = $educationLevel === 'college'
                    ? ['Computer Science', 'Information Technology', 'Business Administration', 'Engineering']
                    : ['Senior High School - STEM', 'Senior High School - ABM', 'Senior High School - HUMSS', 'Senior High School - GAS'];

                $firstName = fake()->firstName();
                $lastName = fake()->lastName();

                Teacher::create([
                    'user_id' => $user->id,
                    'employee_number' => 'T'.str_pad($i, 3, '0', STR_PAD_LEFT),
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => fake()->optional()->firstName(),
                    'department' => fake()->randomElement($departments),
                    'specialization' => $this->getSpecialization($educationLevel),
                    'hire_date' => fake()->dateTimeBetween('2018-01-01', '2024-12-31')->format('Y-m-d'),
                    'status' => 'active',
                ]);
            }
        }

        // Create 5 Students for each program
        $this->command->info('Creating Students...');
        foreach ($programs as $program) {
            for ($i = 1; $i <= 5; $i++) {
                $firstName = fake()->firstName();
                $lastName = fake()->lastName();
                $yearLevel = fake()->numberBetween(1, 4);

                $user = User::create([
                    'name' => $firstName.' '.$lastName,
                    'email' => strtolower($program->program_code.$i.'.'.$firstName.'.'.$lastName).'@student.datamex.edu.ph',
                    'password' => Hash::make('password123'),
                    'role' => 'student',
                    'email_verified_at' => now(),
                ]);

                $student = Student::create([
                    'user_id' => $user->id,
                    'student_number' => $program->program_code.'-'.date('Y').'-'.str_pad(($programs->search($program) * 5) + $i + rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'program_id' => $program->id,
                    'current_year_level' => $yearLevel,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'middle_name' => fake()->optional()->firstName(),
                    'education_level' => $program->education_level,
                    'student_type' => fake()->randomElement(['regular', 'irregular']),
                    'status' => 'active',
                    'phone' => fake()->numerify('09#########'),
                    'address' => fake()->address(),
                    'birth_date' => fake()->dateTimeBetween('1995-01-01', '2006-12-31')->format('Y-m-d'),
                    'parent_contact' => fake()->numerify('09#########'),
                    'enrolled_date' => fake()->dateTimeBetween('2024-06-01', '2024-08-31')->format('Y-m-d'),
                ]);

                // Ensure payment records for the current academic year
                $student->ensurePaymentRecords('2024-2025', '1st');
                $student->ensurePaymentRecords('2024-2025', '2nd');
            }
        }

        // Create some sections and enroll students
        $this->command->info('Creating sections and enrollments...');
        foreach ($programs as $program) {
            for ($yearLevel = 1; $yearLevel <= 4; $yearLevel++) {
                $sectionsCount = fake()->numberBetween(1, 2); // 1-2 sections per year level

                for ($s = 1; $s <= $sectionsCount; $s++) {
                    $sectionName = chr(64 + $s); // A, B

                    $section = Section::create([
                        'section_name' => $sectionName,
                        'program_id' => $program->id,
                        'year_level' => $yearLevel,
                        'academic_year' => '2024-2025',
                        'semester' => '1st',
                        'status' => 'active',
                    ]);

                    // Assign subjects to section
                    $subjects = Subject::where('education_level', $program->education_level)
                        ->where('year_level', $yearLevel)
                        ->take(fake()->numberBetween(4, 7))
                        ->get();

                    foreach ($subjects as $subject) {
                        SectionSubject::create([
                            'section_id' => $section->id,
                            'subject_id' => $subject->id,
                            'status' => 'active',
                        ]);
                    }

                    // Enroll some students in this section (about 60% of students)
                    $students = Student::where('program_id', $program->id)
                        ->where('current_year_level', $yearLevel)
                        ->take(fake()->numberBetween(2, 4))
                        ->get();

                    $headTeacher = Teacher::whereHas('user', function ($query) {
                        $query->where('role', 'head_teacher');
                    })->first();
                    $enrolledBy = $headTeacher ? $headTeacher->user_id : User::where('role', 'super_admin')->first()->id;

                    foreach ($students as $student) {
                        $enrollment = StudentEnrollment::create([
                            'student_id' => $student->id,
                            'section_id' => $section->id,
                            'enrollment_date' => fake()->dateTimeBetween('2024-08-01', '2024-09-30')->format('Y-m-d'),
                            'enrolled_by' => $enrolledBy,
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
                                'enrolled_by' => $enrolledBy,
                            ]);
                        }
                    }
                }
            }
        }

        $this->command->info('Role-based dummy data creation completed!');
        $this->command->line('');
        $this->command->info('Summary:');
        $this->command->line('- Super Admins: '.User::where('role', 'super_admin')->count());
        $this->command->line('- Registrars: '.User::where('role', 'registrar')->count());
        $this->command->line('- Head Teachers: '.User::where('role', 'head_teacher')->count());
        $this->command->line('- Teachers: '.User::where('role', 'teacher')->count());
        $this->command->line('- Students: '.User::where('role', 'student')->count());
        $this->command->line('- Total Users: '.User::count());
        $this->command->line('- Sections: '.Section::count());
        $this->command->line('- Student Enrollments: '.StudentEnrollment::count());
        $this->command->line('');
        $this->command->info('Login Credentials:');
        $this->command->line('All users have password: password123');
        $this->command->line('Email patterns:');
        $this->command->line('- Super Admin: superadmin1@datamex.edu.ph');
        $this->command->line('- Registrar: registrar1@datamex.edu.ph');
        $this->command->line('- Head Teacher: headteacher1@datamex.edu.ph');
        $this->command->line('- Teachers: teacher1@datamex.edu.ph to teacher5@datamex.edu.ph');
        $this->command->line('- Students: [program_code][number].[firstname].[lastname]@student.datamex.edu.ph');
    }

    /**
     * Get specialization based on education level
     */
    private function getSpecialization(string $educationLevel): string
    {
        if ($educationLevel === 'college') {
            return fake()->randomElement([
                'Software Engineering, Database Systems',
                'Network Security, Systems Administration',
                'Web Development, Mobile App Development',
                'Data Science, Machine Learning',
                'Business Management, Finance',
                'Accounting, Auditing',
                'Marketing, Entrepreneurship',
                'Engineering Design, Project Management',
            ]);
        } else {
            return fake()->randomElement([
                'Mathematics, Statistics',
                'Science, Research Methods',
                'English, Communication',
                'Social Studies, History',
                'Business, Economics',
                'Arts, Creative Writing',
                'Physical Education, Health',
                'Computer Literacy, Digital Arts',
            ]);
        }
    }
}
