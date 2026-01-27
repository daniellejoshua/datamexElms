<?php

namespace App\Console\Commands;

use App\Models\SchoolSetting;
use App\Models\ShsStudentPayment;
use App\Models\Student;
use Illuminate\Console\Command;

class CreateShsPaymentRecords extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:create-shs-payment-records {--academic_year= : The academic year} {--semester= : The semester}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create SHS payment records for existing SHS students';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $academicYear = $this->option('academic_year') ?? SchoolSetting::getCurrentAcademicYear();
        $semester = $this->option('semester') ?? SchoolSetting::getCurrentSemester();

        $this->info("Creating SHS payment records for academic year: {$academicYear}, semester: {$semester}");

        $shsStudents = Student::where('education_level', 'senior_high')->get();
        $created = 0;

        foreach ($shsStudents as $student) {
            // Check if payment record already exists
            $existingPayment = ShsStudentPayment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if (! $existingPayment) {
                $student->ensureShsPaymentRecords($academicYear, $semester);
                $created++;
                $this->line("Created payment record for: {$student->user->name}");
            } else {
                $this->line("Payment record already exists for: {$student->user->name}");
            }
        }

        $this->info("Created {$created} SHS payment records out of {$shsStudents->count()} SHS students.");
    }
}
