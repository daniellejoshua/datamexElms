<?php

namespace App\Console\Commands;

use App\Models\ArchivedSection;
use App\Models\ArchivedStudent;
use App\Models\ArchivedStudentEnrollment;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ArchiveSemesterData extends Command
{
    protected $signature = 'school:archive-semester-data {--notes=} {--academic-year=} {--semester=}';

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
            // Determine archive period: prefer explicit flags, fallback to SchoolSetting
            $academicYear = $this->option('academic-year') ?? SchoolSetting::getCurrentAcademicYear();
            $semesterOption = $this->option('semester') ?? SchoolSetting::getCurrentSemester();

            // Normalize semester value to stored format if needed (e.g. '1st'->'first')
            $semester = match (strtolower($semesterOption)) {
                '1st', 'first' => 'first',
                '2nd', 'second' => 'second',
                'summer' => 'summer',
                default => $semesterOption,
            };

            $sections = Section::with(['studentEnrollments', 'studentEnrollments.studentGrades', 'studentEnrollments.shsStudentGrades', 'subjects'])->get();
            $archivedStudentIds = [];
            foreach ($sections as $section) {
                $archivedSection = ArchivedSection::create([
                    'original_section_id' => $section->id,
                    'section_name' => $section->section_name,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'room' => $section->room,
                    'status' => 'completed',
                    'course_data' => $section->subjects->map(function ($subject) {
                        return [
                            'id' => $subject->id,
                            'subject_code' => $subject->subject_code ?? null,
                            'subject_name' => $subject->subject_name ?? null,
                            'units' => $subject->units ?? null,
                        ];
                    })->toArray(),
                    'total_enrolled_students' => $section->studentEnrollments->count(),
                    'completed_students' => $section->studentEnrollments->where('status', 'completed')->count(),
                    'dropped_students' => $section->studentEnrollments->where('status', 'dropped')->count(),
                    'section_average_grade' => $section->studentEnrollments->avg('semester_grade'),
                    'archived_at' => now(),
                    'archived_by' => $user->id,
                    'archive_notes' => $this->option('notes'),
                ]);
                foreach ($section->studentEnrollments as $enrollment) {
                    // Preserve original status for archival snapshot; only mark active->completed
                    $originalStatus = $enrollment->status;
                    $completionDate = $enrollment->completion_date ?? now();

                    if ($originalStatus === 'active') {
                        $enrollment->status = 'completed';
                        $enrollment->completion_date = $completionDate;
                        $enrollment->save();
                        $finalStatus = 'completed';
                    } else {
                        // preserve dropped/withdrawn/etc.
                        $finalStatus = $originalStatus;
                    }

                    ArchivedStudentEnrollment::create([
                        'archived_section_id' => $archivedSection->id,
                        'student_id' => $enrollment->student_id,
                        'original_enrollment_id' => $enrollment->id,
                        'academic_year' => $academicYear,
                        'semester' => $semester,
                        'enrolled_date' => $enrollment->enrollment_date,
                        'completion_date' => $completionDate,
                        'final_status' => $finalStatus,
                        'final_grades' => $enrollment->studentGrades->toArray(),
                        'final_semester_grade' => $enrollment->semester_grade,
                        'letter_grade' => $enrollment->letter_grade,
                        'student_data' => $enrollment->student->toArray(),
                    ]);
                    $archivedStudentIds[] = $enrollment->student_id;
                }
                // Mark section as archived (non-destructive) instead of deleting it
                $section->status = 'archived';
                $section->save();
            }
            // Create ArchivedStudent records for the students we just archived
            $archivedStudentIds = array_values(array_unique($archivedStudentIds));
            if (! empty($archivedStudentIds)) {
                $students = Student::with('user', 'program')->whereIn('id', $archivedStudentIds)->get();
                foreach ($students as $student) {
                    // Skip if an archived record already exists for this student and period
                    $exists = ArchivedStudent::where('original_student_id', $student->id)
                        ->where('academic_year', $academicYear)
                        ->where('semester', $semester)
                        ->exists();

                    if ($exists) {
                        continue;
                    }

                    ArchivedStudent::create([
                        'original_student_id' => $student->id,
                        'user_id' => $student->user_id,
                        'program_id' => $student->program_id,
                        'student_number' => $student->student_number,
                        'first_name' => $student->first_name,
                        'last_name' => $student->last_name,
                        'middle_name' => $student->middle_name,
                        'birth_date' => $student->birth_date,
                        'address' => $student->address,
                        'phone' => $student->phone,
                        'year_level' => $student->year_level,
                        'parent_contact' => $student->parent_contact,
                        'student_type' => $student->student_type,
                        'education_level' => $student->education_level,
                        'track' => $student->track,
                        'strand' => $student->strand,
                        'status' => $student->status,
                        'enrolled_date' => $student->enrolled_date,
                        'academic_year' => $academicYear,
                        'semester' => $semester,
                        'archived_at' => now(),
                        'archived_by' => $user->id,
                        'archive_notes' => $this->option('notes'),
                        'student_data' => $student->toArray(),
                    ]);

                    // Mark student status to 'archived' so admins can filter them out if desired
                    $student->status = 'archived';
                    $student->save();
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
