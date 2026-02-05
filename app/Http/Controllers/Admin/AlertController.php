<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use Inertia\Inertia;
use Inertia\Response;

class AlertController extends Controller
{
    public function index(): Response
    {
        // Get all low enrollment sections
        $lowEnrollmentSections = Section::with(['program', 'studentEnrollments' => function ($query) {
            $query->where('status', 'active');
        }])
            ->get()
            ->filter(function ($section) {
                return $section->studentEnrollments->count() < 20;
            })
            ->map(function ($section) {
                return [
                    'id' => $section->id,
                    'section_name' => $section->formatted_name,
                    'program_name' => $section->program->program_name ?? 'Unknown',
                    'student_count' => $section->studentEnrollments->count(),
                    'capacity' => 40, // Assuming standard capacity
                ];
            });

        // Get all students without sections
        $studentsWithoutSections = Student::whereDoesntHave('enrollments', function ($query) {
            $query->where('status', 'active');
        })
            ->with(['user', 'program'])
            ->get()
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_number' => $student->student_number,
                    'name' => $student->user->name ?? 'Unknown',
                    'program_name' => $student->program->program_name ?? 'Unknown',
                    'education_level' => $student->education_level,
                    'year_level' => $student->year_level,
                ];
            });

        // Get all sections with unassigned subjects
        $sectionsWithoutTeachers = Section::with(['program', 'sectionSubjects' => function ($query) {
            $query->whereNull('teacher_id')->where('status', 'active');
        }])
            ->whereHas('sectionSubjects', function ($query) {
                $query->whereNull('teacher_id')->where('status', 'active');
            })
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

        // Get teachers with pending grade submissions
        $currentAcademicYear = config('school_settings.current_academic_year', '2026-2027');
        $currentSemester = config('school_settings.current_semester', '1st');

        // For college students - check if final grades are submitted
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
            ->select(
                'section_subjects.teacher_id',
                \DB::raw("CONCAT(COALESCE(programs.program_code, ''), '-', sections.year_level, sections.section_name) as formatted_section_name"),
                'section_subjects.subject_id'
            )
            ->distinct()
            ->get()
            ->groupBy('teacher_id');

        // For SHS students - check if fourth quarter grades are submitted
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
                'section_subjects.subject_id'
            )
            ->distinct()
            ->get()
            ->groupBy('teacher_id');

        // Combine and format the pending teachers data
        $pendingGradeTeachers = collect();

        foreach ([$collegePendingTeachers, $shsPendingTeachers] as $pendingGroup) {
            foreach ($pendingGroup as $teacherId => $records) {
                $teacher = \App\Models\Teacher::with('user')->find($teacherId);
                if ($teacher) {
                    $sections = $records->pluck('formatted_section_name')->unique();
                    $subjectCount = $records->count();

                    $pendingGradeTeachers->push([
                        'id' => $teacher->id,
                        'name' => $teacher->user->name ?? 'Unknown',
                        'sections' => $sections,
                        'pending_subjects_count' => $subjectCount,
                        'education_levels' => $records->groupBy(function ($record) {
                            // Determine education level from the query type
                            return str_contains($record->formatted_section_name, 'SHS') ? 'senior_high' : 'college';
                        })->keys(),
                    ]);
                }
            }
        }

        return Inertia::render('Admin/Alerts/Index', [
            'lowEnrollmentSections' => $lowEnrollmentSections,
            'studentsWithoutSections' => $studentsWithoutSections,
            'sectionsWithoutTeachers' => $sectionsWithoutTeachers,
            'pendingGradeTeachers' => $pendingGradeTeachers,
            'alertsSummary' => [
                'total_alerts' => $lowEnrollmentSections->count() + $studentsWithoutSections->count() + $sectionsWithoutTeachers->count() + $pendingGradeTeachers->count(),
                'low_enrollment_count' => $lowEnrollmentSections->count(),
                'unassigned_students_count' => $studentsWithoutSections->count(),
                'unassigned_subjects_count' => $sectionsWithoutTeachers->count(),
                'pending_grades_count' => $pendingGradeTeachers->count(),
            ],
        ]);
    }
}
