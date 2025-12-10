<?php

namespace App\Console\Commands;

use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class UpdateCollegePrograms extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:update-college-programs {--force : Skip confirmation prompt}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Update college programs to keep only BSIT, ACT, and BSHM';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->option('force') && ! $this->confirm('This will remove BSCS, BSA, and BSBA programs and create ACT and BSHM. Continue?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('Updating college programs...');

        DB::beginTransaction();

        try {
            // Get current college programs
            $bsit = Program::where('program_code', 'BSIT')->first();
            $bscs = Program::where('program_code', 'BSCS')->first();
            $bsa = Program::where('program_code', 'BSA')->first();
            $bsba = Program::where('program_code', 'BSBA')->first();

            // Check for students that need to be reassigned
            $bscsStudents = Student::where('program_id', $bscs->id ?? null)->get();
            if ($bscsStudents->count() > 0) {
                $this->warn("Found {$bscsStudents->count()} students in BSCS program. Reassigning to BSIT...");
                Student::where('program_id', $bscs->id)->update(['program_id' => $bsit->id]);
            }

            // Check for sections that need to be reassigned
            $bscsSections = Section::where('program_id', $bscs->id ?? null)->get();
            if ($bscsSections->count() > 0) {
                $this->warn("Found {$bscsSections->count()} sections in BSCS program. Reassigning to BSIT...");
                Section::where('program_id', $bscs->id)->update(['program_id' => $bsit->id]);
            }

            // Remove unwanted programs
            $programsToRemove = ['BSCS', 'BSA', 'BSBA'];
            foreach ($programsToRemove as $code) {
                $program = Program::where('program_code', $code)->first();
                if ($program) {
                    $program->delete();
                    $this->info("✓ Removed {$code} program");
                }
            }

            // Create new programs
            $newPrograms = [
                [
                    'program_code' => 'ACT',
                    'program_name' => 'Associate in Computer Technology',
                    'education_level' => 'college',
                    'description' => 'Two-year program focused on computer technology fundamentals',
                    'total_years' => 2,
                    'status' => 'active',
                ],
                [
                    'program_code' => 'BSHM',
                    'program_name' => 'Bachelor of Science in Hospitality Management',
                    'education_level' => 'college',
                    'description' => 'Four-year program in hospitality and tourism management',
                    'total_years' => 4,
                    'status' => 'active',
                ],
            ];

            foreach ($newPrograms as $programData) {
                Program::create($programData);
                $this->info("✓ Created {$programData['program_code']} program");
            }

            DB::commit();

            $this->info('✅ College programs updated successfully!');
            $this->info('Kept: BSIT');
            $this->info('Added: ACT, BSHM');
            $this->info('Removed: BSCS, BSA, BSBA');

        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('❌ Error updating programs: '.$e->getMessage());

            return 1;
        }

        return 0;
    }
}
