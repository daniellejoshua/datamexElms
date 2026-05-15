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

            // For transferees, check if there's a specific year level curriculum guide
            $targetCurriculum = null;

            if (! $request->previous_program_id) {
                $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();

                $yearLevelGuide = \App\Models\YearLevelCurriculumGuide::where('program_id', $request->new_program_id)
                    ->where('year_level', $request->student_year_level)
                    ->where('academic_year', $currentAcademicYear)
                    ->with('curriculum')
                    ->first();

                \Log::info('Credit Transfer Debug - Transferee curriculum selection', [
                    'program_id' => $request->new_program_id,
                    'year_level' => $request->student_year_level,
                    'academic_year' => $currentAcademicYear,
                    'year_level_guide_found' => $yearLevelGuide ? true : false,
                    'guide_curriculum' => $yearLevelGuide && $yearLevelGuide->curriculum ? $yearLevelGuide->curriculum->curriculum_name : null,
                ]);

                if ($yearLevelGuide && $yearLevelGuide->curriculum) {
                    // Check if the guide curriculum has subjects
                    $subjectCount = \App\Models\CurriculumSubject::where('curriculum_id', $yearLevelGuide->curriculum->id)->count();

                    \Log::info('Credit Transfer Debug - Guide curriculum validation', [
                        'guide_curriculum_id' => $yearLevelGuide->curriculum->id,
                        'guide_curriculum_name' => $yearLevelGuide->curriculum->curriculum_name,
                        'subject_count' => $subjectCount,
                        'will_use_guide' => $subjectCount > 0,
                    ]);

                    if ($subjectCount > 0) {
                        $targetCurriculum = $yearLevelGuide->curriculum;
                    }
                }
            }

            // Get current curriculum for new program if no valid year level guide exists
            if (! $targetCurriculum) {
                $targetCurriculum = $newProgram->curriculums()->where('is_current', true)->first();

                \Log::info('Credit Transfer Debug - Using fallback curriculum', [
                    'fallback_curriculum_id' => $targetCurriculum->id,
                    'fallback_curriculum_name' => $targetCurriculum->curriculum_name,
                    'reason' => ! $request->previous_program_id ? 'no_valid_year_level_guide' : 'shiftee',
                ]);
            } else {
                \Log::info('Credit Transfer Debug - Using year level guide curriculum', [
                    'selected_curriculum_id' => $targetCurriculum->id,
                    'selected_curriculum_name' => $targetCurriculum->curriculum_name,
                ]);
            }

            if (! $targetCurriculum) {
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

            // Get all subjects from target curriculum (either year level guide or current curriculum)
            $newSubjects = CurriculumSubject::where('curriculum_id', $targetCurriculum->id)
                ->with('subject')
                ->orderBy('year_level')
                ->orderBy('semester')
                ->get();

            \Log::info('Credit Transfer Debug - Final subject loading', [
                'target_curriculum_id' => $targetCurriculum->id,
                'target_curriculum_name' => $targetCurriculum->curriculum_name,
                'total_subjects_loaded' => $newSubjects->count(),
                'is_transferee' => ! $request->previous_program_id,
            ]);

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
                                'source' => 'subject_credit',
                                'passed' => is_numeric($credit->final_grade) ? ($credit->final_grade >= 75) : true,
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
                                'source' => 'credit_transfer',
                                'passed' => is_numeric($transfer->grade) ? ($transfer->grade >= 75) : true,
                            ];
                        });

                    // Get completed subjects from StudentGrade (graded subjects with final grades)
                    $gradedSubjectsQuery = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
                        $query->where('student_id', $student->id);
                    })
                        // include partial grading records (prelim/midterm/prefinal/final/semester)
                        ->where(function ($q) {
                            $q->whereNotNull('prelim_grade')
                                ->orWhereNotNull('midterm_grade')
                                ->orWhereNotNull('prefinal_grade')
                                ->orWhereNotNull('final_grade')
                                ->orWhereNotNull('semester_grade');
                        })
                        ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
                        ->get()
                        ->filter(function ($grade) {
                            return $grade->sectionSubject && $grade->sectionSubject->subject;
                        })
                        ->map(function ($grade) {
                            // best available grade (prefer semester/final then prefinal/midterm/prelim)
                            $best = $grade->semester_grade ?? $grade->final_grade ?? $grade->prefinal_grade ?? $grade->midterm_grade ?? $grade->prelim_grade;

                            // gather teacher name if available
                            $teacherName = null;
                            if ($grade->sectionSubject && $grade->sectionSubject->teacher && $grade->sectionSubject->teacher->user) {
                                $teacherName = $grade->sectionSubject->teacher->user->name;
                            }

                            return [
                                'subject_id' => $grade->sectionSubject->subject_id,
                                'subject_code' => $grade->sectionSubject->subject->subject_code,
                                'subject_name' => $grade->sectionSubject->subject->subject_name,
                                'final_grade' => $best,
                                'units' => $grade->sectionSubject->subject->units ?? 3,
                                'source' => 'grade',
                                'is_partial' => is_null($grade->final_grade) && is_null($grade->semester_grade) && ($grade->prelim_grade || $grade->midterm_grade || $grade->prefinal_grade),
                                'passed' => is_numeric($best) ? ($best >= 75) : false,
                                'teacher_name' => $teacherName,
                            ];
                        });

                    // Combine all sources (same as Academic History)
                    $studentCompletedSubjects = $creditedSubjectsQuery
                        ->concat($creditTransfersQuery)
                        ->concat($gradedSubjectsQuery);

                    // also merge any archived grades (teacher info may live here)
                    $archivedSubjectsQuery = \App\Models\ArchivedStudentSubject::where('student_id', $student->id)
                        ->whereNotNull('final_grade')
                        ->with('teacher.user')
                        ->get()
                        ->map(function ($s) {
                            return [
                                'subject_id' => $s->subject_id,
                                'subject_code' => $s->subject_code,
                                'subject_name' => $s->subject_name,
                                'final_grade' => $s->final_grade,
                                'units' => $s->units,
                                'source' => 'archived',
                                'archived_student_subject_id' => $s->id,
                                'is_partial' => false,
                                'passed' => is_numeric($s->final_grade) ? ($s->final_grade >= 75) : true,
                                'teacher_name' => $s->teacher?->user?->name,
                            ];
                        });

                    $studentCompletedSubjects = $studentCompletedSubjects->concat($archivedSubjectsQuery);

                    // Also include active student subject enrollments (no dropped enrollments)
                    $enrolledSubjects = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)
                        ->where('status', '!=', 'dropped')
                        ->with('sectionSubject.subject')
                        ->get()
                        ->map(function ($se) {
                            return [
                                'subject_id' => $se->sectionSubject->subject_id ?? null,
                                'subject_code' => $se->sectionSubject->subject?->subject_code ?? null,
                                'subject_name' => $se->sectionSubject->subject?->subject_name ?? null,
                                'final_grade' => null,
                                'units' => $se->sectionSubject->subject?->units ?? 3,
                                'source' => 'enrolled',
                                'is_partial' => true,
                                'passed' => false,
                            ];
                        });

                    $studentCompletedSubjects = $studentCompletedSubjects->concat($enrolledSubjects)
                        ->unique('subject_code'); // Remove duplicates by subject code

                    // simplified list of completed codes/names for debugging
                    $simplifiedCompleted = $studentCompletedSubjects->map(fn ($c) => [
                        'subject_code' => $c['subject_code'] ?? null,
                        'subject_name' => $c['subject_name'] ?? null, // original name from credit record
                    ])->unique()->values()->toArray();
                }
            }

            // For shiftees: Find transferred subjects and catch-up subjects
            if ($request->previous_program_id && $previousSubjects->isNotEmpty() && $request->student_id) {
                // prepare a set of subject codes from the old curriculum.  earlier
                // logic limited this to "minor" courses only, but it turns out shiftees
                // expect all completed subjects to carry over (including majors) so
                // we'll stop filtering by subject_type here.
                $minorCodes = $previousSubjects->pluck('subject_code')
                    ->map(fn ($c) => strtolower(preg_replace('/[^A-Za-z0-9]/', '', $c)))
                    ->unique()
                    ->toArray();

                // Get list of subjects student has completed
                foreach ($studentCompletedSubjects as $completed) {
                    // if the completed record has a code and it's not one of the minors,
                    // skip it entirely; this prevents majors from being matched by fuzzy
                    // logic later
                    $compCodeNorm = strtolower(preg_replace('/[^A-Za-z0-9]/', '', (string) ($completed['subject_code'] ?? '')));
                    if ($compCodeNorm !== '' && ! in_array($compCodeNorm, $minorCodes, true)) {
                        continue;
                    }
                    // Check if this completed subject exists in new curriculum
                    // Use a more flexible matching strategy (name fuzzy/token/code numeric checks)
                    $matchingNewSubject = $newSubjects->first(function ($newSubject) use ($completed) {
                        $normalize = fn ($s) => strtolower(trim(preg_replace('/\s+/', ' ', preg_replace('/[^A-Za-z0-9 ]+/', ' ', (string) $s))));

                        $newName = $normalize($newSubject->subject_name);
                        $completedName = $normalize($completed['subject_name']);

                        // Normalized codes (remove non-alphanumeric)
                        $normalizeCode = fn ($c) => strtolower(preg_replace('/[^A-Za-z0-9]/', '', (string) $c));
                        $newCode = $normalizeCode($newSubject->subject_code);
                        $completedCode = $normalizeCode($completed['subject_code']);

                        // 1) Exact name or exact code (fast path)
                        if ($newName === $completedName || $newCode === $completedCode) {
                            return true;
                        }

                        // 2) Numeric-code match (e.g. MATH101 vs MATH-101A) — compare digits only but
                        // require alphabetic prefix to match as well to avoid cases like PE4/THC4.
                        $digits = fn ($s) => preg_replace('/[^0-9]/', '', $s);
                        $letters = fn ($s) => preg_replace('/[^A-Za-z]/', '', $s);
                        if ($digits($newCode) !== '' && $digits($newCode) === $digits($completedCode)) {
                            if (strtolower($letters($newCode)) === strtolower($letters($completedCode))) {
                                return true;
                            }
                        }

                        // before we attempt fuzzy name logic, make sure the numeric portion of
                        // the names themselves matches. this stops "NSTP 2" from being treated
                        // as a token overlap with "NSTP 1" even though all other words line up.
                        $numericInName = fn ($s) => preg_replace('/[^0-9]/', '', $s);
                        if ($numericInName($newName) !== '' && $numericInName($completedName) !== ''
                            && $numericInName($newName) !== $numericInName($completedName)) {
                            return false;
                        }

                        // 3) Token overlap (Jaccard-like) — handles name variants
                        $tokens = fn ($s) => array_values(array_filter(array_map(fn ($t) => trim($t), preg_split('/\s+/', $s))));
                        $newTokens = $tokens($newName);
                        $oldTokens = $tokens($completedName);
                        if (! empty($newTokens) && ! empty($oldTokens)) {
                            $intersection = count(array_intersect($newTokens, $oldTokens));
                            $union = count(array_unique(array_merge($newTokens, $oldTokens)));
                            $overlap = $union > 0 ? $intersection / $union : 0;

                            if ($overlap >= 0.6) {
                                return true;
                            }
                        }

                        // 4) Fuzzy name similarity using similar_text percentage
                        similar_text($newName, $completedName, $percent);
                        if ($percent >= 78) { // permissive threshold to catch common variants
                            return true;
                        }

                        return false;
                    });

                    // If exists in new curriculum, it will be transferred (regardless of year/semester)
                    if ($matchingNewSubject) {
                        // Decide if this completed record is creditable (credit records always credit; grades need to be passing)
                        $completedGrade = $completed['final_grade'] ?? null;
                        $source = $completed['source'] ?? 'grade';

                        // Only auto-credit previously approved credits (credit_transfer/subject_credit) or numeric passing grades
                        $isAutoCreditable = in_array($source, ['credit_transfer', 'subject_credit']) || (is_numeric($completedGrade) && floatval($completedGrade) >= 75);

                        // Avoid exact duplicates; however, if the same new subject is matched
                        // from two different old subject codes we still want both entries so the
                        // registrar can review them separately.
                        $alreadyAdded = collect($creditedSubjects)->contains(function ($credited) use ($matchingNewSubject, $completed) {
                            return $credited['subject_id'] === $matchingNewSubject->subject_id
                                && ($credited['old_subject_code'] ?? null) === ($completed['subject_code'] ?? null);
                        });

                        // Always add matched subject as a candidate; mark whether it's auto-creditable or requires review
                        if (! $alreadyAdded) {
                            $creditedSubjects[] = [
                                'subject_id' => $matchingNewSubject->subject_id,
                                'subject_code' => $matchingNewSubject->subject_code,
                                'subject_name' => $matchingNewSubject->subject_name,
                                'units' => $matchingNewSubject->units,
                                'year_level' => $matchingNewSubject->year_level,
                                'semester' => $matchingNewSubject->semester,
                                'grade' => $completedGrade,
                                'is_partial' => ($completed['source'] === 'grade' && ($completed['is_partial'] ?? false)) || ($completed['source'] === 'enrolled'),
                                'old_subject_code' => is_string($completed['subject_code']) ? trim($completed['subject_code']) : null,
                                'old_subject_name' => is_string($completed['subject_name']) ? trim($completed['subject_name']) : null,
                                'teacher_name' => $completed['teacher_name'] ?? null,
                                'match_reason' => ($completed['source'] !== 'grade' && $completed['source'] !== 'enrolled') ? 'Existing credit' : 'Matched by name/code',
                                'auto_credit' => $isAutoCreditable,
                                'requires_review' => ! $isAutoCreditable,
                            ];
                        }

                        // If not auto-creditable and the source is grade/enrolled, mark in similar for visibility too
                        if (! $isAutoCreditable) {
                            $similar[] = [
                                'old_subject' => [
                                    'subject_code' => $completed['subject_code'] ?? null,
                                    'subject_name' => is_string($completed['subject_name']) ? trim($completed['subject_name']) : null,
                                ],
                                'new_subject' => $matchingNewSubject,
                                'grade' => $completedGrade,
                                'note' => 'Matched but requires manual review (partial grade or enrollment only)',
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
                            'original_subject_code' => is_string($externalCredit['subject_code']) ? trim($externalCredit['subject_code']) : null,
                            'original_subject_name' => is_string($externalCredit['subject_name']) ? trim($externalCredit['subject_name']) : null,
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
                'message' => "Curriculum comparison completed successfully using {$targetCurriculum->curriculum_code}",
                'data' => [
                    'new_program' => [
                        'id' => $newProgram->id,
                        'name' => $newProgram->program_name,
                        'code' => $newProgram->program_code,
                        'curriculum' => [
                            'id' => $targetCurriculum->id,
                            'name' => $targetCurriculum->curriculum_name,
                            'code' => $targetCurriculum->curriculum_code,
                            'subjects' => $allNewSubjects, // All subjects for transferee/shiftee to check
                        ],
                    ],
                    'credited_subjects' => $creditedSubjects,
                    'completed_subjects' => $simplifiedCompleted ?? [],
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
                        'archived_student_subject_id' => $subject['archived_student_subject_id'] ?? null,
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
