<?php

namespace Database\Seeders;

use App\Helpers\AcademicHelper;
use App\Models\SchoolSetting;
use Illuminate\Database\Seeder;

class SchoolSettingSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $settings = [
            [
                'key' => 'school_name',
                'value' => 'Datamex Institute of Technology',
                'type' => 'string',
                'description' => 'Official name of the school',
            ],
            [
                'key' => 'school_year_start_month',
                'value' => '8',
                'type' => 'integer',
                'description' => 'Month when academic year starts (1-12, default: 8 = August)',
            ],
            [
                'key' => 'semester_1_months',
                'value' => json_encode([8, 9, 10, 11, 12]),
                'type' => 'json',
                'description' => 'Months for 1st semester (default: Aug-Dec)',
            ],
            [
                'key' => 'semester_2_months',
                'value' => json_encode([1, 2, 3, 4, 5]),
                'type' => 'json',
                'description' => 'Months for 2nd semester (default: Jan-May)',
            ],
            [
                'key' => 'summer_months',
                'value' => json_encode([6, 7]),
                'type' => 'json',
                'description' => 'Months for summer semester (default: Jun-Jul)',
            ],
            [
                'key' => 'auto_academic_period',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Automatically calculate current academic year and semester',
            ],
            [
                'key' => 'enrollment_open',
                'value' => '1',
                'type' => 'boolean',
                'description' => 'Whether enrollment is currently open',
            ],
            [
                'key' => 'maintenance_mode',
                'value' => '0',
                'type' => 'boolean',
                'description' => 'Enable maintenance mode for system updates',
            ],
        ];

        foreach ($settings as $setting) {
            SchoolSetting::updateOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }

        // Set current academic period if auto mode is enabled
        $autoMode = SchoolSetting::get('auto_academic_period', true);
        if ($autoMode) {
            $currentAcademicYear = AcademicHelper::getCurrentAcademicYear();
            $currentSemester = AcademicHelper::getCurrentSemester();
            
            $this->command->info("Auto-detected current academic period: {$currentAcademicYear} - {$currentSemester}");
        }
    }
}
