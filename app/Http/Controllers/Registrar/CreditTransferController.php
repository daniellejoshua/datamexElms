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
            'student_id' => 'nullable|exists:students,id', // For existing shiftees
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
            $feeAdjustments = [
                'credits' => 0,
                'catchup' => 0,
                'total' => 0,
            ];

            $studentYearLevel = $request->student_year_level;

            // Get student's completed subjects if student_id is provided (for existing shiftees)
            // This should match what Academic History shows
            $studentCompletedSubjects = collect();
            if ($request->student_id) {
                $student = Student::find($request->student_id);
                if ($student) {
                    // Get completed subjects from StudentSubjectCredit (credited subjects)
                    $creditedSubjectsQuery = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
                        ->where('credit_status', 'credited')
                        ->whereHas('subject')
                        ->with('subject')
                        ->get()
                        ->map(function ($credit) {
                            return [
                                'subject_id' => $credit->subject_id,
                                'subject_code' => $credit->subject->subject_code,
                                'subject_name' => $credit->subject->subject_name,
                                'final_grade' => $credit->final_grade,
                                'units' => $credit->units,
                            ];
                        });

                    // Get completed subjects from StudentCreditTransfer (credit transfers)
                    $creditTransfersQuery = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
                        ->where('credit_status', 'credited')
                        ->whereHas('subject')
                        ->with('subject')
                        ->get()
                        ->map(function ($transfer) {
                            return [
                                'subject_id' => $transfer->subject_id,
                                'subject_code' => $transfer->subject->subject_code,
                                'subject_name' => $transfer->subject->subject_name,
                                'final_grade' => $transfer->grade ?? 'PASSED',
                                'units' => $transfer->units ?? 3,
                            ];
                        });

                    // Get completed subjects from StudentGrade (graded subjects with final grades)
                    $gradedSubjectsQuery = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    })
                        ->whereNotNull('final_grade')
                        ->with('sectionSubject.subject')
                        ->get()
                        ->filter(function ($grade) {
                            return $grade->sectionSubject && $grade->sectionSubject->subject;
                        })
                        ->map(function ($grade) {
                            return [
                                'subject_id' => $grade->sectionSubject->subject_id,
                                'subject_code' => $grade->sectionSubject->subject->subject_code,
                                'subject_name' => $grade->sectionSubject->subject->subject_name,
                                'final_grade' => $grade->final_grade,
                                'units' => $grade->sectionSubject->subject->units ?? 3,
                            ];
                        });

                    // Combine all sources (same as Academic History)
                    $studentCompletedSubjects = $creditedSubjectsQuery
                        ->concat($creditTransfersQuery)
                        ->concat($gradedSubjectsQuery)
                        ->unique('subject_code'); // Remove duplicates by subject code
                }
            }

            // For shiftees: Find transferred subjects and catch-up subjects
            if ($request->previous_program_id && $previousSubjects->isNotEmpty() && $request->student_id) {
                // Get list of subjects student has completed
                foreach ($studentCompletedSubjects as $completed) {
                    // Check if this completed subject exists in new curriculum
                    // Prioritize name matching since same subjects often have different codes across programs
                    $matchingNewSubject = $newSubjects->first(function ($newSubject) use ($completed) {
                        $newName = strtolower(trim($newSubject->subject_name));
                        $completedName = strtolower(trim($completed['subject_name']));
                        // Remove spaces from codes for comparison (e.g., "PE 3" vs "PE3")
                        $newCode = strtolower(str_replace(' ', '', trim($newSubject->subject_code)));
                        $completedCode = strtolower(str_replace(' ', '', trim($completed['subject_code'])));

                        // Match by name (exact match) - most reliable since codes differ across programs
                        if ($newName === $completedName) {
                            return true;
                        }

                        // Match by code (exact match, ignoring spaces) - secondary check
                        if ($newCode === $completedCode) {
                            return true;
                        }

                        return false;
                    });

                    // If exists in new curriculum, it will be transferred (regardless of year/semester)
                    if ($matchingNewSubject) {
                        // Avoid duplicates
                        $alreadyAdded = collect($creditedSubjects)->contains(function ($credited) use ($matchingNewSubject) {
                            return $credited['subject_id'] === $matchingNewSubject->subject_id;
                        });

                        if (! $alreadyAdded) {
                            $creditedSubjects[] = [
                                'subject_id' => $matchingNewSubject->subject_id,
                                'subject_code' => $matchingNewSubject->subject_code,
                                'subject_name' => $matchingNewSubject->subject_name,
                                'units' => $matchingNewSubject->units,
                                'year_level' => $matchingNewSubject->year_level,
                                'semester' => $matchingNewSubject->semester,
                                'grade' => $completed['final_grade'],
                                'old_subject_code' => $completed['subject_code'], // Show the old code for reference
                            ];
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
                        ];
                    }
                }
            }

            // For shiftees, package the data without fee adjustments
            // Irregular student fees are calculated based on actual enrolled subjects per semester

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
                // Find the corresponding curriculum subject in the new curriculum
                $curriculumSubject = \App\Models\CurriculumSubject::where('curriculum_id', $newCurriculum->id)
                    ->where('subject_id', $subject['subject_id'])
                    ->first();

                $creditTransfer = StudentCreditTransfer::create([
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
                    'verified_semester_grade' => $subject['grade'] ?? null,
                    'previous_school' => $subject['previous_school'] ?? $request->previous_school,
                    'approved_by' => auth()->id(),
                    'approved_at' => now(),
                ]);

                // Also create StudentSubjectCredit record for Academic History display
                if ($curriculumSubject) {
                    \App\Models\StudentSubjectCredit::create([
                        'student_id' => $student->id,
                        'curriculum_subject_id' => $curriculumSubject->id,
                        'subject_id' => $subject['subject_id'],
                        'subject_code' => $subject['subject_code'],
                        'subject_name' => $subject['subject_name'],
                        'units' => $subject['units'],
                        'year_level' => $subject['year_level'],
                        'semester' => $subject['semester'],
                        'credit_type' => 'transfer',
                        'credit_status' => 'credited',
                        'final_grade' => $subject['grade'] ?? null,
                        'credited_at' => now(),
                        'student_credit_transfer_id' => $creditTransfer->id,
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
        ]);

        try {
            $credit = StudentCreditTransfer::findOrFail($creditTransferId);

            $oldStatus = $credit->credit_status;
            $newStatus = $request->credit_status;

            $credit->update([
                'credit_status' => $newStatus,
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);

            // If status changed to 'credited', create StudentSubjectCredit record for Academic History
            if ($oldStatus !== 'credited' && $newStatus === 'credited') {
                // Find the corresponding curriculum subject
                $curriculumSubject = \App\Models\CurriculumSubject::where('curriculum_id', $credit->new_curriculum_id)
                    ->where('subject_id', $credit->subject_id)
                    ->first();

                if ($curriculumSubject) {
                    \App\Models\StudentSubjectCredit::create([
                        'student_id' => $credit->student_id,
                        'curriculum_subject_id' => $curriculumSubject->id,
                        'subject_id' => $credit->subject_id,
                        'subject_code' => $credit->subject_code,
                        'subject_name' => $credit->subject_name,
                        'units' => $credit->units,
                        'year_level' => $credit->year_level,
                        'semester' => $credit->semester,
                        'credit_type' => 'transfer',
                        'credit_status' => 'credited',
                        'final_grade' => $credit->verified_semester_grade,
                        'credited_at' => now(),
                        'student_credit_transfer_id' => $credit->id,
                        'approved_by' => auth()->id(),
                        'approved_at' => now(),
                    ]);
                }
            }

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

    /**
     * Update the verified semester grade for a credit transfer
     */
    public function updateCreditGrade(Request $request, $creditTransferId)
    {
        $request->validate([
            'verified_semester_grade' => 'required|string|max:10',
        ]);

        try {
            $credit = StudentCreditTransfer::findOrFail($creditTransferId);

            $credit->update([
                'verified_semester_grade' => $request->verified_semester_grade,
                'updated_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Credit grade updated successfully',
                'data' => $credit,
            ]);

        } catch (\Exception $e) {
            Log::error('Update credit grade error: '.$e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to update credit grade',
            ], 500);
        }
    }
}
