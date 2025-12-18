<?php

namespace App\Console\Commands;

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ClassSchedule;
use App\Models\GradeVersion;
use App\Models\MaterialAccessLog;
use App\Models\PaymentTransaction;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\SemesterFinalization;
use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Console\Command;

class ResetAcademicData extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:reset-academic-data';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reset all student-related data and restart the academic year to 2025-2026, semester 1';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        if (! $this->confirm('This will permanently delete ALL student data, enrollments, archived records, payments, grades, and related data. Are you sure you want to proceed?')) {
            $this->info('Operation cancelled.');

            return;
        }

        $this->info('Starting data reset...');

        // Delete in order to respect foreign keys
        $this->safeDelete(MaterialAccessLog::class);
        $this->safeDelete(PaymentTransaction::class);
        $this->safeDelete(GradeVersion::class);
        $this->safeDelete(ArchivedStudentEnrollment::class);
        $this->safeDelete(StudentEnrollment::class);
        $this->safeDelete(ArchivedSection::class);
        $this->safeDelete(ClassSchedule::class);
        $this->safeDelete(SectionSubject::class);
        $this->safeDelete(Section::class);
        $this->safeDelete(SemesterFinalization::class);
        $this->safeDelete(Student::class);

        // Reset school settings
        SchoolSetting::where('key', 'current_academic_year')->update(['value' => '2025-2026']);
        SchoolSetting::where('key', 'current_semester')->update(['value' => '1st']);

        $this->info('Data reset complete. Academic year restarted to 2025-2026, semester 1.');
    }

    private function safeDelete(string $modelClass)
    {
        try {
            $modelClass::query()->delete();
            $this->info("Deleted data from {$modelClass}");
        } catch (\Exception $e) {
            $this->warn("Could not delete from {$modelClass}: ".$e->getMessage());
        }
    }
}
