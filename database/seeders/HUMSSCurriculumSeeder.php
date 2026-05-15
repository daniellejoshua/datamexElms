<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class HUMSSCurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the HUMSS program
        $humssProgram = Program::where('program_code', 'HUMSS')->first();
        if (! $humssProgram) {
            $this->command->error('HUMSS program not found. Please run ProgramSeeder first.');

            return;
        }

        // Create HUMSS 2025 Curriculum
        $curriculum = Curriculum::updateOrCreate(
            ['curriculum_code' => 'HUMSS-2025'],
            [
                'curriculum_name' => 'HUMSS 2025',
                'program_id' => $humssProgram->id,
                'description' => 'Humanities and Social Sciences Curriculum 2025',
                'is_current' => true,
                'status' => 'active',
            ]
        );

        // Define all subjects with their details
        // For SHS: 'core' = Core Subjects, 'applied' = Applied Subjects, 'specialized' = Specialized Subjects
        $subjects = [
            // Grade 11 - First Semester - Core Subjects
            ['code' => 'ENG 110', 'name' => 'ORAL COMMUNICATION', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'MATH 110', 'name' => 'GENERAL MATHEMATICS', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'PSCI 110', 'name' => 'EARTH AND LIFE SCIENCE', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'FIL 110', 'name' => 'KOMUNIKASYON AT PANANALIKSIK SA WIKA AT KULTURANG PILIPINO', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'PHI 110', 'name' => 'INTRODUCTION TO PHILOSOPHY OF THE HUMAN PERSON', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'CON 110', 'name' => '21ST CENTURY LITERATURE FROM THE PHILIPPINES AND THE WORLD', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'PE110', 'name' => 'PHYSICAL EDUCATION AND HEALTH 1', 'type' => 'core', 'year' => 11, 'semester' => '1st', 'units' => 2],

            // Grade 11 - First Semester - Specialized Subjects
            ['code' => 'HUMSS 1', 'name' => 'CREATIVE WRITING', 'type' => 'specialized', 'year' => 11, 'semester' => '1st', 'units' => 3],
            ['code' => 'HUMSS 2', 'name' => 'INTRODUCTION TO THE WORLD REGIONS AND BELIEF SYSTEM', 'type' => 'specialized', 'year' => 11, 'semester' => '1st', 'units' => 3],

            // Grade 11 - Second Semester - Core Subjects
            ['code' => 'ENG 120', 'name' => 'READING AND WRITING', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'PS 120', 'name' => 'PHYSICAL SCIENCE', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'MATH 120', 'name' => 'STATISTICS AND PROBABILITY', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'FIL 120', 'name' => 'PAGBASA AT PAGSULAT NG IBA\'T IBANG TEKSTO TUNGO SA PANANALIKSIK', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'PD 120', 'name' => 'PERSONALITY DEVELOPMENT', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'PE 120', 'name' => 'PHYSICAL EDUCATION AND HEALTH 2', 'type' => 'core', 'year' => 11, 'semester' => '2nd', 'units' => 2],

            // Grade 11 - Second Semester - Applied Subjects
            ['code' => 'RESEARCH', 'name' => 'PRACTICAL RESEARCH 1', 'type' => 'applied', 'year' => 11, 'semester' => '2nd', 'units' => 3],

            // Grade 11 - Second Semester - Specialized Subjects
            ['code' => 'HUMSS 3', 'name' => 'CREATIVE NON-FICTION THE LITERARY ESSAY', 'type' => 'specialized', 'year' => 11, 'semester' => '2nd', 'units' => 3],
            ['code' => 'HUMSS 4', 'name' => 'TRENDS, NETWORKS, AND CRITICAL THINKING IN THE 21ST CENTURY', 'type' => 'specialized', 'year' => 11, 'semester' => '2nd', 'units' => 3],

            // Grade 12 - First Semester - Core Subjects
            ['code' => 'PHI 210', 'name' => 'UNDERSTANDING CULTURE, SOCIETY AND POLITICS', 'type' => 'core', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'PE 210', 'name' => 'PHYSICAL EDUCATION AND HEALTH 3', 'type' => 'core', 'year' => 12, 'semester' => '1st', 'units' => 2],

            // Grade 12 - First Semester - Applied Subjects
            ['code' => 'EAPP', 'name' => 'ENGLISH FOR ACADEMIC AND PROFESSIONAL PURPOSES', 'type' => 'applied', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'RESEARCH2', 'name' => 'PRACTICAL RESEARCH 2', 'type' => 'applied', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'E-TECH', 'name' => 'EMPOWERMENT TECHNOLOGIES', 'type' => 'applied', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'PFPL', 'name' => 'FILIPINO SA PILING LARANGAN', 'type' => 'applied', 'year' => 12, 'semester' => '1st', 'units' => 3],

            // Grade 12 - First Semester - Specialized Subjects
            ['code' => 'HUMSS 5', 'name' => 'PHILIPPINE POLITICS AND GOVERNANCE', 'type' => 'specialized', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'HUMSS 6', 'name' => 'COMMUNITY ENGAGEMENT, SOLIDARITY, AND CITIZENSHIP', 'type' => 'specialized', 'year' => 12, 'semester' => '1st', 'units' => 3],
            ['code' => 'HUMSS 7', 'name' => 'DISCIPLINE AND IDEAS IN THE SOCIAL SCIENCE', 'type' => 'specialized', 'year' => 12, 'semester' => '1st', 'units' => 3],

            // Grade 12 - Second Semester - Core Subjects
            ['code' => 'CON 220', 'name' => 'CONTEMPORARY PHILIPPINE ARTS FROM THE REGION', 'type' => 'core', 'year' => 12, 'semester' => '2nd', 'units' => 3],
            ['code' => 'MIL 220', 'name' => 'MEDIA AND INFORMATION LITERACY', 'type' => 'core', 'year' => 12, 'semester' => '2nd', 'units' => 3],
            ['code' => 'PE 220', 'name' => 'PHYSICAL EDUCATION AND HEALTH 4', 'type' => 'core', 'year' => 12, 'semester' => '2nd', 'units' => 2],

            // Grade 12 - Second Semester - Applied Subjects
            ['code' => 'ENTREP', 'name' => 'ENTREPRENEURSHIP', 'type' => 'applied', 'year' => 12, 'semester' => '2nd', 'units' => 3],
            ['code' => 'II', 'name' => 'INQUIRIES, INVESTIGATIVE, IMMERSION', 'type' => 'applied', 'year' => 12, 'semester' => '2nd', 'units' => 4],

            // Grade 12 - Second Semester - Specialized Subjects
            ['code' => 'HUMSS 8', 'name' => 'DISCIPLINE AND IDEAS IN THE APPLIED SCIENCE', 'type' => 'specialized', 'year' => 12, 'semester' => '2nd', 'units' => 3],
            ['code' => 'HUMSS 9', 'name' => 'WORK IMMERSION', 'type' => 'specialized', 'year' => 12, 'semester' => '2nd', 'units' => 4],
        ];

        // Create subjects and curriculum subjects
        foreach ($subjects as $subjectData) {
            // Create or update the subject
            $subject = Subject::updateOrCreate(
                ['subject_code' => $subjectData['code']],
                [
                    'subject_name' => $subjectData['name'],
                    'program_id' => $humssProgram->id,
                    'units' => $subjectData['units'],
                    'subject_type' => $subjectData['type'],
                    'education_level' => 'senior_high',
                    'status' => 'active',
                ]
            );

            // Create curriculum subject relationship
            CurriculumSubject::updateOrCreate(
                [
                    'curriculum_id' => $curriculum->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'year_level' => $subjectData['year'],
                    'semester' => $subjectData['semester'],
                    'subject_type' => $subjectData['type'],
                    'units' => $subjectData['units'],
                    'hours' => null,
                    'prerequisites' => null,
                    'is_lab' => false,
                    'status' => 'active',
                ]
            );
        }

        $this->command->info('HUMSS 2025 Curriculum seeded successfully with '.count($subjects).' subjects.');
    }
}
