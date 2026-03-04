<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithColumnFormatting;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Protection;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GradeTemplateExport implements FromCollection, WithColumnFormatting, WithHeadings, WithStyles
{
    protected Collection $enrollments;

    protected bool $isCollegeLevel;

    protected $sectionSubject;

    protected $teacher;

    public function __construct(Collection $enrollments, bool $isCollegeLevel, $sectionSubject = null, $teacher = null)
    {
        $this->enrollments = $enrollments;
        $this->isCollegeLevel = $isCollegeLevel;
        $this->sectionSubject = $sectionSubject;
        $this->teacher = $teacher;
    }

    public function collection(): Collection
    {
        $rows = collect();

        // Add validation row at the top
        if ($this->sectionSubject) {
            $validationData = [
                'section_subject_id' => $this->sectionSubject->id,
                'section_code' => $this->sectionSubject->section->section_code ?? $this->sectionSubject->section->section_name,
                'subject_code' => $this->sectionSubject->subject->subject_code,
                'validation' => 'DO NOT MODIFY THIS ROW - Template validation data',
            ];

            // Fill remaining columns with empty strings to match headings
            $headingsCount = count($this->headings());
            for ($i = count($validationData); $i < $headingsCount; $i++) {
                $validationData[] = '';
            }

            $rows->push($validationData);
        }

        // Add student data rows
        $studentRows = $this->enrollments->map(function ($enrollment) {
            $studentNumber = (string) ($enrollment->student->student_number ?? $enrollment->student->student_id ?? '');
            $studentName = $enrollment->student->user->name ?? '';

            $data = [
                'student_id' => $studentNumber,
                'student_name' => $studentName,
            ];

            // Try to include existing grades for this enrollment if present
            $existing = null;

            try {
                if (isset($enrollment->id) && $enrollment->id) {
                    if ($this->isCollegeLevel) {
                        $existing = \App\Models\StudentGrade::where('student_enrollment_id', $enrollment->id)
                            ->where('section_subject_id', $this->sectionSubject->id)
                            ->when($this->teacher, fn ($q) => $q->where('teacher_id', $this->teacher->id))
                            ->first();
                    } else {
                        $existing = \App\Models\ShsStudentGrade::where('student_enrollment_id', $enrollment->id)
                            ->where('section_subject_id', $this->sectionSubject->id)
                            ->when($this->teacher, fn ($q) => $q->where('teacher_id', $this->teacher->id))
                            ->first();
                    }
                }
            } catch (\Exception $e) {
                // ignore DB issues in export - leave fields blank
            }

            if ($this->isCollegeLevel) {
                $data = array_merge($data, [
                    'prelim' => $existing?->prelim_grade ?? '',
                    'midterm' => $existing?->midterm_grade ?? '',
                    'prefinals' => $existing?->prefinal_grade ?? '',
                    'finals' => $existing?->final_grade ?? '',
                    'teacher_remarks' => $existing?->teacher_remarks ?? '',
                ]);
            } else {
                $data = array_merge($data, [
                    '1st_quarter' => $existing?->first_quarter_grade ?? '',
                    '2nd_quarter' => $existing?->second_quarter_grade ?? '',
                    'teacher_remarks' => $existing?->teacher_remarks ?? '',
                ]);
            }

            return $data;
        });

        return $rows->merge($studentRows);
    }

    public function headings(): array
    {
        $headings = [
            'Student ID',
            'Student Name',
        ];

        if ($this->isCollegeLevel) {
            $headings = array_merge($headings, [
                'Prelim',
                'Midterm',
                'PreFinals',
                'Finals',
                'Teacher Remarks',
            ]);
        } else {
            $headings = array_merge($headings, [
                'Quarter 1',
                'Quarter 2',
                'Teacher Remarks',
            ]);
        }

        return $headings;
    }

    public function styles(Worksheet $sheet): array
    {
        // Set column widths
        $sheet->getColumnDimension('A')->setWidth(15); // Student ID
        $sheet->getColumnDimension('B')->setWidth(25); // Student Name

        // Set column widths for grade columns based on level
        if ($this->isCollegeLevel) {
            $sheet->getColumnDimension('C')->setWidth(10); // Prelim
            $sheet->getColumnDimension('D')->setWidth(10); // Midterm
            $sheet->getColumnDimension('E')->setWidth(12); // PreFinals
            $sheet->getColumnDimension('F')->setWidth(8);  // Finals
            $sheet->getColumnDimension('G')->setWidth(30); // Teacher Remarks
        } else {
            $sheet->getColumnDimension('C')->setWidth(12); // Q1
            $sheet->getColumnDimension('D')->setWidth(12); // Q2
            $sheet->getColumnDimension('E')->setWidth(30); // Teacher Remarks
        }

        // First, unlock all cells by default
        $sheet->getStyle($sheet->calculateWorksheetDimension())->getProtection()->setLocked(Protection::PROTECTION_UNPROTECTED);

        // Lock the validation row (row 2) completely
        $sheet->getStyle('A2:'.$sheet->getHighestColumn().'2')->getProtection()->setLocked(Protection::PROTECTION_PROTECTED);

        // Then lock only the first two columns for student data (starting from row 3)
        $lastRow = $this->enrollments->count() + 2; // +2 for header row and validation row
        $sheet->getStyle('A3:B'.$lastRow)->getProtection()->setLocked(Protection::PROTECTION_PROTECTED);

        // Protect the worksheet with password
        $sheet->getProtection()->setSheet(true);
        $sheet->getProtection()->setPassword('readonly');

        return [
            // Style the header row as bold
            1 => ['font' => ['bold' => true]],
            // Style the validation row with light gray background and italic text
            2 => [
                'font' => ['italic' => true, 'color' => ['rgb' => '666666']],
                'fill' => [
                    'fillType' => 'solid',
                    'startColor' => ['rgb' => 'F0F0F0'],
                ],
            ],
        ];
    }

    public function columnFormats(): array
    {
        $formats = [
            'A' => '@', // Text format for Student ID
            'B' => '@', // Text format for Student Name
        ];

        if ($this->isCollegeLevel) {
            $formats['G'] = '@'; // Text format for Teacher Remarks (column G for college)
        } else {
            $formats['E'] = '@'; // Text format for Teacher Remarks (column E for SHS)
        }

        return $formats;
    }
}
