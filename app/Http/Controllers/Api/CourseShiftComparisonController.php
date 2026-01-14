<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CourseShiftComparisonController extends Controller
{
    /**
     * Get subject comparison for course shift.
     * Compares student's completed subjects with new curriculum.
     */
    public function compare(Student $student, Request $request)
    {
        $newProgramId = $request->input('new_program_id');
        $newCurriculumId = $request->input('new_curriculum_id');

        // Get student's current program and curriculum
        $oldProgram = $student->program;
        $oldCurriculum = $student->curriculum;

        // Get new program and curriculum
        $newProgram = \App\Models\Program::find($newProgramId);
        $newCurriculum = Curriculum::find($newCurriculumId);

        if (! $oldProgram || ! $newProgram || ! $newCurriculum) {
            return response()->json(['error' => 'Invalid program or curriculum'], 400);
        }

        // Get all subjects the student has completed with grades
        $completedSubjects = DB::table('student_subject_enrollments')
            ->join('section_subjects', 'student_subject_enrollments.section_subject_id', '=', 'section_subjects.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->leftJoin('student_grades', function ($join) {
                $join->on('student_subject_enrollments.student_enrollment_id', '=', 'student_grades.student_enrollment_id')
                    ->on('section_subjects.id', '=', 'student_grades.section_subject_id');
            })
            ->leftJoin('shs_student_grades', function ($join) {
                $join->on('student_subject_enrollments.student_enrollment_id', '=', 'shs_student_grades.student_enrollment_id')
                    ->on('section_subjects.id', '=', 'shs_student_grades.section_subject_id');
            })
            ->where('student_subject_enrollments.student_id', $student->id)
            ->whereNotNull(DB::raw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade)'))
            ->where(function ($query) {
                $query->where('student_grades.status', 'passed')
                    ->orWhere('shs_student_grades.status', 'passed')
                    ->orWhereRaw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade) >= 75');
            })
            ->select(
                'subjects.id',
                'subjects.subject_code',
                'subjects.subject_name',
                'subjects.description',
                DB::raw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade) as grade'),
                'student_subject_enrollments.academic_year',
                'student_subject_enrollments.semester'
            )
            ->distinct()
            ->get();

        // Get new curriculum subjects
        $newCurriculumSubjects = CurriculumSubject::where('curriculum_id', $newCurriculumId)
            ->with('subject')
            ->get()
            ->map(function ($cs) {
                return [
                    'id' => $cs->subject->id,
                    'subject_code' => $cs->subject->subject_code,
                    'subject_name' => $cs->subject->subject_name,
                    'description' => $cs->subject->description,
                    'year_level' => $cs->year_level,
                    'semester' => $cs->semester,
                    'units' => $cs->subject->units ?? 3,
                ];
            });

        // Match subjects
        $credited = [];
        $similar = [];
        $newSubjects = [];
        $newSubjectIds = [];

        foreach ($newCurriculumSubjects as $newSubject) {
            $matched = false;

            foreach ($completedSubjects as $completedSubject) {
                // Exact match by subject code
                if (strtoupper($completedSubject->subject_code) === strtoupper($newSubject['subject_code'])) {
                    $credited[] = [
                        'old_subject' => [
                            'id' => $completedSubject->id,
                            'subject_code' => $completedSubject->subject_code,
                            'subject_name' => $completedSubject->subject_name,
                        ],
                        'new_subject' => $newSubject,
                        'grade' => number_format($completedSubject->grade, 2),
                        'match_reason' => 'Exact code match',
                    ];
                    $matched = true;
                    $newSubjectIds[] = $newSubject['id'];
                    break;
                }

                // Similar subject code (first 3-4 characters match)
                $oldCode = strtoupper($completedSubject->subject_code);
                $newCode = strtoupper($newSubject['subject_code']);
                if (substr($oldCode, 0, 3) === substr($newCode, 0, 3) && strlen($oldCode) >= 3) {
                    $similarity = similar_text($oldCode, $newCode, $percent);
                    if ($percent >= 70) {
                        $similar[] = [
                            'old_subject' => [
                                'id' => $completedSubject->id,
                                'subject_code' => $completedSubject->subject_code,
                                'subject_name' => $completedSubject->subject_name,
                            ],
                            'new_subject' => $newSubject,
                            'grade' => number_format($completedSubject->grade, 2),
                            'similarity_score' => round($percent, 0),
                        ];
                        $matched = true;
                        $newSubjectIds[] = $newSubject['id'];
                        break;
                    }
                }

                // Name similarity check
                $nameSimilarity = 0;
                similar_text(
                    strtoupper($completedSubject->subject_name),
                    strtoupper($newSubject['subject_name']),
                    $nameSimilarity
                );

                if ($nameSimilarity >= 80) {
                    $similar[] = [
                        'old_subject' => [
                            'id' => $completedSubject->id,
                            'subject_code' => $completedSubject->subject_code,
                            'subject_name' => $completedSubject->subject_name,
                        ],
                        'new_subject' => $newSubject,
                        'grade' => number_format($completedSubject->grade, 2),
                        'similarity_score' => round($nameSimilarity, 0),
                    ];
                    $matched = true;
                    $newSubjectIds[] = $newSubject['id'];
                    break;
                }
            }

            if (! $matched) {
                $newSubjects[] = $newSubject;
            }
        }

        return response()->json([
            'old_program' => $oldProgram->program_name,
            'old_program_code' => $oldProgram->program_code,
            'new_program' => $newProgram->program_name,
            'new_program_code' => $newProgram->program_code,
            'completed_subjects' => $completedSubjects->map(fn ($s) => [
                'subject_code' => $s->subject_code,
                'subject_name' => $s->subject_name,
                'grade' => number_format($s->grade, 2),
            ]),
            'credited_subjects' => $credited,
            'similar_subjects' => $similar,
            'new_subjects' => $newSubjects,
            'summary' => [
                'total_completed' => $completedSubjects->count(),
                'will_be_credited' => count($credited),
                'needs_review' => count($similar),
                'new_to_take' => count($newSubjects),
            ],
        ]);
    }
}
