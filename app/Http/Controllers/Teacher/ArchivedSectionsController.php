<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ArchivedSectionsController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = $request->user()->teacher;

        // Get ALL archived sections and filter in PHP since JSON_SEARCH has issues with integer values
        // This preserves ALL historical archived sections - nothing is deleted
        $archivedSections = ArchivedSection::with(['archivedEnrollments', 'program', 'curriculum'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->get()
            ->filter(function ($section) use ($teacher) {
                // Filter sections where teacher taught at least one subject
                $courseData = $section->course_data ?? [];
                foreach ($courseData as $course) {
                    if (isset($course['teacher_id']) && $course['teacher_id'] == $teacher->id) {
                        return true;
                    }
                }

                return false;
            })
            ->values();

        // Paginate the filtered collection
        $currentPage = $request->get('page', 1);
        $perPage = 20;
        $total = $archivedSections->count();
        $paginatedSections = $archivedSections->forPage($currentPage, $perPage);

        $archivedSectionsPaginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $paginatedSections,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/ArchivedSections/Index', [
            'archivedSections' => $archivedSectionsPaginated,
        ]);
    }

    public function show(Request $request, ArchivedSection $archivedSection): Response
    {
        $teacher = $request->user()->teacher;

        // Verify teacher taught at least one subject in this section
        $courseData = $archivedSection->course_data ?? [];
        $taughtSection = false;
        foreach ($courseData as $course) {
            if (isset($course['teacher_id']) && $course['teacher_id'] == $teacher->id) {
                $taughtSection = true;
                break;
            }
        }

        if (! $taughtSection) {
            abort(403, 'You do not have access to this archived section.');
        }

        $archivedSection->load(['archivedEnrollments', 'program', 'curriculum']);

        // Process enrollments to check grade status
        $enrollmentsWithStatus = $archivedSection->archivedEnrollments->map(function ($enrollment) {
            $finalGrades = $enrollment->final_grades ?? [];

            // Check if all 4 grades exist (prelim, midterm, prefinals, finals)
            $requiredGrades = ['prelim', 'midterm', 'prefinals', 'finals'];
            $missingGrades = [];

            foreach ($requiredGrades as $grade) {
                if (empty($finalGrades[$grade])) {
                    $missingGrades[] = ucfirst($grade);
                }
            }

            // Determine status
            if (count($missingGrades) > 0) {
                $gradeStatus = 'Missing Grades';
                $missingGradesList = $missingGrades;
            } else {
                $gradeStatus = 'Complete';
                $missingGradesList = [];
            }

            return [
                'id' => $enrollment->id,
                'student_id' => $enrollment->student_id,
                'student_data' => $enrollment->student_data,
                'final_grades' => $finalGrades,
                'final_semester_grade' => $enrollment->final_semester_grade,
                'final_status' => $enrollment->final_status,
                'grade_status' => $gradeStatus,
                'missing_grades' => $missingGradesList,
            ];
        });

        return Inertia::render('Teacher/ArchivedSections/Show', [
            'archivedSection' => $archivedSection,
            'enrollments' => $enrollmentsWithStatus,
        ]);
    }

    public function updateGrades(Request $request, ArchivedSection $archivedSection)
    {
        $teacher = $request->user()->teacher;

        // Verify teacher taught at least one subject in this section
        $courseData = $archivedSection->course_data ?? [];
        $taughtSection = false;
        foreach ($courseData as $course) {
            if (isset($course['teacher_id']) && $course['teacher_id'] == $teacher->id) {
                $taughtSection = true;
                break;
            }
        }

        if (! $taughtSection) {
            abort(403, 'You do not have access to this archived section.');
        }

        // Validate the request
        $validator = Validator::make($request->all(), [
            'enrollment_id' => 'required|exists:archived_student_enrollments,id',
            'grades.prelim' => 'nullable|numeric|min:0|max:100',
            'grades.midterm' => 'nullable|numeric|min:0|max:100',
            'grades.prefinals' => 'nullable|numeric|min:0|max:100',
            'grades.finals' => 'nullable|numeric|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        // Find the enrollment
        $enrollment = ArchivedStudentEnrollment::where('id', $request->enrollment_id)
            ->where('archived_section_id', $archivedSection->id)
            ->firstOrFail();

        // Update the final_grades JSON field
        $finalGrades = $enrollment->final_grades ?? [];
        $grades = $request->grades;

        // Update grades if provided
        foreach (['prelim', 'midterm', 'prefinals', 'finals'] as $gradeType) {
            if (isset($grades[$gradeType]) && $grades[$gradeType] !== '') {
                $finalGrades[$gradeType] = (float) $grades[$gradeType];
            }
        }

        // Calculate new final semester grade if all grades are present
        if (isset($finalGrades['prelim'], $finalGrades['midterm'], $finalGrades['prefinals'], $finalGrades['finals'])) {
            $finalSemesterGrade = (
                $finalGrades['prelim'] +
                $finalGrades['midterm'] +
                $finalGrades['prefinals'] +
                $finalGrades['finals']
            ) / 4;

            $enrollment->final_semester_grade = round($finalSemesterGrade, 2);
        }

        $enrollment->final_grades = $finalGrades;
        $enrollment->save();

        // Update the original student_grades table if the record exists
        if ($enrollment->original_enrollment_id) {
            $studentGrade = StudentGrade::where('student_enrollment_id', $enrollment->original_enrollment_id)
                ->first();

            if ($studentGrade) {
                // Map archived grades to student_grades columns
                if (isset($finalGrades['prelim'])) {
                    $studentGrade->prelim_grade = $finalGrades['prelim'];
                }
                if (isset($finalGrades['midterm'])) {
                    $studentGrade->midterm_grade = $finalGrades['midterm'];
                }
                if (isset($finalGrades['prefinals'])) {
                    $studentGrade->prefinal_grade = $finalGrades['prefinals'];
                }
                if (isset($finalGrades['finals'])) {
                    $studentGrade->final_grade = $finalGrades['finals'];
                }

                // Update semester_grade if all grades are present
                if (isset($finalGrades['prelim'], $finalGrades['midterm'], $finalGrades['prefinals'], $finalGrades['finals'])) {
                    $studentGrade->semester_grade = $enrollment->final_semester_grade;
                }

                $studentGrade->save();

                // Update student_subject_credits if this grade has a credit record
                if ($studentGrade->id) {
                    $subjectCredit = StudentSubjectCredit::where('student_grade_id', $studentGrade->id)
                        ->where('student_id', $enrollment->student_id)
                        ->first();

                    if ($subjectCredit && $studentGrade->semester_grade !== null) {
                        // Update the final_grade in student_subject_credits
                        $subjectCredit->final_grade = $studentGrade->semester_grade;

                        // Update credit_status based on the grade
                        if ($studentGrade->semester_grade >= 75) {
                            $subjectCredit->credit_status = 'credited';
                        } else {
                            $subjectCredit->credit_status = 'failed';
                        }

                        $subjectCredit->save();
                    }
                }
            }
        }

        return back();
    }
}
