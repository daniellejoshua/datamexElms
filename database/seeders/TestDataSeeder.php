<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TestDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create Admin User
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => 'super_admin',
            'email_verified_at' => now(),
        ]);

        // Create Teacher Users
        $teacherUsers = [
            ['name' => 'Prof. John Smith', 'email' => 'john.smith@test.com'],
            ['name' => 'Dr. Maria Garcia', 'email' => 'maria.garcia@test.com'],
            ['name' => 'Prof. David Lee', 'email' => 'david.lee@test.com'],
            ['name' => 'Dr. Sarah Johnson', 'email' => 'sarah.johnson@test.com'],
            ['name' => 'Prof. Michael Brown', 'email' => 'michael.brown@test.com'],
        ];

        $teachers = [];
        foreach ($teacherUsers as $userData) {
            $user = User::create([
                'name' => $userData['name'],
                'email' => $userData['email'],
                'password' => Hash::make('password'),
                'role' => 'teacher',
                'email_verified_at' => now(),
            ]);

            $teachers[] = Teacher::create([
                'user_id' => $user->id,
                'employee_number' => 'EMP'.str_pad(count($teachers) + 1, 4, '0', STR_PAD_LEFT),
                'first_name' => explode(' ', $userData['name'])[1] ?? 'John',
                'last_name' => explode(' ', $userData['name'])[2] ?? 'Doe',
                'middle_name' => null,
                'department' => fake()->randomElement(['Computer Science', 'Mathematics', 'Physics', 'Chemistry', 'English']),
                'specialization' => fake()->randomElement(['Programming', 'Database Systems', 'Web Development', 'Data Science']),
                'hire_date' => fake()->dateTimeBetween('-5 years', 'now'),
                'status' => 'active',
            ]);
        }

        // Create Student User
        $student = User::create([
            'name' => 'Test Student',
            'email' => 'student@test.com',
            'password' => Hash::make('password'),
            'role' => 'student',
            'email_verified_at' => now(),
        ]);

        // Get existing programs (assuming they were created by ProgramSeeder)
        $createdPrograms = Program::whereIn('program_code', ['BSCS', 'BSIT', 'STEM', 'ABM'])->get();

        // Create Sections
        $sections = [];
        foreach ($createdPrograms as $program) {
            for ($year = 1; $year <= $program->total_years; $year++) {
                foreach (['A', 'B'] as $sectionName) {
                    $sections[] = Section::create([
                        'program_id' => $program->id,
                        'year_level' => $year,
                        'section_name' => $sectionName,
                        'academic_year' => '2024-2025',
                        'semester' => '1st',
                        'status' => 'active',
                    ]);
                }
            }
        }

        // Create Subjects with different hour requirements
        $existingSubjects = Subject::all();
        $createdSubjects = $existingSubjects; // Use existing subjects

        if ($existingSubjects->isEmpty()) {
            $subjects = [
                // CS Subjects
                ['code' => 'CS101', 'name' => 'Introduction to Programming', 'units' => 3, 'year' => 1, 'type' => 'major'],
                ['code' => 'CS102', 'name' => 'Data Structures', 'units' => 4, 'year' => 1, 'type' => 'major'],
                ['code' => 'CS201', 'name' => 'Object Oriented Programming', 'units' => 3, 'year' => 2, 'type' => 'major'],
                ['code' => 'CS202', 'name' => 'Database Systems', 'units' => 4, 'year' => 2, 'type' => 'major'],

                // Math Subjects
                ['code' => 'MATH101', 'name' => 'College Algebra', 'units' => 3, 'year' => 1, 'type' => 'general'],
                ['code' => 'MATH102', 'name' => 'Calculus I', 'units' => 4, 'year' => 1, 'type' => 'general'],
                ['code' => 'MATH201', 'name' => 'Statistics', 'units' => 3, 'year' => 2, 'type' => 'general'],

                // General Subjects
                ['code' => 'ENG101', 'name' => 'English Composition', 'units' => 3, 'year' => 1, 'type' => 'general'],
                ['code' => 'PE101', 'name' => 'Physical Education', 'units' => 2, 'year' => 1, 'type' => 'general'],
                ['code' => 'HIST101', 'name' => 'Philippine History', 'units' => 3, 'year' => 1, 'type' => 'general'],
            ];

            $createdSubjects = [];
            foreach ($subjects as $subjectData) {
                $createdSubjects[] = Subject::create([
                    'subject_code' => $subjectData['code'],
                    'subject_name' => $subjectData['name'],
                    'description' => 'Sample description for '.$subjectData['name'],
                    'units' => $subjectData['units'],
                    'year_level' => $subjectData['year'],
                    'semester' => 1,
                    'subject_type' => $subjectData['type'],
                    'status' => 'active',
                ]);
            }
        }        // Create some sample schedule assignments to demonstrate conflicts
        $firstSection = $sections[0]; // CS 1A
        $firstTeacher = $teachers[0];

        // Assign subjects to the first section with proper schedules
        SectionSubject::create([
            'section_id' => $firstSection->id,
            'subject_id' => $createdSubjects[0]->id, // CS101 - 3 hours
            'teacher_id' => $firstTeacher->id,
            'room' => 'Room 101',
            'schedule_days' => 'Monday',
            'start_time' => '08:00',
            'end_time' => '11:00', // 3 hours
            'status' => 'active',
        ]);

        SectionSubject::create([
            'section_id' => $firstSection->id,
            'subject_id' => $createdSubjects[1]->id, // CS102 - 4 hours
            'teacher_id' => $teachers[1]->id,
            'room' => 'Lab A',
            'schedule_days' => 'Tuesday,Thursday',
            'start_time' => '09:00',
            'end_time' => '11:00', // 2 hours × 2 days = 4 hours
            'status' => 'active',
        ]);

        // Add more assignments for the first teacher to have multiple sections/subjects
        SectionSubject::create([
            'section_id' => $firstSection->id,
            'subject_id' => $createdSubjects[4]->id, // Math101
            'teacher_id' => $firstTeacher->id,
            'room' => 'Room 102',
            'schedule_days' => 'Wednesday,Friday',
            'start_time' => '10:00',
            'end_time' => '11:30',
            'status' => 'active',
        ]);

        // Assign teacher to IT section as well
        if (count($sections) > 1) {
            SectionSubject::create([
                'section_id' => $sections[1]->id, // IT 1A
                'subject_id' => $createdSubjects[0]->id, // CS101
                'teacher_id' => $firstTeacher->id,
                'room' => 'Room 201',
                'schedule_days' => 'Monday,Wednesday',
                'start_time' => '14:00',
                'end_time' => '15:30',
                'status' => 'active',
            ]);
        }

        $this->command->info('Test data created successfully!');
        $this->command->info('Admin: admin@test.com / password');
        $this->command->info('Teacher: john.smith@test.com / password (and 4 others)');
        $this->command->info('Student: student@test.com / password');
        $this->command->info('Programs: CS, IT, STEM, ABM with sections');
        $this->command->info('Subjects: Various subjects with different hour requirements');
        $this->command->info('Sample schedules created to test conflict detection');
    }
}
