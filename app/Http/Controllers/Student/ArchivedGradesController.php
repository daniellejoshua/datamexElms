<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ArchivedStudentEnrollment;
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

        return Inertia::render('Student/ArchivedGrades/Index', [
            'archivedEnrollments' => $archivedEnrollments,
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
                            'prelim' => $s->prelim_grade,
                            'midterm' => $s->midterm_grade,
                            'prefinals' => $s->prefinal_grade,
                            'finals' => $s->final_grade,
                        ],
                        'final_semester_grade' => $s->semester_grade,
                    ];
                })->toArray();
        }

        return Inertia::render('Student/ArchivedGrades/Show', [
            'subjects' => $subjects,
            'academic_year' => $academic_year,
            'semester' => $semester,
        ]);
    }

    public function showSection(Request $request, $sectionId)    {
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
    }}
