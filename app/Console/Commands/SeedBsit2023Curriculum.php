<?php

namespace App\Console\Commands;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Console\Command;

class SeedBsit2023Curriculum extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-bsit-2023-curriculum';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed BSIT 2023 curriculum with subjects';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        // Find or create the BSIT program
        $program = Program::firstOrCreate(
            ['program_code' => 'BSIT'],
            ['program_name' => 'Bachelor of Science in Information Technology']
        );

        // Find or create the BSIT 2023 curriculum
        $curriculum = Curriculum::firstOrCreate(
            [
                'program_id' => $program->id,
                'curriculum_name' => 'BSIT 2023',
            ],
            [
                'curriculum_code' => 'BSIT2023',
                'description' => 'Curriculum for BSIT 2023',
                'status' => 'active',
            ]
        );

        $this->info("Using curriculum ID: {$curriculum->id}");

        // Define subjects for BSIT 2023
        $subjects = [
            ['code' => 'IT201', 'name' => 'Advanced Programming', 'units' => 3, 'year' => 1, 'semester' => 'first'],
            ['code' => 'IT202', 'name' => 'Database Management Systems', 'units' => 3, 'year' => 1, 'semester' => 'second'],
            ['code' => 'IT203', 'name' => 'Web Development', 'units' => 3, 'year' => 2, 'semester' => 'first'],
            ['code' => 'IT204', 'name' => 'Software Engineering', 'units' => 3, 'year' => 2, 'semester' => 'second'],
            ['code' => 'IT205', 'name' => 'Network Security', 'units' => 3, 'year' => 3, 'semester' => 'first'],
        ];

        foreach ($subjects as $subjectData) {
            $subject = Subject::firstOrCreate(
                ['subject_code' => $subjectData['code']],
                [
                    'subject_name' => $subjectData['name'],
                    'units' => $subjectData['units'],
                ]
            );

            $this->info("Ensured subject: {$subject->subject_code} - {$subject->subject_name}");

            // Map subject to curriculum
            CurriculumSubject::firstOrCreate(
                [
                    'curriculum_id' => $curriculum->id,
                    'subject_id' => $subject->id,
                ],
                [
                    'year' => $subjectData['year'],
                    'semester' => $subjectData['semester'],
                ]
            );

            $this->info("Mapped {$subject->subject_code} -> Year {$subjectData['year']} {$subjectData['semester']}");
        }

        $this->info('Seeding finished.');
        $this->info('Subjects: '.Subject::count());
        $this->info('Curriculum subjects for BSIT 2023: '.CurriculumSubject::where('curriculum_id', $curriculum->id)->count());
    }
}
