<?php

namespace App\Console\Commands;

use App\Models\CourseMaterial;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class UpdateFileHashes extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'materials:update-hashes {--force : Force update all hashes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update file hashes for existing course materials to enable duplicate detection';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $force = $this->option('force');

        $query = CourseMaterial::query();
        if (! $force) {
            $query->whereNull('file_hash');
        }

        $materials = $query->get();

        if ($materials->isEmpty()) {
            $this->info('No materials need hash updates.');

            return;
        }

        $this->info("Updating hashes for {$materials->count()} materials...");

        $updated = 0;
        $missing = 0;

        foreach ($materials as $material) {
            $disk = config('filesystems.default');

            if (Storage::disk($disk)->exists($material->file_path)) {
                $fullPath = Storage::disk($disk)->path($material->file_path);
                $hash = hash_file('sha256', $fullPath);

                $material->update(['file_hash' => $hash]);
                $this->line("✓ Updated: {$material->title}");
                $updated++;
            } else {
                $this->error("✗ Missing file: {$material->title} ({$material->file_path})");
                $missing++;
            }
        }

        $this->info("\nSummary:");
        $this->info("- Updated: {$updated} files");
        if ($missing > 0) {
            $this->warn("- Missing: {$missing} files");
        }

        // Check for duplicates
        $duplicates = $this->findDuplicates();
        if ($duplicates->count() > 0) {
            $this->warn("\nFound {$duplicates->count()} duplicate files:");
            foreach ($duplicates as $hash => $materials) {
                $this->line('Hash: '.substr($hash, 0, 12)."... ({$materials->count()} copies)");
                foreach ($materials as $material) {
                    $this->line("  - {$material->title} (ID: {$material->id})");
                }
            }
        }
    }

    private function findDuplicates()
    {
        return CourseMaterial::whereNotNull('file_hash')
            ->get()
            ->groupBy('file_hash')
            ->filter(function ($materials) {
                return $materials->count() > 1;
            });
    }
}
