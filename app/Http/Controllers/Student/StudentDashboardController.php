<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class StudentDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Ensure student relationship is loaded
        if (! $user->student) {
            abort(404, 'Student profile not found');
        }

        $student = $user->student;

        // Get current enrollments with grades and schedules
        $enrollments = $student->studentEnrollments()
            ->with([
                'section.program',
                'section.subjects',
                'section.sectionSubjects.teacher.user' => function ($query) {
                    $query->select('id', 'name');
                },
                'section.sectionSubjects.subject',
            ])
            ->where('status', 'active')
            ->whereNotNull('section_id') // Only get enrollments with assigned sections
            ->get();

        // Get today's schedule
        $today = strtolower(now()->format('l')); // Get day name in lowercase (monday, tuesday, etc.)
        $todaySchedule = collect();

        foreach ($enrollments as $enrollment) {
            if ($enrollment->section && $enrollment->section->sectionSubjects) {
                foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                    // Debug: Check if schedule_days exists and what it contains
                    $scheduleDays = $sectionSubject->schedule_days;
                    if ($scheduleDays && is_array($scheduleDays) && in_array($today, $scheduleDays)) {
                        $todaySchedule->push([
                            'id' => $sectionSubject->id,
                            'subject_name' => $sectionSubject->subject->subject_name ?? 'Unknown Subject',
                            'subject_code' => $sectionSubject->subject->subject_code ?? '',
                            'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                            'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                            'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                            'room' => $sectionSubject->room ?? 'TBA',
                            'section_name' => $enrollment->section->section_name,
                        ]);
                    }
                }
            }
        }

        // Sort today's schedule by start time
        $todaySchedule = $todaySchedule->sortBy('start_time');

        // Get current subjects from enrollments
        $currentSubjects = collect();
        foreach ($enrollments as $enrollment) {
            if ($enrollment->section && $enrollment->section->sectionSubjects) {
                foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                    $currentSubjects->push([
                        'id' => $sectionSubject->id,
                        'subject_name' => $sectionSubject->subject->subject_name ?? 'Unknown Subject',
                        'subject_code' => $sectionSubject->subject->subject_code ?? '',
                        'teacher_name' => $sectionSubject->teacher?->user?->name ?? 'TBA',
                        'room' => $sectionSubject->room ?? 'TBA',
                        'schedule_days' => $sectionSubject->schedule_days ?? [],
                        'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                        'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                        'section_name' => $enrollment->section->section_name,
                        'program_name' => $enrollment->section->program->program_name ?? 'Unknown Program',
                    ]);
                }
            }
        }
        $recentGrades = $student->studentGrades()
            ->with(['studentEnrollment.section.program'])
            ->latest()
            ->limit(5)
            ->get();

        // Get current academic year and semester from the first enrollment
        $currentYear = $enrollments->first()?->academic_year ?? '2025-2026';
        $currentSemester = $enrollments->first()?->semester ?? '1st';

        $paymentStatus = $student->studentSemesterPayments()
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->first();

        // Get payment transactions
        $paymentTransactions = $student->paymentTransactions()
            ->with(['processedBy'])
            ->latest()
            ->limit(10)
            ->get();

        return Inertia::render('Student/Dashboard', [
            'student' => $student->load(['user', 'program']),
            'enrollments' => $enrollments,
            'currentSubjects' => $currentSubjects,
            'recentGrades' => $recentGrades,
            'paymentStatus' => $paymentStatus,
            'paymentTransactions' => $paymentTransactions,
            'todaySchedule' => $todaySchedule,
            'currentSection' => $enrollments->first()?->section,
            'stats' => [
                'totalSubjects' => $currentSubjects->count(),
                'averageGrade' => $recentGrades->avg('semester_grade') ?? 0,
                'totalPaid' => $paymentStatus?->total_paid ?? 0,
                'balance' => $paymentStatus?->balance ?? 0,
            ],
            'currentAcademicInfo' => [
                'year' => $currentYear,
                'semester' => $currentSemester,
                'today' => $today,
            ],
        ]);
    }
}
