<?php

namespace Database\Seeders;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use Illuminate\Database\Seeder;

class BSITCurriculumSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the BSIT program ID dynamically
        $bsitProgram = \App\Models\Program::where('program_code', 'BSIT')->first();
        if (! $bsitProgram) {
            $this->command->error('BSIT program not found. Please run ProgramSeeder first.');

            return;
        }
        $bsitProgramId = $bsitProgram->id;

        // Create BSIT 2022 Curriculum
        $curriculum = Curriculum::updateOrCreate(
            ['curriculum_code' => 'BSIT-2022'],
            [
                'curriculum_name' => 'BSIT 2022',
                'program_id' => $bsitProgramId, // BSIT program
                'description' => 'BSIT Curriculum 2022',
                'is_current' => true,
                'status' => 'active',
            ]
        );

        // Curriculum subjects data
        $curriculumSubjects = [
            // 1st Year - 1st Semester
            ['subject_code' => 'CORE1', 'year_level' => 1, 'semester' => '1st'],
            ['subject_code' => 'ITE1', 'year_level' => 1, 'semester' => '1st'],
            ['subject_code' => 'CORE2', 'year_level' => 1, 'semester' => '1st'],
            ['subject_code' => 'PE1', 'year_level' => 1, 'semester' => '1st'],
            ['subject_code' => 'NSTP1', 'year_level' => 1, 'semester' => '1st'],
            ['subject_code' => 'CVED101', 'year_level' => 1, 'semester' => '1st'],

            // 1st Year - 2nd Semester
            ['subject_code' => 'CORE3', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'ITE2', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'CORE4', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'CORE5', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'PE2', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'NSTP2', 'year_level' => 1, 'semester' => '2nd'],
            ['subject_code' => 'CVED102', 'year_level' => 1, 'semester' => '2nd'],

            // 2nd Year - 1st Semester
            ['subject_code' => 'ITE3', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'ITEMAJOR1', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'ITE4', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'ITEMAJOR2', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'ELECTIVE1', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'FIL1', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'APC1', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'CORE6', 'year_level' => 2, 'semester' => '1st'],
            ['subject_code' => 'PE3', 'year_level' => 2, 'semester' => '1st'],

            // 2nd Year - 2nd Semester
            ['subject_code' => 'CORE7', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'FIL2', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'CORE8', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'ITE5', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR4', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR5', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'CVED104', 'year_level' => 2, 'semester' => '2nd'],
            ['subject_code' => 'PE4', 'year_level' => 2, 'semester' => '2nd'],

            // 3rd Year - 1st Semester
            ['subject_code' => 'ELECTIVE2', 'year_level' => 3, 'semester' => '1st'],
            ['subject_code' => 'APC4', 'year_level' => 3, 'semester' => '1st'],
            ['subject_code' => 'APC5', 'year_level' => 3, 'semester' => '1st'],
            ['subject_code' => 'ITEMAJOR6', 'year_level' => 3, 'semester' => '1st'],
            ['subject_code' => 'ITEMAJOR7', 'year_level' => 3, 'semester' => '1st'],
            ['subject_code' => 'ITEMAJOR8', 'year_level' => 3, 'semester' => '1st'],

            // 3rd Year - 2nd Semester
            ['subject_code' => 'ITEMAJOR10', 'year_level' => 3, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR9', 'year_level' => 3, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR11', 'year_level' => 3, 'semester' => '2nd'],
            ['subject_code' => 'ITE6', 'year_level' => 3, 'semester' => '2nd'],
            ['subject_code' => 'ELECTIVE3', 'year_level' => 3, 'semester' => '2nd'],
            ['subject_code' => 'APC6', 'year_level' => 3, 'semester' => '2nd'],

            // 4th Year - 1st Semester
            ['subject_code' => 'ITEMAJOR12', 'year_level' => 4, 'semester' => '1st'],

            // 4th Year - 2nd Semester
            ['subject_code' => 'LIT', 'year_level' => 4, 'semester' => '2nd'],
            ['subject_code' => 'ELECTIVE4', 'year_level' => 4, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR13', 'year_level' => 4, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR14', 'year_level' => 4, 'semester' => '2nd'],
            ['subject_code' => 'ITEMAJOR15', 'year_level' => 4, 'semester' => '2nd'],
        ];

        foreach ($curriculumSubjects as $subjectData) {
            // ensure code is uppercase, then try to get the human name from subjects table
            $subjectData['subject_code'] = strtoupper(trim($subjectData['subject_code']));
            $subjectData['subject_name'] = \App\Models\Subject::where('subject_code', $subjectData['subject_code'])->value('subject_name')
                ? strtoupper(\App\Models\Subject::where('subject_code', $subjectData['subject_code'])->value('subject_name'))
                : $subjectData['subject_code'];

            $subject = \App\Models\Subject::where('subject_code', $subjectData['subject_code'])->first();

            if ($subject) {
                CurriculumSubject::updateOrCreate(
                    [
                        'curriculum_id' => $curriculum->id,
                        'subject_id' => $subject->id,
                    ],
                    [
                        'subject_code' => strtoupper($subject->subject_code),
                        'subject_name' => strtoupper($subject->subject_name),
                        'year_level' => $subjectData['year_level'],
                        'semester' => $subjectData['semester'],
                        'subject_type' => $subject->subject_type,
                        'units' => $subject->units,
                        'hours' => null,
                        'prerequisites' => $subject->prerequisites,
                        'is_lab' => false,
                        'status' => 'active',
                    ]
                );
            }
        }

        $this->command->info('BSIT 2022 Curriculum seeded successfully with '.count($curriculumSubjects).' subjects.');
    }
}
