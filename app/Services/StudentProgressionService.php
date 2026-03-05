<?php

namespace App\Services;

use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\CurriculumSubject;
use App\Models\SemesterFinalization;
use App\Models\ShsStudentGrade;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use App\Models\StudentSemesterPayment;
use Illuminate\Support\Facades\DB;

/**
 * Handles student progression through semesters and year levels
 * without creating duplicate student records.
 */
class StudentProgressionService
{
    /**
     * Progress a student to the next semester within the same year level.
     */
    public function progressToNextSemester(Student $student, string $newAcademicYear, string $newSemester): void
    {
        // Check if student has any unpaid balances
        $unpaidBalances = StudentSemesterPayment::where('student_id', $student->id)
            ->where('balance', '>', 0)
            ->sum('balance');

        if ($unpaidBalances > 0) {
            throw new \Exception("Cannot progress student {$student->user->name} due to unpaid balance of ₱".number_format($unpaidBalances, 2));
        }

        DB::transaction(function () use ($student, $newAcademicYear, $newSemester) {
            // Archive current enrollment if exists
            $currentEnrollment = $student->enrollments()
                ->where('status', 'active')
                ->first();

            if ($currentEnrollment) {
                $this->archiveEnrollment($currentEnrollment);
            }

            // Create new enrollment for next semester
            StudentEnrollment::create([
                'student_id' => $student->id,
                'section_id' => null, // Will be assigned during section assignment
                'academic_year' => $newAcademicYear,
                'semester' => $newSemester,
                'status' => 'active',
                'enrollment_date' => now(),
                'enrolled_by' => auth()->id,
            ]);
        });
    }

    /**
     * Progress a student to the next year level.
     */
    public function progressToNextYearLevel(Student $student, string $newAcademicYear): void
    {
        // Check if student has any unpaid balances
        $unpaidBalances = StudentSemesterPayment::where('student_id', $student->id)
            ->where('balance', '>', 0)
            ->sum('balance');

        if ($unpaidBalances > 0) {
            throw new \Exception("Cannot progress student {$student->user->name} due to unpaid balance of ₱".number_format($unpaidBalances, 2));
        }

        // SHS gate: Grade 11 -> Grade 12 requires complete/passing Grade 11 curriculum.
        $this->assertShsPromotionEligibility($student);

        DB::transaction(function () use ($student, $newAcademicYear) {
            // Archive current enrollment
            $currentEnrollment = $student->enrollments()
                ->where('status', 'active')
                ->first();

            if ($currentEnrollment) {
                $this->archiveEnrollment($currentEnrollment);
            }

            // Update student's year level
            $newYearLevel = $this->getNextYearLevel($student->current_year_level);
            $student->update([
                'current_year_level' => $newYearLevel,
                'year_level' => $newYearLevel, // Backward compatibility
            ]);

            // Create new enrollment for first semester of new year
            StudentEnrollment::create([
                'student_id' => $student->id,
                'section_id' => null,
                'academic_year' => $newAcademicYear,
                'semester' => '1st',
                'status' => 'active',
                'enrollment_date' => now(),
                'enrolled_by' => auth()->id,
            ]);
        });
    }

    /**
     * Graduate a student (complete their program).
     */
    public function graduateStudent(Student $student): void
    {
        DB::transaction(function () use ($student) {
            // Archive current enrollment with graduation status
            $currentEnrollment = $student->enrollments()
                ->where('status', 'active')
                ->first();

            if ($currentEnrollment) {
                $this->archiveEnrollment($currentEnrollment, 'graduated');
            }

            // Update student status to graduated
            $student->update([
                'status' => 'graduated',
            ]);
        });
    }

    /**
     * Archive an enrollment record.
     */
    private function archiveEnrollment(StudentEnrollment $enrollment, string $finalStatus = 'completed'): void
    {
        // Get final grades for this enrollment
        $finalGrades = $enrollment->studentGrades()
            ->with('sectionSubject.subject')
            ->get()
            ->mapWithKeys(function ($grade) {
                return [
                    $grade->sectionSubject->subject->name => [
                        'prelim' => $grade->prelim_grade,
                        'midterm' => $grade->midterm_grade,
                        'prefinal' => $grade->prefinal_grade,
                        'final' => $grade->final_grade,
                        'final_average' => $grade->final_grade,
                    ],
                ];
            })->toArray();

        // Calculate semester grade
        $semesterGrade = collect($finalGrades)
            ->avg(fn ($grades) => $grades['final_average']);

        // Create archived record
        ArchivedStudentEnrollment::create([
            'archived_section_id' => $enrollment->section_id,
            'student_id' => $enrollment->student_id,
            'original_enrollment_id' => $enrollment->id,
            'academic_year' => $enrollment->academic_year,
            'semester' => $enrollment->semester,
            'enrolled_date' => $enrollment->enrollment_date,
            'completion_date' => now(),
            'final_status' => $finalStatus,
            'final_grades' => $finalGrades,
            'final_semester_grade' => $semesterGrade,
            'letter_grade' => $this->calculateLetterGrade($semesterGrade),
            'student_data' => [
                'year_level_at_completion' => $enrollment->student->current_year_level,
                'program' => $enrollment->student->program?->name,
                'track' => $enrollment->student->track,
                'strand' => $enrollment->student->strand,
            ],
        ]);

        // Update enrollment status
        $enrollment->update(['status' => 'completed']);
    }

