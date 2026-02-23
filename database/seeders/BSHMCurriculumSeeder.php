<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Database\Seeder;

class BSHMCurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find or create BSHM program
        $program = Program::firstOrCreate(
            ['program_code' => 'BSHM'],
            [
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'description' => 'A four-year degree program that covers the process of conception, planning, organizing, and implementation in the aspects of tourism and hospitality industry.',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ]
        );

        // Create or get curriculum
        $curriculum = Curriculum::firstOrCreate(
            [
                'program_id' => $program->id,
                'curriculum_code' => 'BSHM-2024',
            ],
            [
                'curriculum_name' => 'BSHM Curriculum 2024',
                'description' => 'Bachelor of Science in Hospitality Management Curriculum',
                'status' => 'active',
                'is_current' => true,
            ]
        );

        // Define all subjects with their details
        $subjects = [
            // First Year - First Semester
            ['code' => 'GE1', 'name' => 'UNDERSTANDING THE SELF', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 1],
            ['code' => 'GE2', 'name' => 'SCIENCE TECHNOLOGY AND SOCIETY', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 1],
            ['code' => 'THC 1', 'name' => 'MICRO PERSPECTIVE OF TOURISM AND HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 1],
            ['code' => 'THC 3', 'name' => 'PHILIPPINE CULTURE AND TOURISM GEOGRAPHY', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 1],
            ['code' => 'THC 4', 'name' => 'RISK MANAGEMENT AS APPLIED TO SAFETY, SECURITY AND SANITATION', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 1],
            ['code' => 'PE 1', 'name' => 'PHYSICAL FITNESS', 'units' => 2, 'type' => 'minor', 'year' => 1, 'semester' => 1],
            ['code' => 'NSTP 1', 'name' => 'NATIONAL SERVICE TRAINING PROGRAM 1', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 1],
            ['code' => 'CVED 101', 'name' => 'VALUES EDUCATION 1', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 1],

            // First Year - Second Semester
            ['code' => 'GE6', 'name' => 'PURPOSIVE COMMUNICATIONS', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 2],
            ['code' => 'GE5', 'name' => 'MATHEMATICS IN THE MODERN WORLD', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 2],
            ['code' => 'THC2', 'name' => 'MACRO PERSPECTIVE OF TOURISM AND HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 2],
            ['code' => 'HPC 5', 'name' => 'FUNDAMENTALS IN FOOD SERVICE OPERATIONS', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 2],
            ['code' => 'HPC 6', 'name' => 'MANAGEMENT (MICE)', 'units' => 3, 'type' => 'major', 'year' => 1, 'semester' => 2],
            ['code' => 'PE 2', 'name' => 'RHYTHMIC ACTIVITIES', 'units' => 2, 'type' => 'minor', 'year' => 1, 'semester' => 2],
            ['code' => 'NSTP 2', 'name' => 'NATIONAL SERVICE TRAINING PROGRAM 2', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 2],
            ['code' => 'CVED 2', 'name' => 'VALUES EDUCATION 2', 'units' => 3, 'type' => 'minor', 'year' => 1, 'semester' => 2],

            // Second Year - First Semester
            ['code' => 'FIL 1', 'name' => 'KONTEKSWALISADONG KOMUNIKASYON SA FILIPINO', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 1],
            ['code' => 'THC 5', 'name' => 'LEGAL ASPECT IN TOURISM AND HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 1],
            ['code' => 'THC 6', 'name' => 'QUALITY SERVICE MANAGEMENT IN TOURISM AND HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 1],
            ['code' => 'THC 7', 'name' => 'PROFESSIONAL DEVELOPMENT AND APPLIED ETHICS', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 1],
            ['code' => 'HPC1', 'name' => 'SUPPLY CHAIN MANAGEMENT IN HOSPITALITY INDUSTRY', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 1],
            ['code' => 'HPC 2', 'name' => 'FUNDAMENTALS IN LODGING OPERATIONS', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 1],
            ['code' => 'PE 3', 'name' => 'INDIVIDUAL & DUAL SPORTS', 'units' => 2, 'type' => 'minor', 'year' => 2, 'semester' => 1],
            ['code' => 'GE4', 'name' => 'ART APPRECIATION', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 1],
            ['code' => 'CVED 103', 'name' => 'MORALITY & SOCIAL RESPONSIBILITY', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 1],

            // Second Year - Second Semester
            ['code' => 'GE4', 'name' => 'THE CONTEMPORARY WORLD', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 2],
            ['code' => 'FIL 2', 'name' => 'FILIPINO SA IBAT IBANG DISIPLINA', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 2],
            ['code' => 'THC 8', 'name' => 'TOURISM AND HOSPITALITY MARKETING', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 2],
            ['code' => 'HPC3', 'name' => 'KITCHEN ESSENTIALS AND BASIC FOOD PREPARATIONS', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 2],
            ['code' => 'HPC4', 'name' => 'APPLIED BUSINESS TOOLS AND TECHNOLOGY AND TOURISM', 'units' => 3, 'type' => 'major', 'year' => 2, 'semester' => 2],
            ['code' => 'GE8', 'name' => 'ETHICS', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 2],
            ['code' => 'PE4', 'name' => 'TEAM SPORTS', 'units' => 2, 'type' => 'minor', 'year' => 2, 'semester' => 2],
            ['code' => 'CVED 104', 'name' => 'MARRIAGE & FAMILY PLANNING', 'units' => 3, 'type' => 'minor', 'year' => 2, 'semester' => 2],

            // Third Year - First Semester
            ['code' => 'HPC 7', 'name' => 'ERGONOMICS AND FACILITIES PLANNING FOR THE HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'HPC 8', 'name' => 'FOREIGN LANGUAGE 1', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'HMPE1', 'name' => 'BREAD AND PASTRY', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'HMPE 2', 'name' => 'FRONT OFFICE OPERATION', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'GE9', 'name' => 'RIZAL\'S LIFE WORKS & WRITINGS', 'units' => 3, 'type' => 'minor', 'year' => 3, 'semester' => 1],
            ['code' => 'HMPE 3', 'name' => 'CATERING MANAGEMENT', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'BME1', 'name' => 'STRATEGIC MANAGEMENT AND TOTAL QUALITY MANAGEMENT', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 1],
            ['code' => 'GE3', 'name' => 'READING IN PHILIPPINE HISTORY', 'units' => 3, 'type' => 'minor', 'year' => 3, 'semester' => 1],

            // Third Year - Second Semester
            ['code' => 'THC 10', 'name' => 'ENTREPRENEURSHIP IN TOURISM AND HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'TPC 8', 'name' => 'FOREIGN LANGUAGE 2', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'TPC 10', 'name' => 'RESEARCH IN HOSPITALITY', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'TMPE 4', 'name' => 'ROOMS DIVISION', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'TMPE 5', 'name' => 'QUICK FOOD SERVICE OPERATION', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'BME 2', 'name' => 'OPERATION MANAGEMENT', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'THC 9', 'name' => 'MULTICULTURAL DIVERSITY IN THE WORK PLACE FOR THE TOURISM', 'units' => 3, 'type' => 'major', 'year' => 3, 'semester' => 2],
            ['code' => 'LIT', 'name' => 'PANITIKAN', 'units' => 3, 'type' => 'minor', 'year' => 3, 'semester' => 2],

            // Fourth Year - First Semester
            ['code' => 'PRAC1', 'name' => 'PRACTICUM 1(300 HRS) RESTAURANT BASED', 'units' => 3, 'type' => 'major', 'year' => 4, 'semester' => 1],

            // Fourth Year - Second Semester
            ['code' => 'PRAC2', 'name' => 'PRACTICUM 2(300 HRS) HOTEL BASED', 'units' => 3, 'type' => 'major', 'year' => 4, 'semester' => 2],
        ];

        foreach ($subjects as $subjectData) {
            // uppercase code/name for consistency and remove all whitespace from codes
            $subjectData['code'] = strtoupper(preg_replace('/\s+/', '', $subjectData['code']));
            $subjectData['name'] = strtoupper(trim($subjectData['name']));

            // Check if subject already exists by code (subject_code is unique globally)
            $subject = Subject::where('subject_code', $subjectData['code'])->first();

            // If subject doesn't exist, create it
            if (! $subject) {
                $subject = Subject::create([
                    'subject_code' => strtoupper(preg_replace('/\s+/','',$subjectData['code'])),
                    'program_id' => $program->id,
                    'subject_name' => strtoupper($subjectData['name']),
                    'description' => strtoupper($subjectData['name']),
                    'units' => $subjectData['units'],
                    'subject_type' => $subjectData['type'],
                    'education_level' => 'college',
                    'status' => 'active',
                ]);
            }

            // Create curriculum subject link (only if not exists)
            CurriculumSubject::firstOrCreate(
                [
                    'curriculum_id' => $curriculum->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'subject_code' => $subjectData['code'],
                    'subject_name' => $subjectData['name'],
                    'description' => $subjectData['name'],
                    'units' => $subjectData['units'],
                    'year_level' => $subjectData['year'],
                    'semester' => $subjectData['semester'],
                    'subject_type' => $subjectData['type'],
                    'status' => 'active',
                ]
            );
        }

        $this->command->info('BSHM Curriculum seeded successfully!');
        $this->command->info("Program: {$program->program_name}");
        $this->command->info("Curriculum: {$curriculum->curriculum_name}");
        $this->command->info('Total Subjects: '.count($subjects));
    }
}
