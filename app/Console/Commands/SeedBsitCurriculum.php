<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SeedBsitCurriculum extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-bsit-curriculum';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create BSIT 2022 curriculum and seed a subset of subjects (safe, idempotent)';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Seeding BSIT 2022 curriculum (subset of subjects)...');

        $programModel = \App\Models\Program::class;
        $curriculumModel = \App\Models\Curriculum::class;
        $subjectModel = \App\Models\Subject::class;
        $curriculumSubjectModel = \App\Models\CurriculumSubject::class;

        // Find or create program BSIT
        $program = $programModel::where('program_code', 'BSIT')
            ->orWhere('program_name', 'like', '%Information Technology%')
            ->first();

        if (! $program) {
            $this->info('BSIT program not found, creating program.');
            $program = $programModel::create([
                'program_code' => 'BSIT',
                'program_name' => 'Bachelor of Science in Information Technology',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ]);
        }

        // Create curriculum BSIT 2022 (academic_year 2022-2023)
        $curriculum = $curriculumModel::firstOrCreate([
            'curriculum_name' => 'BSIT 2022',
        ], [
            'program_id' => $program->id,
            'curriculum_code' => 'BSIT-2022',
            'academic_year' => '2022-2023',
            'description' => 'Imported subset from provided BSIT curriculum',
            'status' => 'active',
        ]);

        $this->info('Using curriculum ID: '.$curriculum->id);

        // Subset of BSIT subjects (codes, names, units, type)
        $subjects = [
            ['subject_code' => 'IT101', 'subject_name' => 'Introduction to Computing', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'IT102', 'subject_name' => 'Fundamentals of Programming 1', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'IT103', 'subject_name' => 'Fundamentals of Programming 2', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'IT104', 'subject_name' => 'Purposeful Communication', 'units' => 3, 'subject_type' => 'general'],
            ['subject_code' => 'IT105', 'subject_name' => 'Mathematics in the Modern World', 'units' => 3, 'subject_type' => 'general'],
        ];

        foreach ($subjects as $s) {
            $subject = $subjectModel::firstOrCreate([
                'subject_code' => $s['subject_code'],
            ], [
                'subject_name' => $s['subject_name'],
                'description' => $s['subject_name'],
                'units' => $s['units'],
                'subject_type' => $s['subject_type'],
                'status' => 'active',
                'program_id' => $program->id,
            ]);

            $this->info('Ensured subject: '.$subject->subject_code.' - '.$subject->subject_name);
        }

        // Map subjects into curriculum_subjects with year/semester
        $mappings = [
            ['code' => 'IT101', 'year' => 1, 'semester' => 'first'],
            ['code' => 'IT102', 'year' => 1, 'semester' => 'first'],
            ['code' => 'IT103', 'year' => 1, 'semester' => 'second'],
            ['code' => 'IT104', 'year' => 1, 'semester' => 'second'],
            ['code' => 'IT105', 'year' => 1, 'semester' => 'second'],
        ];

        foreach ($mappings as $m) {
            $subject = $subjectModel::where('subject_code', $m['code'])->first();
            if (! $subject) {
                $this->warn('Subject '.$m['code'].' missing; skipping.');

                continue;
            }

            // Avoid duplicate mapping
            $exists = $curriculumSubjectModel::where('curriculum_id', $curriculum->id)
                ->where('subject_code', $subject->subject_code)
                ->first();

            if ($exists) {
                $this->info('Mapping already exists for '.$subject->subject_code);

                continue;
            }

            $curriculumSubjectModel::create([
                'curriculum_id' => $curriculum->id,
                'subject_id' => $subject->id,
                'subject_code' => $subject->subject_code,
                'subject_name' => $subject->subject_name,
                'description' => $subject->description,
                'units' => $subject->units,
                'year_level' => $m['year'],
                'semester' => $m['semester'] === 'first' ? '1st' : '2nd',
                'subject_type' => $subject->subject_type ?? 'core',
                'is_lab' => false,
                'status' => 'active',
            ]);

            $this->info('Mapped '.$subject->subject_code.' -> Year '.$m['year'].' '.$m['semester']);
        }

        $this->info('Seeding finished. Subjects: '.$subjectModel::count().', Curriculum subjects for BSIT 2022: '.$curriculumSubjectModel::where('curriculum_id', $curriculum->id)->count());
    }
}