    /**
     * Get the next year level.
     */
    private function getNextYearLevel(string $currentLevel): string
    {
        $yearLevelMap = [
            '1' => '2',
            '2' => '3',
            '3' => '4',
            '11' => '12', // SHS
            'Grade 11' => 'Grade 12',
            'Grade 12' => 'Graduate',
        ];

        return $yearLevelMap[$currentLevel] ?? $currentLevel;
    }

    /**
     * Calculate letter grade from numeric grade.
     */
    private function calculateLetterGrade(?float $grade): ?string
    {
        if ($grade === null) {
            return null;
        }

        return match (true) {
            $grade >= 95 => 'A+',
            $grade >= 90 => 'A',
            $grade >= 85 => 'B+',
            $grade >= 80 => 'B',
            $grade >= 75 => 'C+',
            $grade >= 70 => 'C',
            $grade >= 65 => 'D',
            default => 'F',
        };
    }

    /**
     * Prevent SHS Grade 11 students from moving to Grade 12
     * if they still have missing or failed Grade 11 curriculum subjects.
     */
    private function assertShsPromotionEligibility(Student $student): void
    {
        $educationLevel = strtolower((string) ($student->education_level ?? $student->program?->education_level ?? ''));
        $isShs = in_array($educationLevel, ['shs', 'senior_high'], true);
        $currentYearRaw = (string) ($student->current_year_level ?? '');
        $currentYear = str_contains($currentYearRaw, '11') ? 11 : (str_contains($currentYearRaw, '12') ? 12 : (int) $currentYearRaw);

        // Only enforce when moving from Grade 11.
        if (! $isShs || $currentYear !== 11) {
            return;
        }

        if (empty($student->curriculum_id)) {
            throw new \Exception('Cannot promote to Grade 12: student has no assigned curriculum.');
        }

        $grade11Curriculum = CurriculumSubject::query()
            ->where('curriculum_id', $student->curriculum_id)
            ->where(function ($q) {
                $q->whereIn('year_level', [11, '11', 'Grade 11', 'grade 11', 1, '1']);
            })
            ->get();

        if ($grade11Curriculum->isEmpty()) {
            throw new \Exception('Cannot promote to Grade 12: no Grade 11 curriculum subjects found.');
        }

        $requiredSubjectCodes = $grade11Curriculum
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)))
            ->unique()
            ->values();

        $requiredSubjectIds = $grade11Curriculum
            ->pluck('subject_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        $passedCodes = collect();

        // SHS grade rows (primary source).
        $shsPassed = ShsStudentGrade::query()
            ->whereHas('studentEnrollment', fn ($q) => $q->where('student_id', $student->id))
            ->whereNotNull('final_grade')
            ->where('final_grade', '>=', 75)
            ->with('sectionSubject.subject')
            ->get()
            ->pluck('sectionSubject.subject.subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));
        $passedCodes = $passedCodes->merge($shsPassed);

        // StudentGrade fallback.
        $collegeStylePassed = StudentGrade::query()
            ->whereHas('studentEnrollment', fn ($q) => $q->where('student_id', $student->id))
            ->whereNotNull('final_grade')
            ->where('final_grade', '>=', 75)
            ->with('sectionSubject.subject')
            ->get()
            ->pluck('sectionSubject.subject.subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));
        $passedCodes = $passedCodes->merge($collegeStylePassed);

        // Archived grades.
        $archivedPassed = ArchivedStudentSubject::query()
            ->where('student_id', $student->id)
            ->where(function ($q) {
                $q->where('semester_grade', '>=', 75)
                    ->orWhere('final_grade', '>=', 75);
            })
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));
        $passedCodes = $passedCodes->merge($archivedPassed);

        // Credited subjects count as completed.
        $creditedCodes = StudentSubjectCredit::query()
            ->where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get(['subject_id', 'subject_code'])
            ->filter(function ($row) use ($requiredSubjectIds, $requiredSubjectCodes) {
                $code = strtoupper(trim((string) ($row->subject_code ?? '')));
                return $requiredSubjectIds->contains((int) $row->subject_id)
                    || ($code !== '' && $requiredSubjectCodes->contains($code));
            })
            ->pluck('subject_code')
            ->filter()
            ->map(fn ($code) => strtoupper(trim((string) $code)));
        $passedCodes = $passedCodes->merge($creditedCodes);

        $passedCodes = $passedCodes->unique()->values();

        $missingOrFailed = $requiredSubjectCodes
            ->filter(fn ($required) => ! $passedCodes->contains($required))
            ->values();

        if ($missingOrFailed->isNotEmpty()) {
            $sample = $missingOrFailed->take(5)->implode(', ');
            $extra = $missingOrFailed->count() > 5 ? ' ...' : '';
            throw new \Exception("Cannot promote to Grade 12: incomplete or failed Grade 11 curriculum subjects ({$sample}{$extra}).");
        }
    }

    /**
     * Get graduation candidates for a given period.
     */
    public function getGraduationCandidates(string $academicYear, string $semester, string $educationLevel): \Illuminate\Database\Eloquent\Collection
    {
        $maxYearLevel = $educationLevel === 'shs' ? '12' : '4';

        return Student::whereHas('enrollments', function ($query) use ($academicYear, $semester) {
            $query->where('academic_year', $academicYear)
                ->where('semester', $semester)
                ->where('status', 'active');
        })
            ->where('current_year_level', $maxYearLevel)
            ->where('education_level', $educationLevel)
            ->where('status', 'active')
            ->with(['enrollments.studentGrades', 'program'])
            ->get()
            ->filter(function ($student) {
                // Check if student has passing grades
                return $this->hasPassingGrades($student);
            });
    }

    /**
     * Check if a student has passing grades for graduation.
     */
    private function hasPassingGrades(Student $student): bool
    {
        $currentEnrollment = $student->enrollments()
            ->where('status', 'active')
            ->first();

        if (! $currentEnrollment) {
            return false;
        }

        $grades = $currentEnrollment->studentGrades;

        // All subjects must have final grades >= 75
        return $grades->every(function ($grade) {
            return $grade->final_grade && $grade->final_grade >= 75;
        });
    }

    /**
     * Batch process semester completion for multiple students.
     */
    public function batchProcessSemesterCompletion(array $studentIds, string $academicYear, string $semester): array
    {
        $results = ['success' => 0, 'failed' => 0, 'errors' => []];

        foreach ($studentIds as $studentId) {
            try {
                $student = Student::findOrFail($studentId);

                // Check if this semester is finalized
                if (SemesterFinalization::isFinalized($academicYear, $semester, $student->education_level, $student->track)) {
                    throw new \Exception("Semester {$semester} {$academicYear} is already finalized for {$student->education_level}");
                }

                // Note: Graduation is now handled automatically during archiving
                // Only progress to next semester for continuing students
                $this->progressToNextSemester($student, $this->getNextAcademicPeriod($academicYear, $semester)['year'], $this->getNextAcademicPeriod($academicYear, $semester)['semester']);

                $results['success']++;
            } catch (\Exception $e) {
                $results['failed']++;
                $results['errors'][] = "Student ID {$studentId}: ".$e->getMessage();
            }
        }

        return $results;
    }

    /**
     * Check if a student should graduate.
     */
    private function shouldGraduate(Student $student, string $academicYear, string $semester): bool
    {
        $maxYearLevel = $student->education_level === 'senior_high' ? '12' : '4';
        $finalSemester = $student->education_level === 'senior_high' ? '2nd' : '2nd';

        return $student->current_year_level == $maxYearLevel &&
               $semester === $finalSemester &&
               $this->hasPassingGrades($student);
    }

    /**
     * Get next academic period.
     */
    private function getNextAcademicPeriod(string $currentYear, string $currentSemester): array
    {
        if ($currentSemester === '1st') {
            return ['year' => $currentYear, 'semester' => '2nd'];
        } else {
            // Move to next academic year, first semester
            $yearParts = explode('-', $currentYear);
            $nextStartYear = (int) $yearParts[0] + 1;
            $nextEndYear = (int) $yearParts[1] + 1;

            return [
                'year' => "{$nextStartYear}-{$nextEndYear}",
                'semester' => '1st',
            ];
        }
    }
}
