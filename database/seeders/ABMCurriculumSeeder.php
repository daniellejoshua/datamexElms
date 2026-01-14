<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class ABMCurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the ABM program
        $program = Program::where('program_code', 'ABM')
            ->where('education_level', 'senior_high')
            ->first();

        if (! $program) {
            $this->command->error('ABM program not found! Please create it first.');

            return;
        }

        // Create curriculum for ABM 2025
        $curriculum = Curriculum::updateOrCreate(
            [
                'program_id' => $program->id,
                'curriculum_name' => 'ABM 2025 Curriculum',
            ],
            [
                'curriculum_code' => 'ABM-2025',
                'description' => 'Accountancy, Business and Management curriculum focusing on business, finance, and management',
                'status' => 'active',
                'is_current' => true,
            ]
        );

        // Define all subjects for ABM
        $subjects = [
            // Grade 11 - First Semester - Core Subjects
            ['code' => 'ENG 110', 'name' => 'Oral Communication', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'MATH 110', 'name' => 'General Mathematics', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'PSCI 110', 'name' => 'Earth and Life Science', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'FIL 110', 'name' => 'Komunikasyon at Pananaliksik sa Wika at Kulturang Pilipino', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'PHI 110', 'name' => 'Introduction to Philosophy of Human Person', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'CON 110', 'name' => '21st Century Literature from the Philippines and the World', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 1],
            ['code' => 'PE 110', 'name' => 'Physical Education and Health 1', 'type' => 'core', 'units' => 2, 'year' => 11, 'semester' => 1],

            // Grade 11 - First Semester - Specialized Subjects
            ['code' => 'ABM 1', 'name' => 'Applied Economics', 'type' => 'specialized', 'units' => 3, 'year' => 11, 'semester' => 1],

            // Grade 11 - Second Semester - Core Subjects
            ['code' => 'ENG 120', 'name' => 'Reading and Writing', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'PS 120', 'name' => 'Physical Science', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'MATH 120', 'name' => 'Statistic and Probability', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'FIL 120', 'name' => 'Pagbasa at Pagsulat ng Iba\'t Ibang Teksto Tungo sa Pananaliksik', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'PD 120', 'name' => 'Personality Development', 'type' => 'core', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'PE 120', 'name' => 'Physical Education and Health 2', 'type' => 'core', 'units' => 2, 'year' => 11, 'semester' => 2],

            // Grade 11 - Second Semester - Applied Subjects
            ['code' => 'RESEARCH1', 'name' => 'Practical Research 1', 'type' => 'applied', 'units' => 3, 'year' => 11, 'semester' => 2],

            // Grade 11 - Second Semester - Specialized Subjects
            ['code' => 'ABM 2', 'name' => 'Business Ethics and Social Responsibility', 'type' => 'specialized', 'units' => 3, 'year' => 11, 'semester' => 2],
            ['code' => 'ABM 3', 'name' => 'Fundamentals of Accountancy, Business and Management 1', 'type' => 'specialized', 'units' => 3, 'year' => 11, 'semester' => 2],

            // Grade 12 - First Semester - Core Subjects
            ['code' => 'PHI 210', 'name' => 'Understanding Culture, Society and Politics', 'type' => 'core', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'PE 210', 'name' => 'Physical Education and Health 3', 'type' => 'core', 'units' => 2, 'year' => 12, 'semester' => 1],

            // Grade 12 - First Semester - Applied Subjects
            ['code' => 'EAPP', 'name' => 'English for Academic and Professional Purposes', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'RESEARCH2', 'name' => 'Practical Research 2', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'E-TECH', 'name' => 'Empowerment Technologies', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'FPIL', 'name' => 'Pilipino sa Piling Laranagan', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 1],

            // Grade 12 - First Semester - Specialized Subjects
            ['code' => 'ABM 4', 'name' => 'Fundamentals of Accountancy, Business and Management 2', 'type' => 'specialized', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'ABM 5', 'name' => 'Business Math', 'type' => 'specialized', 'units' => 3, 'year' => 12, 'semester' => 1],
            ['code' => 'ABM 6', 'name' => 'Organization Management', 'type' => 'specialized', 'units' => 3, 'year' => 12, 'semester' => 1],

            // Grade 12 - Second Semester - Core Subjects
            ['code' => 'CON 220', 'name' => 'Contemporary Philippine Arts from the Region', 'type' => 'core', 'units' => 3, 'year' => 12, 'semester' => 2],
            ['code' => 'MIL 220', 'name' => 'Media and Information Literacy', 'type' => 'core', 'units' => 3, 'year' => 12, 'semester' => 2],
            ['code' => 'PE 220', 'name' => 'Physical Education and Health 4', 'type' => 'core', 'units' => 2, 'year' => 12, 'semester' => 2],

            // Grade 12 - Second Semester - Applied Subjects
            ['code' => 'ENTREP', 'name' => 'Entrepreneurship', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 2],
            ['code' => 'III', 'name' => 'Inquiries, Investigative, Immersion', 'type' => 'applied', 'units' => 3, 'year' => 12, 'semester' => 2],

            // Grade 12 - Second Semester - Specialized Subjects
            ['code' => 'ABM 7', 'name' => 'Business Finance', 'type' => 'specialized', 'units' => 3, 'year' => 12, 'semester' => 2],
            ['code' => 'ABM 8', 'name' => 'Principle of Marketing', 'type' => 'specialized', 'units' => 3, 'year' => 12, 'semester' => 2],
            ['code' => 'ABM 9', 'name' => 'Work Immersion', 'type' => 'specialized', 'units' => 2, 'year' => 12, 'semester' => 2],
        ];

        $this->command->info('Creating subjects and linking to curriculum...');

        foreach ($subjects as $subjectData) {
            // Create or update the subject
            $subject = Subject::updateOrCreate(
                [
                    'subject_code' => $subjectData['code'],
                    'education_level' => 'senior_high',
                ],
                [
                    'subject_name' => $subjectData['name'],
                    'subject_type' => $subjectData['type'],
                    'program_id' => $subjectData['type'] === 'specialized' ? $program->id : null,
                    'description' => null,
                    'units' => $subjectData['units'],
                    'status' => 'active',
                ]
            );

            // Link subject to curriculum
            CurriculumSubject::updateOrCreate(
                [
                    'curriculum_id' => $curriculum->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'units' => $subject->units,
                    'year_level' => $subjectData['year'],
                    'semester' => $subjectData['semester'],
                    'subject_type' => $subjectData['type'],
                    'status' => 'active',
                ]
            );

            $this->command->info("✓ {$subjectData['code']} - {$subjectData['name']}");
        }

        $this->command->info("\n✅ ABM 2025 Curriculum seeded successfully with ".count($subjects).' subjects!');
    }
}
