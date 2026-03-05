<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArchivedGradesController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        $archivedEnrollments = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->with(['archivedSection.program'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->paginate(20);

        // Group enrollments by academic period and calculate student-specific subject counts.
        $enrollmentsByPeriod = $archivedEnrollments->getCollection()->groupBy(function ($enrollment) {
            return $enrollment->academic_year.'-'.$enrollment->semester;
        });

        $periodStats = [];
        foreach ($enrollmentsByPeriod as $periodKey => $enrollments) {
            [$academicYear, $semester] = explode('-', $periodKey);
            $enrollmentIds = $enrollments->pluck('id')->filter()->values();

            $subjectsQuery = ArchivedStudentSubject::query()
                ->where('student_id', $student->id)
                ->whereHas('archivedEnrollment', function ($query) use ($academicYear, $semester) {
                    $query->where('academic_year', $academicYear)
                        ->where('semester', $semester);
                });

            if ($enrollmentIds->isNotEmpty()) {
                $subjectsQuery->whereIn('archived_student_enrollment_id', $enrollmentIds);
            }

            $subjectRows = $subjectsQuery->get();

            if ($subjectRows->isNotEmpty()) {
                $totalSubjects = $subjectRows
                    ->map(fn ($row) => $row->subject_code ?: 'id:'.$row->subject_id)
                    ->filter()
                    ->unique()
                    ->count();

                $completedSubjects = $subjectRows
                    ->filter(fn ($row) => ! is_null($row->semester_grade))
                    ->map(fn ($row) => $row->subject_code ?: 'id:'.$row->subject_id)
                    ->filter()
                    ->unique()
                    ->count();
            } else {
                // Fallback for older archived records without normalized subject rows.
                $totalSubjects = (int) $enrollments->count();
                $completedSubjects = (int) $enrollments->where('final_status', 'completed')->count();
            }

            $periodStats[$periodKey] = [
                'total_subjects' => $totalSubjects,
                'completed_subjects' => $completedSubjects,
            ];
        }

        // Add period stats to each enrollment row for frontend grouping.
        $archivedEnrollments->getCollection()->transform(function ($enrollment) use ($periodStats) {
            $periodKey = $enrollment->academic_year.'-'.$enrollment->semester;
            $enrollment->period_total_subjects = $periodStats[$periodKey]['total_subjects'] ?? 0;
            $enrollment->period_completed_subjects = $periodStats[$periodKey]['completed_subjects'] ?? 0;

            return $enrollment;
        });

        return Inertia::render('Student/ArchivedGrades/Index', [
            'archivedEnrollments' => $archivedEnrollments,
            'isShsStudent' => in_array(strtolower((string) $student->education_level), ['senior_high', 'shs'], true),
        ]);
    }

    public function showByPeriod(Request $request): Response
    {
        $student = $request->user()->student;
        $academic_year = $request->query('academic_year');
        $semester = $request->query('semester');

        if (! $academic_year || ! $semester) {
            abort(404);
        }

        $archivedEnrollments = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->where('academic_year', $academic_year)
            ->where('semester', $semester)
            ->with(['archivedSection.program'])
            ->get();

        // pull normalized subjects if they exist
        $enrollmentIds = $archivedEnrollments->pluck('id')->filter()->values();
        $subjects = [];
        if ($enrollmentIds->isNotEmpty()) {
            $subjects = \App\Models\ArchivedStudentSubject::whereIn('archived_student_enrollment_id', $enrollmentIds)
                ->with('teacher.user')
                ->orderBy('subject_code')
                ->get()
                ->map(function ($s) use ($archivedEnrollments) {
                    $en = $archivedEnrollments->firstWhere('id', $s->archived_student_enrollment_id);

                    $archivedSection = $en?->archivedSection;
                    $programCode = $archivedSection?->program?->program_code;
                    $yearLevel = $archivedSection?->year_level;

                    return [
                        'id' => $s->id,
                        'subject_code' => $s->subject_code,
                        'subject_name' => $s->subject_name,
                        'teacher_name' => optional(optional($s->teacher)->user)->name,
                        'section_name' => $archivedSection?->section_name,

                        // include archived section metadata so frontend can build labels
                        'archived_section' => $archivedSection ? [
                            'id' => $archivedSection->id,
                            'section_name' => $archivedSection->section_name,
                            'name' => $archivedSection->section_name,
                            'year_level' => $yearLevel,
                            'program_code' => $programCode,
                        ] : null,
                        // duplicate at top level for convenience
                        'program_code' => $programCode,
                        'year_level' => $yearLevel,

                        'final_grades' => [
                            'q1' => $s->first_quarter_grade ?? $s->prelim_grade,
                            'q2' => $s->second_quarter_grade ?? $s->midterm_grade,
                            'prelim' => $s->prelim_grade,
                            'midterm' => $s->midterm_grade,
                            'prefinals' => $s->prefinal_grade,
                            'finals' => $s->final_grade,
                        ],
                        'final_semester_grade' => $s->semester_grade,
                        'teacher_remarks' => $s->teacher_remarks ?? $en?->teacher_remarks,
                    ];
                })->toArray();
        }

        // Fallback for legacy archived records where normalized subject rows
        // were not yet generated. Show at least one row per archived enrollment.
        if (empty($subjects)) {
            $subjects = $archivedEnrollments->map(function ($enrollment) {
                $grades = is_array($enrollment->final_grades) ? $enrollment->final_grades : [];
                $archivedSection = $enrollment->archivedSection;
                $courseData = is_array($archivedSection?->course_data) ? $archivedSection->course_data : [];
                $firstCourse = $courseData[0] ?? [];

                $q1 = $grades['q1'] ?? $grades['quarter1'] ?? $grades['quarter_1'] ?? $grades['prelim'] ?? null;
                $q2 = $grades['q2'] ?? $grades['quarter2'] ?? $grades['quarter_2'] ?? $grades['midterm'] ?? $grades['final'] ?? null;

                return [
                    'id' => 'legacy-'.$enrollment->id,
                    'subject_code' => $firstCourse['subject_code'] ?? $firstCourse['course_code'] ?? 'ARCH',
                    'subject_name' => $firstCourse['subject_name'] ?? 'Archived Grade',
                    'teacher_name' => $firstCourse['teacher_name'] ?? null,
                    'section_name' => $archivedSection?->section_name,
                    'archived_section' => $archivedSection ? [
                        'id' => $archivedSection->id,
                        'section_name' => $archivedSection->section_name,
                        'name' => $archivedSection->section_name,
                        'year_level' => $archivedSection->year_level,
                        'program_code' => $archivedSection?->program?->program_code,
                    ] : null,
                    'program_code' => $archivedSection?->program?->program_code,
                    'year_level' => $archivedSection?->year_level,
                    'final_grades' => [
                        'q1' => $q1,
                        'q2' => $q2,
                        'prelim' => $grades['prelim'] ?? $q1,
                        'midterm' => $grades['midterm'] ?? $q2,
                        'prefinals' => $grades['prefinals'] ?? $grades['prefinal'] ?? null,
                        'finals' => $grades['finals'] ?? $grades['final'] ?? null,
                    ],
                    'final_semester_grade' => $enrollment->final_semester_grade ?? $grades['overall'] ?? $grades['final'] ?? null,
                    'teacher_remarks' => $enrollment->teacher_remarks,
                ];
            })->values()->toArray();
        }

        return Inertia::render('Student/ArchivedGrades/Show', [
            'subjects' => $subjects,
            'academic_year' => $academic_year,
            'semester' => $semester,
            'isShsStudent' => in_array(strtolower((string) $student->education_level), ['senior_high', 'shs'], true),
        ]);
    }

    public function showSection(Request $request, $sectionId)
    {
        // redirect back to period view, section-specific page is deprecated
        $academic_year = $request->query('academic_year');
        $semester = $request->query('semester');

        if (! $academic_year || ! $semester) {
            abort(404);
        }

        return redirect()->route('student.archived-grades.period', [
            'academic_year' => $academic_year,
            'semester' => $semester,
        ]);
    }
}
