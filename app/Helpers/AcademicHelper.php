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

        // Academic year typically starts in August (month 8)
        // If current month is before August, we're in the second half of academic year
        if ($currentMonth >= 8) {
            // August to December = first half of academic year
            $startYear = $currentYear;
            $endYear = $currentYear + 1;
        } else {
            // January to July = second half of academic year
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
        } elseif ($month >= 1 && $month <= 5) {
            // January to May = 2nd semester
            return '2nd';
        } else {
            // June to July = summer semester
            return 'summer';
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
            ['value' => 'summer', 'label' => 'Summer'],
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
}
