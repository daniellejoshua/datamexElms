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

    public function __construct(Collection $enrollments, bool $isCollegeLevel, $sectionSubject = null)
    {
        $this->enrollments = $enrollments;
        $this->isCollegeLevel = $isCollegeLevel;
        $this->sectionSubject = $sectionSubject;
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
            $data = [
                'student_id' => (string) $enrollment->student->student_number,
                'student_name' => $enrollment->student->user->name,
            ];

            if ($this->isCollegeLevel) {
                $data = array_merge($data, [
                    'prelim' => '',
                    'midterm' => '',
                    'prefinals' => '',
                    'finals' => '',
                ]);
            } else {
                $data = array_merge($data, [
                    '1st_quarter' => '',
                    '2nd_quarter' => '',
                    '3rd_quarter' => '',
                    '4th_quarter' => '',
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
            ]);
        } else {
            $headings = array_merge($headings, [
                '1st Quarter',
                '2nd Quarter',
                '3rd Quarter',
                '4th Quarter',
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
        } else {
            $sheet->getColumnDimension('C')->setWidth(12); // 1st Quarter
            $sheet->getColumnDimension('D')->setWidth(12); // 2nd Quarter
            $sheet->getColumnDimension('E')->setWidth(12); // 3rd Quarter
            $sheet->getColumnDimension('F')->setWidth(12); // 4th Quarter
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
        return [
            'A' => '@', // Text format for Student ID
            'B' => '@', // Text format for Student Name
        ];
    }
}
