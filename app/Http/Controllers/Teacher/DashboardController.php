<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Teacher;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the teacher dashboard.
     */
    public function index(): Response
    {
        // Get the current authenticated teacher
        $teacher = Teacher::where('user_id', Auth::id())->firstOrFail();

        // Get teacher's sections with related data
        $teacherSections = SectionSubject::with([
            'section.program',
            'subject',
        ])
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->get();

        // Calculate statistics
        $totalSections = $teacherSections->count();
        $totalStudents = $teacherSections->sum(function ($sectionSubject) {
            return \App\Models\StudentSubjectEnrollment::where('section_subject_id', $sectionSubject->id)
                ->where('status', 'active')
                ->where('academic_year', $sectionSubject->section->academic_year)
                ->where('semester', $sectionSubject->section->semester)
                ->count();
        });
        $totalSubjects = $teacherSections->pluck('subject_id')->unique()->count();

        // Get today's schedule
        $todaySchedule = $this->getTodaySchedule($teacher);

        // Get upcoming classes (next 3 days)
        $upcomingClasses = $this->getUpcomingClasses($teacher);

        // Get recent activities
        $recentActivities = $this->getRecentActivities($teacher);

        // Prepare section overview data
        $sectionOverview = $teacherSections->map(function ($sectionSubject) {
            $section = $sectionSubject->section;
            // Count students enrolled in this specific subject
            $studentCount = \App\Models\StudentSubjectEnrollment::where('section_subject_id', $sectionSubject->id)
                ->where('status', 'active')
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->count();

            return [
                'id' => $section->id,
                'section_name' => $section->section_name,
                'program_name' => $section->program->program_name,
                'year_level' => $section->year_level,
                'subject_name' => $sectionSubject->subject->subject_name,
                'subject_code' => $sectionSubject->subject->subject_code,
                'enrolled_students_count' => $studentCount,
                'room' => $sectionSubject->room,
                'schedule' => $this->formatSchedule($sectionSubject),
                'academic_year' => $section->academic_year,
                'semester' => $section->semester,
            ];
        });

        return Inertia::render('Teacher/Dashboard', [
            'teacher' => [
                'id' => $teacher->id,
                'name' => trim($teacher->first_name.' '.$teacher->middle_name.' '.$teacher->last_name),
                'employee_number' => $teacher->employee_number,
                'department' => $teacher->department,
                'specialization' => $teacher->specialization,
            ],
            'stats' => [
                'totalSections' => $totalSections,
                'totalStudents' => $totalStudents,
                'totalSubjects' => $totalSubjects,
                'activeClasses' => $todaySchedule->count(),
            ],
            'sections' => $sectionOverview,
            'todaySchedule' => $todaySchedule,
            'upcomingClasses' => $upcomingClasses,
            'recentActivities' => $recentActivities,
        ]);
    }

    /**
     * Get today's schedule for the teacher
     */
    private function getTodaySchedule(Teacher $teacher)
    {
        $today = now()->format('l'); // Get day name (e.g., 'Monday')

        return SectionSubject::with(['section.program', 'subject'])
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->whereRaw('FIND_IN_SET(?, schedule_days)', [$today])
            ->orderBy('start_time')
            ->get()
            ->map(function ($sectionSubject) {
                return [
                    'id' => $sectionSubject->id,
                    'subject_name' => $sectionSubject->subject->subject_name,
                    'subject_code' => $sectionSubject->subject->subject_code,
                    'section_name' => $sectionSubject->section->section_name,
                    'program_name' => $sectionSubject->section->program->program_name,
                    'room' => $sectionSubject->room,
                    'start_time' => $sectionSubject->start_time,
                    'end_time' => $sectionSubject->end_time,
                    'student_count' => $sectionSubject->section->enrollments->count(),
                ];
            });
    }

    /**
     * Get upcoming classes for the next 3 days
     */
    private function getUpcomingClasses(Teacher $teacher)
    {
        $upcomingDays = collect(range(1, 3))->map(function ($day) {
            return now()->addDays($day)->format('l');
        });

        return SectionSubject::with(['section.program', 'subject'])
            ->where('teacher_id', $teacher->id)
            ->where('status', 'active')
            ->where(function ($query) use ($upcomingDays) {
                foreach ($upcomingDays as $day) {
                    $query->orWhereRaw('FIND_IN_SET(?, schedule_days)', [$day]);
                }
            })
            ->orderBy('start_time')
            ->get()
            ->map(function ($sectionSubject) {
                $scheduleDays = explode(',', $sectionSubject->schedule_days);
                $nextClassDate = null;

                // Find the next occurrence
                for ($i = 1; $i <= 7; $i++) {
                    $checkDate = now()->addDays($i);
                    if (in_array($checkDate->format('l'), $scheduleDays)) {
                        $nextClassDate = $checkDate;
                        break;
                    }
                }

                return [
                    'id' => $sectionSubject->id,
                    'subject_name' => $sectionSubject->subject->subject_name,
                    'subject_code' => $sectionSubject->subject->subject_code,
                    'section_name' => $sectionSubject->section->section_name,
                    'room' => $sectionSubject->room,
                    'start_time' => $sectionSubject->start_time,
                    'end_time' => $sectionSubject->end_time,
                    'next_class_date' => $nextClassDate?->format('M d, Y'),
                    'next_class_day' => $nextClassDate?->format('l'),
                ];
            })
            ->take(5);
    }

    /**
     * Get recent activities
     */
    private function getRecentActivities(Teacher $teacher)
    {
        // This is a placeholder - you can expand this based on your audit system
        return collect([
            [
                'action' => 'Class Attended',
                'description' => 'Completed Mathematics class with Section A',
                'timestamp' => now()->subHours(2),
                'type' => 'class',
            ],
            [
                'action' => 'Grades Updated',
                'description' => 'Updated quiz scores for Physics Section B',
                'timestamp' => now()->subHours(5),
                'type' => 'grading',
            ],
            [
                'action' => 'Schedule Changed',
                'description' => 'Room changed for tomorrow\'s Chemistry class',
                'timestamp' => now()->subDays(1),
                'type' => 'schedule',
            ],
        ]);
    }

    /**
     * Format schedule for display
     */
    private function formatSchedule(SectionSubject $sectionSubject): string
    {
        $days = $sectionSubject->schedule_days;

        // Handle the schedule_days based on its type
        if (is_array($days)) {
            $formattedDays = implode(', ', array_map('ucfirst', $days));
        } elseif (is_string($days)) {
            // Handle legacy string format or malformed JSON
            $days = str_replace(['"', '[', ']'], '', $days);
            $dayArray = array_filter(array_map('trim', explode(',', $days)));
            $formattedDays = implode(', ', array_map('ucfirst', $dayArray));
        } else {
            $formattedDays = 'TBA';
        }

        $startTime = \Carbon\Carbon::parse($sectionSubject->start_time)->format('g:i A');
        $endTime = \Carbon\Carbon::parse($sectionSubject->end_time)->format('g:i A');

        return "{$formattedDays} {$startTime} - {$endTime}";
    }
}
