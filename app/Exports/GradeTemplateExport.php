<?php

namespace App\Exports;

use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class GradeTemplateExport implements FromCollection, WithHeadings, WithStyles
{
    protected Collection $enrollments;
    protected bool $isCollegeLevel;

    public function __construct(Collection $enrollments, bool $isCollegeLevel)
    {
        $this->enrollments = $enrollments;
        $this->isCollegeLevel = $isCollegeLevel;
    }

    public function collection(): Collection
    {
        return $this->enrollments->map(function ($enrollment) {
            $data = [
                'student_id' => $enrollment->student->student_id,
                'student_name' => $enrollment->student->user->name,
            ];

            if ($this->isCollegeLevel) {
                $data += [
                    'prelim_grade' => '',
                    'midterm_grade' => '',
                    'prefinal_grade' => '',
                    'final_grade' => '',
                ];
            } else {
                $data += [
                    'first_quarter_grade' => '',
                    'second_quarter_grade' => '',
                    'third_quarter_grade' => '',
                    'fourth_quarter_grade' => '',
                ];
            }

            $data['teacher_remarks'] = '';

            return $data;
        });
    }

    public function headings(): array
    {
        $headings = [
            'Student ID',
            'Student Name',
        ];

        if ($this->isCollegeLevel) {
            $headings += [
                'Prelim Grade',
                'Midterm Grade',
                'Prefinal Grade',
                'Final Grade',
            ];
        } else {
            $headings += [
                '1st Quarter Grade',
                '2nd Quarter Grade',
                '3rd Quarter Grade',
                '4th Quarter Grade',
            ];
        }

        $headings[] = 'Teacher Remarks';

        return $headings;
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            // Style the first row as bold
            1 => ['font' => ['bold' => true]],
        ];
    }
}
