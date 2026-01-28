<?php

namespace App\Imports;

use App\Models\ShsStudentGrade;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use App\Models\Teacher;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class GradeImport implements ToCollection, WithHeadingRow
{
    protected \App\Models\SectionSubject $sectionSubject;

    protected Teacher $teacher;

    protected bool $isCollegeLevel;

    public function __construct(\App\Models\SectionSubject $sectionSubject, Teacher $teacher)
    {
        $this->sectionSubject = $sectionSubject;
        $this->teacher = $teacher;
        $this->isCollegeLevel = in_array($sectionSubject->section->year_level, [1, 2, 3, 4]);
    }

    public function collection(Collection $rows)
    {
        \Log::info('GradeImport collection method called', ['row_count' => $rows->count()]);

        // Validate the first row contains correct template data
        $firstRow = $rows->first();
        if ($firstRow && isset($firstRow['section_subject_id'])) {
            $templateSectionSubjectId = (string) $firstRow['section_subject_id'];
            $expectedSectionSubjectId = (string) $this->sectionSubject->id;

            if ($templateSectionSubjectId !== $expectedSectionSubjectId) {
                throw new \Exception("This template is for a different subject. Expected section_subject_id: {$expectedSectionSubjectId}, found: {$templateSectionSubjectId}");
            }

            \Log::info('Template validation passed', [
                'expected_section_subject_id' => $expectedSectionSubjectId,
                'template_section_subject_id' => $templateSectionSubjectId,
            ]);

            // Remove the validation row from processing
            $rows = $rows->skip(1);
        } else {
            \Log::warning('Template validation row not found - this may be an old template format');
        }

        foreach ($rows as $index => $row) {
            \Log::info('Processing row', [
                'row_index' => $index,
                'raw_row_data' => $row->toArray(),
                'student_id' => $row['student_id'] ?? $row['Student ID'] ?? 'missing',
                'student_name' => $row['student_name'] ?? $row['Student Name'] ?? 'missing',
            ]);

            // Cast student_id to string if it's not already
            $studentId = $row['student_id'] ?? $row['Student ID'] ?? '';
            $studentName = $row['student_name'] ?? $row['Student Name'] ?? '';

            if (isset($studentId)) {
                $row['student_id'] = (string) $studentId;
                \Log::info('Student ID cast to string', ['student_id' => $row['student_id']]);
            }

            // Find enrollment - first try regular enrollment, then irregular
            $enrollment = StudentEnrollment::whereHas('student', function ($query) use ($studentId) {
                $query->where('student_number', $studentId);
            })
                ->whereHas('student.user', function ($query) use ($studentName) {
                    $query->where('name', $studentName);
                })
                ->where('section_id', $this->sectionSubject->section_id)
                ->where('status', 'active')
                ->first();

            if (! $enrollment) {
                // Try to find irregular enrollment
                $subjectEnrollment = StudentSubjectEnrollment::whereHas('student', function ($query) use ($studentId) {
                    $query->where('student_number', $studentId);
                })
                    ->whereHas('student.user', function ($query) use ($studentName) {
                        $query->where('name', $studentName);
                    })
                    ->where('section_subject_id', $this->sectionSubject->id)
                    ->where('status', 'active')
                    ->first();

                if ($subjectEnrollment) {
                    // Create/find enrollment for irregular student
                    $enrollment = StudentEnrollment::firstOrCreate([
                        'student_id' => $subjectEnrollment->student_id,
                        'section_id' => $this->sectionSubject->section_id,
                        'status' => 'active',
                    ], [
                        'enrollment_type' => 'irregular',
                        'enrollment_date' => now(),
                    ]);
                }
            }

            if (! $enrollment) {
                \Log::warning('Student enrollment not found', [
                    'student_id' => $studentId,
                    'student_name' => $studentName,
                    'section_subject_id' => $this->sectionSubject->id,
                ]);

                continue;
            }

            \Log::info('Found enrollment', ['enrollment_id' => $enrollment->id]);

            if ($this->isCollegeLevel) {
                // Handle college grades
                $grade = StudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'section_subject_id' => $this->sectionSubject->id,
                    'teacher_id' => $this->teacher->id,
                ]);

                \Log::info('College grade lookup', [
                    'enrollment_id' => $enrollment->id,
                    'section_subject_id' => $this->sectionSubject->id,
                    'teacher_id' => $this->teacher->id,
                    'existing' => $grade->exists,
                    'grade_id' => $grade->id ?? null,
                ]);

                // Only set grade fields if the source cell contains a numeric value
                $prelimRaw = $row['prelim'] ?? $row['Prelim'] ?? null;
                $midtermRaw = $row['midterm'] ?? $row['Midterm'] ?? null;
                $prefinalRaw = $row['prefinals'] ?? $row['PreFinals'] ?? $row['prefinal'] ?? $row['PreFinal'] ?? null;
                $finalRaw = $row['finals'] ?? $row['Finals'] ?? $row['final'] ?? $row['Final'] ?? null;

                if ($this->hasNumericValue($prelimRaw)) {
                    $grade->prelim_grade = $this->parseGrade($prelimRaw);
                    if ($grade->prelim_grade !== null && ! $grade->prelim_submitted_at) {
                        $grade->prelim_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($midtermRaw)) {
                    $grade->midterm_grade = $this->parseGrade($midtermRaw);
                    if ($grade->midterm_grade !== null && ! $grade->midterm_submitted_at) {
                        $grade->midterm_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($prefinalRaw)) {
                    $grade->prefinal_grade = $this->parseGrade($prefinalRaw);
                    if ($grade->prefinal_grade !== null && ! $grade->prefinal_submitted_at) {
                        $grade->prefinal_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($finalRaw)) {
                    $grade->final_grade = $this->parseGrade($finalRaw);
                    if ($grade->final_grade !== null && ! $grade->final_submitted_at) {
                        $grade->final_submitted_at = now();
                    }
                }

                // Calculate semester grade only when all components are non-null (allow zero values)
                if ($grade->prelim_grade !== null && $grade->midterm_grade !== null && $grade->prefinal_grade !== null && $grade->final_grade !== null) {
                    $grade->semester_grade = ($grade->prelim_grade + $grade->midterm_grade + $grade->prefinal_grade + $grade->final_grade) / 4;
                    $grade->overall_status = $grade->semester_grade >= 60 ? 'passed' : 'failed';
                }

                $saved = $grade->save();
                \Log::info('College grade saved', [
                    'grade_id' => $grade->id,
                    'saved' => $saved,
                    'prelim' => $grade->prelim_grade,
                    'midterm' => $grade->midterm_grade,
                    'prefinals' => $grade->prefinal_grade,
                    'finals' => $grade->final_grade,
                    'semester_grade' => $grade->semester_grade,
                    'overall_status' => $grade->overall_status,
                    'errors' => $saved ? null : $grade->errors,
                    'attributes' => $grade->getAttributes(),
                ]);

                if (! $saved) {
                    \Log::error('Failed to save college grade', [
                        'grade_id' => $grade->id,
                        'errors' => $grade->errors ?? 'No errors',
                        'attributes' => $grade->getAttributes(),
                    ]);
                    throw new \Exception('Failed to save college grade: ' . json_encode($grade->errors));
                }
            } else {
                // Handle SHS grades
                $grade = ShsStudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'section_subject_id' => $this->sectionSubject->id,
                    'teacher_id' => $this->teacher->id,
                ]);

                \Log::info('SHS grade lookup', [
                    'enrollment_id' => $enrollment->id,
                    'section_subject_id' => $this->sectionSubject->id,
                    'teacher_id' => $this->teacher->id,
                    'existing' => $grade->exists,
                    'grade_id' => $grade->id ?? null,
                ]);

                // Only set quarter grades when the source cell contains a numeric value
                $q1Raw = $row['1st_quarter'] ?? $row['1st Quarter'] ?? $row['first_quarter'] ?? $row['First Quarter'] ?? null;
                $q2Raw = $row['2nd_quarter'] ?? $row['2nd Quarter'] ?? $row['second_quarter'] ?? $row['Second Quarter'] ?? null;
                $q3Raw = $row['3rd_quarter'] ?? $row['3rd Quarter'] ?? $row['third_quarter'] ?? $row['Third Quarter'] ?? null;
                $q4Raw = $row['4th_quarter'] ?? $row['4th Quarter'] ?? $row['fourth_quarter'] ?? $row['Fourth Quarter'] ?? null;

                if ($this->hasNumericValue($q1Raw)) {
                    $grade->first_quarter_grade = $this->parseGrade($q1Raw);
                    if ($grade->first_quarter_grade !== null && ! $grade->first_quarter_submitted_at) {
                        $grade->first_quarter_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($q2Raw)) {
                    $grade->second_quarter_grade = $this->parseGrade($q2Raw);
                    if ($grade->second_quarter_grade !== null && ! $grade->second_quarter_submitted_at) {
                        $grade->second_quarter_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($q3Raw)) {
                    $grade->third_quarter_grade = $this->parseGrade($q3Raw);
                    if ($grade->third_quarter_grade !== null && ! $grade->third_quarter_submitted_at) {
                        $grade->third_quarter_submitted_at = now();
                    }
                }

                if ($this->hasNumericValue($q4Raw)) {
                    $grade->fourth_quarter_grade = $this->parseGrade($q4Raw);
                    if ($grade->fourth_quarter_grade !== null && ! $grade->fourth_quarter_submitted_at) {
                        $grade->fourth_quarter_submitted_at = now();
                    }
                }

                // Calculate final grade when all quarters are non-null (allow zero)
                if ($grade->first_quarter_grade !== null && $grade->second_quarter_grade !== null &&
                    $grade->third_quarter_grade !== null && $grade->fourth_quarter_grade !== null) {
                    $grade->final_grade = ($grade->first_quarter_grade + $grade->second_quarter_grade +
                                         $grade->third_quarter_grade + $grade->fourth_quarter_grade) / 4;
                    $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                }

                $saved = $grade->save();
                \Log::info('SHS grade saved', [
                    'grade_id' => $grade->id,
                    'saved' => $saved,
                    '1st_quarter' => $grade->first_quarter_grade,
                    '2nd_quarter' => $grade->second_quarter_grade,
                    '3rd_quarter' => $grade->third_quarter_grade,
                    '4th_quarter' => $grade->fourth_quarter_grade,
                    'final_grade' => $grade->final_grade,
                    'completion_status' => $grade->completion_status,
                    'errors' => $saved ? null : $grade->errors,
                    'attributes' => $grade->getAttributes(),
                ]);

                if (! $saved) {
                    \Log::error('Failed to save SHS grade', [
                        'grade_id' => $grade->id,
                        'errors' => $grade->errors ?? 'No errors',
                        'attributes' => $grade->getAttributes(),
                    ]);
                    throw new \Exception('Failed to save SHS grade: ' . json_encode($grade->errors));
                }
            }
        }
    }

    private function parseGrade(?string $grade): ?float
    {
        if ($grade === null) {
            return null;
        }

        $trimmed = trim((string) $grade);
        if ($trimmed === '') {
            return null;
        }

        if (! is_numeric($trimmed)) {
            return null;
        }

        $numericGrade = (float) $trimmed;

        // Validate grade range
        if ($numericGrade < 0 || $numericGrade > 100) {
            return null;
        }

        return $numericGrade;
    }

    private function hasNumericValue($value): bool
    {
        if ($value === null) return false;

        $trim = trim((string) $value);
        if ($trim === '') return false;

        return is_numeric($trim);
    }
}
