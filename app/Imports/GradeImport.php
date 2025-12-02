<?php

namespace App\Imports;

use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\ShsStudentGrade;
use App\Models\Section;
use App\Models\Teacher;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\WithValidation;

class GradeImport implements ToCollection, WithHeadingRow, WithValidation
{
    protected Section $section;
    protected Teacher $teacher;
    protected bool $isCollegeLevel;

    public function __construct(Section $section, Teacher $teacher)
    {
        $this->section = $section;
        $this->teacher = $teacher;
        $this->isCollegeLevel = in_array($section->year_level, ['1st Year', '2nd Year', '3rd Year', '4th Year']);
    }

    public function collection(Collection $rows): void
    {
        foreach ($rows as $row) {
            // Find student enrollment by student ID
            $enrollment = StudentEnrollment::whereHas('student', function ($query) use ($row) {
                $query->where('student_id', $row['student_id']);
            })
            ->where('section_id', $this->section->id)
            ->where('status', 'active')
            ->first();

            if (!$enrollment) {
                continue; // Skip if student not found in this section
            }

            if ($this->isCollegeLevel) {
                // Handle college grades
                $grade = StudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'teacher_id' => $this->teacher->id
                ]);

                $grade->prelim_grade = $this->parseGrade($row['prelim_grade'] ?? null);
                $grade->midterm_grade = $this->parseGrade($row['midterm_grade'] ?? null);
                $grade->prefinal_grade = $this->parseGrade($row['prefinal_grade'] ?? null);
                $grade->final_grade = $this->parseGrade($row['final_grade'] ?? null);
                $grade->teacher_remarks = $row['teacher_remarks'] ?? null;

                // Calculate semester grade if all components are present
                if ($grade->prelim_grade && $grade->midterm_grade && $grade->prefinal_grade && $grade->final_grade) {
                    $grade->semester_grade = ($grade->prelim_grade + $grade->midterm_grade + $grade->prefinal_grade + $grade->final_grade) / 4;
                    $grade->overall_status = $grade->semester_grade >= 60 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($grade->prelim_grade !== null && !$grade->prelim_submitted_at) {
                    $grade->prelim_submitted_at = now();
                }
                if ($grade->midterm_grade !== null && !$grade->midterm_submitted_at) {
                    $grade->midterm_submitted_at = now();
                }
                if ($grade->prefinal_grade !== null && !$grade->prefinal_submitted_at) {
                    $grade->prefinal_submitted_at = now();
                }
                if ($grade->final_grade !== null && !$grade->final_submitted_at) {
                    $grade->final_submitted_at = now();
                }

                $grade->save();
            } else {
                // Handle SHS grades
                $grade = ShsStudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'teacher_id' => $this->teacher->id
                ]);

                $grade->first_quarter_grade = $this->parseGrade($row['first_quarter_grade'] ?? null);
                $grade->second_quarter_grade = $this->parseGrade($row['second_quarter_grade'] ?? null);
                $grade->third_quarter_grade = $this->parseGrade($row['third_quarter_grade'] ?? null);
                $grade->fourth_quarter_grade = $this->parseGrade($row['fourth_quarter_grade'] ?? null);
                $grade->teacher_remarks = $row['teacher_remarks'] ?? null;

                // Calculate final grade if all quarters are present
                if ($grade->first_quarter_grade && $grade->second_quarter_grade && 
                    $grade->third_quarter_grade && $grade->fourth_quarter_grade) {
                    $grade->final_grade = ($grade->first_quarter_grade + $grade->second_quarter_grade + 
                                         $grade->third_quarter_grade + $grade->fourth_quarter_grade) / 4;
                    $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($grade->first_quarter_grade !== null && !$grade->first_quarter_submitted_at) {
                    $grade->first_quarter_submitted_at = now();
                }
                if ($grade->second_quarter_grade !== null && !$grade->second_quarter_submitted_at) {
                    $grade->second_quarter_submitted_at = now();
                }
                if ($grade->third_quarter_grade !== null && !$grade->third_quarter_submitted_at) {
                    $grade->third_quarter_submitted_at = now();
                }
                if ($grade->fourth_quarter_grade !== null && !$grade->fourth_quarter_submitted_at) {
                    $grade->fourth_quarter_submitted_at = now();
                }

                $grade->save();
            }
        }
    }

    private function parseGrade(?string $grade): ?float
    {
        if (empty($grade) || $grade === '' || $grade === null) {
            return null;
        }

        $numericGrade = (float) $grade;
        
        // Validate grade range
        if ($numericGrade < 0 || $numericGrade > 100) {
            return null;
        }

        return $numericGrade;
    }

    public function rules(): array
    {
        $rules = [
            'student_id' => 'required',
            'teacher_remarks' => 'nullable|string|max:1000',
        ];

        if ($this->isCollegeLevel) {
            $rules += [
                'prelim_grade' => 'nullable|numeric|between:0,100',
                'midterm_grade' => 'nullable|numeric|between:0,100',
                'prefinal_grade' => 'nullable|numeric|between:0,100',
                'final_grade' => 'nullable|numeric|between:0,100',
            ];
        } else {
            $rules += [
                'first_quarter_grade' => 'nullable|numeric|between:0,100',
                'second_quarter_grade' => 'nullable|numeric|between:0,100',
                'third_quarter_grade' => 'nullable|numeric|between:0,100',
                'fourth_quarter_grade' => 'nullable|numeric|between:0,100',
            ];
        }

        return $rules;
    }
}
