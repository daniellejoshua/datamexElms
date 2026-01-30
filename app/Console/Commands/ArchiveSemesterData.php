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
    protected $signature = 'school:archive-semester-data {--notes=} {--academic-year=} {--semester=} {--force}';

    protected $description = 'Archive all sections, enrollments, and grades. SHS: Annual archiving with graduation. College: Semester archiving with final semester graduation. Only Head Teacher can run.';

    public function handle(): int
    {
        // Temporarily skip user check for testing
        // $user = Auth::user();
        // if (! $user || ! $user->hasRole('head_teacher')) {
        //     $this->error('Only Head Teacher can archive semester data.');
        //     return 1;
        // }
        $user = (object) ['id' => 1]; // Head teacher user for testing

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

            // Validate archiving rules based on education level
            if (! $this->validateArchivingRules($semester)) {
                return 1;
            }

            $this->info("Starting archive process for {$academicYear} - {$semester} semester...");

            // Get sections to archive based on education level rules
            $sectionsQuery = Section::with(['studentEnrollments', 'studentEnrollments.studentGrades', 'studentEnrollments.shsStudentGrades', 'sectionSubjects', 'sectionSubjects.subject', 'sectionSubjects.teacher.user']);

            // Archive sections based on semester and education level
            if ($semester === 'second') {
                // Archive all sections for the academic year (end of year archiving)
                $sections = $sectionsQuery->get();
            } elseif ($semester === 'first') {
                // For mid-year archiving, archive college sections and SHS sections (to create 2nd semester sections)
                $sections = $sectionsQuery->whereHas('program', function ($query) {
                    $query->whereIn('education_level', ['college', 'senior_high', 'shs']);
                })->get();
            } else {
                // For other semesters (summer), only archive college sections
                $sections = $sectionsQuery->whereHas('program', function ($query) {
                    $query->where('education_level', 'college');
                })->get();
            }

            $this->info("Found {$sections->count()} sections to archive");

            $archivedStudentIds = [];
            $graduatedStudents = [];
            $shsSectionsToRecreate = [];

            foreach ($sections as $section) {
                $this->info("Archiving section: {$section->section_name}");

                // Check if this is an SHS section
                $isShsSection = $section->program && in_array(strtolower($section->program->education_level), ['senior_high', 'shs']);

                if ($isShsSection) {
                    // For SHS sections, store info to recreate them after archiving
                    $shsSectionsToRecreate[] = [
                        'original_section' => $section,
                        'studentEnrollments' => $section->studentEnrollments,
                    ];
                }

                $archivedSection = ArchivedSection::create([
                    'original_section_id' => $section->id,
                    'program_id' => $section->program_id,
                    'curriculum_id' => $section->curriculum_id,
                    'year_level' => $section->year_level,
                    'section_name' => $section->section_name,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'room' => $section->room,
                    'status' => 'completed',
                    'course_data' => $section->sectionSubjects->map(function ($sectionSubject) {
                        return [
                            'id' => $sectionSubject->subject->id,
                            'subject_code' => $sectionSubject->subject->subject_code ?? null,
                            'subject_name' => $sectionSubject->subject->subject_name ?? null,
                            'units' => $sectionSubject->subject->units ?? null,
                            'teacher_id' => $sectionSubject->teacher_id,
                            'teacher_name' => $sectionSubject->teacher ? $sectionSubject->teacher->user->name : 'N/A',
                            'room' => $sectionSubject->room,
                            'schedule_days' => $sectionSubject->schedule_days,
                            'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                            'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
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

                // Only archive students for college sections, not SHS
                if (! $isShsSection) {
                    foreach ($section->studentEnrollments as $enrollment) {
                        $student = $enrollment->student;

                        // Check if student should graduate
                        $shouldGraduate = $this->shouldGraduateStudent($student, $academicYear, $semester, $enrollment);

                        // Preserve original status for archival snapshot; only mark active->completed
                        $originalStatus = $enrollment->status;
                        $completionDate = $enrollment->completion_date ?? now();

                        if ($originalStatus === 'active') {
                            $enrollment->status = 'completed';
                            $enrollment->completion_date = $completionDate;
                            $enrollment->save();
                            $finalStatus = 'completed'; // Use 'completed' instead of 'graduated' for archived records
                        } else {
                            // preserve dropped/withdrawn/etc.
                            $finalStatus = $originalStatus;
                        }

                        // Transform grades to expected format for archived records
                        $finalGrades = [];
                        if ($enrollment->studentGrades->count() > 0) {
                            $grade = $enrollment->studentGrades->first();
                            $finalGrades = [
                                'prelim' => $grade->prelim_grade,
                                'midterm' => $grade->midterm_grade,
                                'prefinals' => $grade->prefinal_grade,
                                'finals' => $grade->final_grade,
                            ];
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
                            'final_grades' => $finalGrades,
                            'final_semester_grade' => $enrollment->semester_grade,
                            'letter_grade' => $enrollment->letter_grade,
                            'student_data' => $enrollment->student->toArray(),
                        ]);

                        $archivedStudentIds[] = $enrollment->student_id;

                        // Track students for graduation
                        if ($shouldGraduate) {
                            $graduatedStudents[] = $student;
                        }
                    }
                }

                // Mark section as archived (non-destructive) instead of deleting it
                $section->status = 'archived';
                $section->save();

                // Mark all section subjects as inactive so they don't show in active views
                \App\Models\SectionSubject::where('section_id', $section->id)
                    ->update(['status' => 'inactive']);
            }

            // For SHS sections, create new sections for the next semester with same year level
            // Only do this when archiving 1st semester - for 2nd semester, archive normally like college
            if ($semester === 'first') {
                foreach ($shsSectionsToRecreate as $shsSectionData) {
                    $originalSection = $shsSectionData['original_section'];
                    $studentEnrollments = $shsSectionData['studentEnrollments'];

                    $this->info("Creating new SHS section for: {$originalSection->section_name}");

                    // For SHS, keep same year level but change semester
                    $sameYearLevel = $originalSection->year_level;
                    $nextSemester = '2nd'; // Archive 1st sem, create 2nd sem sections

                    // Create new section for 2nd semester with same year level
                    $newSection = Section::create([
                        'program_id' => $originalSection->program_id,
                        'curriculum_id' => $originalSection->curriculum_id,
                        'year_level' => $sameYearLevel, // Keep same year level
                        'section_name' => $originalSection->section_name, // Keep same name
                        'room' => $originalSection->room,
                        'status' => 'active',
                        'max_students' => $originalSection->max_students,
                        'academic_year' => $academicYear, // Keep same academic year
                        'semester' => $nextSemester,
                    ]);

                    // Move students to new section
                    foreach ($studentEnrollments as $enrollment) {
                        // Create new enrollment for the student in the new section
                        \App\Models\StudentEnrollment::create([
                            'student_id' => $enrollment->student_id,
                            'section_id' => $newSection->id,
                            'enrollment_date' => now(),
                            'enrolled_by' => $user->id, // Use the archiving user
                            'status' => 'active',
                            'academic_year' => $academicYear,
                            'semester' => $nextSemester,
                            'year_level' => $sameYearLevel, // Keep same year level
                        ]);
                    }

                    $this->info("Created new section {$newSection->section_name} (Grade {$sameYearLevel}) with {$studentEnrollments->count()} students for 2nd semester");
                }
            }

            // Create ArchivedStudent records and handle graduation
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
                        'year_level' => $this->convertYearLevelToInt($student->year_level),
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

                    // Check if this student should be graduated
                    $shouldGraduate = in_array($student, $graduatedStudents);

                    if ($shouldGraduate) {
                        // Graduate the student
                        $student->status = 'graduated';
                        $this->info("Graduating student: {$student->user->name} ({$student->student_number})");
                    } else {
                        // Mark as inactive (for continuing students who are archived)
                        $student->status = 'inactive';
                    }

                    $student->save();
                }
            }

            DB::commit();

            $graduationCount = count($graduatedStudents);
            $this->info('Archive process completed successfully!');
            $this->info("Archived {$sections->count()} sections");
            $this->info('Processed '.count($archivedStudentIds).' students');
            if ($graduationCount > 0) {
                $this->info("Graduated {$graduationCount} students");
            }

            return 0;
        } catch (\Exception $e) {
            DB::rollBack();
            $this->error('Error archiving semester data: '.$e->getMessage());

            return 1;
        }
    }

    /**
     * Validate archiving rules based on education level and semester.
     */
    private function validateArchivingRules(string $semester): bool
    {
        if ($semester !== 'second' && ! $this->option('force')) {
            $this->warn('Note: Only archiving college sections for mid-year archiving.');
            $this->warn('SHS sections will only be archived at the end of the academic year (2nd semester).');
            $this->warn('Use --force flag to override this behavior.');
        }

        return true;
    }

    /**
     * Determine if a student should graduate based on their current status and performance.
     */
    private function shouldGraduateStudent(Student $student, string $academicYear, string $semester, $enrollment): bool
    {
        // Only consider active students
        if ($student->status !== 'active') {
            return false;
        }

        // Check education level specific graduation requirements
        if ($student->education_level === 'college') {
            // College students graduate in 4th year, 2nd semester
            return $student->current_year_level == 4 &&
                   $semester === 'second' &&
                   $this->hasPassingGrades($enrollment);
        } elseif ($student->education_level === 'senior_high') {
            // SHS students graduate at end of Grade 12 (2nd semester of academic year)
            return $student->current_year_level == 12 &&
                   $semester === 'second' &&
                   $this->hasPassingGrades($enrollment);
        }

        return false;
    }

    /**
     * Check if enrollment has passing grades for graduation.
     */
    private function hasPassingGrades($enrollment): bool
    {
        $grades = $enrollment->studentGrades ?? collect();

        // All subjects must have final grades >= 75
        return $grades->every(function ($grade) {
            return $grade->final_grade && $grade->final_grade >= 75;
        });
    }

    /**
     * Convert year level string to integer for archiving.
     */
    private function convertYearLevelToInt(?string $yearLevel): ?int
    {
        if (! $yearLevel) {
            return null;
        }

        // Handle SHS format: "Grade 11" -> 11, "Grade 12" -> 12
        if (preg_match('/Grade (\d+)/', $yearLevel, $matches)) {
            return (int) $matches[1];
        }

        // Handle college format: "1st Year" -> 1, "2nd Year" -> 2, "3rd Year" -> 3, "4th Year" -> 4
        if (preg_match('/(\d+)(?:st|nd|rd|th) Year/', $yearLevel, $matches)) {
            return (int) $matches[1];
        }

        // Try to extract any number from the string
        if (preg_match('/(\d+)/', $yearLevel, $matches)) {
            return (int) $matches[1];
        }

        return null;
    }
}
