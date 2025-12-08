<?php

namespace App\Models;

use App\Helpers\AcademicHelper;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'description',
    ];

    /**
     * Get setting value with proper type casting.
     */
    public function getValueAttribute($value)
    {
        return match ($this->type) {
            'boolean' => (bool) $value,
            'integer' => (int) $value,
            'json' => json_decode($value, true),
            default => $value,
        };
    }

    /**
     * Set setting value with proper type conversion.
     */
    public function setValueAttribute($value): void
    {
        $this->attributes['value'] = match ($this->type) {
            'boolean' => $value ? '1' : '0',
            'integer' => (string) $value,
            'json' => json_encode($value),
            default => (string) $value,
        };
    }

    /**
     * Get a setting value by key.
     */
    public static function get(string $key, $default = null)
    {
        $setting = static::where('key', $key)->first();

        if (! $setting) {
            return $default;
        }

        return $setting->value;
    }

    /**
     * Set a setting value by key.
     */
    public static function set(string $key, $value, string $type = 'string', ?string $description = null): void
    {
        static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'type' => $type,
                'description' => $description,
            ]
        );
    }

    /**
     * Get current academic year from settings or calculate it.
     */
    public static function getCurrentAcademicYear(): string
    {
        // First try to get from settings (manual override)
        $setting = static::get('current_academic_year');

        if ($setting) {
            return $setting;
        }

        // Fall back to automatic calculation
        return AcademicHelper::getCurrentAcademicYear();
    }

    /**
     * Get current semester from settings or calculate it.
     */
    public static function getCurrentSemester(): string
    {
        // First try to get from settings (manual override)
        $setting = static::get('current_semester');

        if ($setting) {
            return $setting;
        }

        // Fall back to automatic calculation
        return AcademicHelper::getCurrentSemester();
    }

    /**
     * Set the current academic year and semester manually.
     */
    public static function setCurrentAcademicPeriod(string $academicYear, string $semester): void
    {
        static::set('current_academic_year', $academicYear, 'string', 'Current academic year (manual override)');
        static::set('current_semester', $semester, 'string', 'Current semester (manual override)');
    }

    /**
     * Clear manual overrides and use automatic calculation.
     */
    public static function useAutomaticAcademicPeriod(): void
    {
        static::where('key', 'current_academic_year')->delete();
        static::where('key', 'current_semester')->delete();
    }
}
