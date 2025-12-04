<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\CourseMaterial;
use App\Models\MaterialAccessLog;
use App\Models\Student;
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

        // Get all active enrollments with subject details
        $enrollments = $student->studentEnrollments()
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
            ->where('status', 'active')
            ->get();

        // Transform the data for easier frontend consumption
        $subjects = [];
        foreach ($enrollments as $enrollment) {
            foreach ($enrollment->section->sectionSubjects as $sectionSubject) {
                $subject = $sectionSubject->subject;
                $teacher = $sectionSubject->teacher;

                // Get student grades for this enrollment
                $studentGrades = $enrollment->studentGrades()
                    ->where('teacher_id', $sectionSubject->teacher_id)
                    ->first();

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
                    'teacher_name' => $teacher->user->name,
                    'section_name' => $enrollment->section->section_name,
                    'program_name' => $enrollment->section->program->program_name,
                    'program_code' => $enrollment->section->program->program_code,
                    'year_level' => $enrollment->section->year_level,
                    'academic_year' => $enrollment->section->academic_year,
                    'semester' => $enrollment->section->semester,
                    'schedule_days' => $sectionSubject->schedule_days,
                    'start_time' => $sectionSubject->start_time?->format('H:i'),
                    'end_time' => $sectionSubject->end_time?->format('H:i'),
                    'room' => $sectionSubject->room,
                    'section_subject_id' => $sectionSubject->id,
                    'materials' => $sectionMaterials,
                    'grades' => $studentGrades ? [
                        'prelim_grade' => $studentGrades->prelim_grade,
                        'midterm_grade' => $studentGrades->midterm_grade,
                        'prefinal_grade' => $studentGrades->prefinal_grade,
                        'final_grade' => $studentGrades->final_grade,
                        'semester_grade' => $studentGrades->semester_grade,
                        'status' => $studentGrades->overall_status,
                    ] : null,
                ];
            }
        }

        return Inertia::render('Student/Subjects/Index', [
            'subjects' => $subjects,
            'student' => $student->load('user'),
        ]);
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
