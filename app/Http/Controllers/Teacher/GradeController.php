<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\StudentGrade;
use App\Models\ShsStudentGrade;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;
use App\Imports\GradeImport;
use App\Exports\GradeTemplateExport;

class GradeController extends Controller
{
    /**
     * Show grades for a specific section
     */
    public function show(Section $section): Response
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section
        $sectionSubject = SectionSubject::where('section_id', $section->id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        // Get all student enrollments for this section
        $enrollments = StudentEnrollment::with([
            'student.user',
            'section',
            'studentGrades' => function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            },
            'shsStudentGrades' => function ($query) use ($teacher) {
                $query->where('teacher_id', $teacher->id);
            }
        ])
        ->where('section_id', $section->id)
        ->where('status', 'active')
        ->get();

        // Determine if this is college or SHS based on section
        // Load the program relationship if not already loaded
        $section->load('program');
        
        // Check multiple ways to determine if it's college level:
        // 1. Check program type/name for college indicators
        // 2. Check year level format variations
        $isCollegeLevel = false;
        
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
        }
        
        // If not determined by program, check year level
        if (!$isCollegeLevel) {
            $yearLevel = $section->year_level;
            
            // Check various year level formats
            $collegeYearFormats = [
                '1st Year', '2nd Year', '3rd Year', '4th Year',
                '1', '2', '3', '4',
                1, 2, 3, 4
            ];
            
            $isCollegeLevel = in_array($yearLevel, $collegeYearFormats, true);
        }

        return Inertia::render('Teacher/Grades/Show', [
            'section' => $section->load(['program', 'sectionSubjects.subject']),
            'sectionSubject' => $sectionSubject,
            'enrollments' => $enrollments,
            'isCollegeLevel' => $isCollegeLevel,
            'teacher' => $teacher
        ]);
    }

    /**
     * Update grades for students
     */
    public function updateGrades(Request $request, Section $section)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section
        SectionSubject::where('section_id', $section->id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.enrollment_id' => 'required|exists:student_enrollments,id',
            'grades.*.prelim_grade' => 'nullable|numeric|between:0,100',
            'grades.*.midterm_grade' => 'nullable|numeric|between:0,100',
            'grades.*.prefinal_grade' => 'nullable|numeric|between:0,100',
            'grades.*.final_grade' => 'nullable|numeric|between:0,100',
            'grades.*.first_quarter_grade' => 'nullable|numeric|between:0,100',
            'grades.*.second_quarter_grade' => 'nullable|numeric|between:0,100',
            'grades.*.third_quarter_grade' => 'nullable|numeric|between:0,100',
            'grades.*.fourth_quarter_grade' => 'nullable|numeric|between:0,100',
            'grades.*.teacher_remarks' => 'nullable|string|max:1000',
        ]);

        foreach ($validated['grades'] as $gradeData) {
            $enrollment = StudentEnrollment::findOrFail($gradeData['enrollment_id']);
            
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
            
            if (!$isCollegeLevel) {
                $yearLevel = $enrollment->section->year_level;
                $collegeYearFormats = [
                    '1st Year', '2nd Year', '3rd Year', '4th Year',
                    '1', '2', '3', '4',
                    1, 2, 3, 4
                ];
                
                $isCollegeLevel = in_array($yearLevel, $collegeYearFormats, true);
            }

            if ($isCollegeLevel) {
                // Handle college grades
                $grade = StudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'teacher_id' => $teacher->id
                ]);

                $grade->prelim_grade = $gradeData['prelim_grade'] ?? null;
                $grade->midterm_grade = $gradeData['midterm_grade'] ?? null;
                $grade->prefinal_grade = $gradeData['prefinal_grade'] ?? null;
                $grade->final_grade = $gradeData['final_grade'] ?? null;
                $grade->teacher_remarks = $gradeData['teacher_remarks'] ?? null;

                // Calculate semester grade if all components are present
                if ($grade->prelim_grade && $grade->midterm_grade && $grade->prefinal_grade && $grade->final_grade) {
                    $grade->semester_grade = ($grade->prelim_grade + $grade->midterm_grade + $grade->prefinal_grade + $grade->final_grade) / 4;
                    $grade->overall_status = $grade->semester_grade >= 60 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($gradeData['prelim_grade'] !== null && !$grade->prelim_submitted_at) {
                    $grade->prelim_submitted_at = now();
                }
                if ($gradeData['midterm_grade'] !== null && !$grade->midterm_submitted_at) {
                    $grade->midterm_submitted_at = now();
                }
                if ($gradeData['prefinal_grade'] !== null && !$grade->prefinal_submitted_at) {
                    $grade->prefinal_submitted_at = now();
                }
                if ($gradeData['final_grade'] !== null && !$grade->final_submitted_at) {
                    $grade->final_submitted_at = now();
                }

                $grade->save();
            } else {
                // Handle SHS grades
                $grade = ShsStudentGrade::firstOrNew([
                    'student_enrollment_id' => $enrollment->id,
                    'teacher_id' => $teacher->id
                ]);

                $grade->first_quarter_grade = $gradeData['first_quarter_grade'] ?? null;
                $grade->second_quarter_grade = $gradeData['second_quarter_grade'] ?? null;
                $grade->third_quarter_grade = $gradeData['third_quarter_grade'] ?? null;
                $grade->fourth_quarter_grade = $gradeData['fourth_quarter_grade'] ?? null;
                $grade->teacher_remarks = $gradeData['teacher_remarks'] ?? null;

                // Calculate final grade if all quarters are present
                if ($grade->first_quarter_grade && $grade->second_quarter_grade && 
                    $grade->third_quarter_grade && $grade->fourth_quarter_grade) {
                    $grade->final_grade = ($grade->first_quarter_grade + $grade->second_quarter_grade + 
                                         $grade->third_quarter_grade + $grade->fourth_quarter_grade) / 4;
                    $grade->completion_status = $grade->final_grade >= 75 ? 'passed' : 'failed';
                }

                // Set submission timestamps
                if ($gradeData['first_quarter_grade'] !== null && !$grade->first_quarter_submitted_at) {
                    $grade->first_quarter_submitted_at = now();
                }
                if ($gradeData['second_quarter_grade'] !== null && !$grade->second_quarter_submitted_at) {
                    $grade->second_quarter_submitted_at = now();
                }
                if ($gradeData['third_quarter_grade'] !== null && !$grade->third_quarter_submitted_at) {
                    $grade->third_quarter_submitted_at = now();
                }
                if ($gradeData['fourth_quarter_grade'] !== null && !$grade->fourth_quarter_submitted_at) {
                    $grade->fourth_quarter_submitted_at = now();
                }

                $grade->save();
            }
        }

        return redirect()->back()->with('success', 'Grades updated successfully.');
    }

    /**
     * Import grades from Excel file
     */
    public function importGrades(Request $request, Section $section)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section
        SectionSubject::where('section_id', $section->id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        $request->validate([
            'grades_file' => 'required|file|mimes:xlsx,xls,csv|max:2048',
        ]);

        try {
            Excel::import(new GradeImport($section, $teacher), $request->file('grades_file'));
            
            return redirect()->back()->with('success', 'Grades imported successfully.');
        } catch (\Exception $e) {
            return redirect()->back()->withErrors(['grades_file' => 'Error importing grades: ' . $e->getMessage()]);
        }
    }

    /**
     * Download grade template
     */
    public function downloadTemplate(Section $section)
    {
        $user = Auth::user();
        $teacher = Teacher::where('user_id', $user->id)->firstOrFail();

        // Verify teacher is assigned to this section
        SectionSubject::where('section_id', $section->id)
            ->where('teacher_id', $teacher->id)
            ->firstOrFail();

        // Get students in this section
        $enrollments = StudentEnrollment::with('student.user')
            ->where('section_id', $section->id)
            ->where('status', 'active')
            ->get();

        // Determine if college or SHS
        $isCollegeLevel = in_array($section->year_level, ['1st Year', '2nd Year', '3rd Year', '4th Year']);

        return Excel::download(new GradeTemplateExport($enrollments, $isCollegeLevel), 
                              "grade_template_{$section->section_code}.xlsx");
    }
}
