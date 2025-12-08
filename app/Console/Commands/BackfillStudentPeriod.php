<?php

namespace App\Console\Commands;

use App\Models\Student;
use App\Models\StudentEnrollment;
use Illuminate\Console\Command;

class BackfillStudentPeriod extends Command
{
    protected $signature = 'backfill:student-period';

    protected $description = 'Backfill students current_academic_year and current_semester from latest student_enrollments';

    public function handle(): int
    {
        $this->info('Starting backfill of student current period...');

        Student::chunk(100, function ($students) {
            foreach ($students as $student) {
                $latest = StudentEnrollment::where('student_id', $student->id)
                    ->orderBy('enrollment_date', 'desc')
                    ->orderBy('id', 'desc')
                    ->first();

                if ($latest) {
                    $student->current_academic_year = $latest->academic_year;
                    $student->current_semester = $latest->semester;
                    $student->save();
                }
            }
        });

        $this->info('Backfill completed.');

        return 0;
    }
}
