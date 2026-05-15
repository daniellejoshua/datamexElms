<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ArchivedStudentEnrollment;
use App\Models\CourseMaterial;
use App\Models\CurriculumSubject;
use App\Models\MaterialAccessLog;
use App\Models\SchoolSetting;
use App\Models\Student;
use App\Models\StudentSemesterPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class SubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Ensure student relationship is loaded
        if (! $user->student) {
            abort(404, 'Student profile not found');
        }

        $student = $user->student;

        // Get current academic year and semester from school settings
        $currentYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();
        $normalizedCurrentSemester = $this->normalizeSemester($currentSemester);

        // Get current payment status for the student
        $paymentStatus = StudentSemesterPayment::where('student_id', $student->id)
            ->where('academic_year', $currentYear)
            ->where('semester', $currentSemester)
            ->first();

        // Get all enrollments with subject details (only those with sections) - filter by current semester
        // For irregular students, get all enrollments in current semester (they might have multiple sections)
        // For regular students, only get active enrollments
        if ($student->student_type === 'irregular') {
            $enrollments = $student->studentEnrollments()
                ->whereNotNull('section_id')
                ->where('academic_year', $currentYear)
                ->where('semester', $currentSemester)
                ->with([
                    'section' => function ($query) {
                        $query->select('id', 'section_name', 'year_level', 'program_id', 'academic_year', 'semester');
                    },
                    'section.program' => function ($query) {
                        $query->select('id', 'program_name', 'program_code');
                    },
                    'section.sectionSubjects' => function ($query) {
                        $query->select('id', 'section_id', 'subject_id', 'teacher_id', 'schedule_days', 'start_time', 'end_time', 'room');
                    },
                    'section.sectionSubjects.subject' => function ($query) {
                        $query->select('id', 'subject_code', 'subject_name', 'units', 'description');
                    },
                    'section.sectionSubjects.teacher' => function ($query) {
                        $query->select('id', 'user_id');
                    },
                    'section.sectionSubjects.teacher.user' => function ($query) {
                        $query->select('id', 'name');
                    },
                    'section.courseMaterials' => function ($query) {
                        $query->where('is_active', true)
                            ->where('visibility', 'all_students')
                            ->select('id', 'section_id', 'teacher_id', 'title', 'description', 'file_name', 'file_path', 'file_type', 'file_size', 'original_name', 'upload_date', 'created_at');
                    },
                ])
                ->get();
        } else {
            $enrollments = $student->studentEnrollments()
                ->whereNotNull('section_id')
                ->where('status', 'active')
                ->where('academic_year', $currentYear)
                ->where('semester', $currentSemester)
                ->with([
                    'section' => function ($query) {
                        $query->select('id', 'section_name', 'year_level', 'program_id', 'academic_year', 'semester');
                    },
                    'section.program' => function ($query) {
                        $query->select('id', 'program_name', 'program_code');
                    },
                    'section.sectionSubjects' => function ($query) {
                        $query->select('id', 'section_id', 'subject_id', 'teacher_id', 'schedule_days', 'start_time', 'end_time', 'room');
                    },
                    'section.sectionSubjects.subject' => function ($query) {
                        $query->select('id', 'subject_code', 'subject_name', 'units', 'description');
                    },
                    'section.sectionSubjects.teacher' => function ($query) {
                        $query->select('id', 'user_id');
                    },
                    'section.sectionSubjects.teacher.user' => function ($query) {
                        $query->select('id', 'name');
                    },
                    'section.courseMaterials' => function ($query) {
                        $query->where('is_active', true)
                            ->where('visibility', 'all_students')
                            ->select('id', 'section_id', 'teacher_id', 'title', 'description', 'file_name', 'file_path', 'file_type', 'file_size', 'original_name', 'upload_date', 'created_at');
                    },
                ])
                ->get();
        }

        // Get subjects with grades to determine which subjects the student is actually taking
        // For irregular students, get ALL grades from current semester (they can be in multiple sections)
        // For regular students, only from active enrollments
        if ($student->student_type === 'irregular') {
            $studentGrades = $student->studentGrades()
                ->with(['sectionSubject.subject', 'sectionSubject.teacher.user', 'studentEnrollment.section.program'])
                ->whereHas('studentEnrollment', function ($query) use ($student, $currentYear, $currentSemester) {
                    $query->where('student_id', $student->id)
                        ->where('academic_year', $currentYear)
                        ->where('semester', $currentSemester);
                })
                ->get();
        } else {
            $studentGrades = $student->studentGrades()
                ->with(['sectionSubject.subject', 'sectionSubject.teacher.user', 'studentEnrollment.section.program'])
                ->whereHas('studentEnrollment', function ($query) use ($student, $currentYear, $currentSemester) {
                    $query->where('student_id', $student->id)
                        ->where('status', 'active')
                        ->where('academic_year', $currentYear)
                        ->where('semester', $currentSemester);
                })
                ->get();
        }

        // Get SHS grades for SHS students
        $shsStudentGrades = collect();
        foreach ($enrollments as $enrollment) {
            if ($enrollment->section && in_array($enrollment->section->year_level, [11, 12])) {
                $enrollmentShsGrades = $enrollment->shsStudentGrades()
                    ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
                    ->get();
                $shsStudentGrades = $shsStudentGrades->merge($enrollmentShsGrades);
            }
        }

        // Group grades by subject to avoid duplicates
        $subjectGradesMap = [];
        foreach ($studentGrades as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subjectCode = $grade->sectionSubject->subject->subject_code;
                if (! isset($subjectGradesMap[$subjectCode])) {
                    $subjectGradesMap[$subjectCode] = [
                        'type' => 'college',
                        'grade' => $grade,
                    ];
                }
            }
        }

        // Add SHS grades to the map
        foreach ($shsStudentGrades as $grade) {
            if ($grade->sectionSubject && $grade->sectionSubject->subject) {
                $subjectCode = $grade->sectionSubject->subject->subject_code;
                if (! isset($subjectGradesMap[$subjectCode])) {
                    $subjectGradesMap[$subjectCode] = [
                        'type' => 'shs',
                        'grade' => $grade,
                    ];
                }
            }
        }

        // Transform the data for easier frontend consumption
        $subjects = [];

        if ($student->student_type === 'irregular') {
            // For irregular students: show only subjects they are specifically enrolled in
            // via StudentSubjectEnrollments (not all subjects from sections)
            $subjectEnrollments = $student->studentSubjectEnrollments()
                ->where('academic_year', $currentYear)
                ->where('semester', $currentSemester)
                ->with([
                    'sectionSubject' => function ($query) {
                        $query->with([
                            'subject',
                            'teacher.user',
                            'section.program',
                        ]);
                    },
                ])
                ->get();

            // Transform the data for easier frontend consumption
            foreach ($subjectEnrollments as $subjectEnrollment) {
                $sectionSubject = $subjectEnrollment->sectionSubject;
                if (! $sectionSubject || ! $sectionSubject->subject) {
                    continue;
                }

                $subject = $sectionSubject->subject;
                $teacher = $sectionSubject->teacher;
                $section = $sectionSubject->section;

                // Check if we have grades for this subject
                $gradeData = $subjectGradesMap[$subject->subject_code] ?? null;
                $gradesData = null;
                $gradeType = null;

                if ($gradeData) {
                    $grade = $gradeData['grade'];
                    $gradeType = $gradeData['type'];

                    // Prepare grades based on type
                    if ($gradeType === 'college') {
                        $gradesData = [
                            'prelim_grade' => $grade->prelim_grade,
                            'midterm_grade' => $grade->midterm_grade,
                            'prefinal_grade' => $grade->prefinal_grade,
                            'final_grade' => $grade->final_grade,
                            'semester_grade' => $grade->semester_grade,
                            'teacher_remarks' => $grade->teacher_remarks ?? null,
                            'status' => $grade->overall_status,
                        ];
                    } elseif ($gradeType === 'shs') {
                        $gradesData = [
                            'q1_grade' => $grade->first_quarter_grade,
                            'q2_grade' => $grade->second_quarter_grade,
                            'final_grade' => $grade->final_grade,
                            'semester_grade' => $grade->final_grade,
                            'teacher_remarks' => $grade->teacher_remarks ?? null,
                            'status' => $grade->completion_status,
                        ];
                    }
                }

                // Filter materials for this specific teacher
                $sectionMaterials = $section?->courseMaterials
                    ->where('teacher_id', $sectionSubject->teacher_id)
                    ->map(function ($material) use ($student) {
                        // Check if student has accessed this material
                        $hasAccessed = MaterialAccessLog::where('student_id', $student->id)
                            ->where('material_id', $material->id)
                            ->exists();

                        return [
                            'id' => $material->id,
                            'title' => $material->title,
                            'description' => $material->description,
                            'type' => pathinfo($material->original_name, PATHINFO_EXTENSION),
                            'size' => $material->formatted_file_size,
                            'uploadDate' => $material->upload_date?->format('Y-m-d'),
                            'downloadUrl' => route('student.materials.download', $material->id),
                            'isNew' => ! $hasAccessed && $material->created_at >= now()->subDays(7),
                        ];
                    })
                    ->values();

                $subjects[] = [
                    'id' => $subject->id,
                    'subject_code' => $subject->subject_code,
                    'subject_name' => $subject->subject_name,
                    'units' => $subject->units,
                    'description' => $subject->description,
                    'teacher_name' => $teacher?->user?->name ?? 'TBA',
                    'section_name' => $section?->section_name ?? 'TBA',
                    'program_name' => $section?->program?->program_name ?? 'TBA',
                    'program_code' => $section?->program?->program_code ?? 'TBA',
                    'year_level' => $section?->year_level ?? null,
                    'academic_year' => $section?->academic_year ?? $currentYear,
                    'semester' => $section?->semester ?? $currentSemester,
                    'schedule_days' => $sectionSubject->schedule_days,
                    'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                    'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                    'room' => $sectionSubject->room,
                    'section_subject_id' => $sectionSubject->id,
                    'materials' => $sectionMaterials,
                    'grades' => $gradesData,
                ];
            }
        } else {
            // Build curriculum subject filter for regular students.
            // Only subjects in the student's assigned curriculum for the
            // current year/semester should be shown.
            $curriculumSubjectMap = collect();
            if (! empty($student->curriculum_id)) {
                $curriculumSubjectMap = CurriculumSubject::query()
                    ->where('curriculum_id', $student->curriculum_id)
                    ->get()
                    ->groupBy(function ($row) {
                        return (int) $row->year_level.'|'.$this->normalizeSemester((string) $row->semester);
                    });
            }

            // For regular students: show all subjects in their enrolled sections
            foreach ($enrollments as $enrollment) {
                // Skip enrollments without sections
                if (! $enrollment->section) {
                    continue;
                }

                $sectionYearLevel = (int) ($enrollment->section->year_level ?? 0);
                $curriculumKey = $sectionYearLevel.'|'.$normalizedCurrentSemester;
                $allowedSubjectIds = $curriculumSubjectMap->has($curriculumKey)
                    ? $curriculumSubjectMap->get($curriculumKey)->pluck('subject_id')->unique()->values()->all()
                    : [];

                // If student has an assigned curriculum and it has entries for this
                // year/semester, enforce that filter strictly.
                $enforceCurriculum = ! empty($student->curriculum_id) && count($allowedSubjectIds) > 0;

                foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                    $subject = $sectionSubject->subject;
                    if (! $subject) {
                        continue;
                    }

                    if ($enforceCurriculum && ! in_array($subject->id, $allowedSubjectIds, true)) {
                        continue;
                    }

                    $teacher = $sectionSubject->teacher;

                    // Get student grades for this enrollment (College)
                    $studentGrades = $enrollment->studentGrades()
                        ->where('teacher_id', $sectionSubject->teacher_id)
                        ->first();

                    // Get SHS grades for this enrollment (SHS)
                    $shsStudentGrades = $enrollment->shsStudentGrades()
                        ->where('teacher_id', $sectionSubject->teacher_id)
                        ->first();

                    // Determine which grades to use based on year level
                    $gradesData = null;
                    $gradeType = null;
                    if ($enrollment->section->year_level >= 11 && $enrollment->section->year_level <= 12) {
                        // SHS student
                        if ($shsStudentGrades) {
                            $gradesData = [
                                'q1_grade' => $shsStudentGrades->first_quarter_grade,
                                'q2_grade' => $shsStudentGrades->second_quarter_grade,
                                'final_grade' => $shsStudentGrades->final_grade,
                                'semester_grade' => $shsStudentGrades->final_grade,
                                'teacher_remarks' => $shsStudentGrades->teacher_remarks ?? null,
                                'status' => $shsStudentGrades->completion_status,
                            ];
                            $gradeType = 'shs';
                        }
                    } else {
                        // College student
                        if ($studentGrades) {
                            $gradesData = [
                                'prelim_grade' => $studentGrades->prelim_grade,
                                'midterm_grade' => $studentGrades->midterm_grade,
                                'prefinal_grade' => $studentGrades->prefinal_grade,
                                'final_grade' => $studentGrades->final_grade,
                                'semester_grade' => $studentGrades->semester_grade,
                                'teacher_remarks' => $studentGrades->teacher_remarks ?? null,
                                'status' => $studentGrades->overall_status,
                            ];
                            $gradeType = 'college';
                        }
                    }

                    // Filter materials for this specific teacher
                    $sectionMaterials = $enrollment->section->courseMaterials
                        ->where('teacher_id', $sectionSubject->teacher_id)
                        ->map(function ($material) use ($student) {
                            // Check if student has accessed this material
                            $hasAccessed = MaterialAccessLog::where('student_id', $student->id)
                                ->where('material_id', $material->id)
                                ->exists();

                            return [
                                'id' => $material->id,
                                'title' => $material->title,
                                'description' => $material->description,
                                'type' => pathinfo($material->original_name, PATHINFO_EXTENSION),
                                'size' => $material->formatted_file_size,
                                'uploadDate' => $material->upload_date?->format('Y-m-d'),
                                'downloadUrl' => route('student.materials.download', $material->id),
                                'isNew' => ! $hasAccessed && $material->created_at >= now()->subDays(7), // Mark as new if not accessed and uploaded in last 7 days
                            ];
                        })
                        ->values();

                    $subjects[] = [
                        'id' => $subject->id,
                        'subject_code' => $subject->subject_code,
                        'subject_name' => $subject->subject_name,
                        'units' => $subject->units,
                        'description' => $subject->description,
                        'teacher_name' => $teacher?->user?->name ?? 'TBA',
                        'section_name' => $enrollment->section->section_name,
                        'program_name' => $enrollment->section->program->program_name,
                        'program_code' => $enrollment->section->program->program_code,
                        'year_level' => $enrollment->section->year_level,
                        'academic_year' => $enrollment->section->academic_year,
                        'semester' => $enrollment->section->semester,
                        'schedule_days' => $sectionSubject->schedule_days,
                        'start_time' => $sectionSubject->start_time ? substr($sectionSubject->start_time, 0, 5) : null,
                        'end_time' => $sectionSubject->end_time ? substr($sectionSubject->end_time, 0, 5) : null,
                        'room' => $sectionSubject->room,
                        'section_subject_id' => $sectionSubject->id,
                        'materials' => $sectionMaterials,
                        'grades' => $gradesData,
                    ];
                }
            }
        }

        // Get archived enrollments for the student
        $archivedEnrollments = ArchivedStudentEnrollment::with('archivedSection')
            ->where('student_id', $student->id)
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        // Determine visible grade periods server-side (same rules as GradesController)
        $visiblePeriods = [
            'prelim' => false,
            'midterm' => false,
            'prefinal' => false,
            'final' => false,
            'semester' => false,
        ];

        if ($paymentStatus) {
            if ($paymentStatus->balance <= 0) {
                $visiblePeriods = array_fill_keys(array_keys($visiblePeriods), true);
            } else {
                if (! empty($paymentStatus->final_paid)) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => true, 'semester' => false];
                } elseif (! empty($paymentStatus->prefinal_paid)) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => true, 'final' => false, 'semester' => false];
                } elseif (! empty($paymentStatus->midterm_paid)) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => true, 'prefinal' => false, 'final' => false, 'semester' => false];
                } elseif (! empty($paymentStatus->prelim_paid)) {
                    $visiblePeriods = ['prelim' => true, 'midterm' => false, 'prefinal' => false, 'final' => false, 'semester' => false];
                }
            }
        }

        return Inertia::render('Student/Subjects/Index', [
            'subjects' => $subjects,
            'student' => $student->load('user'),
            'archivedEnrollments' => $archivedEnrollments,
            'paymentStatus' => $paymentStatus,
            'visibleGradePeriods' => $visiblePeriods,
        ]);
    }

    private function normalizeSemester(?string $semester): string
    {
        $value = strtolower(trim((string) $semester));

        return match ($value) {
            '1', '1st', 'first' => '1st',
            '2', '2nd', 'second' => '2nd',
            'annual', 'yearly' => 'annual',
            default => $value,
        };
    }

    public function downloadMaterial(Request $request, CourseMaterial $material)
    {
        $user = $request->user();

        // Ensure student relationship is loaded
        if (! $user->student) {
            abort(404, 'Student profile not found');
        }

        $student = $user->student;

        // Check if student has access to this material through their enrollment
        $hasAccess = $student->studentEnrollments()
            ->where('section_id', $material->section_id)
            ->where('status', 'active')
            ->exists();

        if (! $hasAccess) {
            abort(403, 'You do not have access to this material.');
        }

        // Check if material exists and is active
        if (! $material->is_active || ! Storage::disk(config('filesystems.default'))->exists($material->file_path)) {
            abort(404, 'Material not found.');
        }

        // Log the download if MaterialAccessLog exists
        if (class_exists(MaterialAccessLog::class)) {
            MaterialAccessLog::create([
                'student_id' => $student->id,
                'material_id' => $material->id,
                'accessed_at' => now(),
                'download_completed' => true,
            ]);
        }

        // Increment download count
        $material->increment('download_count');

        return Storage::disk(config('filesystems.default'))->download($material->file_path, $material->original_name);
    }

    public function markMaterialAsViewed(Request $request, CourseMaterial $material)
    {
        $user = $request->user();

        // Ensure student relationship is loaded
        if (! $user->student) {
            abort(404, 'Student profile not found');
        }

        $student = $user->student;

        // Check if student has access to this material through their enrollment
        $hasAccess = $student->studentEnrollments()
            ->where('section_id', $material->section_id)
            ->where('status', 'active')
            ->exists();

        if (! $hasAccess) {
            abort(403, 'You do not have access to this material.');
        }

        // Create access log if it doesn't exist (to mark as viewed)
        MaterialAccessLog::firstOrCreate([
            'student_id' => $student->id,
            'material_id' => $material->id,
        ], [
            'accessed_at' => now(),
            'download_completed' => false,
        ]);

        return response()->json(['success' => true]);
    }
}
