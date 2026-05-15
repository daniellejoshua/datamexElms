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
     * Get the current semester.
     *
     * The system no longer calculates the semester based on the date.  The
     * academic period always starts in the 1st semester and administrators
     * manually advance it when appropriate.  If a manual override exists in
     * `SchoolSetting` it will take precedence, otherwise this helper simply
     * returns the default value of "1st".
     */
    public static function getCurrentSemester(): string
    {
        // Always start with first semester; the admin will change it explicitly
        return '1st';
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

        // new simplified Filipino grading scale provided by the user
        if ($numericGrade >= 96) {
            return '1.00';
        }

        if ($numericGrade >= 94) {
            return '1.25';
        }

        if ($numericGrade >= 91) {
            return '1.50';
        }

        if ($numericGrade >= 88) {
            return '1.75';
        }

        if ($numericGrade >= 85) {
            return '2.00';
        }

        if ($numericGrade >= 83) {
            return '2.25';
        }

        if ($numericGrade >= 80) {
            return '2.50';
        }

        if ($numericGrade >= 78) {
            return '2.75';
        }

        if ($numericGrade >= 75) {
            return '3.00';
        }

        // anything below 75 is a failing grade according to the new scale
        return '5.00';
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

        // inverse of the simplified numeric-to-GPA scale
        if ($gpa <= 1.00) {
            return 96.0;
        }

        if ($gpa <= 1.25) {
            return 94.0;
        }

        if ($gpa <= 1.50) {
            return 91.0;
        }

        if ($gpa <= 1.75) {
            return 88.0;
        }

        if ($gpa <= 2.00) {
            return 85.0;
        }

        if ($gpa <= 2.25) {
            return 83.0;
        }

        if ($gpa <= 2.50) {
            return 80.0;
        }

        if ($gpa <= 2.75) {
            return 78.0;
        }

        if ($gpa <= 3.00) {
            return 75.0;
        }

        // anything above 3.00 is failing under the new scale
        return 0.0;
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
