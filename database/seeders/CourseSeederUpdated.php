<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Course;

class CourseSeederUpdated extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            // College General Education Courses
            [
                'subject_name' => 'Mathematics in the Modern World',
                'course_code' => 'MATH101',
                'description' => 'Basic mathematical concepts and applications in daily life',
                'units' => 3,
                'education_level' => 'college',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Understanding the Self',
                'course_code' => 'UTS101', 
                'description' => 'Personal development and self-awareness',
                'units' => 3,
                'education_level' => 'college',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Purposive Communication',
                'course_code' => 'COMM101',
                'description' => 'Communication skills and techniques',
                'units' => 3,
                'education_level' => 'college',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Physical Education 1',
                'course_code' => 'PE101',
                'description' => 'Physical fitness and wellness',
                'units' => 2,
                'education_level' => 'both',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Introduction to Programming',
                'course_code' => 'CS101',
                'description' => 'Basic programming concepts using Python',
                'units' => 3,
                'education_level' => 'college',
                'track' => null,
                'status' => 'active'
            ],

            // SHS Core Subjects (Common to all tracks)
            [
                'subject_name' => 'Oral Communication',
                'course_code' => 'SHS-COMM11',
                'description' => 'Fundamentals of oral communication',
                'units' => 2,
                'education_level' => 'shs',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Reading and Writing Skills',
                'course_code' => 'SHS-ENG11',
                'description' => 'English language reading and writing skills',
                'units' => 2,
                'education_level' => 'shs',
                'track' => null,
                'status' => 'active'
            ],
            [
                'subject_name' => 'General Mathematics',
                'course_code' => 'SHS-MATH11',
                'description' => 'Basic mathematics for senior high school',
                'units' => 2,
                'education_level' => 'shs',
                'track' => null,
                'status' => 'active'
            ],

            // SHS STEM Track Subjects
            [
                'subject_name' => 'Physics for Scientists and Engineers',
                'course_code' => 'SHS-PHYSICS11',
                'description' => 'Fundamental physics concepts',
                'units' => 3,
                'education_level' => 'shs',
                'track' => 'STEM',
                'status' => 'active'
            ],
            [
                'subject_name' => 'General Chemistry 1',
                'course_code' => 'SHS-CHEM11',
                'description' => 'Basic chemistry principles',
                'units' => 3,
                'education_level' => 'shs',
                'track' => 'STEM',
                'status' => 'active'
            ],
            [
                'subject_name' => 'Basic Calculus',
                'course_code' => 'SHS-CALC11',
                'description' => 'Introduction to differential calculus',
                'units' => 3,
                'education_level' => 'shs',
                'track' => 'STEM',
                'status' => 'active'
            ],

            // SHS HUMSS Track Subjects
            [
                'subject_name' => 'Introduction to World Religions',
                'course_code' => 'SHS-REL11',
                'description' => 'Study of major world religions',
                'units' => 2,
                'education_level' => 'shs',
                'track' => 'HUMSS',
                'status' => 'active'
            ],
            [
                'subject_name' => 'Contemporary Philippine Arts',
                'course_code' => 'SHS-ARTS11',
                'description' => 'Philippine arts and culture',
                'units' => 2,
                'education_level' => 'shs',
                'track' => 'HUMSS',
                'status' => 'active'
            ],

            // SHS ABM Track Subjects
            [
                'subject_name' => 'Organization and Management',
                'course_code' => 'SHS-OM11',
                'description' => 'Business organization and management principles',
                'units' => 2,
                'education_level' => 'shs',
                'track' => 'ABM',
                'status' => 'active'
            ],
            [
                'subject_name' => 'Fundamentals of Accountancy',
                'course_code' => 'SHS-ACCT11',
                'description' => 'Basic accounting principles',
                'units' => 3,
                'education_level' => 'shs',
                'track' => 'ABM',
                'status' => 'active'
            ]
        ];

        foreach ($courses as $course) {
            Course::create($course);
        }
    }
}