<?php

namespace App\Console\Commands;

use App\Helpers\AcademicHelper;
use App\Models\SchoolSetting;
use Illuminate\Console\Command;

class SetAcademicPeriod extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'academic:set-period 
                           {--year= : Academic year (e.g., 2024-2025)}
                           {--semester= : Semester (1st, 2nd, summer)}
                           {--auto : Use automatic calculation}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set the current academic year and semester for the school';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        if ($this->option('auto')) {
            SchoolSetting::useAutomaticAcademicPeriod();
            $this->info('✅ Switched to automatic academic period calculation');
            $this->line('Current period: '.AcademicHelper::getCurrentAcademicYear().' - '.AcademicHelper::getCurrentSemester());

            return 0;
        }

        $academicYear = $this->option('year');
        $semester = $this->option('semester');

        if (! $academicYear) {
            $academicYear = $this->choice(
                'Select academic year:',
                AcademicHelper::getAcademicYearOptions(),
                AcademicHelper::getCurrentAcademicYear()
            );
        }

        if (! $semester) {
            $semesterOptions = collect(AcademicHelper::getSemesterOptions())->pluck('value')->toArray();
            $semester = $this->choice(
                'Select semester:',
                $semesterOptions,
                AcademicHelper::getCurrentSemester()
            );
        }

        // Validate academic year format
        if (! preg_match('/^\d{4}-\d{4}$/', $academicYear)) {
            $this->error('❌ Invalid academic year format. Use YYYY-YYYY (e.g., 2024-2025)');

            return 1;
        }

        // Validate semester
        if (! in_array($semester, ['1st', '2nd', 'summer'])) {
            $this->error('❌ Invalid semester. Use: 1st, 2nd, or summer');

            return 1;
        }

        SchoolSetting::setCurrentAcademicPeriod($academicYear, $semester);

        $this->info('✅ Academic period set successfully!');
        $this->line("Academic Year: {$academicYear}");
        $this->line("Semester: {$semester}");

        return 0;
    }
}
