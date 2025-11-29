<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Course;
use App\Models\Section;

class SectionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $courses = Course::all();
        
        foreach ($courses as $course) {
            // Create sections for 1st semester 2024-2025
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'A',
                'room' => 'Room ' . (100 + $course->id),
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'status' => 'active'
            ]);
            
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'B',
                'room' => 'Room ' . (200 + $course->id),
                'academic_year' => '2024-2025',
                'semester' => '1st',
                'status' => 'active'
            ]);
            
            // Create sections for 2nd semester 2024-2025
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'C',
                'room' => 'Room ' . (300 + $course->id),
                'academic_year' => '2024-2025',
                'semester' => '2nd',
                'status' => 'active'
            ]);
            
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'D',
                'room' => 'Room ' . (400 + $course->id),
                'academic_year' => '2024-2025',
                'semester' => '2nd',
                'status' => 'active'
            ]);
            
            // Create sections for 1st semester 2023-2024 (Historical Data)
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'A',
                'room' => 'Room ' . (100 + $course->id),
                'academic_year' => '2023-2024',
                'semester' => '1st',
                'status' => 'inactive'
            ]);
            
            Section::create([
                'course_id' => $course->id,
                'section_name' => 'B',
                'room' => 'Room ' . (200 + $course->id),
                'academic_year' => '2023-2024',
                'semester' => '1st',
                'status' => 'inactive'
            ]);
        }
    }
}
