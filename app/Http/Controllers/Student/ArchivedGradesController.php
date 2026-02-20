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

        // Group by section to avoid duplicates
        $sections = $archivedEnrollments->groupBy('archived_section_id')->map(function ($enrollments) {
            $section = $enrollments->first()->archivedSection;

            return [
                'section' => $section,
                'enrollments' => $enrollments,
                'total_subjects' => $enrollments->count(),
                'completed_count' => $enrollments->where('final_status', 'completed')->count(),
                'best_grade' => $enrollments->whereNotNull('final_semester_grade')->max('final_semester_grade'),
            ];
        });

        return Inertia::render('Student/ArchivedGrades/Show', [
            'sections' => $sections,
            'academic_year' => $academic_year,
            'semester' => $semester,
        ]);
    }

    public function showSection(Request $request, $sectionId): Response
    {
        $student = $request->user()->student;
        $academic_year = $request->query('academic_year');
        $semester = $request->query('semester');

        if (! $academic_year || ! $semester) {
            abort(404);
        }

        $archivedEnrollments = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->where('archived_section_id', $sectionId)
            ->where('academic_year', $academic_year)
            ->where('semester', $semester)
            ->with(['archivedSection.program'])
            ->get();

        \Log::info('Archived enrollments query', [
            'student_id' => $student->id,
            'section_id' => $sectionId,
            'academic_year' => $academic_year,
            'semester' => $semester,
            'count' => $archivedEnrollments->count(),
        ]);

        $section = $archivedEnrollments->first()?->archivedSection;

        // Prefer normalized archived subject rows when available
        $subjectsFromCourseData = [];

        $archivedEnrollmentIds = $archivedEnrollments->pluck('id')->filter()->values();
        $archivedSubjects = [];

        if ($archivedEnrollmentIds->isNotEmpty()) {
            $archivedSubjects = \App\Models\ArchivedStudentSubject::whereIn('archived_student_enrollment_id', $archivedEnrollmentIds)
                ->orderBy('subject_code')
                ->get();
        }

        if ($archivedSubjects->isNotEmpty()) {
            // Build subject entries from normalized archived_subject rows
            foreach ($archivedSubjects as $s) {
                $enrollment = $archivedEnrollments->firstWhere('id', $s->archived_student_enrollment_id);

                $subjectsFromCourseData[] = [
                    'id' => $s->id,
                    'subject_code' => $s->subject_code ?? 'N/A',
                    'subject_name' => $s->subject_name ?? 'Unknown Subject',
                    'credits' => $s->units ?? 0,
                    'teacher_name' => $s->teacher_id ? optional(\App\Models\Teacher::find($s->teacher_id))->user->name : null,
                    'final_grades' => [
                        'prelim' => $s->prelim_grade,
                        'midterm' => $s->midterm_grade,
                        'prefinals' => $s->prefinal_grade,
                        'finals' => $s->final_grade,
                    ],
                    'final_semester_grade' => $s->semester_grade,
                    'final_status' => $enrollment?->final_status ?? 'archived',
                    'letter_grade' => $enrollment?->letter_grade ?? null,
                ];
            }
        } elseif ($section && $section->course_data && is_array($section->course_data) && count($section->course_data) > 0) {
            \Log::info('Course data found', ['count' => count($section->course_data)]);

            // Get enrollment data for grades
            $enrollmentData = $archivedEnrollments->first();

            foreach ($section->course_data as $index => $course) {
                \Log::info('Processing course', ['index' => $index, 'course' => $course]);
                $subjectsFromCourseData[] = [
                    'id' => $course['id'] ?? 'course-'.$index,
                    'subject_code' => $course['course_code'] ?? $course['subject_code'] ?? 'N/A',
                    'subject_name' => $course['subject_name'] ?? 'Unknown Subject',
                    'credits' => $course['credits'] ?? 0,
                    'teacher_name' => $course['teacher_name'] ?? 'N/A',
                    'final_grades' => $enrollmentData ? ($enrollmentData->final_grades ?? []) : [],
                    'final_semester_grade' => $enrollmentData ? ($enrollmentData->final_semester_grade ?? null) : null,
                    'final_status' => $enrollmentData ? ($enrollmentData->final_status ?? 'unknown') : 'unknown',
                    'letter_grade' => $enrollmentData ? ($enrollmentData->letter_grade ?? null) : null,
                ];
            }
            \Log::info('Subjects created from course data', ['count' => count($subjectsFromCourseData)]);
        } else {
            \Log::info('No course data found or empty, creating placeholder subjects', [
                'section_exists' => ! is_null($section),
                'course_data_exists' => $section ? ! is_null($section->course_data) : false,
                'course_data_type' => $section ? gettype($section->course_data) : 'N/A',
                'course_data_count' => $section && is_array($section->course_data) ? count($section->course_data) : 0,
            ]);

            // Create placeholder subjects based on enrollments or a default message
            if ($archivedEnrollments->count() > 0) {
                $subjectsFromCourseData[] = [
                    'id' => 'placeholder-1',
                    'subject_code' => 'ARCHIVED',
                    'subject_name' => 'Archived Subjects',
                    'credits' => 0,
                    'teacher_name' => 'N/A',
                    'final_grades' => [],
                    'final_semester_grade' => null,
                    'final_status' => 'archived',
                    'letter_grade' => null,
                ];
            } else {
                $subjectsFromCourseData[] = [
                    'id' => 'no-data-1',
                    'subject_code' => 'N/A',
                    'subject_name' => 'No Subject Data Available',
                    'credits' => 0,
                    'teacher_name' => 'N/A',
                    'final_grades' => [],
                    'final_semester_grade' => null,
                    'final_status' => 'no_data',
                    'letter_grade' => null,
                ];
            }
        }

        return Inertia::render('Student/ArchivedGrades/SubjectGrades', [
            'archivedEnrollments' => $subjectsFromCourseData,
            'section' => $section,
            'academic_year' => $academic_year,
            'semester' => $semester,
        ]);
    }
}
