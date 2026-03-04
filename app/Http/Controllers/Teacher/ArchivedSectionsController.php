<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\StudentGrade;
use App\Models\StudentSubjectCredit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Inertia\Inertia;
use Inertia\Response;

class ArchivedSectionsController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            // Return empty paginator if no teacher found
            $emptyPaginator = new \Illuminate\Pagination\LengthAwarePaginator(
                [],
                0,
                12,
                1,
                ['path' => $request->url(), 'query' => $request->query()]
            );

            return Inertia::render('Teacher/ArchivedSections/Index', [
                'archivedSectionGroups' => $emptyPaginator->toArray(),
            ]);
        }

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

        // Group sections by academic year and semester
        $groupedSections = $archivedSections->groupBy(function ($section) {
            return $section->academic_year.'|'.$section->semester;
        })->map(function ($sections, $key) use ($teacher) {
            [$academicYear, $semester] = explode('|', $key, 2);

            // Calculate totals for this academic year/semester
            $totalSections = $sections->count();

            // Get all archived student subjects taught by this teacher in this period
            $teacherSubjects = ArchivedStudentSubject::whereIn('archived_student_enrollment_id',
                ArchivedStudentEnrollment::whereIn('archived_section_id', $sections->pluck('id'))
                    ->pluck('id')
            )->where('teacher_id', $teacher->id)->get();

            // Count unique students
            $totalStudents = $teacherSubjects->pluck('student_id')->unique()->count();

            // Count completed and dropped subjects
            $totalCompleted = $teacherSubjects->where('semester_grade', '>=', 75)->count();
            $totalDropped = $teacherSubjects->where('semester_grade', '<', 75)->whereNotNull('semester_grade')->count();

            // Calculate average grade
            $grades = $teacherSubjects->pluck('semester_grade')->filter()->values();
            $averageGrade = $grades->isNotEmpty() ? $grades->avg() : null;

            // Get education level breakdown
            $educationLevels = $sections->groupBy(function ($section) {
                return $section->program?->education_level ?? 'unknown';
            })->map->count();

            return [
                'academic_year' => $academicYear,
                'semester' => $semester,
                'total_sections' => $totalSections,
                'total_students' => $totalStudents,
                'total_completed' => $totalCompleted,
                'total_dropped' => $totalDropped,
                'average_grade' => $averageGrade ? round($averageGrade, 2) : null,
                'education_levels' => $educationLevels,
                'sections' => $sections->toArray(),
            ];
        })->values();

        // Paginate the grouped data
        $currentPage = $request->get('page', 1);
        $perPage = 12; // Show fewer groups per page since they contain more info
        $total = $groupedSections->count();
        $paginatedGroups = $groupedSections->forPage($currentPage, $perPage);

        // Convert to simple array for better serialization
        $groupedSectionsArray = $groupedSections->toArray();

        $groupedSectionsPaginated = new \Illuminate\Pagination\LengthAwarePaginator(
            $groupedSectionsArray,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/ArchivedSections/Index', [
            'archivedSectionGroups' => $groupedSectionsPaginated,
        ]);
    }

    public function showByPeriod(Request $request): Response
    {
        $teacher = $request->user()->teacher;
        $academicYear = $request->query('academic_year');
        $semester = $request->query('semester');

        if (! $academicYear || ! $semester) {
            abort(400, 'Academic year and semester are required.');
        }

        // Get archived sections for this specific period where teacher taught subjects
        $archivedSections = ArchivedSection::with(['archivedEnrollments', 'program', 'curriculum'])
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
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
            ->map(function ($section) use ($teacher) {
                // Calculate teacher-specific stats for this section
                $courseData = $section->course_data ?? [];
                $teacherSubjectIds = collect($courseData)
                    ->where('teacher_id', $teacher->id)
                    ->pluck('id');

                // Get enrollments for subjects taught by this teacher
                $teacherEnrollments = ArchivedStudentSubject::whereIn('archived_student_enrollment_id',
                    ArchivedStudentEnrollment::where('archived_section_id', $section->id)->pluck('id')
                )->where('teacher_id', $teacher->id)->get();

                // Calculate teacher-specific stats
                $teacherStudents = $teacherEnrollments->pluck('student_id')->unique()->count();
                $teacherCompleted = $teacherEnrollments->where('semester_grade', '>=', 75)->count();

                // Add teacher-specific data to section
                $section->teacher_students = $teacherStudents;
                $section->teacher_completed = $teacherCompleted;

                return $section;
            })
            ->values();

        return Inertia::render('Teacher/ArchivedSections/ShowByPeriod', [
            'archivedSections' => $archivedSections->toArray(),
            'academicYear' => $academicYear,
            'semester' => $semester,
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

        // Get current student data for all archived enrollments
        $studentIds = $archivedSection->archivedEnrollments->pluck('student_id')->unique()->filter();
        $currentStudents = \App\Models\Student::whereIn('id', $studentIds)
            ->with('user')
            ->get()
            ->keyBy('id');

        // Filter out dropped students and process remaining enrollments to check grade status
        $enrollmentsWithStatus = $archivedSection->archivedEnrollments
            ->filter(function ($enrollment) {
                return $enrollment->final_status !== 'dropped';
            })
            ->map(function ($enrollment) use ($currentStudents) {
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
                    'student_data' => $currentStudents->has($enrollment->student_id) ? [
                        'name' => $this->formatStudentName($currentStudents[$enrollment->student_id]),
                        'student_number' => $currentStudents[$enrollment->student_id]->student_number ?? 'Unknown',
                        'first_name' => $currentStudents[$enrollment->student_id]->first_name ?? '',
                        'last_name' => $currentStudents[$enrollment->student_id]->last_name ?? '',
                        'middle_name' => $currentStudents[$enrollment->student_id]->middle_name ?? '',
                        'suffix' => $currentStudents[$enrollment->student_id]->suffix ?? '',
                    ] : ($enrollment->student_data ?? []),
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

    public function showSubjectGrades(Request $request, ArchivedSection $archivedSection, $subjectId): Response
    {
        $teacher = $request->user()->teacher;

        // Verify teacher taught at least one subject in this section
        $courseData = $archivedSection->course_data ?? [];
        $taughtSection = false;
        $subject = null;
        foreach ($courseData as $course) {
            if (isset($course['teacher_id']) && $course['teacher_id'] == $teacher->id) {
                $taughtSection = true;
                // Find the specific subject
                if ((isset($course['id']) && $course['id'] == $subjectId) ||
                    (isset($course['subject_code']) && $course['subject_code'] == $subjectId)) {
                    $subject = $course;
                }
            }
        }

        if (! $taughtSection) {
            abort(403, 'You do not have access to this archived section.');
        }

        if (! $subject) {
            abort(404, 'Subject not found or you do not teach this subject.');
        }

        $archivedSection->load(['archivedEnrollments', 'program', 'curriculum']);

        // Get current student data for all archived enrollments
        $studentIds = $archivedSection->archivedEnrollments->pluck('student_id')->unique()->filter();
        $currentStudents = \App\Models\Student::whereIn('id', $studentIds)
            ->with('user')
            ->get()
            ->keyBy('id');

        // Filter out dropped students and process remaining enrollments to check grade status
        // Try to use normalized archived subject rows for this specific subject first
        $archivedEnrollmentIds = $archivedSection->archivedEnrollments->pluck('id')->filter()->values();
        $enrollmentsWithStatus = collect();

        if ($archivedEnrollmentIds->isNotEmpty()) {
            $subjectMatchQuery = \App\Models\ArchivedStudentSubject::whereIn('archived_student_enrollment_id', $archivedEnrollmentIds);

            // Match by subject_id or subject_code or section_subject_id
            if (is_numeric($subjectId)) {
                $subjectMatchQuery->where(function ($q) use ($subjectId) {
                    $q->where('subject_id', (int) $subjectId)
                        ->orWhere('subject_code', (string) $subjectId)
                        ->orWhere('section_subject_id', (int) $subjectId);
                });
            } else {
                $subjectMatchQuery->where('subject_code', (string) $subjectId);
            }

            $subjectRows = $subjectMatchQuery->get();

            if ($subjectRows->isNotEmpty()) {
                // Determine if this is SHS or college based on archived section data
                $isShsLevel = false;
                if (isset($archivedSection->program) && $archivedSection->program) {
                    $programName = strtolower($archivedSection->program->program_name ?? '');
                    $educationLevel = strtolower($archivedSection->program->education_level ?? '');
                    $yearLevel = $archivedSection->year_level;

                    $shsNameIndicators = ['senior high', 'shs', 'grade 11', 'grade 12'];
                    $isShsLevel =
                        collect($shsNameIndicators)->some(fn ($indicator) => str_contains($programName, $indicator)) ||
                        $educationLevel === 'senior_high' ||
                        in_array($yearLevel, [11, 12, '11', '12'], true);
                }

                foreach ($subjectRows as $row) {
                    $enrollment = $archivedSection->archivedEnrollments->firstWhere('id', $row->archived_student_enrollment_id);

                    if ($isShsLevel) {
                        // SHS quarters (only Q1 and Q2)
                        $missing = [];
                        if (is_null($row->first_quarter_grade)) {
                            $missing[] = 'Q1';
                        }
                        if (is_null($row->second_quarter_grade)) {
                            $missing[] = 'Q2';
                        }

                        $gradeStatus = count($missing) > 0 ? 'Missing Grades' : 'Complete';

                        $enrollmentsWithStatus->push([
                            'id' => $row->archived_student_enrollment_id,
                            'student_id' => $row->student_id,
                            'student_data' => $currentStudents->has($row->student_id) ? [
                                'name' => $this->formatStudentName($currentStudents[$row->student_id]),
                                'student_number' => $currentStudents[$row->student_id]->student_number ?? 'Unknown',
                                'first_name' => $currentStudents[$row->student_id]->first_name ?? '',
                                'last_name' => $currentStudents[$row->student_id]->last_name ?? '',
                                'middle_name' => $currentStudents[$row->student_id]->middle_name ?? '',
                                'suffix' => $currentStudents[$row->student_id]->suffix ?? '',
                            ] : ($enrollment?->student_data ?? []),
                            'final_grades' => [
                                'first_quarter' => $row->first_quarter_grade,
                                'second_quarter' => $row->second_quarter_grade,
                            ],
                            'final_semester_grade' => $row->semester_grade,
                            'final_status' => $enrollment?->final_status ?? 'archived',
                            'grade_status' => $gradeStatus,
                            'missing_grades' => $missing,
                            'teacher_remarks' => $enrollment?->teacher_remarks ?? null,
                        ]);
                    } else {
                        // College terms
                        $missing = [];
                        if (is_null($row->prelim_grade)) {
                            $missing[] = 'Prelim';
                        }
                        if (is_null($row->midterm_grade)) {
                            $missing[] = 'Midterm';
                        }
                        if (is_null($row->prefinal_grade)) {
                            $missing[] = 'Prefinal';
                        }
                        if (is_null($row->final_grade)) {
                            $missing[] = 'Final';
                        }

                        $gradeStatus = count($missing) > 0 ? 'Missing Grades' : 'Complete';

                        $enrollmentsWithStatus->push([
                            'id' => $row->archived_student_enrollment_id,
                            'student_id' => $row->student_id,
                            'student_data' => $currentStudents->has($row->student_id) ? [
                                'name' => $this->formatStudentName($currentStudents[$row->student_id]),
                                'student_number' => $currentStudents[$row->student_id]->student_number ?? 'Unknown',
                                'first_name' => $currentStudents[$row->student_id]->first_name ?? '',
                                'last_name' => $currentStudents[$row->student_id]->last_name ?? '',
                                'middle_name' => $currentStudents[$row->student_id]->middle_name ?? '',
                                'suffix' => $currentStudents[$row->student_id]->suffix ?? '',
                            ] : ($enrollment?->student_data ?? []),
                            'final_grades' => [
                                'prelim' => $row->prelim_grade,
                                'midterm' => $row->midterm_grade,
                                'prefinals' => $row->prefinal_grade,
                                'finals' => $row->final_grade,
                            ],
                            'final_semester_grade' => $row->semester_grade,
                            'final_status' => $enrollment?->final_status ?? 'archived',
                            'grade_status' => $gradeStatus,
                            'missing_grades' => $missing,
                            'teacher_remarks' => $enrollment?->teacher_remarks ?? null,
                        ]);
                    }
                }

                return Inertia::render('Teacher/ArchivedSections/SubjectGrades', [
                    'archivedSection' => $archivedSection,
                    'subject' => $subject,
                    'enrollments' => $enrollmentsWithStatus->values(),
                ]);
            }
        }

        // Fallback to enrollment-level final_grades JSON if no normalized rows exist
        // Determine if this is SHS or college based on archived section data
        $isShsLevel = false;
        if (isset($archivedSection->program) && $archivedSection->program) {
            $programName = strtolower($archivedSection->program->program_name ?? '');
            $educationLevel = strtolower($archivedSection->program->education_level ?? '');
            $yearLevel = $archivedSection->year_level;

            $shsNameIndicators = ['senior high', 'shs', 'grade 11', 'grade 12'];
            $isShsLevel =
                collect($shsNameIndicators)->some(fn ($indicator) => str_contains($programName, $indicator)) ||
                $educationLevel === 'senior_high' ||
                in_array($yearLevel, [11, 12, '11', '12'], true);
        }

        $enrollmentsWithStatus = $archivedSection->archivedEnrollments
            ->filter(function ($enrollment) {
                return $enrollment->final_status !== 'dropped';
            })
            ->map(function ($enrollment) use ($currentStudents, $isShsLevel) {
                $finalGrades = $enrollment->final_grades ?? [];

                if ($isShsLevel) {
                    // Check SHS quarter grades (only Q1 and Q2)
                    $requiredGrades = ['first_quarter', 'second_quarter'];
                    $missingGrades = [];

                    foreach ($requiredGrades as $grade) {
                        if (empty($finalGrades[$grade])) {
                            $displayName = match ($grade) {
                                'first_quarter' => 'Q1',
                                'second_quarter' => 'Q2',
                                default => ucfirst(str_replace('_', ' ', $grade))
                            };
                            $missingGrades[] = $displayName;
                        }
                    }
                } else {
                    // Check college term grades
                    $requiredGrades = ['prelim', 'midterm', 'prefinals', 'finals'];
                    $missingGrades = [];

                    foreach ($requiredGrades as $grade) {
                        if (empty($finalGrades[$grade])) {
                            $missingGrades[] = ucfirst($grade);
                        }
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
                    'student_data' => $currentStudents->has($enrollment->student_id) ? [
                        'name' => $this->formatStudentName($currentStudents[$enrollment->student_id]),
                        'student_number' => $currentStudents[$enrollment->student_id]->student_number ?? 'Unknown',
                        'first_name' => $currentStudents[$enrollment->student_id]->first_name ?? '',
                        'last_name' => $currentStudents[$enrollment->student_id]->last_name ?? '',
                        'middle_name' => $currentStudents[$enrollment->student_id]->middle_name ?? '',
                        'suffix' => $currentStudents[$enrollment->student_id]->suffix ?? '',
                    ] : ($enrollment->student_data ?? []),
                    'final_grades' => $finalGrades,
                    'final_semester_grade' => $enrollment->final_semester_grade,
                    'final_status' => $enrollment->final_status,
                    'grade_status' => $gradeStatus,
                    'missing_grades' => $missingGradesList,
                    'teacher_remarks' => $enrollment->teacher_remarks ?? null,
                ];
            });

        return Inertia::render('Teacher/ArchivedSections/SubjectGrades', [
            'archivedSection' => $archivedSection,
            'subject' => $subject,
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

        // Validate the request - support both college and SHS grades
        $validator = Validator::make($request->all(), [
            'enrollment_id' => 'required|exists:archived_student_enrollments,id',
            'section_subject_id' => 'nullable',
            'subject_id' => 'nullable',
            'subject_code' => 'nullable|string',
            'grades.prelim' => 'nullable|numeric|min:0|max:100',
            'grades.midterm' => 'nullable|numeric|min:0|max:100',
            'grades.prefinals' => 'nullable|numeric|min:0|max:100',
            'grades.finals' => 'nullable|numeric|min:0|max:100',
            'grades.first_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.second_quarter' => 'nullable|numeric|min:0|max:100',
            'grades.teacher_remarks' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return back()->withErrors($validator);
        }

        // Find the enrollment
        $enrollment = ArchivedStudentEnrollment::where('id', $request->enrollment_id)
            ->where('archived_section_id', $archivedSection->id)
            ->firstOrFail();

        // Prevent editing grades for dropped students
        if ($enrollment->final_status === 'dropped') {
            abort(403, 'Cannot edit grades for dropped students.');
        }

        // Update the final_grades JSON field
        $finalGrades = $enrollment->final_grades ?? [];
        $grades = $request->grades;

        // Determine if this is SHS or college based on archived section data
        $isShsLevel = false;
        if (isset($archivedSection->program) && $archivedSection->program) {
            $programName = strtolower($archivedSection->program->program_name ?? '');
            $educationLevel = strtolower($archivedSection->program->education_level ?? '');
            $yearLevel = $archivedSection->year_level;

            $shsIndicators = ['senior high', 'shs', 'grade 11', 'grade 12'];
            foreach ($shsIndicators as $indicator) {
                if (strpos($programName, $indicator) !== false) {
                    $isShsLevel = true;
                    break;
                }
            }

            if (! $isShsLevel) {
                $isShsLevel = $educationLevel === 'senior_high' || in_array($yearLevel, [11, 12, '11', '12', 'Grade 11', 'Grade 12'], true);
            }
        }

        if ($isShsLevel) {
            // Update SHS quarter grades (only Q1 and Q2)
            foreach (['first_quarter', 'second_quarter'] as $gradeType) {
                if (isset($grades[$gradeType]) && $grades[$gradeType] !== '') {
                    $finalGrades[$gradeType] = (float) $grades[$gradeType];
                }
            }

            // Calculate new final semester grade if both quarters are present
            if (isset($finalGrades['first_quarter'], $finalGrades['second_quarter'])) {
                $finalSemesterGrade = (
                    $finalGrades['first_quarter'] +
                    $finalGrades['second_quarter']
                ) / 2;

                $enrollment->final_semester_grade = round($finalSemesterGrade);
            }
        } else {
            // Update college grades
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

                $enrollment->final_semester_grade = round($finalSemesterGrade);
            }
        }

        $enrollment->final_grades = $finalGrades;

        // Update teacher remarks if provided
        if (isset($grades['teacher_remarks'])) {
            $enrollment->teacher_remarks = $grades['teacher_remarks'];
        }

        $enrollment->save();

        // Update the original grade tables if the record exists
        if ($enrollment->original_enrollment_id) {
            if ($isShsLevel) {
                // Update SHS student grades (only Q1 and Q2)
                $shsStudentGrade = \App\Models\ShsStudentGrade::where('student_enrollment_id', $enrollment->original_enrollment_id)
                    ->where('section_subject_id', $request->section_subject_id ?? null)
                    ->first();

                if ($shsStudentGrade) {
                    // Map archived grades to SHS grade columns
                    if (isset($finalGrades['first_quarter'])) {
                        $shsStudentGrade->first_quarter_grade = $finalGrades['first_quarter'];
                    }
                    if (isset($finalGrades['second_quarter'])) {
                        $shsStudentGrade->second_quarter_grade = $finalGrades['second_quarter'];
                    }

                    // Update final grade if both quarters are present
                    if (isset($finalGrades['first_quarter'], $finalGrades['second_quarter'])) {
                        $shsStudentGrade->final_grade = $enrollment->final_semester_grade;
                        $shsStudentGrade->completion_status = $enrollment->final_semester_grade >= 75 ? 'passed' : 'failed';
                    }

                    $shsStudentGrade->save();
                }
            } else {
                // Update college student grades
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
        }

        // Also keep normalized archived_subject rows in sync when possible
        try {
            $archivedSubjectQuery = ArchivedStudentSubject::where('archived_student_enrollment_id', $enrollment->id);
            $sectionSubjectId = $request->input('section_subject_id');
            $subjectId = $request->input('subject_id');
            $subjectCode = $request->input('subject_code');

            if ($sectionSubjectId) {
                $archivedSubjectQuery->where('section_subject_id', $sectionSubjectId);
            } elseif ($subjectId || $subjectCode) {
                $archivedSubjectQuery->where(function ($q) use ($subjectId, $subjectCode) {
                    if ($subjectId) {
                        $q->orWhere('subject_id', $subjectId);
                    }
                    if ($subjectCode) {
                        $q->orWhere('subject_code', $subjectCode);
                    }
                });
            }

            $archivedSubject = $archivedSubjectQuery->first();

            if (! $archivedSubject && ($sectionSubjectId || $subjectId || $subjectCode)) {
                $archivedSubject = new ArchivedStudentSubject;
                $archivedSubject->archived_student_enrollment_id = $enrollment->id;
                $archivedSubject->student_id = $enrollment->student_id;
                $archivedSubject->original_enrollment_id = $enrollment->original_enrollment_id;
                $archivedSubject->section_subject_id = $sectionSubjectId;
                $archivedSubject->subject_id = $subjectId;
                $archivedSubject->subject_code = $subjectCode;
                $archivedSubject->teacher_id = $teacher->id;
            }

            if ($archivedSubject) {
                // Map enrollment-level final_grades to normalized fields if present
                if (isset($finalGrades['prelim'])) {
                    $archivedSubject->prelim_grade = $finalGrades['prelim'];
                }
                if (isset($finalGrades['midterm'])) {
                    $archivedSubject->midterm_grade = $finalGrades['midterm'];
                }
                if (isset($finalGrades['prefinals'])) {
                    $archivedSubject->prefinal_grade = $finalGrades['prefinals'];
                }
                if (isset($finalGrades['finals'])) {
                    $archivedSubject->final_grade = $finalGrades['finals'];
                }

                if ($enrollment->final_semester_grade !== null) {
                    $archivedSubject->semester_grade = $enrollment->final_semester_grade;
                }

                $archivedSubject->save();
            }
        } catch (\Throwable $e) {
            // Don't block UI if archived subject sync fails; log for investigation
            Log::warning('Failed to sync archived_student_subject after grades update', ['error' => $e->getMessage(), 'enrollment_id' => $enrollment->id]);
        }

        // Always return JSON since the frontend uses Inertia and handles toasts itself
        return response()->json([
            'success' => true,
            'message' => 'Grades updated successfully',
        ]);
    }

    /**
     * Format a student's full name from individual name components
     */
    private function formatStudentName($student): string
    {
        $parts = [
            $student->first_name,
            $student->middle_name,
            $student->last_name,
        ];

        if ($student->suffix) {
            $parts[] = $student->suffix;
        }

        return implode(' ', array_filter($parts));
    }
}
