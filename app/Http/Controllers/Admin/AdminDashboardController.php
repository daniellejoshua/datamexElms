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
        $programStats = Student::select('student_type', DB::raw('count(*) as count'))
            ->groupBy('student_type')
            ->get();

        // Get sections with low enrollment (below 20)
        $lowEnrollmentSections = Section::with(['program', 'studentEnrollments' => function ($query) {
            $query->where('status', 'active');
        }])
            ->get()
            ->filter(function ($section) {
                return $section->studentEnrollments->count() < 20;
            })
            ->take(5)
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'section_name' => $section->formatted_name,
                    'program_name' => $section->program->program_name ?? 'Unknown',
                    'student_count' => $section->studentEnrollments->count(),
                ];
            });

        // Get students without sections (no active enrollments)
        $studentsWithoutSections = Student::whereDoesntHave('enrollments', function ($query) {
            $query->where('status', 'active');
        })
            ->with(['user', 'program'])
            ->take(5)
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_number' => $student->student_number,
                    'name' => $student->user->name ?? 'Unknown',
                    'program_name' => $student->program->program_name ?? 'Unknown',
                    'education_level' => $student->education_level,
                ];
            });

        // Get sections with subjects that don't have assigned teachers
        $sectionsWithoutTeachers = Section::with(['program', 'sectionSubjects' => function ($query) {
            $query->whereNull('teacher_id')->where('status', 'active');
        }])
            ->whereHas('sectionSubjects', function ($query) {
                $query->whereNull('teacher_id')->where('status', 'active');
            })
            ->take(5)
            ->get()
            ->map(function ($section) {
                $unassignedSubjects = $section->sectionSubjects->map(function ($sectionSubject) {
                    return $sectionSubject->subject->subject_name ?? 'Unknown Subject';
                });

                return [
                    'id' => $section->id,
                    'section_name' => $section->formatted_name,
                    'program_name' => $section->program->program_name ?? 'Unknown',
                    'education_level' => $section->program->education_level ?? 'college',
                    'unassigned_subjects' => $unassignedSubjects,
                    'unassigned_count' => $unassignedSubjects->count(),
                ];
            });

        // Get teachers with pending grade submissions for current period
        $currentAcademicYear = config('school_settings.current_academic_year', '2026-2027');
        $currentSemester = config('school_settings.current_semester', '1st');

        // For college students - check if final grades are submitted for current semester
        // restrict to programs.education_level = 'college' and include per-section student counts
        $collegePendingTeachers = \DB::table('section_subjects')
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->join('programs', 'sections.program_id', '=', 'programs.id')
            ->join('student_enrollments', 'sections.id', '=', 'student_enrollments.section_id')
            ->leftJoin('student_grades', function ($join) {
                $join->on('student_grades.student_enrollment_id', '=', 'student_enrollments.id')
                    ->on('student_grades.section_subject_id', '=', 'section_subjects.id');
            })
            ->where('sections.academic_year', $currentAcademicYear)
            ->where('sections.semester', $currentSemester)
            ->where('sections.status', 'active')
            ->where('section_subjects.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->whereNotNull('section_subjects.teacher_id')
            ->whereNull('student_grades.final_submitted_at')
            ->where('programs.education_level', 'college')
            ->select(
                'section_subjects.teacher_id',
                \DB::raw("CONCAT(COALESCE(programs.program_code, ''), '-', sections.year_level, sections.section_name) as formatted_section_name"),
                'section_subjects.subject_id',
                \DB::raw("(SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = sections.id AND se.status = 'active') as student_count")
            )
            ->distinct()
            ->get()
            ->groupBy('teacher_id');

        // For SHS students - check if fourth quarter grades are submitted (include per-section student counts)
        $shsPendingTeachers = \DB::table('section_subjects')
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->join('programs', 'sections.program_id', '=', 'programs.id')
            ->join('student_enrollments', 'sections.id', '=', 'student_enrollments.section_id')
            ->join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->leftJoin('shs_student_grades', function ($join) {
                $join->on('shs_student_grades.student_enrollment_id', '=', 'student_enrollments.id')
                    ->on('shs_student_grades.section_subject_id', '=', 'section_subjects.id');
            })
            ->where('sections.academic_year', $currentAcademicYear)
            ->where('sections.semester', $currentSemester)
            ->where('students.education_level', 'senior_high')
            ->where('sections.status', 'active')
            ->where('section_subjects.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->whereNotNull('section_subjects.teacher_id')
            ->whereNull('shs_student_grades.fourth_quarter_submitted_at')
            ->select(
                'section_subjects.teacher_id',
                \DB::raw("CONCAT(COALESCE(programs.program_code, ''), '-', sections.year_level, sections.section_name) as formatted_section_name"),
                'section_subjects.subject_id',
                \DB::raw("(SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = sections.id AND se.status = 'active') as student_count")
            )
            ->distinct()
            ->get()
            ->groupBy('teacher_id');

        // Combine college + SHS groups per teacher to avoid duplicates
        $combinedByTeacher = [];

        foreach ([$collegePendingTeachers, $shsPendingTeachers] as $pendingGroup) {
            foreach ($pendingGroup as $teacherId => $records) {
                if (! isset($combinedByTeacher[$teacherId])) {
                    $combinedByTeacher[$teacherId] = $records;
                } else {
                    $combinedByTeacher[$teacherId] = $combinedByTeacher[$teacherId]->concat($records);
                }
            }
        }

        $pendingGradeTeachers = collect();

        foreach ($combinedByTeacher as $teacherId => $records) {
            $teacher = \App\Models\Teacher::with('user')->find($teacherId);
            if (! $teacher) {
                continue;
            }

            // ensure sections are unique and include student counts; count distinct pending subjects
            $sections = $records->map(function ($r) {
                return [
                    'name' => $r->formatted_section_name,
                    'student_count' => (int) ($r->student_count ?? 0),
                ];
            })->unique('name')->take(3)->values();

            $subjectCount = $records->pluck('subject_id')->unique()->count();

            $pendingGradeTeachers->push([
                'id' => $teacher->id,
                'name' => $teacher->user->name ?? 'Unknown',
                'sections' => $sections,
                'pending_subjects_count' => $subjectCount,
            ]);
        }

        $pendingGradeTeachers = $pendingGradeTeachers->take(5);

        return Inertia::render('Admin/Dashboard', [
            'stats' => $stats,
            'enrollmentStats' => $enrollmentStats,
            'programStats' => $programStats,
            'lowEnrollmentSections' => $lowEnrollmentSections,
            'studentsWithoutSections' => $studentsWithoutSections,
            'sectionsWithoutTeachers' => $sectionsWithoutTeachers,
            'pendingGradeTeachers' => $pendingGradeTeachers,
        ]);
    }
}
