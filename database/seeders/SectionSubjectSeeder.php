<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SectionSubjectSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get some programs and subjects
        $programs = \App\Models\Program::all();
        $subjects = \App\Models\Subject::all();

        // Create teachers if they don't exist
        if (\App\Models\Teacher::count() === 0) {
            $teacherUsers = \App\Models\User::where('role', 'teacher')->get();

            foreach ($teacherUsers as $user) {
                \App\Models\Teacher::create([
                    'user_id' => $user->id,
                    'employee_number' => 'EMP'.str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'first_name' => explode(' ', $user->name)[0],
                    'last_name' => explode(' ', $user->name)[1] ?? '',
                    'middle_name' => null,
                    'department' => 'Computer Science',
                    'specialization' => 'Programming',
                    'hire_date' => now()->subYears(rand(1, 10)),
                    'status' => 'active',
                ]);
            }
        }

        $teachers = \App\Models\Teacher::all();

        // Create sections if they don't exist
        if (\App\Models\Section::count() === 0) {
            foreach ($programs as $program) {
                for ($yearLevel = 1; $yearLevel <= 4; $yearLevel++) {
                    foreach (['A', 'B'] as $sectionLetter) {
                        \App\Models\Section::create([
                            'program_id' => $program->id,
                            'section_name' => $sectionLetter,
                            'year_level' => $yearLevel,
                            'academic_year' => '2024-2025',
                            'semester' => '1st',
                            'status' => 'active',
                        ]);
                    }
                }
            }
        }

        // Assign subjects to sections
        $sections = \App\Models\Section::all();

        foreach ($sections as $section) {
            // Get subjects appropriate for this year level
            $yearLevelSubjects = $subjects->where('year_level', $section->year_level);

            // Skip if no subjects available for this year level
            if ($yearLevelSubjects->isEmpty()) {
                continue;
            }

            // Assign 3-5 random subjects to each section (or all available if less than 3)
            $maxSubjects = min(rand(3, 5), $yearLevelSubjects->count());
            $assignedSubjects = $yearLevelSubjects->random($maxSubjects);

            foreach ($assignedSubjects as $subject) {
                \App\Models\SectionSubject::create([
                    'section_id' => $section->id,
                    'subject_id' => $subject->id,
                    'teacher_id' => $teachers->random()->id,
                    'room' => 'Room '.rand(101, 501),
                    'status' => 'active',
                ]);
            }
        }
    }
}
