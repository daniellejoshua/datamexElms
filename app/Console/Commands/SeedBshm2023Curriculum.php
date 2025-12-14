<?php

namespace App\Console\Commands;

use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Subject;
use Illuminate\Console\Command;

class SeedBshm2023Curriculum extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-bshm-2023-curriculum';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Seed BSHM 2023 curriculum with subjects';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        // Find or create the BSHM program
        $program = Program::firstOrCreate(
            ['program_code' => 'BSHM'],
            ['program_name' => 'Bachelor of Science in Hospitality Management']
        );

        // Find or create the BSHM 2023 curriculum
        $curriculum = Curriculum::firstOrCreate(
            [
                'program_id' => $program->id,
                'curriculum_name' => 'BSHM 2023',
            ],
            [
                'curriculum_code' => 'BSHM2023',
                'description' => 'Curriculum for BSHM 2023',
                'status' => 'active',
            ]
        );

        $this->info("Using curriculum ID: {$curriculum->id}");

        // Define subjects for BSHM 2023
        $subjects = [
            ['code' => 'HM201', 'name' => 'Advanced Hospitality Management', 'units' => 3, 'year' => 1, 'semester' => 'first'],
            ['code' => 'HM202', 'name' => 'Event Planning', 'units' => 3, 'year' => 1, 'semester' => 'second'],
            ['code' => 'HM203', 'name' => 'Food and Beverage Management', 'units' => 3, 'year' => 2, 'semester' => 'first'],
            ['code' => 'HM204', 'name' => 'Tourism Marketing', 'units' => 3, 'year' => 2, 'semester' => 'second'],
            ['code' => 'HM205', 'name' => 'Hotel Operations', 'units' => 3, 'year' => 3, 'semester' => 'first'],
            ['code' => 'HM206', 'name' => 'Sustainable Tourism', 'units' => 3, 'year' => 3, 'semester' => 'second'],
            ['code' => 'HM207', 'name' => 'Leadership in Hospitality', 'units' => 3, 'year' => 4, 'semester' => 'first'],
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
        $this->info('Curriculum subjects for BSHM 2023: '.CurriculumSubject::where('curriculum_id', $curriculum->id)->count());
    }
}
