<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ArchivedSection;
use App\Models\ArchivedStudentEnrollment;
use App\Models\Section;
use App\Models\StudentGrade;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AcademicYearController extends Controller
{
    public function index(): Response
    {
        $archivedSections = ArchivedSection::query()
            ->with(['archivedBy:id,name'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->paginate(20);

        $academicYears = ArchivedSection::query()
            ->selectRaw('academic_year, COUNT(*) as sections_count')
            ->groupBy('academic_year')
            ->orderBy('academic_year', 'desc')
            ->get();

        return Inertia::render('Admin/AcademicYear/Index', [
            'archivedSections' => $archivedSections,
            'academicYears' => $academicYears,
            'currentAcademicYear' => $this->getCurrentAcademicYear(),
        ]);
    }

    public function archiveSemester(Request $request)
    {
        $request->validate([
            'academic_year' => 'required|string',
            'semester' => 'required|in:first,second,summer',
            'archive_notes' => 'nullable|string|max:1000',
        ]);

        // Check if semester is already archived
        $existing = ArchivedSection::where('academic_year', $request->academic_year)
            ->where('semester', $request->semester)
            ->exists();

        if ($existing) {
            return redirect()->back()
                ->with('error', 'This semester has already been archived.');
        }

        DB::transaction(function () use ($request) {
            $this->archiveSemesterSections(
                $request->academic_year,
                $request->semester,
                $request->archive_notes
            );
        });

        return redirect()->back()
            ->with('success', 'Semester archived successfully. Sections have been moved to history.');
    }

    protected function archiveSemesterSections(string $academicYear, string $semester, ?string $notes): void
    {
        // Get all sections for this semester
        $sections = Section::with(['course', 'studentEnrollments.student.user'])
            ->where('academic_year', $academicYear)
            ->where('semester', $semester)
            ->get();

        foreach ($sections as $section) {
            // Calculate section statistics
            $enrollments = $section->studentEnrollments;
            $completedCount = $enrollments->where('status', 'active')->count();
            $droppedCount = $enrollments->where('status', 'dropped')->count();

            // Calculate average grade if grades exist
            $averageGrade = null;
            $gradeSum = 0;
            $gradeCount = 0;

            foreach ($enrollments as $enrollment) {
                $grade = StudentGrade::where('student_id', $enrollment->student_id)
                    ->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->where('status', 'finalized')
                    ->first();

                if ($grade && $grade->final_grade) {
                    $gradeSum += $grade->final_grade;
                    $gradeCount++;
                }
            }

            if ($gradeCount > 0) {
                $averageGrade = round($gradeSum / $gradeCount, 2);
            }

            // Archive the section
            $archivedSection = ArchivedSection::create([
                'original_section_id' => $section->id,
                'section_name' => $section->section_name,
                'academic_year' => $academicYear,
                'semester' => $semester,
                'room' => $section->room,
                'status' => 'completed',
                'course_data' => [
                    'id' => $section->course->id,
                    'course_code' => $section->course->course_code,
                    'subject_name' => $section->course->subject_name,
                    'credits' => $section->course->credits,
                ],
                'total_enrolled_students' => $enrollments->count(),
                'completed_students' => $completedCount,
                'dropped_students' => $droppedCount,
                'section_average_grade' => $averageGrade,
                'archived_at' => now(),
                'archived_by' => Auth::id(),
                'archive_notes' => $notes,
            ]);

            // Archive student enrollments
            foreach ($enrollments as $enrollment) {
                $finalGrade = StudentGrade::where('student_id', $enrollment->student_id)
                    ->where('academic_year', $academicYear)
                    ->where('semester', $semester)
                    ->first();

                ArchivedStudentEnrollment::create([
                    'archived_section_id' => $archivedSection->id,
                    'student_id' => $enrollment->student_id,
                    'original_enrollment_id' => $enrollment->id,
                    'academic_year' => $academicYear,
                    'semester' => $semester,
                    'enrolled_date' => $enrollment->enrollment_date,
                    'completion_date' => now()->toDateString(),
                    'final_status' => $enrollment->status === 'active' ? 'completed' : $enrollment->status,
                    'final_grades' => $finalGrade ? [
                        'midterm' => $finalGrade->midterm_grade,
                        'final' => $finalGrade->final_grade,
                        'overall' => $finalGrade->final_grade,
                    ] : null,
                    'final_semester_grade' => $finalGrade?->final_grade,
                    'letter_grade' => $this->calculateLetterGrade($finalGrade?->final_grade),
                    'student_data' => [
                        'name' => $enrollment->student->user->name,
                        'student_id' => $enrollment->student->student_id,
                        'email' => $enrollment->student->user->email,
                    ],
                ]);
            }

            // Delete the original section and enrollments
            $section->studentEnrollments()->delete();
            $section->delete();
        }
    }

    protected function calculateLetterGrade(?float $grade): ?string
    {
        if ($grade === null) {
            return null;
        }

        if ($grade >= 97) {
            return 'A+';
        }
        if ($grade >= 93) {
            return 'A';
        }
        if ($grade >= 90) {
            return 'A-';
        }
        if ($grade >= 87) {
            return 'B+';
        }
        if ($grade >= 83) {
            return 'B';
        }
        if ($grade >= 80) {
            return 'B-';
        }
        if ($grade >= 77) {
            return 'C+';
        }
        if ($grade >= 73) {
            return 'C';
        }
        if ($grade >= 70) {
            return 'C-';
        }
        if ($grade >= 67) {
            return 'D+';
        }
        if ($grade >= 65) {
            return 'D';
        }

        return 'F';
    }

    protected function getCurrentAcademicYear(): string
    {
        $currentYear = date('Y');
        $currentMonth = date('n');

        // Academic year typically starts in June/July
        if ($currentMonth >= 6) {
            return $currentYear.'-'.($currentYear + 1);
        } else {
            return ($currentYear - 1).'-'.$currentYear;
        }
    }

    public function show(ArchivedSection $archivedSection): Response
    {
        $archivedSection->load([
            'archivedEnrollments.student.user',
            'archivedBy:id,name',
        ]);

        return Inertia::render('Admin/AcademicYear/Show', [
            'archivedSection' => $archivedSection,
        ]);
    }
}
