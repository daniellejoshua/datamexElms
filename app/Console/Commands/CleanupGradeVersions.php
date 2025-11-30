<?php

namespace App\Console\Commands;

use App\Models\GradeVersion;
use App\Models\SemesterFinalization;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CleanupGradeVersions extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'grades:cleanup-versions 
                           {--academic-year= : Specific academic year to cleanup}
                           {--semester= : Specific semester to cleanup}
                           {--education-level= : college or shs}
                           {--keep-latest=1 : Number of latest versions to keep per grade}
                           {--dry-run : Show what would be deleted without deleting}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Clean up grade versions after semester finalization';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $academicYear = $this->option('academic-year');
        $semester = $this->option('semester');
        $educationLevel = $this->option('education-level');
        $keepLatest = (int) $this->option('keep-latest');
        $dryRun = $this->option('dry-run');

        $this->info('Starting grade versions cleanup...');

        // Get finalized semesters
        $finalizedSemesters = SemesterFinalization::when($academicYear, function($q) use ($academicYear) {
                return $q->where('academic_year', $academicYear);
            })
            ->when($semester, function($q) use ($semester) {
                return $q->where('semester', $semester);
            })
            ->when($educationLevel, function($q) use ($educationLevel) {
                return $q->where('education_level', $educationLevel);
            })
            ->get();

        if ($finalizedSemesters->isEmpty()) {
            $this->warn('No finalized semesters found matching criteria.');
            return 0;
        }

        $totalCleanedUp = 0;

        foreach ($finalizedSemesters as $finalization) {
            $this->line("Processing {$finalization->education_level} {$finalization->academic_year} {$finalization->semester}...");

            $versionsQuery = GradeVersion::where('academic_year', $finalization->academic_year)
                ->where('semester', $finalization->semester)
                ->where('grade_type', $finalization->education_level);

            if ($finalization->track) {
                // For SHS with specific track - would need track info in grade versions
                $this->comment("Track-specific cleanup: {$finalization->track}");
            }

            // Get versions grouped by grade ID, keeping only the excess ones
            $versionsToDelete = [];
            
            $gradeColumn = $finalization->education_level === 'college' ? 'student_grade_id' : 'shs_student_grade_id';
            
            $gradeIds = $versionsQuery->whereNotNull($gradeColumn)
                ->distinct()
                ->pluck($gradeColumn);

            foreach ($gradeIds as $gradeId) {
                $versions = GradeVersion::where($gradeColumn, $gradeId)
                    ->where('academic_year', $finalization->academic_year)
                    ->where('semester', $finalization->semester)
                    ->orderByDesc('version_number')
                    ->get();

                if ($versions->count() > $keepLatest) {
                    $toDelete = $versions->skip($keepLatest);
                    $versionsToDelete = array_merge($versionsToDelete, $toDelete->pluck('id')->toArray());
                }
            }

            if (empty($versionsToDelete)) {
                $this->comment('No versions to cleanup for this semester.');
                continue;
            }

            if ($dryRun) {
                $this->warn("DRY RUN: Would delete " . count($versionsToDelete) . " grade versions");
                $this->table(['Version ID', 'Grade Type', 'Version #', 'Created At'], 
                    GradeVersion::whereIn('id', array_slice($versionsToDelete, 0, 10))
                        ->get(['id', 'grade_type', 'version_number', 'created_at'])
                        ->map(function($v) {
                            return [$v->id, $v->grade_type, $v->version_number, $v->created_at->format('Y-m-d H:i')];
                        })->toArray()
                );
                if (count($versionsToDelete) > 10) {
                    $this->comment("... and " . (count($versionsToDelete) - 10) . " more");
                }
            } else {
                if ($this->confirm("Delete " . count($versionsToDelete) . " grade versions for this semester?")) {
                    $deleted = GradeVersion::whereIn('id', $versionsToDelete)->delete();
                    $this->info("Deleted {$deleted} grade versions");
                    $totalCleanedUp += $deleted;
                }
            }
        }

        if (!$dryRun && $totalCleanedUp > 0) {
            $this->info("Total cleanup completed: {$totalCleanedUp} grade versions removed");
        }

        return 0;
    }
}
