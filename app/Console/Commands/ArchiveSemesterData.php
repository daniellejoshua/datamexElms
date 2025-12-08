<?php

namespace App\Console\Commands;

use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Section;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ArchiveSemesterData extends Command
{
    protected $signature = 'school:archive-semester-data {--notes=}';

    protected $description = 'Archive all sections, enrollments, and grades for the current semester. Only Head Teacher can run.';

    public function handle(): int
    {
        $user = Auth::user();
        if (! $user || ! $user->hasRole('head_teacher')) {
            $this->error('Only Head Teacher can archive semester data.');

            return 1;
        }

        DB::beginTransaction();
        try {
            $sections = Section::with(['studentEnrollments', 'studentEnrollments.studentGrades', 'studentEnrollments.shsStudentGrades'])->get();
            foreach ($sections as $section) {
                $archivedSection = ArchivedSection::create([
                    'original_section_id' => $section->id,
                    'section_name' => $section->section_name,
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'room' => $section->room,
                    'status' => 'completed',
                    'course_data' => $section->toArray(),
                    'total_enrolled_students' => $section->studentEnrollments->count(),
                    'completed_students' => $section->studentEnrollments->where('status', 'completed')->count(),
                    'dropped_students' => $section->studentEnrollments->where('status', 'dropped')->count(),
                    'section_average_grade' => $section->studentEnrollments->avg('semester_grade'),
                    'archived_at' => now(),
                    'archived_by' => $user->id,
                    'archive_notes' => $this->option('notes'),
                ]);
                foreach ($section->studentEnrollments as $enrollment) {
                    ArchivedStudentEnrollment::create([
                        'archived_section_id' => $archivedSection->id,
                        'student_id' => $enrollment->student_id,
                        'original_enrollment_id' => $enrollment->id,
                        'academic_year' => $enrollment->academic_year,
                        'semester' => $enrollment->semester,
                        'enrolled_date' => $enrollment->enrollment_date,
                        'completion_date' => $enrollment->completion_date,
                        'final_status' => $enrollment->status,
                        'final_grades' => $enrollment->studentGrades->toArray(),
                        'final_semester_grade' => $enrollment->semester_grade,
                        'letter_grade' => $enrollment->letter_grade,
                        'student_data' => $enrollment->student->toArray(),
                    ]);
                }
            }
            DB::commit();
            $this->info('Semester data archived successfully.');

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error archiving semester data: '.$e->getMessage());

            return 1;
        }
    }
}
