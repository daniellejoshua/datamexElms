<?php

namespace App\Console\Commands;

use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\YearLevelCurriculumGuide;
use Illuminate\Console\Command;

class RollYearLevelCurriculumGuides extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'curriculum:roll-guides {--academic-year= : The academic year to roll to}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Roll year level curriculum guides for the new academic year';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $currentAcademicYear = $this->option('academic-year') ?? SchoolSetting::getCurrentAcademicYear();
        $previousAcademicYear = $this->getPreviousAcademicYear($currentAcademicYear);

        $this->info("Rolling guides from {$previousAcademicYear} to {$currentAcademicYear}");

        $programs = Program::with('currentCurriculum')->get();

        foreach ($programs as $program) {
            $this->rollGuidesForProgram($program, $previousAcademicYear, $currentAcademicYear);
        }

        $this->info('Guides rolled successfully');
    }

    private function getPreviousAcademicYear(string $current): string
    {
        [$start, $end] = explode('-', $current);
        $prevStart = (int) $start - 1;
        $prevEnd = (int) $end - 1;

        return "{$prevStart}-{$prevEnd}";
    }

    private function rollGuidesForProgram(Program $program, string $previousAcademicYear, string $currentAcademicYear)
    {
        // Get previous year's guides
        $previousGuides = YearLevelCurriculumGuide::where('program_id', $program->id)
            ->where('academic_year', $previousAcademicYear)
            ->get()
            ->keyBy('year_level');

        // Get current curriculum for year 1
        $currentCurriculum = $program->currentCurriculum;
        if (! $currentCurriculum) {
            $this->warn("No current curriculum for program {$program->name}");

            return;
        }

        // Create new guides
        $newGuides = [];

        // If no previous guides exist, check existing students to determine curricula
        $hasPreviousGuides = $previousGuides->isNotEmpty();

        if (! $hasPreviousGuides) {
            // Fresh start: analyze existing students to determine appropriate curricula
            $existingStudentCurricula = $this->getExistingStudentCurriculaByYearLevel($program->id);
            $this->info("Fresh start for {$program->program_name} - analyzing existing students");
        }

        // Year 1: Always current curriculum (freshmen get newest curriculum)
        $newGuides[1] = $currentCurriculum->id;

        // Year 2: previous year 1, or most common curriculum among existing 2nd years
        if ($hasPreviousGuides) {
            $newGuides[2] = $previousGuides[1]->curriculum_id ?? $currentCurriculum->id;
        } else {
            $newGuides[2] = $existingStudentCurricula[2] ?? $currentCurriculum->id;
        }

        // Year 3: previous year 2, or most common curriculum among existing 3rd years
        if ($hasPreviousGuides) {
            $newGuides[3] = $previousGuides[2]->curriculum_id ?? $currentCurriculum->id;
        } else {
            $newGuides[3] = $existingStudentCurricula[3] ?? $currentCurriculum->id;
        }

        // Year 4: previous year 3, or most common curriculum among existing 4th years
        if ($hasPreviousGuides) {
            $newGuides[4] = $previousGuides[3]->curriculum_id ?? $currentCurriculum->id;
        } else {
            $newGuides[4] = $existingStudentCurricula[4] ?? $currentCurriculum->id;
        }

        // For college programs, typically up to 4 years
        if ($program->education_level === 'college') {
            $maxYear = 4;
        } elseif ($program->education_level === 'senior_high' || $program->education_level === 'shs') {
            $maxYear = 12; // Grade 12
        } else {
            $maxYear = 4;
        }

        for ($year = 1; $year <= $maxYear; $year++) {
            YearLevelCurriculumGuide::updateOrCreate([
                'program_id' => $program->id,
                'academic_year' => $currentAcademicYear,
                'year_level' => $year,
            ], [
                'curriculum_id' => $newGuides[$year] ?? $currentCurriculum->id,
            ]);
        }

        $this->line("Rolled guides for {$program->program_name}");
    }

    /**
     * Get the most common curriculum used by existing students for each year level.
     */
    private function getExistingStudentCurriculaByYearLevel(int $programId): array
    {
        return \App\Models\Student::where('program_id', $programId)
            ->where('status', 'active')
            ->whereNotNull('curriculum_id')
            ->selectRaw('current_year_level, curriculum_id, COUNT(*) as count')
            ->groupBy('current_year_level', 'curriculum_id')
            ->orderBy('current_year_level')
            ->orderByDesc('count')
            ->get()
            ->groupBy('current_year_level')
            ->map(function ($group) {
                return $group->first()->curriculum_id;
            })
            ->toArray();
    }
}
