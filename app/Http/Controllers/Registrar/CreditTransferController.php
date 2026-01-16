<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\Curriculum;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentCreditTransfer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CreditTransferController extends Controller
{
    /**
     * Compare curricula between two programs for shiftees
     */
    public function compareCurricula(Request $request)
    {
        $request->validate([
            'previous_program_id' => 'nullable|exists:programs,id', // Optional for transferees
            'new_program_id' => 'required|exists:programs,id',
            'student_year_level' => 'required|integer',
            'credited_subjects' => 'nullable|array', // For transferees
            'previous_school' => 'nullable|string', // For transferees
        ]);

        try {
            $newProgram = Program::with('curriculums')->findOrFail($request->new_program_id);

            // Get current curriculum for new program
            $newCurriculum = $newProgram->curriculums()->where('is_current', true)->first();

            if (! $newCurriculum) {
                return response()->json([
                    'success' => false,
                    'message' => 'The new program does not have an active curriculum assigned.',
                ], 404);
            }

            // Initialize variables
            $previousSubjects = collect();
            $previousCurriculum = null;

            // Only load previous program data for shiftees
            if ($request->previous_program_id) {
                $previousProgram = Program::with('curriculums')->findOrFail($request->previous_program_id);
                $previousCurriculum = $previousProgram->curriculums()->where('is_current', true)->first();

                if (! $previousCurriculum) {
                    return response()->json([
                        'success' => false,
                        'message' => 'The previous program does not have an active curriculum assigned.',
                    ], 404);
                }

                // Get all subjects from previous curriculum
                $previousSubjects = CurriculumSubject::where('curriculum_id', $previousCurriculum->id)
                    ->with('subject')
                    ->orderBy('year_level')
                    ->orderBy('semester')
                    ->get();
            }

            // Get all subjects from new curriculum
            $newSubjects = CurriculumSubject::where('curriculum_id', $newCurriculum->id)
                ->with('subject')
                ->orderBy('year_level')
                ->orderBy('semester')
                ->get();

            // Determine credited subjects and subjects to catch up
            $creditedSubjects = [];
            $subjectsToCatchUp = [];
            $feeAdjustments = [
                'credits' => 0,
                'catchup' => 0,
                'total' => 0,
            ];

            $studentYearLevel = $request->student_year_level;

            // For shiftees: Check which subjects they've already taken (only if previous_program_id exists)
            if ($request->previous_program_id && $previousSubjects->isNotEmpty()) {
                foreach ($newSubjects as $newSubject) {
                    // Check if this subject exists in the previous curriculum
                    $matchingPreviousSubject = $previousSubjects->first(function ($prevSubject) use ($newSubject) {
                        // Match by subject code or subject name
                        return $prevSubject->subject_code === $newSubject->subject_code ||
                               strtolower($prevSubject->subject_name) === strtolower($newSubject->subject_name);
                    });

                    if ($matchingPreviousSubject) {
                        // Subject exists in both curricula
                        // Check if student has already taken it based on their current year level
                        $subjectYearLevel = $matchingPreviousSubject->year_level;

                        if ($subjectYearLevel < $studentYearLevel ||
                            ($subjectYearLevel == $studentYearLevel && $matchingPreviousSubject->semester == '1st')) {
                            // Student should have taken this subject already
                            $creditedSubjects[] = [
                                'subject_id' => $newSubject->subject_id,
                                'subject_code' => $newSubject->subject_code,
                                'subject_name' => $newSubject->subject_name,
                                'units' => $newSubject->units,
                                'year_level' => $newSubject->year_level,
                                'semester' => $newSubject->semester,
                                'original_year_level' => $matchingPreviousSubject->year_level,
                                'original_semester' => $matchingPreviousSubject->semester,
                                'fee_adjustment' => -300, // -300 for credited subjects
                            ];
                            $feeAdjustments['credits'] -= 300;
                        }
                    } else {
                        // Subject doesn't exist in previous curriculum
                        // Check if it should have been taken by now
                        if ($newSubject->year_level < $studentYearLevel ||
                            ($newSubject->year_level == $studentYearLevel && $newSubject->semester == '1st')) {
                            // Student needs to catch up this subject
                            $subjectsToCatchUp[] = [
                                'subject_id' => $newSubject->subject_id,
                                'subject_code' => $newSubject->subject_code,
                                'subject_name' => $newSubject->subject_name,
                                'units' => $newSubject->units,
                                'year_level' => $newSubject->year_level,
                                'semester' => $newSubject->semester,
                                'fee_adjustment' => 300, // +300 for catch-up subjects
                            ];
                            $feeAdjustments['catchup'] += 300;
                        }
                    }
                }
            }

            // For transferees: Match credited subjects from external school
            if ($request->has('credited_subjects') && ! empty($request->credited_subjects)) {
                $externalCredits = $request->credited_subjects;

                foreach ($externalCredits as $externalCredit) {
                    $matchingSubject = $newSubjects->first(function ($newSubject) use ($externalCredit) {
                        return strtolower($newSubject->subject_code) === strtolower($externalCredit['subject_code']) ||
                               strtolower($newSubject->subject_name) === strtolower($externalCredit['subject_name']);
                    });

                    if ($matchingSubject) {
                        $creditedSubjects[] = [
                            'subject_id' => $matchingSubject->subject_id,
                            'subject_code' => $matchingSubject->subject_code,
                            'subject_name' => $matchingSubject->subject_name,
                            'units' => $matchingSubject->units,
                            'year_level' => $matchingSubject->year_level,
                            'semester' => $matchingSubject->semester,
                            'original_subject_code' => $externalCredit['subject_code'],
                            'original_subject_name' => $externalCredit['subject_name'],
                            'previous_school' => $externalCredit['previous_school'] ?? null,
                            'fee_adjustment' => -300,
                        ];
                        $feeAdjustments['credits'] -= 300;
                    }
                }

                // Check for subjects that need to be caught up
                foreach ($newSubjects as $newSubject) {
                    if ($newSubject->year_level < $studentYearLevel ||
                        ($newSubject->year_level == $studentYearLevel && $newSubject->semester == '1st')) {

                        // Check if already credited
                        $alreadyCredited = collect($creditedSubjects)->contains(function ($credited) use ($newSubject) {
                            return $credited['subject_id'] === $newSubject->subject_id;
                        });

                        if (! $alreadyCredited) {
                            $subjectsToCatchUp[] = [
                                'subject_id' => $newSubject->subject_id,
                                'subject_code' => $newSubject->subject_code,
                                'subject_name' => $newSubject->subject_name,
                                'units' => $newSubject->units,
                                'year_level' => $newSubject->year_level,
                                'semester' => $newSubject->semester,
                                'fee_adjustment' => 300,
                            ];
                            $feeAdjustments['catchup'] += 300;
                        }
                    }
                }
            }

            $feeAdjustments['total'] = $feeAdjustments['credits'] + $feeAdjustments['catchup'];

            // Prepare all new curriculum subjects for display
            $allNewSubjects = $newSubjects->map(function ($subject) {
                return [
                    'subject_id' => $subject->subject_id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'units' => $subject->units,
                    'year_level' => $subject->year_level,
                    'semester' => $subject->semester,
                ];
            })->toArray();

            $response = [
                'success' => true,
                'data' => [
                    'new_program' => [
                        'id' => $newProgram->id,
                        'name' => $newProgram->program_name,
                        'code' => $newProgram->program_code,
                        'curriculum' => [
                            'id' => $newCurriculum->id,
                            'name' => $newCurriculum->curriculum_name,
                            'code' => $newCurriculum->curriculum_code,
                            'subjects' => $allNewSubjects, // All subjects for transferee to check
                        ],
                    ],
                    'credited_subjects' => $creditedSubjects,
                    'subjects_to_catch_up' => $subjectsToCatchUp,
                    'fee_adjustments' => $feeAdjustments,
                ],
            ];

            // Only include previous_program data for shiftees
            if ($request->previous_program_id && isset($previousProgram) && isset($previousCurriculum)) {
                $response['data']['previous_program'] = [
                    'id' => $previousProgram->id,
                    'name' => $previousProgram->program_name,
                    'code' => $previousProgram->program_code,
                    'curriculum' => [
                        'id' => $previousCurriculum->id,
                        'name' => $previousCurriculum->curriculum_name,
                        'code' => $previousCurriculum->curriculum_code,
                    ],
                ];
            }

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Curriculum comparison error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'An error occurred while comparing curricula: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Save credit transfer records for a student
     */
    public function storeCreditTransfers(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'previous_program_id' => 'nullable|exists:programs,id',
            'new_program_id' => 'required|exists:programs,id',
            'transfer_type' => 'required|in:shiftee,transferee',
            'credited_subjects' => 'required|array',
            'subjects_to_catch_up' => 'nullable|array',
            'previous_school' => 'nullable|string',
        ]);

        try {
            DB::beginTransaction();

            $student = Student::findOrFail($request->student_id);
            $previousProgram = $request->previous_program_id ? Program::find($request->previous_program_id) : null;
            $newProgram = Program::findOrFail($request->new_program_id);

            $previousCurriculum = $previousProgram ? $previousProgram->curriculums()->where('is_current', true)->first() : null;
            $newCurriculum = $newProgram->curriculums()->where('is_current', true)->first();

            // Store credited subjects
            foreach ($request->credited_subjects as $subject) {
                StudentCreditTransfer::create([
                    'student_id' => $student->id,
                    'previous_program_id' => $previousProgram?->id,
                    'new_program_id' => $newProgram->id,
                    'previous_curriculum_id' => $previousCurriculum?->id,
                    'new_curriculum_id' => $newCurriculum->id,
                    'subject_id' => $subject['subject_id'],
                    'subject_code' => $subject['subject_code'],
                    'subject_name' => $subject['subject_name'],
                    'original_subject_code' => $subject['original_subject_code'] ?? null,
                    'original_subject_name' => $subject['original_subject_name'] ?? null,
                    'units' => $subject['units'],
                    'year_level' => $subject['year_level'],
                    'semester' => $subject['semester'],
                    'transfer_type' => $request->transfer_type,
                    'credit_status' => 'credited',
                    'fee_adjustment' => -300,
                    'previous_school' => $subject['previous_school'] ?? $request->previous_school,
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                ]);
            }

            // Store catch-up subjects
            if ($request->has('subjects_to_catch_up')) {
                foreach ($request->subjects_to_catch_up as $subject) {
                    StudentCreditTransfer::create([
                        'student_id' => $student->id,
                        'previous_program_id' => $previousProgram?->id,
                        'new_program_id' => $newProgram->id,
                        'previous_curriculum_id' => $previousCurriculum?->id,
                        'new_curriculum_id' => $newCurriculum->id,
                        'subject_id' => $subject['subject_id'],
                        'subject_code' => $subject['subject_code'],
                        'subject_name' => $subject['subject_name'],
                        'units' => $subject['units'],
                        'year_level' => $subject['year_level'],
                        'semester' => $subject['semester'],
                        'transfer_type' => $request->transfer_type,
                        'credit_status' => 'for_catchup',
                        'fee_adjustment' => 300,
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]);
                }
            }

            // Update student record
            $student->update([
                'previous_program_id' => $previousProgram?->id,
                'program_id' => $newProgram->id,
                'previous_curriculum_id' => $previousCurriculum?->id,
                'curriculum_id' => $newCurriculum->id,
                'course_shifted_at' => now(),
                'student_type' => 'irregular', // Mark as irregular
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Credit transfers saved successfully',
                'data' => [
                    'student_id' => $student->id,
                    'total_credits' => count($request->credited_subjects),
                    'total_catchup' => count($request->subjects_to_catch_up ?? []),
                ],
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Store credit transfers error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to save credit transfers: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get credit transfer details for a student
     */
    public function getStudentCreditTransfers($studentId)
    {
        try {
            $student = Student::with([
                'creditTransfers.subject',
                'creditTransfers.previousProgram',
                'creditTransfers.newProgram',
                'creditTransfers.previousCurriculum',
                'creditTransfers.newCurriculum',
                'creditTransfers.approvedBy',
            ])->findOrFail($studentId);

            $creditedSubjects = $student->creditTransfers()->where('credit_status', 'credited')->get();
            $catchupSubjects = $student->creditTransfers()->where('credit_status', 'for_catchup')->get();

            $totalCreditAdjustment = $creditedSubjects->sum('fee_adjustment');
            $totalCatchupAdjustment = $catchupSubjects->sum('fee_adjustment');

            return response()->json([
                'success' => true,
                'data' => [
                    'student' => $student,
                    'credited_subjects' => $creditedSubjects,
                    'catchup_subjects' => $catchupSubjects,
                    'fee_adjustments' => [
                        'credits' => $totalCreditAdjustment,
                        'catchup' => $totalCatchupAdjustment,
                        'total' => $totalCreditAdjustment + $totalCatchupAdjustment,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Get credit transfers error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve credit transfers',
            ], 500);
        }
    }

    /**
     * Get pending credit transfers that need grade verification
     */
    public function getPendingCredits(Request $request)
    {
        try {
            $query = StudentCreditTransfer::with([
                'student.user',
                'subject',
                'newProgram',
                'approvedBy',
            ])
                ->where('credit_status', 'pending')
                ->orderBy('created_at', 'desc');

            // Filter by student if provided
            if ($request->has('student_id')) {
                $query->where('student_id', $request->student_id);
            }

            // Filter by program if provided
            if ($request->has('program_id')) {
                $query->where('new_program_id', $request->program_id);
            }

            $pendingCredits = $query->paginate(20);

            return response()->json([
                'success' => true,
                'data' => $pendingCredits,
            ]);

        } catch (\Exception $e) {
            Log::error('Get pending credits error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending credits',
            ], 500);
        }
    }

    /**
     * Check if a student has completed grades for a subject
     */
    public function checkGradeCompletion(Request $request)
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        try {
            $studentId = $request->student_id;
            $subjectId = $request->subject_id;

            // Find student enrollments with grades for this subject
            $gradeRecords = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($studentId) {
                $query->where('student_id', $studentId);
            })
                ->whereHas('sectionSubject', function ($query) use ($subjectId) {
                    $query->where('subject_id', $subjectId);
                })
                ->get();

            $hasCompletedGrades = false;
            $semesterGrade = null;
            $gradingPeriods = [];

            foreach ($gradeRecords as $grade) {
                $gradingPeriods = [
                    'prelim' => $grade->prelim_grade,
                    'midterm' => $grade->midterm_grade,
                    'prefinal' => $grade->prefinal_grade,
                    'final' => $grade->final_grade,
                    'semester' => $grade->semester_grade,
                ];

                if ($grade->prelim_grade && $grade->midterm_grade &&
                    $grade->prefinal_grade && $grade->final_grade &&
                    $grade->semester_grade) {
                    $hasCompletedGrades = true;
                    $semesterGrade = $grade->semester_grade;
                    break;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'has_completed_grades' => $hasCompletedGrades,
                    'semester_grade' => $semesterGrade,
                    'grading_periods' => $gradingPeriods,
                    'passed' => $semesterGrade >= 60,
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Check grade completion error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to check grade completion',
            ], 500);
        }
    }

    /**
     * Manually approve or reject a credit transfer
     */
    public function updateCreditStatus(Request $request, $creditTransferId)
    {
        $request->validate([
            'credit_status' => 'required|in:credited,rejected,pending',
            'rejection_reason' => 'required_if:credit_status,rejected',
        ]);

        try {
            $credit = StudentCreditTransfer::findOrFail($creditTransferId);

            $credit->update([
                'credit_status' => $request->credit_status,
                'rejection_reason' => $request->rejection_reason ?? null,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Credit status updated successfully',
                'data' => $credit,
            ]);

        } catch (\Exception $e) {
            Log::error('Update credit status error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update credit status',
            ], 500);
        }
    }
}
