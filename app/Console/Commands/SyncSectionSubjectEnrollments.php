<?php

namespace App\Console\Commands;

use App\Models\Section;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Console\Command;

class SyncSectionSubjectEnrollments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'school:sync-section-subject-enrollments';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ensure every student in a section is enrolled in every SectionSubject for that section.';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('Syncing section subject enrollments...');
        $sections = Section::with(['sectionSubjects', 'studentEnrollments'])->get();
        $count = 0;
        foreach ($sections as $section) {
            $subjects = $section->sectionSubjects;
            $enrollments = $section->studentEnrollments()->where('status', 'active')->get();
            foreach ($subjects as $sectionSubject) {
                foreach ($enrollments as $enrollment) {
                    $exists = StudentSubjectEnrollment::where('student_id', $enrollment->student_id)
                        ->where('section_subject_id', $sectionSubject->id)
                        ->where('status', 'active')
                        ->exists();
                    if (! $exists) {
                        StudentSubjectEnrollment::create([
                            'student_id' => $enrollment->student_id,
                            'section_subject_id' => $sectionSubject->id,
                            'enrollment_type' => 'regular',
                            'academic_year' => $enrollment->academic_year,
                            'semester' => $enrollment->semester,
                            'status' => 'active',
                            'enrollment_date' => $enrollment->enrollment_date,
                            'enrolled_by' => $enrollment->enrolled_by,
                        ]);
                        $count++;
                    }
                }
            }
        }
        $this->info("Added $count missing subject enrollments.");

        return 0;
    }
}
