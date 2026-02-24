<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\Student;
use App\Models\Teacher;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Log;

class AlertController extends Controller
{
    public function index(): Response
    {
        // determine current academic period for filtering
        // Use the SchoolSetting helper which falls back to automatic calculation
        // when a manual override isn't present. This prevents null-term filters
        // which would return empty result sets.
        $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();

        // Get all low enrollment sections for the current term
        $lowEnrollmentSections = Section::with(['program', 'studentEnrollments' => function ($query) use ($currentAcademicYear, $currentSemester) {
            $query->where('status', 'active')
                  ->where('academic_year', $currentAcademicYear)
                  ->where('semester', $currentSemester);
        }])
            ->where('academic_year', $currentAcademicYear)
            ->where('semester', $currentSemester)
            ->where('status', 'active')
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

        // Get all students who are enrolled in the current term but lack an
        // *active* section assignment. We first ensure there is at least one
        // enrollment record for the current academic year/semester, then filter
        // out those whose active enrollments in the term have a section (i.e.
        // status `active`).
        // two sets:
        // 1. students who have at least one enrollment this term but none of
        //    those enrollments are active (dashboard-style count)
        $noActive = Student::whereDoesntHave('enrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
            $query->where('status', 'active')
                  ->where('academic_year', $currentAcademicYear)
                  ->where('semester', $currentSemester);
        })
        ->whereHas('enrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
            $query->where('academic_year', $currentAcademicYear)
                  ->where('semester', $currentSemester);
        })
        ->with(['user', 'program'])
        ->get();

        // 2. students with an active term enrollment whose section is missing or
        //    does not match the student's year level. Important: a student may
        //    have multiple enrollments for the term (including interim records
        //    with null `section_id`). We only want to flag students when none
        //    of their *active* enrollments for the term have a valid, active
        //    section whose `year_level` equals the student's `year_level`.
        $missingSection = Student::whereHas('enrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
            // Ensure the student has at least one enrollment in the term
            $query->where('academic_year', $currentAcademicYear)
                  ->where('semester', $currentSemester);
        })
        // Exclude students that do have an active enrollment with a non-null
        // section that is active and matches the student's year_level.
        ->whereDoesntHave('enrollments', function ($q) use ($currentAcademicYear, $currentSemester) {
            $q->where('status', 'active')
              ->where('academic_year', $currentAcademicYear)
              ->where('semester', $currentSemester)
              ->whereNotNull('section_id')
              ->whereHas('section', function ($sectionQ) {
                  $sectionQ->where('status', 'active')
                           ->whereColumn('year_level', 'students.year_level');
              });
        })
        ->with(['user', 'program'])
        ->get();

        // merge, preserving unique students by id
        $studentsWithoutSections = $noActive->concat($missingSection)->unique('id')
            ->map(function ($student) {
                return [
                    'id' => $student->id,
                    'student_number' => $student->student_number,
                    'name' => $student->user->name ?? 'Unknown',
                    'program_name' => $student->program->program_name ?? 'Unknown',
                    'program_code' => $student->program->program_code ?? null,
                    'education_level' => $student->education_level,
                    'year_level' => $student->year_level,
                ];
            });

        // Get all sections with unassigned subjects for the current term
        $sectionsWithoutTeachers = Section::with(['program', 'sectionSubjects' => function ($query) {
            $query->whereNull('teacher_id')->where('status', 'active');
        }])
            ->where('academic_year', $currentAcademicYear)
            ->where('semester', $currentSemester)
            ->where('status', 'active')
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

        // For college students - check if final grades are submitted
        // restrict to programs marked as 'college' to avoid picking up SHS sections
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
                \DB::raw("'college' as education_level"),
                // per-section active student count
                \DB::raw("(SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = sections.id AND se.status = 'active') as student_count")
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
                'section_subjects.subject_id',
                \DB::raw("'senior_high' as education_level"),
                \DB::raw("(SELECT COUNT(*) FROM student_enrollments se WHERE se.section_id = sections.id AND se.status = 'active') as student_count")
            )
            ->distinct()
            ->get()
            ->groupBy('teacher_id');

        // Combine college + SHS groups per teacher to avoid duplicate teacher entries
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
            $teacher = Teacher::with('user')->find($teacherId);

            if (! $teacher) {
                continue;
            }

            // unique sections (one entry per section) with student counts and distinct subject count
            $sections = $records->map(function ($r) {
                return [
                    'name' => $r->formatted_section_name,
                    'student_count' => (int) ($r->student_count ?? 0),
                ];
            })->unique('name')->values();

            $subjectCount = $records->pluck('subject_id')->unique()->count();

            $pendingGradeTeachers->push([
                'id' => $teacher->id,
                'name' => $teacher->user->name ?? 'Unknown',
                'sections' => $sections,
                'section_count' => $sections->count(),
                'pending_subjects_count' => $subjectCount,
                'education_levels' => $records->pluck('education_level')->unique()->values(),
            ]);
        }

        // --- Paginate results per user's preference ---
        $lowPerPage = 6; // low enrollment: 6 cards per page
        $otherPerPage = 3; // pending grades & unassigned subjects & unassigned students: 3 cards per page

        $lowPage = (int) request()->input('low_enrollment_page', 1);
        $studentsPage = (int) request()->input('unassigned_students_page', 1);
        $subjectsPage = (int) request()->input('unassigned_subjects_page', 1);
        $pendingPage = (int) request()->input('pending_grades_page', 1);

        $lowTotal = $lowEnrollmentSections->count();
        $lowItems = $lowEnrollmentSections->forPage($lowPage, $lowPerPage)->values();
        $lowPaginator = new LengthAwarePaginator($lowItems, $lowTotal, $lowPerPage, $lowPage, [
            'path' => url()->current(),
            'pageName' => 'low_enrollment_page',
            'query' => request()->query(),
        ]);

        $studentsTotal = $studentsWithoutSections->count();
        $studentsItems = $studentsWithoutSections->forPage($studentsPage, $otherPerPage)->values();
        $studentsPaginator = new LengthAwarePaginator($studentsItems, $studentsTotal, $otherPerPage, $studentsPage, [
            'path' => url()->current(),
            'pageName' => 'unassigned_students_page',
            'query' => request()->query(),
        ]);

        $subjectsTotal = $sectionsWithoutTeachers->count();
        $subjectsItems = $sectionsWithoutTeachers->forPage($subjectsPage, $otherPerPage)->values();
        $subjectsPaginator = new LengthAwarePaginator($subjectsItems, $subjectsTotal, $otherPerPage, $subjectsPage, [
            'path' => url()->current(),
            'pageName' => 'unassigned_subjects_page',
            'query' => request()->query(),
        ]);

        $pendingTotal = $pendingGradeTeachers->count();
        $pendingItems = $pendingGradeTeachers->forPage($pendingPage, $otherPerPage)->values();
        $pendingPaginator = new LengthAwarePaginator($pendingItems, $pendingTotal, $otherPerPage, $pendingPage, [
            'path' => url()->current(),
            'pageName' => 'pending_grades_page',
            'query' => request()->query(),
        ]);

        return Inertia::render('Admin/Alerts/Index', [
            'lowEnrollmentSections' => $lowPaginator,
            'studentsWithoutSections' => $studentsPaginator,
            'sectionsWithoutTeachers' => $subjectsPaginator,
            'pendingGradeTeachers' => $pendingPaginator,
            'alertsSummary' => [
                'total_alerts' => $lowTotal + $studentsTotal + $subjectsTotal + $pendingTotal,
                'low_enrollment_count' => $lowTotal,
                'unassigned_students_count' => $studentsTotal,
                'unassigned_subjects_count' => $subjectsTotal,
                'pending_grades_count' => $pendingTotal,
            ],
        ]);
    }

    /**
     * Return detailed missing-grade rows (student, subject, section, missing components)
     * for a specific teacher — used by the admin pending-grades modal (JSON).
     */
    public function pendingGradesForTeacher(Teacher $teacher)
    {
        $incompleteGrades = [];

        // log incoming request for diagnostics
        Log::info('Pending grades request', [
            'teacher_id' => $teacher->id,
            'query' => request()->query(),
            'url' => request()->fullUrl(),
        ]);

        // College missing components
        // Start from student_enrollments and left join student_grades so we
        // also capture enrollments that do not yet have a grade record at all.
        $collegeGrades = \DB::table('student_enrollments')
            ->join('sections', 'student_enrollments.section_id', '=', 'sections.id')
            ->join('section_subjects', 'section_subjects.section_id', '=', 'sections.id')
            ->leftJoin('programs', 'sections.program_id', '=', 'programs.id')
            ->where('section_subjects.teacher_id', $teacher->id)
            ->leftJoin('student_grades', function ($join) {
                $join->on('student_grades.student_enrollment_id', '=', 'student_enrollments.id')
                    ->on('student_grades.section_subject_id', '=', 'section_subjects.id');
            })
            ->join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->where('students.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->where('sections.status', 'active')
            ->where('section_subjects.status', 'active')
            ->where('students.education_level', 'college')
            // Treat incomplete when there is no grade row, or any component/submission is null
            ->whereRaw("(student_grades.id IS NULL OR student_grades.prelim_grade IS NULL OR student_grades.midterm_grade IS NULL OR student_grades.prefinal_grade IS NULL OR student_grades.final_grade IS NULL OR student_grades.final_submitted_at IS NULL)")
            ->select(
                'students.first_name',
                'students.last_name',
                'programs.program_code',
                'subjects.subject_code',
                'sections.section_name',
                'sections.year_level',
                'sections.program_id',
                'sections.academic_year',
                'sections.semester',
                'student_grades.prelim_grade',
                'student_grades.midterm_grade',
                'student_grades.prefinal_grade',
                'student_grades.final_grade'
            )
            ->get();

        // Log how many college-grade rows we found (for debugging)
        Log::info('Pending grades - college rows', [
            'teacher_id' => $teacher->id,
            'count' => $collegeGrades->count(),
            'sample' => $collegeGrades->first() ? (array) $collegeGrades->first() : null,
        ]);

        foreach ($collegeGrades as $grade) {
            $missingGrades = [];
            if (is_null($grade->prelim_grade)) $missingGrades[] = 'P';
            if (is_null($grade->midterm_grade)) $missingGrades[] = 'M';
            if (is_null($grade->prefinal_grade)) $missingGrades[] = 'PF';
            if (is_null($grade->final_grade)) $missingGrades[] = 'F';

            $programPrefix = isset($grade->program_code) && $grade->program_code ? $grade->program_code : null;
            $yearLevel = $grade->year_level;
            $sectionName = $grade->section_name;

            $formatted = $programPrefix ? ($programPrefix . $yearLevel . '-' . $sectionName) : ($yearLevel . '-' . $sectionName);

            $incompleteGrades[] = [
                'student' => $grade->first_name.' '.$grade->last_name,
                'subject' => $grade->subject_code,
                'section' => $yearLevel.'-'. $sectionName,
                'formatted_section_name' => $formatted,
                'missing_grades' => implode(', ', $missingGrades),
                'academic_year' => $grade->academic_year,
                'semester' => ucfirst($grade->semester),
                'type' => 'College',
            ];
        }

        // SHS missing components
        // Start from student_enrollments and left join shs_student_grades to include
        // enrollments lacking any grade row yet.
        $shsGrades = \DB::table('student_enrollments')
            ->join('sections', 'student_enrollments.section_id', '=', 'sections.id')
            ->join('section_subjects', 'section_subjects.section_id', '=', 'sections.id')
            ->where('section_subjects.teacher_id', $teacher->id)
            ->leftJoin('shs_student_grades', function ($join) {
                $join->on('shs_student_grades.student_enrollment_id', '=', 'student_enrollments.id')
                    ->on('shs_student_grades.section_subject_id', '=', 'section_subjects.id');
            })
            ->join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->leftJoin('programs', 'sections.program_id', '=', 'programs.id')
            ->where('students.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->where('sections.status', 'active')
            ->where('section_subjects.status', 'active')
            ->where('students.education_level', 'senior_high')
            ->whereRaw("(shs_student_grades.id IS NULL OR shs_student_grades.first_quarter_grade IS NULL OR shs_student_grades.second_quarter_grade IS NULL OR shs_student_grades.final_grade IS NULL OR shs_student_grades.fourth_quarter_submitted_at IS NULL)")
            ->select(
                'students.first_name',
                'students.last_name',
                'subjects.subject_code',
                'sections.section_name',
                'sections.year_level',
                'programs.track',
                'sections.academic_year',
                'sections.semester',
                'shs_student_grades.first_quarter_grade',
                'shs_student_grades.second_quarter_grade',
                'shs_student_grades.final_grade'
            )
            ->get();

        // Log how many SHS-grade rows we found (for debugging)
        Log::info('Pending grades - shs rows', [
            'teacher_id' => $teacher->id,
            'count' => $shsGrades->count(),
            'sample' => $shsGrades->first() ? (array) $shsGrades->first() : null,
        ]);

        foreach ($shsGrades as $grade) {
            $missingGrades = [];
            if (is_null($grade->first_quarter_grade)) $missingGrades[] = '1Q';
            if (is_null($grade->second_quarter_grade)) $missingGrades[] = '2Q';
            if (is_null($grade->final_grade)) $missingGrades[] = 'F';

            $incompleteGrades[] = [
                'student' => $grade->first_name.' '.$grade->last_name,
                'subject' => $grade->subject_code,
                'section' => 'Grade '.$grade->year_level.($grade->track ? ' - '.$grade->track : ''),
                'formatted_section_name' => 'Grade '.$grade->year_level.($grade->track ? ' - '.$grade->track : ''),
                'missing_grades' => implode(', ', $missingGrades),
                'academic_year' => $grade->academic_year,
                'semester' => ucfirst($grade->semester),
                'type' => 'SHS',
            ];
        }

        // Paginate the results (default 5 per page for modal)
        $perPage = (int) request()->input('per_page', 5);
        $page = (int) request()->input('page', 1);
        $total = count($incompleteGrades);

        // Log total found for the teacher so we can see why frontend gets empty
        Log::info('Pending grades computed', [
            'teacher_id' => $teacher->id,
            'total_incomplete' => $total,
            'per_page' => $perPage,
            'page' => $page,
        ]);

        $items = array_slice($incompleteGrades, ($page - 1) * $perPage, $perPage);

        $paginator = new LengthAwarePaginator($items, $total, $perPage, $page, [
            'path' => url()->current(),
            'query' => request()->query(),
        ]);

        // Debugging: return raw computed rows and paginator when ?debug=1
        if (request()->query('debug')) {
            return response()->json([
                'debug' => true,
                'teacher_id' => $teacher->id,
                'total_incomplete' => $total,
                'per_page' => $perPage,
                'page' => $page,
                'paginator' => $paginator->toArray(),
                'rows' => $incompleteGrades,
            ]);
        }

        return response()->json($paginator->toArray());
    }
}

