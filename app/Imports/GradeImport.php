<?php

namespace App\Imports;

use App\Models\SchoolSetting;
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

    /** @var array<string> */
    public array $warnings = [];

    /** @var array<string> */
    public array $successfulImports = [];

    protected int $totalRowsProcessed = 0;

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
        $hasValidationRow = false;
        if ($firstRow) {
            // Look for explicit section_subject_id key OR a validation marker in any value
            $firstRowArray = $firstRow->toArray();
            $valuesConcat = implode(' ', array_map(fn ($v) => (string) $v, $firstRowArray));

            if (isset($firstRow['section_subject_id']) || stripos($valuesConcat, 'DO NOT MODIFY') !== false || stripos($valuesConcat, 'Template validation') !== false || isset($firstRow['validation'])) {
                $hasValidationRow = true;

                // Try to determine the section_subject_id from key or any numeric value in the row
                $templateSectionSubjectId = null;
                if (isset($firstRow['section_subject_id'])) {
                    $templateSectionSubjectId = (string) $firstRow['section_subject_id'];
                } else {
                    foreach ($firstRowArray as $val) {
                        if (is_numeric($val)) {
                            $templateSectionSubjectId = (string) $val;
                            break;
                        }
                    }
                }

                $expectedSectionSubjectId = (string) $this->sectionSubject->id;

                if ($templateSectionSubjectId !== null && $templateSectionSubjectId !== $expectedSectionSubjectId) {
                    throw new \Exception("This template is for a different subject. Expected section_subject_id: {$expectedSectionSubjectId}, found: {$templateSectionSubjectId}");
                }

                \Log::info('Template validation passed', [
                    'expected_section_subject_id' => $expectedSectionSubjectId,
                    'template_section_subject_id' => $templateSectionSubjectId,
                    'detected_values' => $firstRowArray,
                ]);

                // Remove the validation row from processing and reindex the collection so the foreach index is 0-based
                $rows = $rows->skip(1)->values();
            } else {
                \Log::warning('Template validation row not found - this may be an old template format');
                // Ensure rows are reindexed even when there is no explicit validation row
                $rows = $rows->values();
            }
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

            $studentId = $studentId !== null ? (string) trim((string) $studentId) : '';
            $studentName = $studentName !== null ? trim((string) $studentName) : '';

            // If student id or name look invalid (too short or empty), skip and warn
            $rowNumber = $index + ($hasValidationRow ? 3 : 2);
            $this->totalRowsProcessed++;

            if ($studentId === '' || strlen($studentName) < 2 || strlen($studentId) < 3) {
                $this->warnings[] = "❌ Row {$rowNumber}: Student data appears invalid ";

                continue;
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
                        'enrolled_by' => $this->teacher->id,
                        'academic_year' => SchoolSetting::getCurrentAcademicYear(),
                        'semester' => SchoolSetting::getCurrentSemester(),
                    ]);
                }
            }

            if (! $enrollment) {
                // Try to find student by ID only to provide better error message
                $studentByIdOnly = \App\Models\Student::where('student_number', $studentId)->first();

                if ($studentByIdOnly) {
                    $actualName = $studentByIdOnly->user->name ?? 'Unknown';
                    $this->warnings[] = "⚠️ Row {$rowNumber}: Student ID '{$studentId}' found but name mismatch - Expected: '{$actualName}', Found: '{$studentName}'. This row was skipped. Please verify the student name in your Excel file.";
                } else {
                    // Try to find similar student names in the section to provide suggestions
                    $similarStudents = \App\Models\StudentEnrollment::whereHas('student.user', function ($query) use ($studentName) {
                        $query->where('name', 'like', '%'.$studentName.'%');
                    })
                        ->where('section_id', $this->sectionSubject->section_id)
                        ->where('status', 'active')
                        ->with('student.user')
                        ->limit(3)
                        ->get();

                    if ($similarStudents->count() > 0) {
                        $suggestions = $similarStudents->map(fn ($enrollment) => "'{$enrollment->student->student_number}' - '{$enrollment->student->user->name}'"
                        )->join(', ');
                        $this->warnings[] = "❌ Row {$rowNumber}: Student '{$studentId}' - '{$studentName}' not found in this section. Did you mean: {$suggestions}?";
                    } else {
                        $this->warnings[] = "❌ Row {$rowNumber}: Student '{$studentId}' - '{$studentName}' not found in this section. Please verify the student is enrolled in this section and the student ID is correct.";
                    }
                }

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

                $rowNumber = $index + ($hasValidationRow ? 3 : 2);

                if ($this->hasNumericValue($prelimRaw)) {
                    $parsed = $this->parseGrade($prelimRaw);
                    if ($parsed === null) {
                        $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): Prelim grade '{$prelimRaw}' is out of valid range (0-100) and was ignored. Please use grades between 0 and 100.";
                    } else {
                        $grade->prelim_grade = $parsed;
                        if ($grade->prelim_grade !== null && ! $grade->prelim_submitted_at) {
                            $grade->prelim_submitted_at = now();
                        }
                    }
                } elseif ($prelimRaw !== null && trim((string) $prelimRaw) !== '') {
                    $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): Prelim value '{$prelimRaw}' is not a number and was ignored. Please enter numeric grades only.";
                }

                if ($this->hasNumericValue($midtermRaw)) {
                    $parsed = $this->parseGrade($midtermRaw);
                    if ($parsed === null) {
                        $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): Midterm grade '{$midtermRaw}' is out of valid range (0-100) and was ignored. Please use grades between 0 and 100.";
                    } else {
                        $grade->midterm_grade = $parsed;
                        if ($grade->midterm_grade !== null && ! $grade->midterm_submitted_at) {
                            $grade->midterm_submitted_at = now();
                        }
                    }
                } elseif ($midtermRaw !== null && trim((string) $midtermRaw) !== '') {
                    $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): Midterm value '{$midtermRaw}' is not a number and was ignored. Please enter numeric grades only.";
                }

                if ($this->hasNumericValue($prefinalRaw)) {
                    $parsed = $this->parseGrade($prefinalRaw);
                    if ($parsed === null) {
                        $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell E{$rowNumber}): PreFinals value '{$prefinalRaw}' is out of range or invalid and was ignored.";
                    } else {
                        $grade->prefinal_grade = $parsed;
                        if ($grade->prefinal_grade !== null && ! $grade->prefinal_submitted_at) {
                            $grade->prefinal_submitted_at = now();
                        }
                    }
                } elseif ($prefinalRaw !== null && trim((string) $prefinalRaw) !== '') {
                    $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell E{$rowNumber}): PreFinals value '{$prefinalRaw}' is not numeric and was ignored.";
                }

                if ($this->hasNumericValue($finalRaw)) {
                    $parsed = $this->parseGrade($finalRaw);
                    if ($parsed === null) {
                        $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell F{$rowNumber}): Finals value '{$finalRaw}' is out of range or invalid and was ignored.";
                    } else {
                        $grade->final_grade = $parsed;
                        if ($grade->final_grade !== null && ! $grade->final_submitted_at) {
                            $grade->final_submitted_at = now();
                        }
                    }
                } elseif ($finalRaw !== null && trim((string) $finalRaw) !== '') {
                    $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell F{$rowNumber}): Finals value '{$finalRaw}' is not numeric and was ignored.";
                }

                // Handle teacher remarks
                $remarksRaw = $row['teacher_remarks'] ?? $row['Teacher Remarks'] ?? $row['remarks'] ?? $row['Remarks'] ?? null;
                if ($remarksRaw !== null) {
                    $remarks = trim((string) $remarksRaw);
                    if ($remarks !== '') {
                        $grade->teacher_remarks = $remarks;
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
                    throw new \Exception('Failed to save college grade: '.json_encode($grade->errors));
                } else {
                    // Track successful import
                    $gradesSet = [];
                    if ($grade->prelim_grade !== null) {
                        $gradesSet[] = "Prelim: {$grade->prelim_grade}";
                    }
                    if ($grade->midterm_grade !== null) {
                        $gradesSet[] = "Midterm: {$grade->midterm_grade}";
                    }
                    if ($grade->prefinal_grade !== null) {
                        $gradesSet[] = "Prefinals: {$grade->prefinal_grade}";
                    }
                    if ($grade->final_grade !== null) {
                        $gradesSet[] = "Finals: {$grade->final_grade}";
                    }

                    $gradesInfo = ! empty($gradesSet) ? ' ('.implode(', ', $gradesSet).')' : '';
                    $this->successfulImports[] = "✅ Row {$rowNumber}: {$studentName} ({$studentId}){$gradesInfo}";
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
                $q1Raw = $row['1st_quarter'] ?? $row['1st Quarter'] ?? $row['first_quarter'] ?? $row['First Quarter'] ?? $row['q1'] ?? $row['Q1'] ?? null;
                $q2Raw = $row['2nd_quarter'] ?? $row['2nd Quarter'] ?? $row['second_quarter'] ?? $row['Second Quarter'] ?? $row['q2'] ?? $row['Q2'] ?? null;

                if (! $this->isCollegeLevel) {
                    // For SHS, only process Q1 and Q2
                    $q3Raw = null;
                    $q4Raw = null;
                } else {
                    // For College, Q3 and Q4 don't exist, but keep for backward compatibility
                    $q3Raw = $row['3rd_quarter'] ?? $row['3rd Quarter'] ?? $row['third_quarter'] ?? $row['Third Quarter'] ?? null;
                    $q4Raw = $row['4th_quarter'] ?? $row['4th Quarter'] ?? $row['fourth_quarter'] ?? $row['Fourth Quarter'] ?? null;
                }

                if ($this->hasNumericValue($q1Raw)) {
                    $parsed = $this->parseGrade($q1Raw);
                    if ($parsed === null) {
                        $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): 1st Quarter grade '{$q1Raw}' is out of valid range (0-100) and was ignored. Please use grades between 0 and 100.";
                    } else {
                        $grade->first_quarter_grade = $parsed;
                        if ($grade->first_quarter_grade !== null && ! $grade->first_quarter_submitted_at) {
                            $grade->first_quarter_submitted_at = now();
                        }
                    }
                } elseif ($q1Raw !== null && trim((string) $q1Raw) !== '') {
                    $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): 1st Quarter value '{$q1Raw}' is not a number and was ignored. Please enter numeric grades only.";
                }

                if ($this->hasNumericValue($q2Raw)) {
                    $parsed = $this->parseGrade($q2Raw);
                    if ($parsed === null) {
                        $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): 2nd Quarter grade '{$q2Raw}' is out of valid range (0-100) and was ignored. Please use grades between 0 and 100.";
                    } else {
                        $grade->second_quarter_grade = $parsed;
                        if ($grade->second_quarter_grade !== null && ! $grade->second_quarter_submitted_at) {
                            $grade->second_quarter_submitted_at = now();
                        }
                    }
                } elseif ($q2Raw !== null && trim((string) $q2Raw) !== '') {
                    $this->warnings[] = "⚠️ Row {$rowNumber} (Student: {$studentName}): 2nd Quarter value '{$q2Raw}' is not a number and was ignored. Please enter numeric grades only.";
                }

                if ($this->hasNumericValue($q3Raw)) {
                    $parsed = $this->parseGrade($q3Raw);
                    if ($parsed === null) {
                        $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell E{$rowNumber}): 3rd Quarter value '{$q3Raw}' is out of range or invalid and was ignored.";
                    } else {
                        $grade->third_quarter_grade = $parsed;
                        if ($grade->third_quarter_grade !== null && ! $grade->third_quarter_submitted_at) {
                            $grade->third_quarter_submitted_at = now();
                        }
                    }
                } elseif ($q3Raw !== null && trim((string) $q3Raw) !== '') {
                    $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell E{$rowNumber}): 3rd Quarter value '{$q3Raw}' is not numeric and was ignored.";
                }

                if ($this->hasNumericValue($q4Raw)) {
                    $parsed = $this->parseGrade($q4Raw);
                    if ($parsed === null) {
                        $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell F{$rowNumber}): 4th Quarter value '{$q4Raw}' is out of range or invalid and was ignored.";
                    } else {
                        $grade->fourth_quarter_grade = $parsed;
                        if ($grade->fourth_quarter_grade !== null && ! $grade->fourth_quarter_submitted_at) {
                            $grade->fourth_quarter_submitted_at = now();
                        }
                    }
                } elseif ($q4Raw !== null && trim((string) $q4Raw) !== '') {
                    $this->warnings[] = "Row {$rowNumber} (Student ID: '{$studentId}' - {$studentName}; Cell F{$rowNumber}): 4th Quarter value '{$q4Raw}' is not numeric and was ignored.";
                }

                // Handle teacher remarks
                $remarksRaw = $row['teacher_remarks'] ?? $row['Teacher Remarks'] ?? $row['remarks'] ?? $row['Remarks'] ?? null;
                if ($remarksRaw !== null) {
                    $remarks = trim((string) $remarksRaw);
                    if ($remarks !== '') {
                        $grade->teacher_remarks = $remarks;
                    }
                }

                // Calculate final grade when required quarters are non-null (allow zero)
                if (! $this->isCollegeLevel) {
                    // For SHS, only require Q1 and Q2
                    if ($grade->first_quarter_grade !== null && $grade->second_quarter_grade !== null) {
                        $grade->final_grade = round(($grade->first_quarter_grade + $grade->second_quarter_grade) / 2, 2);
                        $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                    }
                } else {
                    // For College, require all 4 quarters (though this shouldn't happen in practice)
                    if ($grade->first_quarter_grade !== null && $grade->second_quarter_grade !== null &&
                        $grade->third_quarter_grade !== null && $grade->fourth_quarter_grade !== null) {
                        $grade->final_grade = ($grade->first_quarter_grade + $grade->second_quarter_grade +
                                             $grade->third_quarter_grade + $grade->fourth_quarter_grade) / 4;
                        $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                    }
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
                    throw new \Exception('Failed to save SHS grade: '.json_encode($grade->errors));
                } else {
                    // Track successful import
                    $gradesSet = [];
                    if ($grade->first_quarter_grade !== null) {
                        $gradesSet[] = "Q1: {$grade->first_quarter_grade}";
                    }
                    if ($grade->second_quarter_grade !== null) {
                        $gradesSet[] = "Q2: {$grade->second_quarter_grade}";
                    }
                    if (! $this->isCollegeLevel) {
                        if ($grade->third_quarter_grade !== null) {
                            $gradesSet[] = "Q3: {$grade->third_quarter_grade}";
                        }
                        if ($grade->fourth_quarter_grade !== null) {
                            $gradesSet[] = "Q4: {$grade->fourth_quarter_grade}";
                        }
                    }

                    $gradesInfo = ! empty($gradesSet) ? ' ('.implode(', ', $gradesSet).')' : '';
                    $this->successfulImports[] = "✅ Row {$rowNumber}: {$studentName} ({$studentId}){$gradesInfo}";
                }
            }
        }

        // After processing all rows, store both warnings and success info to session
        session()->flash('grade_import_warnings', $this->warnings);
        session()->flash('grade_import_successes', $this->successfulImports);
        session()->flash('grade_import_stats', [
            'total_rows_processed' => $this->totalRowsProcessed,
            'successful_imports' => count($this->successfulImports),
            'warnings_count' => count($this->warnings),
            'skipped_rows' => $this->totalRowsProcessed - count($this->successfulImports),
        ]);
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
        if ($value === null) {
            return false;
        }

        $trim = trim((string) $value);
        if ($trim === '') {
            return false;
        }

        return is_numeric($trim);
    }
}
