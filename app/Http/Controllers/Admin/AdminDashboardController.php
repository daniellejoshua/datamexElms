<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Program;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminDashboardController extends Controller
{
    public function index(): Response
    {
        // Get system overview statistics
        $stats = [
            'totalUsers' => User::count(),
            'totalStudents' => Student::count(),
            'totalTeachers' => Teacher::count(),
            'totalPrograms' => Program::count(),
            'totalSubjects' => Subject::count(),
            'totalSections' => Section::count(),
            'activeEnrollments' => StudentEnrollment::where('status', 'active')->count(),
        ];

        // Get recent activity from audit logs
        $recentActivity = AuditLog::with('user')
            ->latest()
            ->limit(10)
            ->get();

        // Get enrollment statistics by education level
        $enrollmentStats = StudentEnrollment::join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->select('students.education_level', DB::raw('count(*) as count'))
            ->where('student_enrollments.status', 'active')
            ->groupBy('students.education_level')
            ->get();

        // Get program distribution
        $programStats = Program::select('education_level', DB::raw('count(*) as count'))
            ->groupBy('education_level')
            ->get();

        // Get sections with low enrollment (below 20)
        $lowEnrollmentSections = Section::with(['program', 'studentEnrollments' => function ($query) {
            $query->where('status', 'active');
        }])
            ->get()
            ->filter(function ($section) {
                return $section->studentEnrollments->count() < 20;
            })
            ->take(5);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'recentActivity' => $recentActivity,
            'enrollmentStats' => $enrollmentStats,
            'programStats' => $programStats,
            'lowEnrollmentSections' => $lowEnrollmentSections,
        ]);
    }
}
