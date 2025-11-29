<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Course;

class CourseSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = [
            // General Education Courses (Permanent Curriculum)
            [
                'subject_name' => 'Mathematics in the Modern World',
                'course_code' => 'MATH101',
                'description' => 'Basic mathematical concepts and applications in daily life',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Understanding the Self',
                'course_code' => 'UTS101', 
                'description' => 'Personal development and self-awareness',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Purposive Communication',
                'course_code' => 'COMM101',
                'description' => 'Communication skills and techniques',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Physical Education 1',
                'course_code' => 'PE101',
                'description' => 'Physical fitness and wellness',
                'units' => 2,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Introduction to Programming',
                'course_code' => 'CS101',
                'description' => 'Basic programming concepts using Python',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Science Technology and Society',
                'course_code' => 'STS101',
                'description' => 'Impact of science and technology on society',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'The Contemporary World',
                'course_code' => 'TCW101',
                'description' => 'Global issues and contemporary challenges',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Art Appreciation',
                'course_code' => 'ART101',
                'description' => 'Understanding and appreciation of various art forms',
                'units' => 3,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Physical Education 2',
                'course_code' => 'PE102',
                'description' => 'Advanced physical fitness and sports',
                'units' => 2,
                'status' => 'active'
            ],
            [
                'subject_name' => 'Database Management Systems',
                'course_code' => 'CS201',
                'description' => 'Database design and management',
                'units' => 3,
                'status' => 'active'
            ]
        ];

        foreach ($courses as $course) {
            Course::create($course);
        }
    }
}
