<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Student;
use App\Models\StudentCreditTransfer;
use App\Models\StudentSubjectCredit;
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

        \Log::info('Course shift comparison request:', [
            'student_id' => $student->id,
            'current_program_id' => $student->program_id,
            'current_program_name' => $student->program?->program_name,
            'current_curriculum_id' => $student->curriculum_id,
            'current_curriculum_name' => $student->curriculum?->curriculum_name,
            'requested_new_program_id' => $newProgramId,
            'requested_new_curriculum_id' => $newCurriculumId,
        ]);

        // Get student's current program and curriculum
        $oldProgram = $student->program;
        $oldCurriculum = $student->curriculum;

        // Get new program and curriculum
        $newProgram = \App\Models\Program::find($newProgramId);
        $newCurriculum = Curriculum::find($newCurriculumId);

        if (! $oldProgram || ! $newProgram || ! $newCurriculum) {
            \Log::error('Invalid program or curriculum', [
                'oldProgram' => $oldProgram?->program_name,
                'newProgram' => $newProgram?->program_name,
                'newCurriculum' => $newCurriculum?->curriculum_name,
            ]);

            return response()->json(['error' => 'Invalid program or curriculum'], 400);
        }

        \Log::info('Fetched new curriculum details:', [
            'new_program_id' => $newProgram->id,
            'new_program_name' => $newProgram->program_name,
            'new_curriculum_id' => $newCurriculum->id,
            'new_curriculum_name' => $newCurriculum->curriculum_name,
        ]);

        // Get all subjects the student has completed with grades
        $completedSubjects = DB::table('student_subject_enrollments')
            ->join('section_subjects', 'student_subject_enrollments.section_subject_id', '=', 'section_subjects.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->leftJoin('student_grades', function ($join) use ($student) {
                $join->on('section_subjects.id', '=', 'student_grades.section_subject_id')
                    ->where('student_grades.student_enrollment_id', 'IN', function ($query) use ($student) {
                        $query->select('id')
                            ->from('student_enrollments')
                            ->where('student_id', $student->id);
                    });
            })
            ->leftJoin('shs_student_grades', function ($join) use ($student) {
                $join->on('section_subjects.id', '=', 'shs_student_grades.section_subject_id')
                    ->where('shs_student_grades.student_enrollment_id', 'IN', function ($query) use ($student) {
                        $query->select('id')
                            ->from('student_enrollments')
                            ->where('student_id', $student->id);
                    });
            })
            ->where('student_subject_enrollments.student_id', $student->id)
            ->select(
                'subjects.id',
                'subjects.subject_code',
                'subjects.subject_name',
                'subjects.description',
                DB::raw('COALESCE(student_grades.semester_grade, student_grades.final_grade, student_grades.prefinal_grade, student_grades.midterm_grade, student_grades.prelim_grade, shs_student_grades.final_grade) as grade'),
                'student_subject_enrollments.academic_year',
                'student_subject_enrollments.semester'
            )
            ->distinct()
            ->get();

        \Log::info('Completed subjects for student '.$student->id.':', ['subjects' => $completedSubjects->toArray()]);

        // Check for existing credited subjects from student_credit_transfers table
        $existingCredits = StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get();

        // Check for existing credited subjects from student_subject_credits table
        $existingSubjectCredits = StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get();

        \Log::info('Existing credit transfers:', ['count' => $existingCredits->count(), 'credits' => $existingCredits->toArray()]);
        \Log::info('Existing subject credits:', ['count' => $existingSubjectCredits->count(), 'credits' => $existingSubjectCredits->toArray()]);

        // Merge all credited subjects into a unified collection
        $allCreditedSubjects = collect();

        // Add from credit transfers
        foreach ($existingCredits as $credit) {
            $allCreditedSubjects->push((object) [
                'id' => $credit->subject_id,
                'subject_code' => $credit->subject_code,
                'subject_name' => $credit->subject_name,
                'grade' => $credit->verified_semester_grade ?? 75, // Use verified grade or default
                'source' => 'credit_transfer',
            ]);
        }

        // Add from subject credits
        foreach ($existingSubjectCredits as $credit) {
            $allCreditedSubjects->push((object) [
                'id' => $credit->subject_id,
                'subject_code' => $credit->subject_code,
                'subject_name' => $credit->subject_name,
                'grade' => $credit->final_grade ?? 75,
                'source' => 'subject_credit',
            ]);
        }

        // Merge with completed subjects from grades
        foreach ($completedSubjects as $completed) {
            // Attach source/flags and normalize grade
            $gradeVal = is_null($completed->grade) ? null : (float) $completed->grade;
            $completed->source = $completed->source ?? 'grade';
            $completed->passed = is_numeric($gradeVal) ? ($gradeVal >= 75) : false;
            $completed->is_partial = ($completed->source === 'grade' && $gradeVal !== null && $gradeVal < 100 && $gradeVal !== ($completed->semester ?? null));

            // Check if not already in credited subjects (by code)
            if (! $allCreditedSubjects->contains(function ($credit) use ($completed) {
                return strtoupper($credit->subject_code) === strtoupper($completed->subject_code);
            })) {
                $allCreditedSubjects->push($completed);
            }
        }

        \Log::info('Total credited/completed subjects for matching:', ['count' => $allCreditedSubjects->count()]);

        // Get new curriculum subjects
        $newCurriculumSubjects = CurriculumSubject::where('curriculum_id', $newCurriculumId)
            ->with('subject')
            ->get();

        \Log::info('Fetched curriculum subjects:', [
            'curriculum_id' => $newCurriculumId,
            'curriculum_name' => $newCurriculum->curriculum_name,
            'total_subjects' => $newCurriculumSubjects->count(),
            'first_3_subjects' => $newCurriculumSubjects->take(3)->map(function ($cs) {
                return [
                    'subject_code' => $cs->subject->subject_code,
                    'subject_name' => $cs->subject->subject_name,
                ];
            })->toArray(),
        ]);

        $newCurriculumSubjects = $newCurriculumSubjects->map(function ($cs) {
            return [
                'id' => $cs->subject->id,
                'subject_code' => $cs->subject->subject_code,
                'subject_name' => $cs->subject->subject_name,
                'description' => $cs->subject->description,
                'year_level' => $cs->year_level,
                'semester' => $cs->semester,
                'units' => $cs->subject->units ?? 3,
            ];
        })->toArray(); // Convert Collection to array

        // Match subjects
        $credited = [];
        $similar = [];
        $newSubjects = [];
        $newSubjectIds = [];

        \Log::info('Starting subject matching with '.$allCreditedSubjects->count().' completed subjects');
        \Log::info('New curriculum has '.count($newCurriculumSubjects).' subjects');

        \Log::info('All credited/completed subjects for matching:', [
            'count' => $allCreditedSubjects->count(),
            'subjects' => $allCreditedSubjects->map(fn ($s) => $s->subject_code)->toArray(),
        ]);
        \Log::info('New curriculum subjects:', [
            'count' => count($newCurriculumSubjects),
            'subjects' => array_slice(array_map(fn ($s) => $s['subject_code'], $newCurriculumSubjects), 0, 10),
        ]);

        foreach ($newCurriculumSubjects as $newSubject) {
            $matched = false;

            foreach ($allCreditedSubjects as $completedSubject) {
                $gradeVal = isset($completedSubject->grade) ? (float) $completedSubject->grade : null;

                // Exact match by subject code
                if (strtoupper($completedSubject->subject_code) === strtoupper($newSubject['subject_code'])) {
                    \Log::info('Match found: '.$completedSubject->subject_code.' = '.$newSubject['subject_code']);

                    $isAutoCreditable = ($completedSubject->source !== 'grade' && in_array($completedSubject->source, ['credit_transfer','subject_credit'])) || ($gradeVal !== null && $gradeVal >= 75);

                    $credited[] = [
                        'old_subject' => [
                            'id' => $completedSubject->id,
                            'subject_code' => $completedSubject->subject_code,
                            'subject_name' => $completedSubject->subject_name,
                        ],
                        'new_subject' => $newSubject,
                        'grade' => is_numeric($gradeVal) ? number_format($gradeVal, 2) : null,
                        'match_reason' => 'Exact code match',
                        'is_partial' => $completedSubject->is_partial ?? false,
                        'auto_credit' => $isAutoCreditable,
                        'requires_review' => ! $isAutoCreditable,
                    ];

                    if (! $isAutoCreditable) {
                        $similar[] = [
                            'old_subject' => [
                                'id' => $completedSubject->id,
                                'subject_code' => $completedSubject->subject_code,
                                'subject_name' => $completedSubject->subject_name,
                            ],
                            'new_subject' => $newSubject,
                            'grade' => is_numeric($gradeVal) ? number_format($gradeVal, 2) : null,
                            'note' => 'Matched but grade incomplete or below passing — requires review',
                        ];
                    }

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
                        if ($completedSubject->source !== 'grade' || ($gradeVal !== null && $gradeVal >= 75)) {
                            $similar[] = [
                                'old_subject' => [
                                    'id' => $completedSubject->id,
                                    'subject_code' => $completedSubject->subject_code,
                                    'subject_name' => $completedSubject->subject_name,
                                ],
                                'new_subject' => $newSubject,
                                'grade' => is_numeric($gradeVal) ? number_format($gradeVal, 2) : null,
                                'similarity_score' => round($percent, 0),
                            ];
                        }

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
                    if ($completedSubject->source !== 'grade' || ($gradeVal !== null && $gradeVal >= 75)) {
                        $similar[] = [
                            'old_subject' => [
                                'id' => $completedSubject->id,
                                'subject_code' => $completedSubject->subject_code,
                                'subject_name' => $completedSubject->subject_name,
                            ],
                            'new_subject' => $newSubject,
                            'grade' => is_numeric($gradeVal) ? number_format($gradeVal, 2) : null,
                            'similarity_score' => round($nameSimilarity, 0),
                        ];
                    }

                    $matched = true;
                    $newSubjectIds[] = $newSubject['id'];
                    break;
                }
            }

            if (! $matched) {
                $newSubjects[] = $newSubject;
            }
        }

        \Log::info('Final credited subjects count: '.count($credited));

        return response()->json([
            'old_program' => $oldProgram->program_name,
            'old_program_code' => $oldProgram->program_code,
            'new_program' => $newProgram->program_name,
            'new_program_code' => $newProgram->program_code,
            'completed_subjects' => $allCreditedSubjects->map(fn ($s) => [
                'subject_code' => $s->subject_code,
                'subject_name' => $s->subject_name,
                'grade' => number_format($s->grade, 2),
                'source' => $s->source ?? 'grade',
            ])->toArray(),
            'credited_subjects' => $credited,
            'similar_subjects' => $similar,
            'new_subjects' => $newSubjects,
            'all_new_subjects' => $newCurriculumSubjects, // Already an array from line 158
            'summary' => [
                'total_completed' => $completedSubjects->count(),
                'will_be_credited' => count($credited),
                'needs_review' => count($similar),
                'new_to_take' => count($newSubjects),
            ],
        ]);
    }
}
