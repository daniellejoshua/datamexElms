<?php

namespace Database\Seeders;

use App\Models\Subject;
use Illuminate\Database\Seeder;

class SubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $subjects = [
            // First Year, First Semester - General Education
            [
                'subject_code' => 'MATH101',
                'subject_name' => 'Mathematics in the Modern World',
                'description' => 'Basic mathematical concepts and applications in daily life',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'general',
                'status' => 'active',
            ],
            [
                'subject_code' => 'UTS101',
                'subject_name' => 'Understanding the Self',
                'description' => 'Personal development and self-awareness',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'general',
                'status' => 'active',
            ],
            [
                'subject_code' => 'COMM101',
                'subject_name' => 'Purposive Communication',
                'description' => 'Communication skills and techniques',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'general',
                'status' => 'active',
            ],

            // IT Major Subjects
            [
                'subject_code' => 'CS101',
                'subject_name' => 'Introduction to Programming',
                'description' => 'Basic programming concepts using Python',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'major',
                'status' => 'active',
            ],
            [
                'subject_code' => 'IT101',
                'subject_name' => 'Fundamentals of Information Technology',
                'description' => 'Basic concepts of information technology and computer systems',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'major',
                'status' => 'active',
            ],

            // Second Semester
            [
                'subject_code' => 'CS102',
                'subject_name' => 'Object-Oriented Programming',
                'description' => 'Advanced programming using OOP principles',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'second',
                'subject_type' => 'major',
                'prerequisites' => ['CS101'],
                'status' => 'active',
            ],
            [
                'subject_code' => 'IT102',
                'subject_name' => 'Database Management Systems',
                'description' => 'Introduction to database design and SQL',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'second',
                'subject_type' => 'major',
                'status' => 'active',
            ],

            // Second Year Subjects
            [
                'subject_code' => 'CS201',
                'subject_name' => 'Data Structures and Algorithms',
                'description' => 'Advanced data structures and algorithm design',
                'units' => 3,
                'year_level' => 2,
                'semester' => 'first',
                'subject_type' => 'major',
                'prerequisites' => ['CS102'],
                'status' => 'active',
            ],
            [
                'subject_code' => 'IT201',
                'subject_name' => 'Web Development',
                'description' => 'Frontend and backend web development',
                'units' => 3,
                'year_level' => 2,
                'semester' => 'first',
                'subject_type' => 'major',
                'prerequisites' => ['CS101', 'IT102'],
                'status' => 'active',
            ],

            // Business Subjects
            [
                'subject_code' => 'ACCT101',
                'subject_name' => 'Principles of Accounting',
                'description' => 'Basic accounting principles and practices',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'first',
                'subject_type' => 'major',
                'status' => 'active',
            ],
            [
                'subject_code' => 'MGT101',
                'subject_name' => 'Principles of Management',
                'description' => 'Basic management concepts and practices',
                'units' => 3,
                'year_level' => 1,
                'semester' => 'second',
                'subject_type' => 'major',
                'status' => 'active',
            ],
        ];

        foreach ($subjects as $subject) {
            Subject::create($subject);
        }
    }
}
