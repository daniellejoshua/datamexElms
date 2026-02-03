<?php

namespace App\Helpers;

use Carbon\Carbon;

class AcademicHelper
{
    /**
     * Get the current academic year based on the current date.
     * Academic year typically starts in August/September and ends in May/June.
     *
     * @return string Format: "2024-2025"
     */
    public static function getCurrentAcademicYear(): string
    {
        $now = Carbon::now();
        $currentYear = $now->year;
        $currentMonth = $now->month;

        // Academic year typically starts in January (month 1)
        // If current month is January or later, we're in the academic year
        if ($currentMonth >= 1) {
            // January to December = academic year
            $startYear = $currentYear;
            $endYear = $currentYear + 1;
        } else {
            // This shouldn't happen since month >=1 always
            $startYear = $currentYear - 1;
            $endYear = $currentYear;
        }

        return "{$startYear}-{$endYear}";
    }

    /**
     * Get the current semester based on the current date.
     */
    public static function getCurrentSemester(): string
    {
        $now = Carbon::now();
        $month = $now->month;

        if ($month >= 8 && $month <= 12) {
            // August to December = 1st semester
            return '1st';
        } else {
            // January to July = 2nd semester
            return '2nd';
        }
    }

    /**
     * Generate academic year options for a given range.
     *
     * @param  int  $pastYears  Number of past years to include
     * @param  int  $futureYears  Number of future years to include
     */
    public static function getAcademicYearOptions(int $pastYears = 2, int $futureYears = 2): array
    {
        $currentAcademicYear = self::getCurrentAcademicYear();
        [$currentStartYear] = explode('-', $currentAcademicYear);
        $currentStartYear = (int) $currentStartYear;

        $options = [];

        for ($i = $pastYears; $i >= -$futureYears; $i--) {
            $startYear = $currentStartYear - $i;
            $endYear = $startYear + 1;
            $options[] = "{$startYear}-{$endYear}";
        }

        return $options;
    }

    /**
     * Get semester options.
     */
    public static function getSemesterOptions(): array
    {
        return [
            ['value' => '1st', 'label' => '1st Semester'],
            ['value' => '2nd', 'label' => '2nd Semester'],
        ];
    }

    /**
     * Check if a given academic year and semester is the current one.
     */
    public static function isCurrent(string $academicYear, string $semester): bool
    {
        return $academicYear === self::getCurrentAcademicYear() &&
               $semester === self::getCurrentSemester();
    }

    /**
     * Get the next academic year.
     */
    public static function getNextAcademicYear(?string $academicYear = null): string
    {
        $academicYear = $academicYear ?? self::getCurrentAcademicYear();
        [$startYear] = explode('-', $academicYear);
        $startYear = (int) $startYear;

        return ($startYear + 1).'-'.($startYear + 2);
    }

    /**
     * Get the previous academic year.
     */
    public static function getPreviousAcademicYear(?string $academicYear = null): string
    {
        $academicYear = $academicYear ?? self::getCurrentAcademicYear();
        [$startYear] = explode('-', $academicYear);
        $startYear = (int) $startYear;

        return ($startYear - 1).'-'.$startYear;
    }

    /**
     * Convert numeric grade (1-100) to GPA equivalent (1.00-5.00).
     * Based on standard Philippine grading system.
     */
    public static function convertToGPA(?float $numericGrade): ?string
    {
        if ($numericGrade === null) {
            return null;
        }

        if ($numericGrade >= 97) {
            return '1.00';
        } elseif ($numericGrade >= 94) {
            return '1.25';
        } elseif ($numericGrade >= 91) {
            return '1.50';
        } elseif ($numericGrade >= 88) {
            return '1.75';
        } elseif ($numericGrade >= 85) {
            return '2.00';
        } elseif ($numericGrade >= 82) {
            return '2.25';
        } elseif ($numericGrade >= 79) {
            return '2.50';
        } elseif ($numericGrade >= 76) {
            return '2.75';
        } elseif ($numericGrade >= 75) {
            return '3.00';
        } elseif ($numericGrade >= 72) {
            return '3.25';
        } elseif ($numericGrade >= 69) {
            return '3.50';
        } elseif ($numericGrade >= 66) {
            return '3.75';
        } elseif ($numericGrade >= 63) {
            return '4.00';
        } elseif ($numericGrade >= 60) {
            return '4.25';
        } elseif ($numericGrade >= 55) {
            return '4.50';
        } elseif ($numericGrade >= 50) {
            return '5.00';
        } else {
            return '5.00';
        }
    }

    /**
     * Convert GPA (1.00-5.00) to equivalent percentage grade (1-100).
     * Based on standard Philippine grading system.
     */
    public static function convertGpaToPercentage(?float $gpa): ?float
    {
        if ($gpa === null) {
            return null;
        }

        if ($gpa <= 1.00) {
            return 100.0;
        } elseif ($gpa <= 1.25) {
            return 96.0;
        } elseif ($gpa <= 1.50) {
            return 93.0;
        } elseif ($gpa <= 1.75) {
            return 90.0;
        } elseif ($gpa <= 2.00) {
            return 87.0;
        } elseif ($gpa <= 2.25) {
            return 84.0;
        } elseif ($gpa <= 2.50) {
            return 81.0;
        } elseif ($gpa <= 2.75) {
            return 78.0;
        } elseif ($gpa <= 3.00) {
            return 75.0;
        } elseif ($gpa <= 3.25) {
            return 72.0;
        } elseif ($gpa <= 3.50) {
            return 69.0;
        } elseif ($gpa <= 3.75) {
            return 66.0;
        } elseif ($gpa <= 4.00) {
            return 63.0;
        } elseif ($gpa <= 4.25) {
            return 60.0;
        } elseif ($gpa <= 4.50) {
            return 55.0;
        } elseif ($gpa <= 4.75) {
            return 50.0;
        } elseif ($gpa <= 5.00) {
            return 50.0; // 5.00 GPA = 50%
        } else {
            return 0.0; // Failing grades below 50%
        }
    }

    /**
     * Format grade display showing both numeric and GPA formats.
     */
    public static function formatGradeDisplay(?float $numericGrade): string
    {
        if ($numericGrade === null) {
            return 'N/A';
        }

        $gpa = self::convertToGPA($numericGrade);

        return "{$numericGrade} ({$gpa})";
    }
}
