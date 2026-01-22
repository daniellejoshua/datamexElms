<?php

namespace App\Http\Controllers;

use App\Models\ArchivedStudent;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Curriculum;
use App\Models\PaymentTransaction;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSemesterPayment;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class RegistrarController extends Controller
{
    /**
     * Show the registrar dashboard.
     */
    public function dashboard(): Response
    {
        $stats = Cache::remember('registrar.dashboard.stats', 300, function () { // Cache for 5 minutes
            $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
            $currentSemester = SchoolSetting::getCurrentSemester();

            return [
                'total_students' => Student::whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'active_students' => Student::whereHas('user', function ($query) {
                    $query->where('is_active', true);
                })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'college_students' => Student::whereHas('program', function ($query) {
                    $query->where('education_level', 'college');
                })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'shs_students' => Student::whereHas('program', function ($query) {
                    $query->where('education_level', 'senior_high');
                })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'active_college_students' => Student::whereHas('user', function ($query) {
                    $query->where('is_active', true);
                })->whereHas('program', function ($query) {
                    $query->where('education_level', 'college');
                })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'active_shs_students' => Student::whereHas('user', function ($query) {
                    $query->where('is_active', true);
                })->whereHas('program', function ($query) {
                    $query->where('education_level', 'senior_high');
                })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
                'regular_students' => Student::where('student_type', 'regular')
                    ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                        $query->where('academic_year', $currentAcademicYear)
                            ->where('semester', $currentSemester)
                            ->where('status', 'active');
                    })->count(),
                'irregular_students' => Student::where('student_type', 'irregular')
                    ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                        $query->where('academic_year', $currentAcademicYear)
                            ->where('semester', $currentSemester)
                            ->where('status', 'active');
                    })->count(),
                'total_teachers' => Teacher::count(),
                'active_teachers' => Teacher::where('status', 'active')->count(),
                'total_sections' => Section::count(),
                'programs' => Program::where('status', 'active')
                    ->withCount(['students' => function ($query) use ($currentAcademicYear, $currentSemester) {
                        $query->whereHas('user', function ($userQuery) {
                            $userQuery->where('is_active', true);
                        })->whereHas('studentEnrollments', function ($enrollmentQuery) use ($currentAcademicYear, $currentSemester) {
                            $enrollmentQuery->where('academic_year', $currentAcademicYear)
                                ->where('semester', $currentSemester)
                                ->where('status', 'active');
                        });
                    }])
                    ->get()
                    ->map(function ($program) {
                        return [
                            'id' => $program->id,
                            'program_code' => $program->program_code,
                            'program_name' => $program->program_name,
                            'education_level' => $program->education_level,
                            'track' => $program->track,
                            'student_count' => $program->students_count,
                        ];
                    })
                    ->groupBy('education_level'),
                'kpi_trends' => $this->getKpiTrends(),
                'payment_stats' => [
                    'total_paid' => PaymentTransaction::where('status', 'completed')
                        ->whereHas('student.studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                            $query->where('academic_year', $currentAcademicYear)
                                ->where('semester', $currentSemester)
                                ->where('status', 'active');
                        })
                        ->sum('amount'),
                    'recent_payments' => PaymentTransaction::where('status', 'completed')
                        ->where('payment_date', '>=', now()->subDays(7))
                        ->whereHas('student.studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                            $query->where('academic_year', $currentAcademicYear)
                                ->where('semester', $currentSemester)
                                ->where('status', 'active');
                        })
                        ->count(),
                    'pending_payments' => Student::whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                        $query->where('academic_year', $currentAcademicYear)
                            ->where('semester', $currentSemester)
                            ->where('status', 'active');
                    })->whereDoesntHave('paymentTransactions', function ($query) {
                        $query->where('status', 'completed')
                            ->where('payment_date', '>=', now()->startOfYear());
                    })->count(),
                ],
                'enrollment_alerts' => [
                    'incomplete_enrollments' => StudentEnrollment::where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'pending')
                        ->count(),
                    'recent_enrollments' => StudentEnrollment::where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active')
                        ->where('enrollment_date', '>=', now()->subDays(7))
                        ->count(),
                ],
            ];
        });

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * Refresh dashboard data by clearing cache and returning fresh data.
     */
    public function refreshDashboard(): Response
    {
        // Clear the dashboard cache
        Cache::forget('registrar.dashboard.stats');

        // Get fresh data (this will recalculate and cache again)
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $stats = [
            'total_students' => Student::whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'active_students' => Student::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'college_students' => Student::whereHas('program', function ($query) {
                $query->where('education_level', 'college');
            })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'shs_students' => Student::whereHas('program', function ($query) {
                $query->where('education_level', 'senior_high');
            })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'active_college_students' => Student::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })->whereHas('program', function ($query) {
                $query->where('education_level', 'college');
            })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'active_shs_students' => Student::whereHas('user', function ($query) {
                $query->where('is_active', true);
            })->whereHas('program', function ($query) {
                $query->where('education_level', 'senior_high');
            })->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                $query->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            })->count(),
            'regular_students' => Student::where('student_type', 'regular')
                ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
            'irregular_students' => Student::where('student_type', 'irregular')
                ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->count(),
            'total_teachers' => Teacher::count(),
            'active_teachers' => Teacher::where('status', 'active')->count(),
            'total_sections' => Section::count(),
            'programs' => Program::where('status', 'active')
                ->withCount(['students' => function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->whereHas('user', function ($userQuery) {
                        $userQuery->where('is_active', true);
                    })->whereHas('studentEnrollments', function ($enrollmentQuery) use ($currentAcademicYear, $currentSemester) {
                        $enrollmentQuery->where('academic_year', $currentAcademicYear)
                            ->where('semester', $currentSemester)
                            ->where('status', 'active');
                    });
                }])
                ->get()
                ->groupBy('education_level')
                ->map(function ($programs) {
                    return $programs->map(function ($program) {
                        return [
                            'id' => $program->id,
                            'program_name' => $program->program_name,
                            'student_count' => $program->students_count,
                        ];
                    });
                }),
            'kpi_trends' => $this->getKpiTrends(),
            'payment_stats' => [
                'total_paid' => PaymentTransaction::where('status', 'completed')
                    ->where('payment_date', '>=', now()->startOfYear())
                    ->sum('amount'),
                'recent_payments' => PaymentTransaction::where('status', 'completed')
                    ->where('payment_date', '>=', now()->subDays(7))
                    ->count(),
                'pending_payments' => Student::whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })->whereDoesntHave('paymentTransactions', function ($query) {
                    $query->where('status', 'completed')
                        ->where('payment_date', '>=', now()->startOfYear());
                })->count(),
            ],
            'enrollment_alerts' => [
                'incomplete_enrollments' => StudentEnrollment::where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'pending')
                    ->count(),
                'recent_enrollments' => StudentEnrollment::where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active')
                    ->where('enrollment_date', '>=', now()->subDays(7))
                    ->count(),
            ],
        ];

        return Inertia::render('Registrar/Dashboard', [
            'stats' => $stats,
        ]);
    }

    /**
     * Get payment collection data by period and year level for the dashboard.
     */
    private function getKpiTrends(): array
    {
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $paymentPeriods = [
            'prelim_payment' => 'Prelim',
            'midterm_payment' => 'Midterm',
            'prefinal_payment' => 'Pre-final',
            'final_payment' => 'Final',
        ];

        $collectionData = [];

        // Get all year levels that have enrolled students
        $yearLevels = Student::whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
            $query->where('academic_year', $currentAcademicYear)
                ->where('semester', $currentSemester)
                ->where('status', 'active');
        })
            ->distinct()
            ->pluck('current_year_level')
            ->sort()
            ->values();

        foreach ($yearLevels as $yearLevel) {
            // Get total enrolled students for this year level
            $totalEnrolled = Student::where('current_year_level', $yearLevel)
                ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                    $query->where('academic_year', $currentAcademicYear)
                        ->where('semester', $currentSemester)
                        ->where('status', 'active');
                })
                ->count();

            $yearLevelData = [
                'year_level' => $yearLevel,
                'label' => $this->getYearLevelLabel($yearLevel),
                'total_enrolled' => $totalEnrolled,
                'periods' => [],
            ];

            foreach ($paymentPeriods as $periodKey => $periodLabel) {
                // Count students who have paid for this period
                $paidCount = Student::where('current_year_level', $yearLevel)
                    ->whereHas('studentEnrollments', function ($query) use ($currentAcademicYear, $currentSemester) {
                        $query->where('academic_year', $currentAcademicYear)
                            ->where('semester', $currentSemester)
                            ->where('status', 'active');
                    })
                    ->whereHas('paymentTransactions', function ($query) use ($periodKey) {
                        $query->where('payment_type', $periodKey)
                            ->where('status', 'completed');
                    })
                    ->count();

                $unpaidCount = $totalEnrolled - $paidCount;

                $yearLevelData['periods'][] = [
                    'period' => $periodKey,
                    'label' => $periodLabel,
                    'paid_count' => $paidCount,
                    'unpaid_count' => $unpaidCount,
                    'total_count' => $totalEnrolled,
                ];
            }

            $collectionData[] = $yearLevelData;
        }

        return $collectionData;
    }

    /**
     * Get human-readable label for year level.
     */
    private function getYearLevelLabel(int $yearLevel): string
    {
        return match ($yearLevel) {
            1 => '1st Year',
            2 => '2nd Year',
            3 => '3rd Year',
            4 => '4th Year',
            5 => '5th Year',
            default => $yearLevel.'th Year',
        };
    }

    /**
     * Show all students for management.
     */
    public function students(): Response
    {
        $educationLevel = request('education_level', 'all');
        $status = request('status', 'all');
        $yearLevel = request('year_level', 'all');
        $studentType = request('student_type', 'all');
        $enrollmentStatus = request('enrollment_status', 'enrolled'); // Default to 'enrolled'

        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Student::with(['user', 'program'])
            ->when($educationLevel !== 'all', function ($q) use ($educationLevel) {
                $q->where('education_level', $educationLevel);
            })
            ->when($status !== 'all', function ($q) use ($status) {
                $q->where('status', $status);
            })
            ->when($yearLevel !== 'all', function ($q) use ($yearLevel) {
                $q->where('year_level', $yearLevel);
            })
            ->when($studentType !== 'all', function ($q) use ($studentType) {
                $q->where('student_type', $studentType);
            });

        // Filter by enrollment status
        if ($enrollmentStatus === 'enrolled') {
            // Only show students currently enrolled in the current semester
            $query->whereHas('studentEnrollments', function ($q) use ($currentAcademicYear, $currentSemester) {
                $q->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            });
        } elseif ($enrollmentStatus === 'not_enrolled') {
            // Only show students NOT currently enrolled in the current semester
            $query->whereDoesntHave('studentEnrollments', function ($q) use ($currentAcademicYear, $currentSemester) {
                $q->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active');
            });
        }
        // 'all' shows all students regardless of enrollment status

        $students = $query->paginate(15)->withQueryString();

        // Get current enrollment sections for each student
        $students->getCollection()->transform(function ($student) use ($currentAcademicYear, $currentSemester) {
            // First try to find enrollment with a section assigned
            $enrollment = StudentEnrollment::with(['section.program'])
                ->where('student_id', $student->id)
                ->where('academic_year', $currentAcademicYear)
                ->where('semester', $currentSemester)
                ->where('status', 'active')
                ->whereNotNull('section_id')
                ->first();

            // If no enrollment with section found, check if student has any active enrollment in current period
            if (! $enrollment) {
                $enrollment = StudentEnrollment::with(['section.program'])
                    ->where('student_id', $student->id)
                    ->where('academic_year', $currentAcademicYear)
                    ->where('semester', $currentSemester)
                    ->where('status', 'active')
                    ->first();
            }

            $student->current_section = $enrollment?->section;
            $student->is_currently_enrolled = $enrollment !== null;

            // Add archived enrollments for all students who have them
            $student->archived_enrollments = ArchivedStudentEnrollment::with('archivedSection')
                ->where('student_id', $student->id)
                ->orderBy('academic_year', 'desc')
                ->orderBy('semester', 'desc')
                ->get();

            return $student;
        });

        $programs = Program::orderBy('program_name')->get();

        $onHoldCount = Student::where('is_on_hold', true)->count();

        return Inertia::render('Registrar/Students/Index', [
            'students' => $students,
            'programs' => $programs,
            'on_hold_count' => $onHoldCount,
            'filters' => [
                'education_level' => $educationLevel,
                'status' => $status,
                'year_level' => $yearLevel,
                'student_type' => $studentType,
                'enrollment_status' => $enrollmentStatus,
            ],
            'current_academic_period' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
        ]);
    }

    /**
     * Show the student registration form.
     */
    public function create(): Response
    {
        $programs = Program::with([
            'programFees',
            'curriculums',
            'currentCurriculum',
            'programCurricula.curriculum',
            'yearLevelGuides.curriculum',
        ])->orderBy('education_level')
            ->orderBy('program_name')
            ->get();

        return Inertia::render('Registrar/Students/Create', [
            'programs' => $programs,
            'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
            'currentSemester' => SchoolSetting::getCurrentSemester(),
        ]);
    }

    /**
     * Clear an on-hold status for a student after payment reconciliation.
     */
    public function clearHold(Request $request, Student $student)
    {
        // Permission check could be added here
        $student->update([
            'is_on_hold' => false,
            'hold_balance' => null,
            'hold_reason' => null,
        ]);

        return redirect()->back()->with('success', "Hold cleared for {$student->user->name}.");
    }

    /**
     * Store a newly registered student or update existing student.
     */
    public function store(Request $request)
    {
        // Direct file write to bypass logging
        file_put_contents(storage_path('logs/debug-store.log'), date('Y-m-d H:i:s')." - STORE CALLED\n".json_encode([
            'transfer_type' => $request->input('transfer_type'),
            'credited_subjects_count' => count($request->input('credited_subjects', [])),
            'has_credited_subjects' => $request->has('credited_subjects'),
        ], JSON_PRETTY_PRINT)."\n\n", FILE_APPEND);

        \Log::info('STORE METHOD CALLED - REQUEST RECEIVED', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'user_id' => auth()->id(),
            'user_roles' => auth()->user()?->roles?->pluck('name')?->toArray() ?? [],
        ]);

        \Log::info('Store method called with data', [
            'transfer_type' => $request->input('transfer_type'),
            'credited_subjects_count' => count($request->input('credited_subjects', [])),
            'credited_subjects' => $request->input('credited_subjects'),
            'has_credited_subjects' => $request->has('credited_subjects'),
            'all_input' => $request->all(),
        ]);

        $validated = $request->validate([
            // Student number for checking existing students
            'student_number' => ['nullable', 'string'],

            // Personal Information
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'birth_date' => ['required', 'date'],
            'address' => ['nullable', 'string'],
            'street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email'],
            'parent_contact' => ['nullable', 'string', 'max:20'],

            // Academic Information
            'program_id' => ['required', 'exists:programs,id'],
            'year_level' => ['required', 'string'],
            'student_type' => ['required', Rule::in(['regular', 'irregular'])],
            'education_level' => ['required', 'string'],
            'track' => ['nullable', 'string'],
            'strand' => ['nullable', 'string'],

            // Payment Information
            'enrollment_fee' => ['nullable', 'numeric', 'min:0'],
            'payment_amount' => ['nullable', 'numeric', 'min:0'],

            // Course shifting confirmation
            'confirm_course_shift' => ['nullable', 'boolean'],
            'create_year_level_guide' => ['nullable', 'boolean'],

            // Credit transfer data (for shiftees/transferees)
            'transfer_type' => ['nullable', Rule::in(['shiftee', 'transferee'])],
            'previous_program_id' => ['nullable', 'exists:programs,id'],
            'previous_school' => ['nullable', 'string', 'max:255'],
            'credited_subjects' => ['nullable', 'array'],
            'credited_subjects.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'credited_subjects.*.subject_code' => ['nullable', 'string'],
            'credited_subjects.*.subject_name' => ['nullable', 'string'],
            'credited_subjects.*.units' => ['nullable', 'numeric'],
            'credited_subjects.*.year_level' => ['nullable', 'integer'],
            'credited_subjects.*.semester' => ['nullable', 'string'],
            'credited_subjects.*.grade' => ['nullable', 'string'],
            'credited_subjects.*.fee_adjustment' => ['nullable', 'numeric'],
            'subjects_to_catch_up' => ['nullable', 'array'],
            'subjects_to_catch_up.*.subject_id' => ['nullable', 'exists:subjects,id'],
            'subjects_to_catch_up.*.subject_code' => ['nullable', 'string'],
            'subjects_to_catch_up.*.subject_name' => ['nullable', 'string'],
            'subjects_to_catch_up.*.units' => ['nullable', 'numeric'],
            'subjects_to_catch_up.*.year_level' => ['nullable', 'integer'],
            'subjects_to_catch_up.*.semester' => ['nullable', 'string'],
            'subjects_to_catch_up.*.fee_adjustment' => ['nullable', 'numeric'],
            'fee_adjustments' => ['nullable', 'array'],
            'fee_adjustments.credits' => ['nullable', 'numeric'],
            'fee_adjustments.catchup' => ['nullable', 'numeric'],
            'fee_adjustments.total' => ['nullable', 'numeric'],

            // Duplicate override flag
            'duplicate_override' => ['nullable', 'boolean'],
        ]);

        // Check if it's 2nd semester - prevent course shifters and transferees
        $currentSemester = \App\Models\SchoolSetting::getCurrentSemester();
        if ($currentSemester === '2nd') {
            if (! empty($validated['transfer_type']) && in_array($validated['transfer_type'], ['shiftee', 'transferee'])) {
                return back()->withErrors([
                    'transfer_type' => 'Course shifters and transferees can only be registered during the 1st semester of the academic year.',
                ])->withInput();
            }

            // Also check if student has course_shift_required data
            if (! empty($validated['confirm_course_shift']) || ! empty($validated['credited_subjects'])) {
                return back()->withErrors([
                    'general' => 'Course shifting and credit transfers can only be processed during the 1st semester of the academic year.',
                ])->withInput();
            }

            // Check if this is a new student (not updating existing)
            if (empty($validated['student_number'])) {
                return back()->withErrors([
                    'general' => 'New student enrollment is not allowed during the 2nd semester. Only existing students from the 1st semester can be updated.',
                ])->withInput();
            }

            // For existing students, verify they were enrolled in 1st semester
            if (! empty($validated['student_number'])) {
                $existingStudent = \App\Models\Student::where('student_number', $validated['student_number'])->first();
                if ($existingStudent) {
                    $currentAcademicYear = \App\Models\SchoolSetting::getCurrentAcademicYear();

                    // Check if student was enrolled in 1st semester of current academic year
                    $firstSemesterEnrollment = \App\Models\StudentEnrollment::where('student_id', $existingStudent->id)
                        ->where('academic_year', $currentAcademicYear)
                        ->where(function ($query) {
                            $query->where('semester', '1st')
                                ->orWhere('semester', 'first');
                        })
                        ->exists();

                    if (! $firstSemesterEnrollment) {
                        return back()->withErrors([
                            'student_number' => 'This student was not enrolled in the 1st semester of the current academic year. Only students who were enrolled in the 1st semester can be updated during the 2nd semester.',
                        ])->withInput();
                    }
                }
            }
        }

        // Custom validation: enrollment_fee is required for regular students, optional for irregular
        if ($validated['student_type'] === 'regular' && (! isset($validated['enrollment_fee']) || $validated['enrollment_fee'] === null || $validated['enrollment_fee'] === '')) {
            return back()->withErrors([
                'enrollment_fee' => 'Enrollment fee is required for regular students.',
            ])->withInput();
        }

        // Check for duplicates if not overridden
        if (empty($validated['duplicate_override']) && empty($validated['student_number'])) {
            // Check for potential duplicates by email + name + birthdate
            $duplicateExists = Student::whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })
                ->where('first_name', 'LIKE', $validated['first_name'])
                ->where('last_name', 'LIKE', $validated['last_name'])
                ->where('birth_date', $validated['birth_date'])
                ->exists();

            if ($duplicateExists) {
                return back()->withErrors([
                    'email' => 'A student with the same email, name, and birthdate already exists. If this is a different person, please confirm the duplicate override.',
                ])->withInput();
            }
        }

        // Check if this is an existing student being updated
        $existingStudent = null;
        if (! empty($validated['student_number'])) {
            $existingStudent = Student::where('student_number', $validated['student_number'])->first();
        }

        // Also check if there's an existing active student with this email
        if (! $existingStudent) {
            $existingStudentByEmail = Student::whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })->first();

            if ($existingStudentByEmail) {
                $existingStudent = $existingStudentByEmail;
            }
        }

        // Check if this is a returning student from archived records
        $archivedStudent = ArchivedStudent::whereHas('user', function ($query) use ($validated) {
            $query->where('email', $validated['email']);
        })->first();

        $isReturningStudent = $archivedStudent !== null;
        $isUpdatingExisting = $existingStudent !== null;

        // For new students, validate email uniqueness before starting transaction
        if (! $isUpdatingExisting && ! $isReturningStudent) {
            $request->validate([
                'email' => 'unique:users,email',
            ]);
        }

        try {
            DB::beginTransaction();

            // If updating existing student, use their existing user
            if ($isUpdatingExisting) {
                $user = $existingStudent->user;
                $user->update([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'email' => $validated['email'],
                    'is_active' => true,
                ]);
                $studentNumber = $existingStudent->student_number;
            } elseif ($isReturningStudent) {
                $user = $archivedStudent->user;
                // Update user name if changed
                $user->update([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'is_active' => true,
                ]);
            } else {
                // New student
                $user = User::create([
                    'name' => trim($validated['first_name'].' '.$validated['last_name']),
                    'email' => $validated['email'],
                    'password' => Hash::make('password123'),
                    'role' => 'student',
                    'is_active' => true,
                ]);
            }

            // Generate student number for new students only (after user is created)
            if (! $isUpdatingExisting) {
                $studentNumber = $isReturningStudent && $archivedStudent->student_number
                    ? $archivedStudent->student_number
                    : $this->generateStudentNumber($user->id);
            }

            // Extract numeric year level from string (e.g., "1st Year" -> 1, "Grade 11" -> 11)
            $numericYearLevel = $this->extractNumericYearLevel($validated['year_level'], $validated['education_level']);

            // --- Year-level progression validation for existing/returning students ---
            // Simple rule: Use current_year_level from Student model (auto-updated by ArchivedStudentEnrollmentObserver)
            // Students can only enroll in their current_year_level or higher (forward progression only)
            if ($isUpdatingExisting || $isReturningStudent) {
                $student = $isUpdatingExisting ? $existingStudent : null;
                $studentId = $isUpdatingExisting ? $existingStudent->id : ($archivedStudent->original_student_id ?? null);

                // Get current allowed year level from database
                if ($student) {
                    $currentAllowedYearLevel = $student->current_year_level ?? 1;
                } elseif ($studentId) {
                    // For returning students, check their original student record
                    $originalStudent = Student::find($studentId);
                    $currentAllowedYearLevel = $originalStudent?->current_year_level ?? 1;
                } else {
                    $currentAllowedYearLevel = 1;
                }

                // Validate: Cannot go backwards, can only go forward or stay at current level
                if ($numericYearLevel < $currentAllowedYearLevel) {
                    return back()->withErrors([
                        'year_level' => "Cannot enroll in year {$numericYearLevel}. You are already in year {$currentAllowedYearLevel}. You cannot move backwards.",
                    ])->withInput();
                }

                // Validate: Cannot skip year levels
                $nextYearLevel = $currentAllowedYearLevel + 1;
                if ($numericYearLevel > $nextYearLevel) {
                    return back()->withErrors([
                        'year_level' => "Cannot skip to year {$numericYearLevel}. You can only enroll in year {$currentAllowedYearLevel} or {$nextYearLevel} (after completing both semesters).",
                    ])->withInput();
                }

                // If trying to advance to next year (+1), verify they completed both semesters of current year
                if ($numericYearLevel > $currentAllowedYearLevel && $studentId) {
                    // Count completed semesters at the current year level
                    $completedSemestersAtCurrentLevel = ArchivedStudentEnrollment::where('student_id', $studentId)
                        ->where('final_status', 'completed')
                        ->whereIn('semester', ['first', 'second']) // Match stored format
                        ->count();

                    // Must complete at least 2 semesters (1st and 2nd) to advance
                    if ($completedSemestersAtCurrentLevel < 2 * ($currentAllowedYearLevel)) {
                        return back()->withErrors([
                            'year_level' => "Cannot advance to year {$numericYearLevel}. Complete both semesters of year {$currentAllowedYearLevel} first. (You have {$completedSemestersAtCurrentLevel} semesters completed)",
                        ])->withInput();
                    }
                }
            }
            // --- end year-level validation ---

            // Concatenate address parts if provided
            $address = $validated['address'] ?? '';
            if (empty($address)) {
                $addressParts = array_filter([
                    $validated['street'] ?? null,
                    $validated['barangay'] ?? null,
                    $validated['city'] ?? null,
                    $validated['province'] ?? null,
                    $validated['zip_code'] ?? null,
                ]);
                $address = implode(', ', $addressParts);
            }

            // Check if existing student is changing programs (shifting courses)
            $isShiftingCourses = false;
            $currentProgram = null;
            $newProgram = null;

            if ($isUpdatingExisting && $existingStudent->program_id != $validated['program_id']) {
                $isShiftingCourses = true;
                $currentProgram = $existingStudent->program;
                $newProgram = Program::find($validated['program_id']);

                // Check if course shift is confirmed
                if (! $validated['confirm_course_shift']) {
                    $programs = Program::with([
                        'programFees',
                        'curriculums',
                        'currentCurriculum',
                        'programCurricula.curriculum',
                        'yearLevelGuides.curriculum',
                    ])
                        ->orderBy('education_level')
                        ->orderBy('program_name')
                        ->get();

                    return Inertia::render('Registrar/Students/Create', [
                        'programs' => $programs,
                        'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
                        'currentSemester' => SchoolSetting::getCurrentSemester(),
                        'course_shift_required' => [
                            'current_program' => $currentProgram->program_name ?? 'Unknown',
                            'current_program_code' => $currentProgram->program_code ?? null,
                            'current_program_id' => $currentProgram->id ?? null,
                            'current_curriculum' => $existingStudent->curriculum?->curriculum_name ?? null,
                            'new_program' => $newProgram->program_name ?? 'Unknown',
                            'new_program_code' => $newProgram->program_code ?? null,
                            'new_program_id' => $newProgram->id ?? null,
                            'student_name' => $existingStudent->first_name.' '.$existingStudent->last_name,
                            'student_id' => $existingStudent->id,
                            'current_year_level' => $existingStudent->year_level,
                        ],
                        'old' => $request->all(), // Preserve form input
                    ]);
                }

                // Mark as irregular only if confirmed
                $validated['student_type'] = 'irregular';
            }

            // Also check if returning archived student is changing programs
            if ($isReturningStudent && $archivedStudent->program_id != $validated['program_id']) {
                $isShiftingCourses = true;
                $currentProgram = $archivedStudent->program;
                $newProgram = Program::find($validated['program_id']);

                // Check if course shift is confirmed
                if (! $validated['confirm_course_shift']) {
                    return Inertia::render('Registrar/Students/Create', [
                        'programs' => Program::with([
                            'programFees',
                            'curriculums',
                            'currentCurriculum',
                            'programCurricula.curriculum',
                            'yearLevelGuides.curriculum',
                        ])
                            ->orderBy('education_level')
                            ->orderBy('program_name')
                            ->get(),
                        'currentAcademicYear' => SchoolSetting::getCurrentAcademicYear(),
                        'currentSemester' => SchoolSetting::getCurrentSemester(),
                        'course_shift_required' => [
                            'current_program' => $currentProgram->program_name ?? 'Unknown',
                            'current_program_code' => $currentProgram->program_code ?? null,
                            'current_program_id' => $currentProgram->id ?? null,
                            'current_curriculum' => $archivedStudent->curriculum?->curriculum_name ?? null,
                            'new_program' => $newProgram->program_name ?? 'Unknown',
                            'new_program_code' => $newProgram->program_code ?? null,
                            'new_program_id' => $newProgram->id ?? null,
                            'student_name' => $archivedStudent->first_name.' '.$archivedStudent->last_name,
                            'student_id' => $archivedStudent->original_student_id,
                            'current_year_level' => $archivedStudent->year_level,
                        ],
                        'old' => $request->all(), // Preserve form input
                    ]);
                }

                // Mark as irregular only if confirmed
                $validated['student_type'] = 'irregular';
            }

            // Calculate batch year
            // SchoolSetting::getCurrentAcademicYear() returns a string like "2025-2026" or similar.
            // We need a numeric start year to do arithmetic; parse the first 4-digit year and fall back to current year.
            $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
            $batchYear = $currentAcademicYear;

            // Extract numeric start year (e.g., '2025' from '2025-2026')
            if (preg_match('/(\d{4})/', (string) $currentAcademicYear, $matches)) {
                $currentAcademicYearStart = (int) $matches[1];
            } else {
                $currentAcademicYearStart = (int) date('Y');
            }

            if ($isUpdatingExisting) {
                // For existing students, keep their batch year
                $batchYear = $existingStudent->batch_year ?? $currentAcademicYear;
            } elseif ($isReturningStudent) {
                // For returning students, keep their batch year
                $batchYear = $archivedStudent->batch_year ?? $archivedStudent->academic_year ?? $currentAcademicYear;
            } else {
                // For new students, if they are transferring at a higher year level, adjust batch year
                if ($numericYearLevel > 1) {
                    $batchYear = (string) ($currentAcademicYearStart - ($numericYearLevel - 1));
                } else {
                    $batchYear = (string) $currentAcademicYearStart;
                }
            }

            // Get the current curriculum and all curricula for the program
            $program = Program::with(['currentCurriculum', 'curriculums'])->find($validated['program_id']);
            $curriculum = $program->currentCurriculum;

            // If this is a new transfer student (not updating existing or returning),
            // and they are entering above 1st year, try to match a curriculum that
            // corresponds to their batch start year (so they join the same curriculum
            // their cohort is using rather than being assigned to the newest one).
            if (! $isUpdatingExisting && ! $isReturningStudent && $numericYearLevel > 1) {
                // We expect $batchYear to be the numeric start year string (e.g., '2023')
                $targetStart = (string) $batchYear;

                // Delegate curriculum selection to the Program model for clarity and testability
                $found = $program->matchCurriculumForTransferee($numericYearLevel, $targetStart);
                if ($found) {
                    $curriculum = $found;
                }
            }

            $curriculumId = $curriculum?->id;

            // Optionally create a Year-Level Curriculum Guide if registrar requested and
            // this is a new transferee entering above 1st year and no guide exists yet.
            if (! $isUpdatingExisting && ! $isReturningStudent && $numericYearLevel > 1 && ($request->boolean('create_year_level_guide'))) {
                $existingGuide = \App\Models\YearLevelCurriculumGuide::where('program_id', $validated['program_id'])
                    ->where('year_level', $numericYearLevel)
                    ->first();

                if (! $existingGuide && $curriculumId) {
                    \App\Models\YearLevelCurriculumGuide::create([
                        'program_id' => $validated['program_id'],
                        'year_level' => $numericYearLevel,
                        'curriculum_id' => $curriculumId,
                    ]);
                }
            }

            // Create student record
            $studentData = [
                'user_id' => $user->id,
                'program_id' => $validated['program_id'],
                'curriculum_id' => $curriculumId,
                'batch_year' => $batchYear,
                'student_number' => $studentNumber,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'] ?? null,
                'suffix' => $validated['suffix'] ?? null,
                'birth_date' => $validated['birth_date'],
                'address' => $address,
                'phone' => $validated['phone'] ?? null,
                'parent_contact' => $validated['parent_contact'] ?? null,
                'year_level' => $validated['year_level'],
                'current_year_level' => $numericYearLevel,
                'current_academic_year' => \App\Models\SchoolSetting::getCurrentAcademicYear(),
                'current_semester' => \App\Models\SchoolSetting::getCurrentSemester(),
                'student_type' => $validated['student_type'],
                'education_level' => $validated['education_level'],
                'track' => $validated['track'] ?? null,
                'strand' => $validated['strand'] ?? null,
                'status' => 'active',
                'enrolled_date' => $isUpdatingExisting ? $existingStudent->enrolled_date : now(),
            ];

            // SHS Voucher System: All SHS students automatically get voucher
            if ($validated['education_level'] === 'senior_high') {
                $studentData['has_voucher'] = true;
                $studentData['voucher_id'] = 'shsvoucher('.$studentData['student_number'].')';
                $studentData['voucher_status'] = 'active';
                $studentData['voucher_invalidated_at'] = null;
                $studentData['voucher_invalidation_reason'] = null;
            }

            // Track course shift data if shifting
            if ($isShiftingCourses && $currentProgram) {
                $studentData['previous_program_id'] = $currentProgram->id;
                $studentData['previous_curriculum_id'] = $isUpdatingExisting ? $existingStudent->curriculum_id : ($archivedStudent->curriculum_id ?? null);
                $studentData['course_shifted_at'] = now();
                $studentData['shift_reason'] = 'Course shift from '.$currentProgram->program_name.' to '.$newProgram->program_name;

                // Note: Credited subjects are now stored in student_credit_transfers table,
                // not in the students.credited_subjects JSON column
            }

            // Track transferee data
            if (! empty($validated['transfer_type']) && $validated['transfer_type'] === 'transferee') {
                $studentData['previous_school'] = $validated['previous_school'] ?? null;
                $studentData['previous_program_id'] = $validated['previous_program_id'] ?? null;
            }

            // Create or update student record
            if ($isUpdatingExisting) {
                $existingStudent->update($studentData);
                $student = $existingStudent;
                $message = "Student {$user->name} updated successfully!";
                if ($isShiftingCourses) {
                    $message .= ' Student marked as irregular due to course shifting.';
                }
            } else {
                $student = Student::create($studentData);
                $baseMessage = "Student {$user->name} registered successfully! Student Number: {$studentNumber}. Default password: password123";
                if ($isShiftingCourses) {
                    $baseMessage .= ' Student marked as irregular due to course shifting.';
                }
                $message = $baseMessage;
            }

            // Check if student has outstanding balances from previous semesters
            $academicYear = SchoolSetting::getCurrentAcademicYear();
            $semester = SchoolSetting::getCurrentSemester();

            $studentIdToCheck = $isReturningStudent ? $archivedStudent->original_student_id : $student->id;
            $unpaidBalances = StudentSemesterPayment::where('student_id', $studentIdToCheck)
                ->where('balance', '>', 0)
                ->where(function ($query) use ($academicYear, $semester) {
                    $query->where('academic_year', '<', $academicYear)
                        ->orWhere(function ($subQuery) use ($academicYear, $semester) {
                            $subQuery->where('academic_year', $academicYear)
                                ->where('semester', '!=', $semester);
                        });
                })
                ->sum('balance');

            if ($unpaidBalances > 0) {
                return back()->withErrors([
                    'student' => 'Cannot enroll student. Outstanding balance of ₱'.number_format($unpaidBalances, 2).' from previous semester(s) must be settled first.',
                ])->withInput();
            }

            // Check if student is already enrolled in the current semester
            // Allow course shift even if already enrolled
            $isCourseShift = $isUpdatingExisting && $existingStudent->program_id != $validated['program_id'];
            $existingEnrollment = StudentEnrollment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if ($existingEnrollment && ! $isCourseShift) {
                return back()->withErrors([
                    'student' => "Student is already enrolled in the current semester ({$academicYear} - {$semester}). Cannot enroll again.",
                ])->withInput();
            }
            // Calculate enrollment fee for irregular students
            if ($validated['student_type'] === 'irregular' && $curriculumId) {
                // Get base enrollment fee from settings or program
                $baseEnrollmentFee = $program->enrollment_fee ?? 5000; // Default base fee

                // Get required subjects for current year/semester
                $requiredSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $curriculumId)
                    ->where('year_level', $numericYearLevel)
                    ->where('semester', $semester)
                    ->count();

                // Calculate total fee (base + 300 per subject)
                $enrollmentFee = $baseEnrollmentFee + (300 * $requiredSubjects);

                // Subtract 300 for each credited subject that's required this semester
                $creditedThisSemester = $this->countCreditedSubjectsForSemester(
                    $curriculumId,
                    $numericYearLevel,
                    $semester,
                    $studentData['credited_subjects'] ?? []
                );

                $enrollmentFee -= (300 * $creditedThisSemester);
            } else {
                $enrollmentFee = (float) $validated['enrollment_fee'];
            }

            // SHS Voucher System: Override fee to 0 if student has active voucher
            if ($validated['education_level'] === 'senior_high' &&
                ($studentData['has_voucher'] ?? false) &&
                ($studentData['voucher_status'] ?? null) === 'active') {
                $enrollmentFee = 0;
            }

            $paymentAmount = (float) $validated['payment_amount'];

            // Ensure values are numeric and non-negative
            if (! is_numeric($enrollmentFee) || $enrollmentFee < 0) {
                return back()->withErrors([
                    'enrollment_fee' => 'Enrollment fee must be a valid positive number.',
                ])->withInput();
            }

            if (! is_numeric($validated['payment_amount']) || $paymentAmount < 0) {
                return back()->withErrors([
                    'payment_amount' => 'Payment amount must be a valid positive number.',
                ])->withInput();
            }

            // SHS students with active vouchers can have zero enrollment fee
            // Also allow zero for all irregular students (fees calculated based on enrolled subjects)
            if ($enrollmentFee == 0 &&
                ! ($validated['education_level'] === 'senior_high' && ($studentData['has_voucher'] ?? false)) &&
                $validated['student_type'] !== 'irregular') {
                return back()->withErrors([
                    'enrollment_fee' => 'Enrollment fee cannot be zero.',
                ])->withInput();
            }

            // Check if payment record already exists for this semester
            $existingPayment = StudentSemesterPayment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if (! $existingPayment) {
                // Create the payment record (without setting enrollment_paid yet)
                $semesterPayment = StudentSemesterPayment::create([
                    'student_id' => $student->id,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'enrollment_fee' => $enrollmentFee,
                    'enrollment_paid' => false,
                    'enrollment_payment_date' => null,
                    'total_semester_fee' => $enrollmentFee,
                    'payment_plan' => 'installment',
                    // Note: total_paid and balance will be calculated by the model's booted() method
                ]);
            } else {
                $semesterPayment = $existingPayment;
            }

            // If there's an initial payment, create a payment transaction
            if ($paymentAmount > 0) {
                PaymentTransaction::create([
                    'student_id' => $student->id,
                    'payable_type' => StudentSemesterPayment::class,
                    'payable_id' => $semesterPayment->id,
                    'amount' => $paymentAmount,
                    'payment_type' => 'enrollment_fee',
                    'payment_method' => 'cash',
                    'reference_number' => 'REG-'.now()->format('YmdHis').'-'.$student->id,
                    'description' => 'Enrollment fee payment',
                    'payment_date' => now(),
                    'status' => 'completed',
                    'processed_by' => Auth::id(),
                    'notes' => 'Payment made during student enrollment',
                ]);

                // Mark enrollment as paid since they registered (regardless of amount)
                $semesterPayment->refresh();
                $semesterPayment->enrollment_payment_date = now();
                $semesterPayment->enrollment_paid = true; // Always true when they register
                $semesterPayment->save(); // Trigger the booted() method to recalculate totals
            }

            // Create enrollment record to track student's enrollment in this semester
            // Double-check that enrollment doesn't already exist (safety check)
            $existingEnrollmentCheck = StudentEnrollment::where([
                'student_id' => $student->id,
                'academic_year' => $academicYear,
                'semester' => $semester,
            ])->first();

            if (! $existingEnrollmentCheck) {
                StudentEnrollment::create([
                    'student_id' => $student->id,
                    'section_id' => null, // Will be assigned later when sections are created
                    'enrollment_date' => now(),
                    'status' => 'active',
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'enrolled_by' => Auth::id(),
                ]);
            }

            // Handle credit transfers for shiftees and transferees
            if (! empty($validated['transfer_type']) && ($validated['transfer_type'] === 'shiftee' || $validated['transfer_type'] === 'transferee')) {
                \Log::info('Processing credit transfers', [
                    'transfer_type' => $validated['transfer_type'],
                    'credited_subjects_count' => count($validated['credited_subjects'] ?? []),
                    'credited_subjects' => $validated['credited_subjects'] ?? [],
                    'subjects_to_catch_up_count' => count($validated['subjects_to_catch_up'] ?? []),
                ]);

                // Get program and curriculum information
                $newProgram = Program::find($validated['program_id']);
                $newCurriculum = $newProgram->curriculums()->where('is_current', true)->first();

                $previousProgram = ! empty($validated['previous_program_id'])
                    ? Program::find($validated['previous_program_id'])
                    : null;
                $previousCurriculum = $previousProgram
                    ? $previousProgram->curriculums()->where('is_current', true)->first()
                    : null;

                // Save credited subjects (TRANSFEREES AND SHIFTEES)
                $shouldProcessCredits = ! empty($validated['credited_subjects']) &&
                                       is_array($validated['credited_subjects']) &&
                                       isset($validated['transfer_type']) &&
                                       in_array($validated['transfer_type'], ['transferee', 'shiftee']);

                if ($shouldProcessCredits) {
                    $transferTypeLabel = strtoupper($validated['transfer_type']);
                    \Log::info('💾 SAVING CREDITED SUBJECTS FOR '.$transferTypeLabel, [
                        'count' => count($validated['credited_subjects']),
                        'student_id' => $student->id,
                        'transfer_type' => $validated['transfer_type'],
                        'credited_subjects' => $validated['credited_subjects'],
                    ]);

                    foreach ($validated['credited_subjects'] as $creditedSubject) {
                        $grade = $creditedSubject['grade'] ?? null;

                        // Double-check grade validation on backend (should already be filtered on frontend)
                        if ($grade !== null && (float) $grade < 75) {
                            \Log::warning('⚠️ Skipping subject with failing grade', [
                                'subject_code' => $creditedSubject['subject_code'],
                                'grade' => $grade,
                            ]);

                            continue;
                        }

                        \Log::info('Processing credited subject', [
                            'subject_id' => $creditedSubject['subject_id'] ?? null,
                            'subject_code' => $creditedSubject['subject_code'] ?? null,
                            'grade' => $grade,
                        ]);

                        // Find the corresponding curriculum subject in the new curriculum
                        $curriculumSubject = \App\Models\CurriculumSubject::where('curriculum_id', $newCurriculum->id)
                            ->where('subject_id', $creditedSubject['subject_id'])
                            ->first();

                        \Log::info('Curriculum subject lookup', [
                            'curriculum_id' => $newCurriculum->id,
                            'subject_id' => $creditedSubject['subject_id'],
                            'found' => $curriculumSubject ? 'YES' : 'NO',
                        ]);

                        $creditTransfer = \App\Models\StudentCreditTransfer::create([
                            'student_id' => $student->id,
                            'previous_program_id' => $previousProgram?->id,
                            'new_program_id' => $newProgram->id,
                            'previous_curriculum_id' => $previousCurriculum?->id,
                            'new_curriculum_id' => $newCurriculum->id,
                            'subject_id' => $creditedSubject['subject_id'] ?? null,
                            'subject_code' => $creditedSubject['subject_code'] ?? null,
                            'subject_name' => $creditedSubject['subject_name'] ?? null,
                            'original_subject_code' => $creditedSubject['original_subject_code'] ?? null,
                            'original_subject_name' => $creditedSubject['original_subject_name'] ?? null,
                            'units' => $creditedSubject['units'] ?? 0,
                            'year_level' => $creditedSubject['year_level'] ?? 1,
                            'semester' => $creditedSubject['semester'] ?? '1st',
                            'transfer_type' => $validated['transfer_type'],
                            'credit_status' => 'credited',
                            'verified_semester_grade' => $creditedSubject['grade'] ?? null,
                            'fee_adjustment' => $creditedSubject['fee_adjustment'] ?? -300,
                            'previous_school' => $validated['previous_school'] ?? null,
                            'approved_by' => Auth::id(),
                            'approved_at' => now(),
                        ]);

                        \Log::info('✅ Created StudentCreditTransfer', ['id' => $creditTransfer->id]);

                        // Also create StudentSubjectCredit record for Academic History display
                        // Create the record even if curriculum_subject_id is null (for transferees)
                        $subjectCredit = \App\Models\StudentSubjectCredit::create([
                            'student_id' => $student->id,
                            'curriculum_subject_id' => $curriculumSubject?->id,
                            'subject_id' => $creditedSubject['subject_id'],
                            'subject_code' => $creditedSubject['subject_code'],
                            'subject_name' => $creditedSubject['subject_name'],
                            'units' => $creditedSubject['units'],
                            'year_level' => $creditedSubject['year_level'],
                            'semester' => $creditedSubject['semester'],
                            'credit_type' => 'transfer',
                            'credit_status' => 'credited',
                            'final_grade' => $creditedSubject['grade'] ?? null,
                            'credited_at' => now(),
                            'student_credit_transfer_id' => $creditTransfer->id,
                            'approved_by' => Auth::id(),
                            'approved_at' => now(),
                        ]);

                        \Log::info('✅ Created StudentSubjectCredit', [
                            'id' => $subjectCredit->id,
                            'has_curriculum_subject' => $curriculumSubject ? 'YES' : 'NO',
                            'curriculum_subject_id' => $curriculumSubject?->id,
                        ]);
                    }
                } else {
                    if (isset($validated['transfer_type']) && $validated['transfer_type'] === 'shiftee') {
                        \Log::info('✋ SHIFTEE - No credited subjects to process (none matched from curriculum comparison)', [
                            'student_id' => $student->id,
                            'transfer_type' => $validated['transfer_type'],
                        ]);
                    } else {
                        \Log::info('❌ No credited subjects to save', [
                            'transfer_type' => $validated['transfer_type'] ?? 'none',
                            'has_credited_subjects_key' => isset($validated['credited_subjects']),
                            'credited_subjects_value' => $validated['credited_subjects'] ?? null,
                        ]);
                    }
                }

                // Save catch-up subjects
                if (! empty($validated['subjects_to_catch_up'])) {
                    foreach ($validated['subjects_to_catch_up'] as $catchupSubject) {
                        \App\Models\StudentCreditTransfer::create([
                            'student_id' => $student->id,
                            'previous_program_id' => $previousProgram?->id,
                            'new_program_id' => $newProgram->id,
                            'previous_curriculum_id' => $previousCurriculum?->id,
                            'new_curriculum_id' => $newCurriculum->id,
                            'subject_id' => $catchupSubject['subject_id'] ?? null,
                            'subject_code' => $catchupSubject['subject_code'] ?? null,
                            'subject_name' => $catchupSubject['subject_name'] ?? null,
                            'units' => $catchupSubject['units'] ?? 0,
                            'year_level' => $catchupSubject['year_level'] ?? 1,
                            'semester' => $catchupSubject['semester'] ?? '1st',
                            'transfer_type' => $validated['transfer_type'],
                            'credit_status' => 'for_catchup',
                            'fee_adjustment' => $catchupSubject['fee_adjustment'] ?? 300,
                            'approved_by' => Auth::id(),
                            'approved_at' => now(),
                        ]);
                    }
                }

                // Update student record with transfer information
                $student->update([
                    'previous_program_id' => $previousProgram?->id,
                    'previous_curriculum_id' => $previousCurriculum?->id,
                    'course_shifted_at' => now(),
                ]);
            }

            // Check if irregular student can become regular after enrollment
            if ($student->student_type === 'irregular') {
                $regularityCheckService = app(\App\Services\StudentRegularityCheckService::class);
                $regularityCheckService->checkAndUpdateRegularityAfterReenrollment($student);
            }

            DB::commit();

            // Clear dashboard stats cache since student data changed
            Cache::forget('registrar.dashboard.stats');

            return redirect()
                ->route('registrar.students')
                ->with('success', $message);

        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withErrors(['error' => 'Failed to register student: '.$e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Update the specified student.
     */
    public function update(Request $request, Student $student)
    {
        $validated = $request->validate([
            // Personal Information only (academic info cannot be edited)
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['required', 'date'],
            'address' => ['nullable', 'string'],
            'street' => ['nullable', 'string', 'max:255'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'city' => ['nullable', 'string', 'max:255'],
            'province' => ['nullable', 'string', 'max:255'],
            'zip_code' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['required', 'email', Rule::unique('users')->ignore($student->user_id)],
            'parent_contact' => ['nullable', 'string', 'max:20'],

            // Status only (academic fields cannot be edited)
            'status' => ['required', Rule::in(['active', 'inactive', 'graduated', 'dropped'])],
        ]);

        try {
            DB::beginTransaction();

            // Update user information
            $student->user->update([
                'name' => trim($validated['first_name'].' '.$validated['last_name']),
                'email' => $validated['email'],
            ]);

            // Concatenate address parts if provided
            $address = $validated['address'] ?? '';
            if (empty($address)) {
                $addressParts = array_filter([
                    $validated['street'] ?? null,
                    $validated['barangay'] ?? null,
                    $validated['city'] ?? null,
                    $validated['province'] ?? null,
                    $validated['zip_code'] ?? null,
                ]);
                $address = implode(', ', $addressParts);
            }

            // Update student information (only personal info and status)
            $student->update([
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'birth_date' => $validated['birth_date'],
                'address' => $address,
                'street' => $validated['street'],
                'barangay' => $validated['barangay'],
                'city' => $validated['city'],
                'province' => $validated['province'],
                'zip_code' => $validated['zip_code'],
                'phone' => $validated['phone'],
                'parent_contact' => $validated['parent_contact'],
                'status' => $validated['status'],
            ]);

            // Deactivate user account if student status is dropped or inactive
            if (in_array($validated['status'], ['dropped', 'inactive'])) {
                $student->user->update(['is_active' => false]);
            } elseif ($validated['status'] === 'active') {
                // Reactivate user account if status is changed to active
                $student->user->update(['is_active' => true]);
            }

            DB::commit();

            // Clear dashboard stats cache since student data changed
            Cache::forget('registrar.dashboard.stats');

            return redirect()->route('registrar.students')->with('success', 'Student updated successfully.');
        } catch (\Exception $e) {
            DB::rollBack();

            return back()
                ->withErrors(['error' => 'Failed to update student: '.$e->getMessage()])
                ->withInput();
        }
    }

    /**
     * Extract numeric year level from string.
     */
    private function extractNumericYearLevel(string $yearLevel, string $educationLevel): int
    {
        if ($educationLevel === 'college') {
            // Extract first digit from "1st Year", "2nd Year", etc.
            if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                return (int) $matches[1];
            }
        } else {
            // Extract numeric grade from "Grade 11", "Grade 12"
            if (preg_match('/(\d+)/', $yearLevel, $matches)) {
                return (int) $matches[1];
            }
        }

        return 1; // Default to 1 if parsing fails
    }

    /**
     * Generate a unique student number.
     */
    private function generateStudentNumber(int $userId): string
    {
        // Format: USERID + day + month + year (DDMMYYYY)
        // Example: User ID 123 enrolling on 17/01/2026 = 123117012026
        $enrollmentDate = now();

        return $userId.$enrollmentDate->format('dmY');
    }

    /**
     * Calculate credited subjects when a student shifts courses.
     * Compares completed subjects with new curriculum and auto-matches.
     * A subject is considered "completed" ONLY if:
     * 1. Teacher has entered ALL grading period grades (no blank terms)
     * 2. A semester/final grade has been computed
     * 3. Student passed the subject (grade >= 75)
     */
    private function calculateCreditedSubjects(?int $studentId, ?int $newCurriculumId): array
    {
        if (! $studentId || ! $newCurriculumId) {
            return [];
        }

        $credited = [];

        // Get all subjects the student has COMPLETED with teacher-entered grades
        // Only consider subjects where:
        // 1. ALL grading periods have grades (no blank terms)
        // 2. Semester grade / final grade is computed and not null
        // 3. Student passed the subject (grade >= 75 or status = 'passed')
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
            ->where('student_subject_enrollments.student_id', $studentId)
            // Must have semester/final grade computed
            ->whereNotNull(DB::raw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade)'))
            // For COLLEGE: Must have ALL 4 grading periods (prelim, midterm, prefinal, finals)
            // For SHS: Must have ALL 4 quarters (first, second, third, fourth)
            ->where(function ($query) {
                $query->where(function ($q) {
                    // College grades - ALL terms must be filled
                    $q->whereNotNull('student_grades.prelim_grade')
                        ->whereNotNull('student_grades.midterm_grade')
                        ->whereNotNull('student_grades.prefinal_grade')
                        ->whereNotNull('student_grades.final_grade');
                })->orWhere(function ($q) {
                    // SHS grades - ALL quarters must be filled
                    $q->whereNotNull('shs_student_grades.first_quarter_grade')
                        ->whereNotNull('shs_student_grades.second_quarter_grade')
                        ->whereNotNull('shs_student_grades.third_quarter_grade')
                        ->whereNotNull('shs_student_grades.fourth_quarter_grade');
                });
            })
            // Must be a passing grade (>= 75)
            ->whereRaw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade) >= 75')
            ->select(
                'subjects.id',
                'subjects.subject_code',
                'subjects.subject_name',
                DB::raw('COALESCE(student_grades.semester_grade, shs_student_grades.final_grade) as grade')
            )
            ->distinct()
            ->get();

        // Get new curriculum subjects
        $newCurriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $newCurriculumId)
            ->with('subject')
            ->get();

        // Match subjects by code (exact match only for auto-credit)
        // Only subjects with teacher-entered passing grades will be credited
        foreach ($newCurriculumSubjects as $newCurriculum) {
            $newSubject = $newCurriculum->subject;

            foreach ($completedSubjects as $completedSubject) {
                if (strtoupper($completedSubject->subject_code) === strtoupper($newSubject->subject_code)) {
                    $credited[] = [
                        'old_subject_id' => $completedSubject->id,
                        'old_subject_code' => $completedSubject->subject_code,
                        'old_subject_name' => $completedSubject->subject_name,
                        'new_subject_id' => $newSubject->id,
                        'new_subject_code' => $newSubject->subject_code,
                        'new_subject_name' => $newSubject->subject_name,
                        'grade' => $completedSubject->grade,
                        'status' => $completedSubject->status ?? 'passed',
                        'credited_at' => now()->toDateTimeString(),
                        'match_reason' => 'Exact code match with passing grade',
                    ];
                    break;
                }
            }
        }

        return $credited;
    }

    /**
     * Count how many credited subjects are required in the specified semester.
     * Used to calculate fee discounts for course shifters and transferees.
     */
    private function countCreditedSubjectsForSemester(int $curriculumId, int $yearLevel, string $semester, array $creditedSubjects = []): int
    {
        if (empty($creditedSubjects)) {
            return 0;
        }

        // Get credited subject IDs
        $creditedSubjectIds = collect($creditedSubjects)->pluck('new_subject_id')->toArray();

        // Get all required subjects for this year level and semester
        $requiredSubjectIds = \App\Models\CurriculumSubject::where('curriculum_id', $curriculumId)
            ->where('year_level', $yearLevel)
            ->where('semester', $semester)
            ->pluck('subject_id')
            ->toArray();

        // Count how many credited subjects are in the required list
        $creditedInSemester = array_intersect($creditedSubjectIds, $requiredSubjectIds);

        return count($creditedInSemester);
    }

    /**
     * Invalidate SHS voucher for a student who dropped or failed
     */
    public function invalidateVoucher(Request $request, Student $student)
    {
        // Only for SHS students
        if ($student->education_level !== 'senior_high') {
            return back()->withErrors(['voucher' => 'Only SHS students have vouchers.']);
        }

        // Only if they have an active voucher
        if (! $student->has_voucher || $student->voucher_status !== 'active') {
            return back()->withErrors(['voucher' => 'Student does not have an active voucher.']);
        }

        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $student->update([
            'voucher_status' => 'invalid',
            'voucher_invalidated_at' => now(),
            'voucher_invalidation_reason' => $validated['reason'],
        ]);

        return back()->with('success', 'Voucher invalidated successfully. Student will need to pay fees for their track.');
    }

    /**
     * Reactivate SHS voucher for a student
     */
    public function reactivateVoucher(Student $student)
    {
        // Only for SHS students
        if ($student->education_level !== 'senior_high') {
            return back()->withErrors(['voucher' => 'Only SHS students have vouchers.']);
        }

        // Only if they have an invalidated voucher
        if (! $student->has_voucher || $student->voucher_status === 'active') {
            return back()->withErrors(['voucher' => 'Voucher is already active.']);
        }

        $student->update([
            'voucher_status' => 'active',
            'voucher_invalidated_at' => null,
            'voucher_invalidation_reason' => null,
        ]);

        return back()->with('success', 'Voucher reactivated successfully. Tuition fees are now covered.');
    }

    /**
     * Check for duplicate students based on email, name, and birthdate
     */
    public function checkDuplicate(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'first_name' => ['required', 'string'],
            'last_name' => ['required', 'string'],
            'birth_date' => ['required', 'date'],
        ]);

        $matches = [];

        // Check active students
        $activeStudent = Student::with(['user', 'program'])
            ->whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })
            ->where('first_name', 'LIKE', $validated['first_name'])
            ->where('last_name', 'LIKE', $validated['last_name'])
            ->where('birth_date', $validated['birth_date'])
            ->first();

        if ($activeStudent) {
            $matches[] = [
                'type' => 'active',
                'confidence' => 'high',
                'student' => [
                    'id' => $activeStudent->id,
                    'student_number' => $activeStudent->student_number,
                    'first_name' => $activeStudent->first_name,
                    'last_name' => $activeStudent->last_name,
                    'middle_name' => $activeStudent->middle_name,
                    'email' => $activeStudent->user->email,
                    'birth_date' => $activeStudent->birth_date,
                    'program' => $activeStudent->program?->program_name,
                    'year_level' => $activeStudent->year_level,
                    'education_level' => $activeStudent->education_level,
                    'student_type' => $activeStudent->student_type,
                    'phone' => $activeStudent->phone,
                    'address' => $activeStudent->address,
                ],
            ];
        }

        // Check archived students
        $archivedStudent = ArchivedStudent::with(['user', 'program'])
            ->whereHas('user', function ($query) use ($validated) {
                $query->where('email', $validated['email']);
            })
            ->where('first_name', 'LIKE', $validated['first_name'])
            ->where('last_name', 'LIKE', $validated['last_name'])
            ->where('birth_date', $validated['birth_date'])
            ->first();

        if ($archivedStudent) {
            $matches[] = [
                'type' => 'archived',
                'confidence' => 'high',
                'student' => [
                    'id' => $archivedStudent->id,
                    'student_number' => $archivedStudent->student_number,
                    'first_name' => $archivedStudent->first_name,
                    'last_name' => $archivedStudent->last_name,
                    'middle_name' => $archivedStudent->middle_name,
                    'email' => $archivedStudent->user?->email,
                    'birth_date' => $archivedStudent->birth_date,
                    'program' => $archivedStudent->program?->program_name,
                    'year_level' => $archivedStudent->year_level,
                    'education_level' => $archivedStudent->education_level,
                    'archived_at' => $archivedStudent->archived_at?->format('M d, Y'),
                    'phone' => $archivedStudent->phone,
                    'address' => $archivedStudent->address,
                ],
            ];
        }

        // Check for potential matches (same email but different name/birthdate)
        if (empty($matches)) {
            $emailMatch = Student::with(['user', 'program'])
                ->whereHas('user', function ($query) use ($validated) {
                    $query->where('email', $validated['email']);
                })
                ->first();

            if ($emailMatch) {
                $matches[] = [
                    'type' => 'active',
                    'confidence' => 'medium',
                    'reason' => 'Same email, different name or birthdate',
                    'student' => [
                        'id' => $emailMatch->id,
                        'student_number' => $emailMatch->student_number,
                        'first_name' => $emailMatch->first_name,
                        'last_name' => $emailMatch->last_name,
                        'middle_name' => $emailMatch->middle_name,
                        'email' => $emailMatch->user->email,
                        'birth_date' => $emailMatch->birth_date,
                        'program' => $emailMatch->program?->program_name,
                        'year_level' => $emailMatch->year_level,
                        'education_level' => $emailMatch->education_level,
                    ],
                ];
            }
        }

        return response()->json([
            'has_duplicates' => ! empty($matches),
            'matches' => $matches,
            'checked_at' => now()->toISOString(),
        ]);
    }

    /**
     * Show academic history page for a student
     */
    public function academicHistory(Student $student)
    {
        // Load student with necessary relationships
        $student->load(['user', 'program', 'curriculum']);

        // Get curriculum subjects
        $curriculumSubjects = [];
        if ($student->curriculum_id) {
            $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                ->whereIn('semester', ['1st', '2nd'])
                ->orderBy('year_level')
                ->orderByRaw("FIELD(semester, '1st', '2nd')")
                ->get();
        }

        // Get all subject grades with details (completed and incomplete)
        // Use associative array to prevent duplicates
        $subjectGradesMap = [];
        $completedSubjects = [];

        // Get subjects with grades (including incomplete ones)
        $gradesQuery = \App\Models\StudentGrade::whereHas('studentEnrollment', function ($query) use ($student) {
            $query->where('student_id', $student->id);
        })
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
            ->get();

        foreach ($gradesQuery as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subject = $grade->sectionSubject->subject;
                $teacher = $grade->sectionSubject->teacher;

                // Skip if we already have this subject (keep the first/latest entry)
                if (isset($subjectGradesMap[$subject->subject_code])) {
                    continue;
                }

                // Determine missing grades
                $missingGrades = [];
                if (is_null($grade->prelim_grade)) {
                    $missingGrades[] = 'Prelim';
                }
                if (is_null($grade->midterm_grade)) {
                    $missingGrades[] = 'Midterm';
                }
                if (is_null($grade->prefinal_grade)) {
                    $missingGrades[] = 'Prefinal';
                }
                if (is_null($grade->final_grade)) {
                    $missingGrades[] = 'Final';
                }

                $gradeInfo = [
                    'subject_id' => $subject->id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'type' => 'graded',
                    'teacher_name' => $teacher ? $teacher->user->name : null,
                    'prelim_grade' => $grade->prelim_grade,
                    'midterm_grade' => $grade->midterm_grade,
                    'prefinal_grade' => $grade->prefinal_grade,
                    'final_grade' => $grade->final_grade,
                    'semester_grade' => $grade->semester_grade,
                    'missing_grades' => $missingGrades,
                    'is_complete' => ! empty($grade->final_grade),
                ];

                $subjectGradesMap[$subject->subject_code] = $gradeInfo;

                // Add to completed if final grade exists
                if ($grade->final_grade) {
                    $completedSubjects[] = [
                        'subject_id' => $subject->id,
                        'subject_code' => $subject->subject_code,
                        'subject_name' => $subject->subject_name,
                        'type' => 'graded',
                    ];
                }
            }
        }

        // Get credited subjects (for transferees/shiftees) - from StudentSubjectCredit
        $creditedSubjects = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject', 'studentCreditTransfer'])
            ->get();

        // Also get credited subjects from StudentCreditTransfer (for credit transfers)
        $creditTransfers = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->with(['subject'])
            ->get();

        foreach ($creditedSubjects as $credited) {
            if ($credited->subject) {
                // Skip if we already have this subject
                if (isset($subjectGradesMap[$credited->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $credited->subject->id,
                    'subject_code' => $credited->subject->subject_code,
                    'subject_name' => $credited->subject->subject_name,
                    'type' => 'credited',
                    'credit_type' => $credited->credit_type,
                    'final_grade' => $credited->final_grade,
                    'credited_from' => $credited->studentCreditTransfer ? $credited->studentCreditTransfer->previous_school : null,
                    'credited_at' => $credited->credited_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$credited->subject->subject_code] = $creditInfo;

                $completedSubjects[] = [
                    'subject_id' => $credited->subject->id,
                    'subject_code' => $credited->subject->subject_code,
                    'subject_name' => $credited->subject->subject_name,
                    'type' => 'credited',
                ];
            }
        }

        // Process credit transfers
        foreach ($creditTransfers as $transfer) {
            if ($transfer->subject) {
                // Skip if we already have this subject
                if (isset($subjectGradesMap[$transfer->subject->subject_code])) {
                    continue;
                }

                $creditInfo = [
                    'subject_id' => $transfer->subject->id,
                    'subject_code' => $transfer->subject->subject_code,
                    'subject_name' => $transfer->subject->subject_name,
                    'type' => 'credited',
                    'credit_type' => $transfer->transfer_type,
                    'final_grade' => $transfer->verified_semester_grade,
                    'credited_from' => $transfer->previous_school,
                    'credited_at' => $transfer->approved_at,
                    'is_complete' => true,
                ];

                $subjectGradesMap[$transfer->subject->subject_code] = $creditInfo;

                $completedSubjects[] = [
                    'subject_id' => $transfer->subject->id,
                    'subject_code' => $transfer->subject->subject_code,
                    'subject_name' => $transfer->subject->subject_name,
                    'type' => 'credited',
                ];
            }
        }

        // Convert map to array
        $subjectGrades = array_values($subjectGradesMap);

        // Get archived enrollments
        $archivedEnrollments = \App\Models\ArchivedStudentEnrollment::where('student_id', $student->id)
            ->with('archivedSection.program')
            ->orderBy('academic_year', 'desc')
            ->orderByRaw("FIELD(semester, 'second', 'first', 'summer')")
            ->get();

        return Inertia::render('Registrar/Students/AcademicHistory', [
            'student' => $student,
            'curriculumSubjects' => $curriculumSubjects,
            'completedSubjects' => $completedSubjects,
            'subjectGrades' => $subjectGrades,
            'archivedEnrollments' => $archivedEnrollments,
        ]);
    }
}
