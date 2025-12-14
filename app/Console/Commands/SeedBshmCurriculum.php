<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class SeedBshmCurriculum extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:seed-bshm-curriculum';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create BSHM 2022 curriculum and seed a subset of subjects (safe, idempotent)';

    /**
     * Execute the console command.
     */
    public function handle(): void
    {
        $this->info('Seeding BSHM 2022 curriculum (subset of subjects)...');

        $programModel = \App\Models\Program::class;
        $curriculumModel = \App\Models\Curriculum::class;
        $subjectModel = \App\Models\Subject::class;
        $curriculumSubjectModel = \App\Models\CurriculumSubject::class;

        // Find or create program BSHM
        $program = $programModel::where('program_code', 'BSHM')
            ->orWhere('program_name', 'like', '%Hospitality%')
            ->first();

        if (! $program) {
            $this->info('BSHM program not found, creating program.');
            $program = $programModel::create([
                'program_code' => 'BSHM',
                'program_name' => 'Bachelor of Science in Hospitality Management',
                'education_level' => 'college',
                'total_years' => 4,
                'status' => 'active',
            ]);
        }

        // Create curriculum BSHM 2022 (academic_year 2021-2022)
        $curriculum = $curriculumModel::firstOrCreate([
            'curriculum_name' => 'BSHM 2022',
        ], [
            'program_id' => $program->id,
            'curriculum_code' => 'BSHM-2022',
            'academic_year' => '2021-2022',
            'description' => 'Imported subset from provided BSHM curriculum',
            'status' => 'active',
        ]);

        $this->info('Using curriculum ID: '.$curriculum->id);

        // Subset of subjects (codes, names, units, type)
        $subjects = [
            ['subject_code' => 'GE1', 'subject_name' => 'Understanding the Self', 'units' => 3, 'subject_type' => 'general'],
            ['subject_code' => 'GE2', 'subject_name' => 'Science, Technology and Society', 'units' => 3, 'subject_type' => 'general'],
            ['subject_code' => 'THC1', 'subject_name' => 'Micro Perspective of Tourism and Hospitality', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'THC2', 'subject_name' => 'Philippine Culture and Tourism Geography', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'HPC3', 'subject_name' => 'Fundamentals in Food Service Operations', 'units' => 3, 'subject_type' => 'major'],
            ['subject_code' => 'PE1', 'subject_name' => 'Physical Fitness', 'units' => 1, 'subject_type' => 'minor'],
            ['subject_code' => 'NSTP1', 'subject_name' => 'National Service Training Program 1', 'units' => 3, 'subject_type' => 'minor'],
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

        // Map a small set into curriculum_subjects with year/semester
        $mappings = [
            ['code' => 'GE1', 'year' => 1, 'semester' => 'first'],
            ['code' => 'GE2', 'year' => 1, 'semester' => 'second'],
            ['code' => 'THC1', 'year' => 1, 'semester' => 'first'],
            ['code' => 'THC2', 'year' => 1, 'semester' => 'second'],
            ['code' => 'HPC3', 'year' => 2, 'semester' => 'first'],
            ['code' => 'PE1', 'year' => 1, 'semester' => 'first'],
            ['code' => 'NSTP1', 'year' => 1, 'semester' => 'second'],
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

        $this->info('Seeding finished. Subjects: '.$subjectModel::count().', Curriculum subjects for BSHM 2022: '.$curriculumSubjectModel::where('curriculum_id', $curriculum->id)->count());
    }
}
