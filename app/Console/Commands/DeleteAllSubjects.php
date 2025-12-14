<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class DeleteAllSubjects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:delete-all-subjects';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete all subjects from the database';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $count = \App\Models\Subject::count();

        if ($count === 0) {
            $this->info('No subjects found in the database.');

            return;
        }

        if (! $this->confirm("Are you sure you want to delete all {$count} subjects? This action cannot be undone.")) {
            $this->info('Operation cancelled.');

            return;
        }

        \App\Models\Subject::query()->delete();

        $this->info("Successfully deleted {$count} subjects from the database.");
    }
}
