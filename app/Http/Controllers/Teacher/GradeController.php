<?php

namespace App\Http\Controllers\Teacher;

use App\Exports\GradeTemplateExport;
use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Imports\GradeImport;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\ShsStudentGrade;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use App\Models\Teacher;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class GradeController extends Controller
{
    /**
     * Show grades for a specific section subject
     */
    public function show(SectionSubject $sectionSubject): Response
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section subject
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized access to this section subject.');
        }

        // Load the section and subject relationships
        $sectionSubject->load(['section.program', 'subject']);

        $section = $sectionSubject->section;

        // Get students enrolled in this specific subject for this teacher
        // This includes both regular students (enrolled through section) and irregular students (enrolled per subject)
        $subjectEnrollments = StudentSubjectEnrollment::with([
            'student.user',
            'sectionSubject.subject',
        ])
            ->where('section_subject_id', $sectionSubject->id)
            ->where('status', 'active')
            ->whereHas('student.user', function ($query) {
                $query->whereNotNull('name')
                    ->where('name', '!=', '')
                    ->where('name', 'not like', '%Unknown%');
            })
            ->get();

        // Load section's program for determining education level
        $section->load('program');

        // Transform to maintain compatibility with existing frontend
        $enrollments = collect();

        foreach ($subjectEnrollments as $subjectEnrollment) {
            // Find the student's enrollment in this section
            $studentEnrollment = StudentEnrollment::with([
                'student.user',
                'section',
                'studentGrades' => function ($query) use ($sectionSubject) {
                    $query->where('section_subject_id', $sectionSubject->id);
                },
                'shsStudentGrades' => function ($query) use ($sectionSubject) {
                    $query->where('section_subject_id', $sectionSubject->id);
                },
            ])
                ->where('section_id', $section->id)
                ->where('student_id', $subjectEnrollment->student_id)
                ->where('status', 'active')
                ->first();

            if ($studentEnrollment) {
                // Add subject enrollment info to the student enrollment
                $studentEnrollment->subject_enrollment = $subjectEnrollment;
                $enrollments->push($studentEnrollment);
            } else {
                // For students without section enrollment (irregular), find or create a real enrollment
                // This happens when a student is enrolled only in specific subjects
                $enrollment = StudentEnrollment::firstOrCreate([
                    'student_id' => $subjectEnrollment->student_id,
                    'section_id' => $section->id,
                    'status' => 'active',
                ], [
                    'enrollment_type' => 'irregular',
                    'enrollment_date' => now(),
                    'enrolled_by' => $teacher->id,
                    'academic_year' => SchoolSetting::getCurrentAcademicYear(),
                    'semester' => SchoolSetting::getCurrentSemester(),
                ]);

                // Load grades for this enrollment
                $enrollment->load([
                    'student.user',
                    'section',
                    'studentGrades' => function ($query) use ($sectionSubject) {
                        $query->where('section_subject_id', $sectionSubject->id);
                    },
                    'shsStudentGrades' => function ($query) use ($sectionSubject) {
                        $query->where('section_subject_id', $sectionSubject->id);
                    },
                ]);

                $enrollment->subject_enrollment = $subjectEnrollment;
                $enrollment->enrollment_type = 'irregular';
                $enrollments->push($enrollment);
            }
        }

        // Determine if this is college or SHS based on section
        // Check multiple ways to determine if it's college level:
        // 1. Check program type/name for college indicators
        // 2. Check year level format variations
        $isCollegeLevel = false;
        $isShsLevel = false;

        if ($section->program) {
            // Check if program name contains college indicators
            $programName = strtolower($section->program->program_name ?? '');
            $collegeIndicators = ['bachelor', 'bs', 'ba', 'bsit', 'bscs', 'college'];

            foreach ($collegeIndicators as $indicator) {
                if (strpos($programName, $indicator) !== false) {
                    $isCollegeLevel = true;
                    break;
                }
            }

            // Check if program name contains SHS indicators
            $shsIndicators = ['senior high', 'shs', 'grade 11', 'grade 12', '11', '12'];

            foreach ($shsIndicators as $indicator) {
                if (strpos($programName, $indicator) !== false) {
                    $isShsLevel = true;
                    break;
                }
            }
        }

        // If not determined by program, check year level
        if (! $isCollegeLevel && ! $isShsLevel) {
            $yearLevel = $section->year_level;

            // Check various year level formats
            $collegeYearFormats = [
                '1st Year', '2nd Year', '3rd Year', '4th Year',
                '1', '2', '3', '4',
                1, 2, 3, 4,
            ];

            $shsYearFormats = [
                'Grade 11', 'Grade 12', '11', '12',
                11, 12,
            ];

            $isCollegeLevel = in_array($yearLevel, $collegeYearFormats, true);
            $isShsLevel = in_array($yearLevel, $shsYearFormats, true);
        }

        return Inertia::render('Teacher/Grades/Show', [
            'section' => $section->load(['program', 'sectionSubjects.subject']),
            'sectionSubject' => $sectionSubject,
            'enrollments' => $enrollments,
            'isCollegeLevel' => $isCollegeLevel,
            'isShsLevel' => $isShsLevel,
            'teacher' => $teacher,
        ]);
    }

    /**
     * Update grades for students in a section subject
     */
    public function updateGrades(Request $request, SectionSubject $sectionSubject)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section subject
        if ($sectionSubject->teacher_id !== $teacher->id) {
            abort(403, 'Unauthorized access to this section subject.');
        }

        \Log::info('Grade update request received', [
            'teacher_id' => $teacher->id,
            'section_subject_id' => $sectionSubject->id,
            'request_data' => $request->all(),
        ]);

        $validated = $request->validate([
            'data.grades' => 'required|array',
            'data.grades.*.enrollment_id' => 'required|string',
            'data.grades.*.prelim_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.midterm_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.prefinal_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.final_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.first_quarter_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.second_quarter_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.third_quarter_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.fourth_quarter_grade' => 'nullable|numeric|between:0,100',
            'data.grades.*.teacher_remarks' => 'nullable|string|max:1000',
        ]);

        \Log::info('Validation passed, processing grades', ['grades_count' => count($validated['data']['grades'])]);

        foreach ($validated['data']['grades'] as $gradeData) {
            // Handle both regular and irregular enrollments
            if (str_starts_with($gradeData['enrollment_id'], 'subject_enrollment_')) {
                // Irregular student - find or create enrollment
                $subjectEnrollmentId = str_replace('subject_enrollment_', '', $gradeData['enrollment_id']);
                $subjectEnrollment = StudentSubjectEnrollment::findOrFail($subjectEnrollmentId);

                // Find or create a student enrollment for this irregular student
                $enrollment = StudentEnrollment::firstOrCreate([
                    'student_id' => $subjectEnrollment->student_id,
                    'section_id' => $sectionSubject->section_id,
                    'status' => 'active',
                ], [
                    'enrollment_type' => 'irregular',
                    'enrollment_date' => now(),
                    'enrolled_by' => $teacher->id,
                    'academic_year' => SchoolSetting::getCurrentAcademicYear(),
                    'semester' => SchoolSetting::getCurrentSemester(),
                ]);

                $studentId = $subjectEnrollment->student_id;
            } else {
                // Regular student - find enrollment
                $enrollment = StudentEnrollment::findOrFail($gradeData['enrollment_id']);
                $studentId = $enrollment->student_id;
            }

            // Determine if this is college or SHS with improved logic
            $enrollment->section->load('program');

            $isCollegeLevel = false;

            if ($enrollment->section->program) {
                $programName = strtolower($enrollment->section->program->program_name ?? '');
                $collegeIndicators = ['bachelor', 'bs', 'ba', 'bsit', 'bscs', 'college'];

                foreach ($collegeIndicators as $indicator) {
                    if (strpos($programName, $indicator) !== false) {
                        $isCollegeLevel = true;
                        break;
                    }
                }
            }

            if (! $isCollegeLevel) {
                $yearLevel = $enrollment->section->year_level;
                $collegeYearFormats = [
                    '1st Year', '2nd Year', '3rd Year', '4th Year',
                    '1', '2', '3', '4',
                    1, 2, 3, 4,
                ];

                $isCollegeLevel = in_array($yearLevel, $collegeYearFormats, true);
            }

            if ($isCollegeLevel) {
                // Handle college grades
                $grade = StudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'section_subject_id' => $sectionSubject->id,
                    'teacher_id' => $teacher->id,
                ]);

                $grade->prelim_grade = $gradeData['prelim_grade'] ?? null;
                $grade->midterm_grade = $gradeData['midterm_grade'] ?? null;
                $grade->prefinal_grade = $gradeData['prefinal_grade'] ?? null;
                $grade->final_grade = $gradeData['final_grade'] ?? null;
                $grade->teacher_remarks = $gradeData['teacher_remarks'] ?? null;

                // Calculate semester grade if all components are present
                if ($grade->prelim_grade !== null && $grade->midterm_grade !== null && $grade->prefinal_grade !== null && $grade->final_grade !== null) {
                    $grade->semester_grade = round(($grade->prelim_grade + $grade->midterm_grade + $grade->prefinal_grade + $grade->final_grade) / 4);
                    $grade->overall_status = $grade->semester_grade >= 60 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($gradeData['prelim_grade'] !== null && ! $grade->prelim_submitted_at) {
                    $grade->prelim_submitted_at = now();
                }
                if ($gradeData['midterm_grade'] !== null && ! $grade->midterm_submitted_at) {
                    $grade->midterm_submitted_at = now();
                }
                if ($gradeData['prefinal_grade'] !== null && ! $grade->prefinal_submitted_at) {
                    $grade->prefinal_submitted_at = now();
                }
                if ($gradeData['final_grade'] !== null && ! $grade->final_submitted_at) {
                    $grade->final_submitted_at = now();
                }

                $grade->save();
            } else {
                // Handle SHS grades - determine if it's SHS level
                $isShsLevel = false;
                if ($enrollment->section->program) {
                    $programName = strtolower($enrollment->section->program->program_name ?? '');
                    $shsIndicators = ['senior high', 'shs', 'grade 11', 'grade 12', '11', '12'];

                    foreach ($shsIndicators as $indicator) {
                        if (strpos($programName, $indicator) !== false) {
                            $isShsLevel = true;
                            break;
                        }
                    }
                }

                if (! $isShsLevel) {
                    $yearLevel = $enrollment->section->year_level;
                    $shsYearFormats = ['Grade 11', 'Grade 12', '11', '12', 11, 12];
                    $isShsLevel = in_array($yearLevel, $shsYearFormats, true);
                }

                $grade = ShsStudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'section_subject_id' => $sectionSubject->id,
                    'teacher_id' => $teacher->id,
                ]);

                $grade->first_quarter_grade = $gradeData['first_quarter_grade'] ?? null;
                $grade->second_quarter_grade = $gradeData['second_quarter_grade'] ?? null;
                $grade->third_quarter_grade = $gradeData['third_quarter_grade'] ?? null;
                $grade->fourth_quarter_grade = $gradeData['fourth_quarter_grade'] ?? null;
                $grade->teacher_remarks = $gradeData['teacher_remarks'] ?? null;

                // Calculate final grade - SHS only uses Q1 and Q2
                if ($grade->first_quarter_grade !== null && $grade->second_quarter_grade !== null) {
                    $grade->final_grade = round(($grade->first_quarter_grade + $grade->second_quarter_grade) / 2);
                    $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($gradeData['first_quarter_grade'] !== null && ! $grade->first_quarter_submitted_at) {
                    $grade->first_quarter_submitted_at = now();
                }
                if ($gradeData['second_quarter_grade'] !== null && ! $grade->second_quarter_submitted_at) {
                    $grade->second_quarter_submitted_at = now();
                }

                $grade->save();
            }
        }

        return redirect()->back()->with('success', 'Grades updated successfully.');
    }

    /**
     * Import grades from Excel file
     */
    public function importGrades(Request $request, SectionSubject $sectionSubject)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section subject or any subject in the same section
        $isAuthorized = $sectionSubject->teacher_id === $teacher->id;

        if (! $isAuthorized) {
            // Check if teacher is assigned to any subject in the same section
            $isAuthorized = SectionSubject::where('section_id', $sectionSubject->section_id)
                ->where('teacher_id', $teacher->id)
                ->exists();
        }

        if (! $isAuthorized) {
            abort(403, 'Unauthorized access to import grades for this section.');
        }

        $request->validate([
            'grades_file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            \Log::info('Starting grade import', [
                'section_subject_id' => $sectionSubject->id,
                'teacher_id' => $teacher->id,
                'file_name' => $request->file('grades_file')->getClientOriginalName(),
                'file_size' => $request->file('grades_file')->getSize(),
                'user_id' => $user->id,
                'csrf_token_present' => $request->has('_token'),
            ]);

            Excel::import(new GradeImport($sectionSubject, $teacher), $request->file('grades_file'));

            \Log::info('Grade import completed successfully');

            $warnings = session('grade_import_warnings', []);
            $successes = session('grade_import_successes', []);
            $stats = session('grade_import_stats', []);

            $message = 'Grades imported successfully.';
            if (! empty($stats)) {
                $message = sprintf(
                    'Import completed! %d of %d rows processed successfully. %s',
                    $stats['successful_imports'] ?? 0,
                    $stats['total_rows_processed'] ?? 0,
                    ! empty($warnings) ? 'Some rows had warnings.' : 'All grades imported without issues!'
                );
            }

            return response()->json([
                'message' => $message,
                'warnings' => $warnings,
                'successes' => $successes,
                'stats' => $stats,
            ]);
        } catch (\Exception $e) {
            \Log::error('Grade import failed', [
                'error' => $e->getMessage(),
                'section_subject_id' => $sectionSubject->id,
                'teacher_id' => $teacher->id,
                'user_id' => $user->id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Error importing grades: '.$e->getMessage()], 422);
        }
    }

    /**
     * Download grade template
     */
    public function downloadTemplate(SectionSubject $sectionSubject)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section subject or any subject in the same section
        $isAuthorized = $sectionSubject->teacher_id === $teacher->id;

        if (! $isAuthorized) {
            // Check if teacher is assigned to any subject in the same section
            $isAuthorized = SectionSubject::where('section_id', $sectionSubject->section_id)
                ->where('teacher_id', $teacher->id)
                ->exists();
        }

        if (! $isAuthorized) {
            abort(403, 'You are not authorized to download templates for this section.');
        }

        // Get students enrolled in this specific subject
        $subjectEnrollments = StudentSubjectEnrollment::with([
            'student.user',
            'student.enrollments' => function ($query) use ($sectionSubject) {
                $query->where('section_id', $sectionSubject->section_id);
            },
        ])
            ->where('section_subject_id', $sectionSubject->id)
            ->where('status', 'active')
            ->whereHas('student.user', function ($query) {
                $query->whereNotNull('name')
                    ->where('name', '!=', '')
                    ->where('name', 'not like', '%Unknown%');
            })
            ->get();

        // Transform to enrollment format for the export
        $enrollments = $subjectEnrollments->map(function ($subjectEnrollment) {
            // Find the student's enrollment in this section
            $enrollment = $subjectEnrollment->student->enrollments->first();

            if (! $enrollment) {
                // Create a mock enrollment for irregular students
                $enrollment = (object) [
                    'student' => $subjectEnrollment->student,
                ];
            }

            return $enrollment;
        })->filter();

        // Determine if college or SHS based on section
        $section = $sectionSubject->section;
        $isCollegeLevel = in_array($section->year_level, [1, 2, 3, 4]);

        // Build a friendly file name: {SectionName}_{AcademicYear}_Sem{Semester}_{SubjectName}.xlsx
        $sanitize = function ($str) {
            $clean = preg_replace('/[^A-Za-z0-9\- _]/', '', $str);
            $clean = preg_replace('/\s+/', '_', trim($clean));

            return $clean ?: 'section';
        };

        $sectionName = $sanitize($section->formatted_name ?? $section->section_name ?? $section->section_code ?? 'section');
        $subjectName = $sanitize($sectionSubject->subject->subject_name ?? $sectionSubject->subject->subject_code ?? 'subject');
        $academicYear = $sanitize($section->academic_year ?? 'year');
        $semester = $sanitize('Sem'.$section->semester);

        $fileName = "grades_{$sectionName}_{$academicYear}_{$semester}_{$subjectName}.xlsx";

        return Excel::download(new GradeTemplateExport($enrollments, $isCollegeLevel, $sectionSubject, $teacher), $fileName);
    }

    /**
     * Export grades to PDF
     */
    public function exportPdf(Request $request, SectionSubject $sectionSubject)
    {
        try {
            $user = Auth::user();
            $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

            // Verify teacher is assigned to this section subject
            if ($sectionSubject->teacher_id !== $teacher->id) {
                return response()->json(['error' => 'Unauthorized access to this section subject.'], 403);
            }

            // Get export options
            $separateByGender = $request->boolean('separate_by_gender', false);
            $gradeFormat = $request->input('grade_format', 'numeric'); // 'numeric' or 'gpa'

            // Determine if college or SHS based on section
            $isCollegeLevel = false;
            $isShsLevel = false;

            // Helper function to convert grade based on format
            $convertGrade = function ($grade) use ($gradeFormat) {
                if ($grade === null || $grade === '') {
                    return '';
                }

                $numericGrade = (float) $grade;

                if ($gradeFormat === 'gpa') {
                    // Delegate conversion to AcademicHelper so the logic is centralized
                    $gpa = AcademicHelper::convertToGPA($numericGrade);

                    return $gpa ?? '';
                }

                // Default to numeric format, properly rounded to whole number
                return number_format(round($numericGrade), 0);
            };

            // Helper function to format student name as "LastName, FirstName MiddleInitial."
            $formatStudentName = function ($fullName) {
                if (! $fullName || trim($fullName) === '') {
                    return 'UNKNOWN STUDENT';
                }

                $nameParts = explode(' ', trim($fullName));
                if (count($nameParts) === 1) {
                    return strtoupper($fullName);
                }

                // Last name is the last part
                $lastName = strtoupper(end($nameParts));

                // First name is the first part
                $firstName = strtoupper($nameParts[0]);

                // Middle name/initial is everything in between
                $middleInitial = '';
                if (count($nameParts) > 2) {
                    $middleParts = array_slice($nameParts, 1, -1);
                    $middleInitial = strtoupper(implode('', array_map(function ($part) {
                        return substr($part, 0, 1);
                    }, $middleParts))).'.';
                }

                return trim("{$lastName}, {$firstName} {$middleInitial}");
            };

            // Helper function to format section name as "PROGRAM-yearlevel section name"
            $formatSectionName = function ($section) {
                $programCode = $section->program->program_code ?? 'N/A';
                $yearLevel = $section->year_level ?? '';

                // Get identifier (usually the letter part like A, B, C, D)
                $identifierMatch = preg_match('/([A-Za-z]+)$/', $section->section_name, $matches);
                $identifier = $identifierMatch ? strtoupper($matches[1]) : '';

                if ($yearLevel && $identifier) {
                    return "{$programCode}-{$yearLevel}{$identifier}";
                } elseif ($identifier) {
                    return "{$programCode}-{$identifier}";
                }

                // Fallback to original section name if parsing fails
                return $section->section_name;
            };

            // Load the section and subject relationships
            $sectionSubject->load(['section.program', 'subject']);

            $section = $sectionSubject->section;

            if (! $section) {
                return response()->json(['error' => 'Section not found for this section subject.'], 404);
            }

            // Determine if college or SHS based on section
            $isCollegeLevel = in_array($section->year_level, [1, 2, 3, 4]);
            $isShsLevel = in_array($section->year_level, [11, 12]);

            // Get students enrolled in this specific subject for this teacher
            $subjectEnrollments = StudentSubjectEnrollment::with([
                'student.user',
                'sectionSubject.subject',
            ])
                ->where('section_subject_id', $sectionSubject->id)
                ->where('status', 'active')
                ->whereHas('student.user', function ($query) {
                    $query->whereNotNull('name')
                        ->where('name', '!=', '')
                        ->where('name', 'not like', '%Unknown%');
                })
                ->get();

            // Transform to enrollment format
            $enrollments = $subjectEnrollments->map(function ($subjectEnrollment) {
                // Find the student's enrollment in this section
                $enrollment = $subjectEnrollment->student->enrollments->first();

                if (! $enrollment) {
                    // Create a mock enrollment for irregular students
                    $enrollment = (object) [
                        'student' => $subjectEnrollment->student,
                    ];
                }

                return $enrollment;
            })->filter();

            if ($enrollments->isEmpty()) {
                return response()->json(['error' => 'No students found for this section subject.'], 404);
            }

            // Sort by last name
            $enrollments = $enrollments->sort(function ($a, $b) {
                $nameA = $a->student->user->name ?? '';
                $nameB = $b->student->user->name ?? '';

                // Split names and get last name
                $partsA = explode(' ', $nameA);
                $partsB = explode(' ', $nameB);

                $lastNameA = count($partsA) > 1 ? end($partsA) : $nameA;
                $lastNameB = count($partsB) > 1 ? end($partsB) : $nameB;

                return strcmp($lastNameA, $lastNameB);
            });

            // Helper function to convert grade based on format
            $convertGrade = function ($grade) use ($gradeFormat) {
                if ($grade === null || $grade === '') {
                    return '';
                }

                $numericGrade = (float) $grade;

                if ($gradeFormat === 'gpa') {
                    // Delegate to AcademicHelper for GPA scale
                    $gpa = AcademicHelper::convertToGPA($numericGrade);

                    return $gpa ?? '';
                }

                // Default to numeric format, properly rounded to whole number
                return number_format(round($numericGrade), 0);
            };

            // Helper function to format student name as "LastName, FirstName MiddleInitial."
            $formatStudentName = function ($fullName) {
                if (! $fullName || trim($fullName) === '') {
                    return 'UNKNOWN STUDENT';
                }

                $nameParts = explode(' ', trim($fullName));
                if (count($nameParts) === 1) {
                    return strtoupper($fullName);
                }

                // Last name is the last part
                $lastName = strtoupper(end($nameParts));

                // First name is the first part
                $firstName = strtoupper($nameParts[0]);

                // Middle name/initial is everything in between
                $middleInitial = '';
                if (count($nameParts) > 2) {
                    $middleParts = array_slice($nameParts, 1, -1);
                    $middleInitial = strtoupper(implode('', array_map(function ($part) {
                        return substr($part, 0, 1);
                    }, $middleParts))).'.';
                }

                return trim("{$lastName}, {$firstName} {$middleInitial}");
            };

            // Helper function to format section name as "PROGRAM-yearlevel section name"
            $formatSectionName = function ($section) {
                $programCode = $section->program->program_code ?? 'N/A';
                $yearLevel = $section->year_level ?? '';

                // Get identifier (usually the letter part like A, B, C, D)
                $identifierMatch = preg_match('/([A-Za-z]+)$/', $section->section_name, $matches);
                $identifier = $identifierMatch ? strtoupper($matches[1]) : '';

                if ($yearLevel && $identifier) {
                    return "{$programCode}-{$yearLevel}{$identifier}";
                } elseif ($identifier) {
                    return "{$programCode}-{$identifier}";
                }

                // Fallback to original section name if parsing fails
                return $section->section_name;
            };

            if ($separateByGender) {
                // Separate by gender: create two sections
                $maleStudents = $enrollments->filter(function ($enrollment) {
                    return $enrollment->student->gender === 'male';
                });

                $femaleStudents = $enrollments->filter(function ($enrollment) {
                    return $enrollment->student->gender === 'female';
                });

                // Prepare data for PDF with gender separation
                $grades = [];

                // Add male students
                if ($maleStudents->isNotEmpty()) {
                    $grades[] = ['section' => 'MALE STUDENTS', 'isHeader' => true];
                    foreach ($maleStudents as $enrollment) {
                        $studentGrades = $enrollment->student->studentGrades()
                            ->where('section_subject_id', $sectionSubject->id)
                            ->first();

                        $shsStudentGrades = $enrollment->student->shsStudentGrades()
                            ->where('section_subject_id', $sectionSubject->id)
                            ->first();

                        $gradeData = [
                            'student_name' => $formatStudentName($enrollment->student->user->name ?? 'Unknown Student'),
                            'student_id' => $enrollment->student->student_number ?? $enrollment->student->student_id ?? 'N/A',
                        ];

                        if ($isCollegeLevel) {
                            $gradeData = array_merge($gradeData, [
                                'prelim_grade' => $convertGrade($studentGrades->prelim_grade ?? ''),
                                'midterm_grade' => $convertGrade($studentGrades->midterm_grade ?? ''),
                                'prefinal_grade' => $convertGrade($studentGrades->prefinal_grade ?? ''),
                                'final_grade' => $convertGrade($studentGrades->final_grade ?? ''),
                                'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                                'remarks' => $studentGrades->teacher_remarks ?? '',
                            ]);
                        } elseif ($isShsLevel) {
                            $gradeData = array_merge($gradeData, [
                                'q1_grade' => $convertGrade($shsStudentGrades->first_quarter_grade ?? ''),
                                'q2_grade' => $convertGrade($shsStudentGrades->second_quarter_grade ?? ''),
                                'semester_grade' => $convertGrade($shsStudentGrades->final_grade ?? ''),
                                'remarks' => $shsStudentGrades->teacher_remarks ?? '',
                            ]);
                        } else {
                            $gradeData = array_merge($gradeData, [
                                'q1_grade' => $convertGrade($studentGrades->first_quarter_grade ?? ''),
                                'q2_grade' => $convertGrade($studentGrades->second_quarter_grade ?? ''),
                                'q3_grade' => $convertGrade($studentGrades->third_quarter_grade ?? ''),
                                'q4_grade' => $convertGrade($studentGrades->fourth_quarter_grade ?? ''),
                                'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                                'remarks' => $studentGrades->teacher_remarks ?? '',
                            ]);
                        }

                        $grades[] = $gradeData;
                    }
                }

                // Add female students
                if ($femaleStudents->isNotEmpty()) {
                    $grades[] = ['section' => 'FEMALE STUDENTS', 'isHeader' => true];
                    foreach ($femaleStudents as $enrollment) {
                        $studentGrades = $enrollment->student->studentGrades()
                            ->where('section_subject_id', $sectionSubject->id)
                            ->first();

                        $shsStudentGrades = $enrollment->student->shsStudentGrades()
                            ->where('section_subject_id', $sectionSubject->id)
                            ->first();

                        $gradeData = [
                            'student_name' => $formatStudentName($enrollment->student->user->name ?? 'Unknown Student'),
                            'student_id' => $enrollment->student->student_number ?? $enrollment->student->student_id ?? 'N/A',
                        ];

                        if ($isCollegeLevel) {
                            $gradeData = array_merge($gradeData, [
                                'prelim_grade' => $convertGrade($studentGrades->prelim_grade ?? ''),
                                'midterm_grade' => $convertGrade($studentGrades->midterm_grade ?? ''),
                                'prefinal_grade' => $convertGrade($studentGrades->prefinal_grade ?? ''),
                                'final_grade' => $convertGrade($studentGrades->final_grade ?? ''),
                                'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                                'remarks' => $studentGrades->teacher_remarks ?? '',
                            ]);
                        } elseif ($isShsLevel) {
                            $gradeData = array_merge($gradeData, [
                                'q1_grade' => $convertGrade($shsStudentGrades->first_quarter_grade ?? ''),
                                'q2_grade' => $convertGrade($shsStudentGrades->second_quarter_grade ?? ''),
                                'semester_grade' => $convertGrade($shsStudentGrades->final_grade ?? ''),
                                'remarks' => $shsStudentGrades->teacher_remarks ?? '',
                            ]);
                        } else {
                            $gradeData = array_merge($gradeData, [
                                'q1_grade' => $convertGrade($studentGrades->first_quarter_grade ?? ''),
                                'q2_grade' => $convertGrade($studentGrades->second_quarter_grade ?? ''),
                                'q3_grade' => $convertGrade($studentGrades->third_quarter_grade ?? ''),
                                'q4_grade' => $convertGrade($studentGrades->fourth_quarter_grade ?? ''),
                                'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                                'remarks' => $studentGrades->teacher_remarks ?? '',
                            ]);
                        }

                        $grades[] = $gradeData;
                    }
                }
            } else {
                // Alphabetical order only
                $grades = [];
                foreach ($enrollments as $enrollment) {
                    $studentGrades = $enrollment->student->studentGrades()
                        ->where('section_subject_id', $sectionSubject->id)
                        ->first();

                    $shsStudentGrades = $enrollment->student->shsStudentGrades()
                        ->where('section_subject_id', $sectionSubject->id)
                        ->first();

                    $gradeData = [
                        'student_name' => $formatStudentName($enrollment->student->user->name ?? 'Unknown Student'),
                        'student_id' => $enrollment->student->student_number ?? $enrollment->student->student_id ?? 'N/A',
                    ];

                    if ($isCollegeLevel) {
                        $gradeData = array_merge($gradeData, [
                            'prelim_grade' => $convertGrade($studentGrades->prelim_grade ?? ''),
                            'midterm_grade' => $convertGrade($studentGrades->midterm_grade ?? ''),
                            'prefinal_grade' => $convertGrade($studentGrades->prefinal_grade ?? ''),
                            'final_grade' => $convertGrade($studentGrades->final_grade ?? ''),
                            'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                            'remarks' => $studentGrades->teacher_remarks ?? '',
                        ]);
                    } elseif ($isShsLevel) {
                        $gradeData = array_merge($gradeData, [
                            'q1_grade' => $convertGrade($shsStudentGrades->first_quarter_grade ?? ''),
                            'q2_grade' => $convertGrade($shsStudentGrades->second_quarter_grade ?? ''),
                            'semester_grade' => $convertGrade($shsStudentGrades->final_grade ?? ''),
                            'remarks' => $shsStudentGrades->teacher_remarks ?? '',
                        ]);
                    } else {
                        $gradeData = array_merge($gradeData, [
                            'q1_grade' => $convertGrade($studentGrades->first_quarter_grade ?? ''),
                            'q2_grade' => $convertGrade($studentGrades->second_quarter_grade ?? ''),
                            'q3_grade' => $convertGrade($studentGrades->third_quarter_grade ?? ''),
                            'q4_grade' => $convertGrade($studentGrades->fourth_quarter_grade ?? ''),
                            'semester_grade' => $convertGrade($studentGrades->semester_grade ?? ''),
                            'remarks' => $studentGrades->teacher_remarks ?? '',
                        ]);
                    }

                    $grades[] = $gradeData;
                }
            }

            $data = [
                'grades' => $grades,
                'section' => $section,
                'sectionSubject' => $sectionSubject,
                'teacher' => $teacher,
                'isCollegeLevel' => $isCollegeLevel,
                'isShsLevel' => $isShsLevel,
                'separateByGender' => $separateByGender,
                'gradeFormat' => $gradeFormat,
                'generatedAt' => now('Asia/Manila')->format('F j, Y'),
                'formattedSectionName' => $formatSectionName($section),
            ];

            $pdf = Pdf::loadView('pdf.teacher-grades', $data);

            $fileName = 'grades_'.str_replace(' ', '_', $formatSectionName($section)).'_'.
                       str_replace(' ', '_', $section->academic_year ?? 'year').'_Sem'.$section->semester.'.pdf';

            return $pdf->download($fileName);
        } catch (\Exception $e) {
            \Log::error('PDF Export Error: '.$e->getMessage());

            return response()->json(['error' => 'Failed to generate PDF: '.$e->getMessage()], 500);
        }
    }
}
