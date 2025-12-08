<?php

namespace App\Rules;

use App\Models\SectionSubject;
use App\Models\Subject;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Carbon;

class TeacherScheduleConflict implements ValidationRule
{
    public function __construct(
        private ?int $teacherId = null,
        private ?int $subjectId = null,
        private ?int $sectionId = null,
        private ?array $scheduleDays = null,
        private ?string $startTime = null,
        private ?string $endTime = null,
        private ?int $excludeSectionSubjectId = null
    ) {}

    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): void  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $this->teacherId || ! $this->subjectId || ! $this->sectionId || ! $this->scheduleDays || ! $this->startTime || ! $this->endTime) {
            return;
        }

        $conflicts = $this->getTeacherConflicts();
        $hoursConflict = $this->checkHoursConflict();
        $timeSlotConflict = $this->checkTimeSlotConflict();

        if ($conflicts->isNotEmpty()) {
            $conflictDetails = $conflicts->map(function ($conflict) {
                $section = $conflict->section;
                $subject = $conflict->subject;
                $days = is_array($conflict->schedule_days) ? implode(', ', $conflict->schedule_days) : $conflict->schedule_days;

                return "{$subject->subject_code} ({$section->program->program_code}-{$section->year_level}{$section->section_name}) on {$days} from {$conflict->start_time} to {$conflict->end_time}";
            })->join('; ');

            $fail("Teacher has a scheduling conflict with: {$conflictDetails}");

            return;
        }

        if ($timeSlotConflict) {
            $fail($timeSlotConflict);

            return;
        }

        if ($hoursConflict) {
            $fail($hoursConflict);

            return;
        }
    }

    private function getTeacherConflicts()
    {
        return SectionSubject::with(['section.program', 'subject'])
            ->where('teacher_id', $this->teacherId)
            ->when($this->excludeSectionSubjectId, function ($query) {
                $query->where('id', '!=', $this->excludeSectionSubjectId);
            })
            ->whereNotNull('schedule_days')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->get()
            ->filter(function ($existingAssignment) {
                return $this->hasTimeConflict($existingAssignment) && $this->hasDayConflict($existingAssignment);
            });
    }

    private function hasTimeConflict($existingAssignment): bool
    {
        $newStart = Carbon::parse($this->startTime);
        $newEnd = Carbon::parse($this->endTime);
        $existingStart = Carbon::parse($existingAssignment->start_time);
        $existingEnd = Carbon::parse($existingAssignment->end_time);

        // Check if the time ranges overlap
        return $newStart->lt($existingEnd) && $newEnd->gt($existingStart);
    }

    private function hasDayConflict($existingAssignment): bool
    {
        $existingDays = is_array($existingAssignment->schedule_days)
            ? $existingAssignment->schedule_days
            : json_decode($existingAssignment->schedule_days, true) ?? [];

        // Check if any day overlaps
        return count(array_intersect($this->scheduleDays, $existingDays)) > 0;
    }

    private function checkHoursConflict(): ?string
    {
        $subject = Subject::find($this->subjectId);
        if (! $subject) {
            return null;
        }

        $requiredHours = $subject->units; // Units represent hours per week
        $newStartTime = Carbon::parse($this->startTime);
        $newEndTime = Carbon::parse($this->endTime);
        $hoursPerSession = $newStartTime->diffInMinutes($newEndTime) / 60; // Convert to precise hours
        $sessionsPerWeek = count($this->scheduleDays);
        $totalHoursPerWeek = $hoursPerSession * $sessionsPerWeek;

        // Check if this schedule provides the required hours (allow small floating point tolerance)
        if (abs($totalHoursPerWeek - $requiredHours) > 0.01) {
            return "Subject {$subject->subject_code} requires {$requiredHours} hours per week, but this schedule provides {$totalHoursPerWeek} hours ({$hoursPerSession} hours × {$sessionsPerWeek} sessions).";
        }

        // Check if teacher already has this subject assigned to this section
        $existingAssignment = SectionSubject::where('teacher_id', $this->teacherId)
            ->where('subject_id', $this->subjectId)
            ->where('section_id', $this->sectionId)
            ->when($this->excludeSectionSubjectId, function ($query) {
                $query->where('id', '!=', $this->excludeSectionSubjectId);
            })
            ->first();

        if ($existingAssignment) {
            return "Teacher is already assigned to teach {$subject->subject_code} in this section.";
        }

        return null;
    }

    private function checkTimeSlotConflict(): ?string
    {
        // Check if there's already a different subject scheduled at this exact time slot
        $existingSubject = SectionSubject::with(['subject', 'section.program'])
            ->where('section_id', $this->sectionId)
            ->where('subject_id', '!=', $this->subjectId)
            ->when($this->excludeSectionSubjectId, function ($query) {
                $query->where('id', '!=', $this->excludeSectionSubjectId);
            })
            ->whereNotNull('schedule_days')
            ->whereNotNull('start_time')
            ->whereNotNull('end_time')
            ->get()
            ->filter(function ($assignment) {
                return $this->hasTimeConflict($assignment) && $this->hasDayConflict($assignment);
            })
            ->first();

        if ($existingSubject) {
            $section = $existingSubject->section;
            $subject = $existingSubject->subject;
            $days = is_array($existingSubject->schedule_days)
                ? implode(', ', $existingSubject->schedule_days)
                : $existingSubject->schedule_days;

            return "Time slot conflict: {$subject->subject_code} is already scheduled for section {$section->program->program_code}-{$section->year_level}{$section->section_name} on {$days} from {$existingSubject->start_time} to {$existingSubject->end_time}.";
        }

        return null;
    }
}
