<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\SectionSubject;
use App\Models\StudentSubjectEnrollment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function college(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        // Get subjects that this teacher teaches for college programs
        $query = SectionSubject::with([
            'subject',
            'section.program',
            'section' => function ($q) {
                $q->whereHas('program', function ($programQuery) {
                    $programQuery->where('education_level', 'college');
                });
            },
        ])
            ->where('teacher_id', $teacher->id)
            ->where('section_subjects.status', 'active')
            ->whereHas('section.program', function ($q) {
                $q->where('education_level', 'college');
            });

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('subject', function ($subjectQuery) use ($request) {
                    $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                        ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                })
                    ->orWhereHas('section', function ($sectionQuery) use ($request) {
                        $sectionQuery->where('section_name', 'like', '%'.$request->search.'%')
                            ->orWhereHas('program', function ($programQuery) use ($request) {
                                $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                            });
                    });
            });
        }

        $subjects = $query->with(['section'])
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->orderBy('sections.academic_year', 'desc')
            ->orderBy('sections.semester')
            ->select('section_subjects.*')
            ->get()
            ->map(function ($sectionSubject) {
                // Count students enrolled in this specific subject
                $enrolledCount = StudentSubjectEnrollment::where('section_subject_id', $sectionSubject->id)
                    ->where('status', 'active')
                    ->count();

                // Format section name for display
                $sectionName = $sectionSubject->section->section_name ?? 'Unknown';
                $programCode = $sectionSubject->section->program->program_code ?? '';
                $yearLevel = $sectionSubject->section->year_level ?? '';

                $formattedSectionName = $programCode ? "{$programCode}-{$yearLevel}{$sectionName}" : $sectionName;

                return [
                    'id' => $sectionSubject->id,
                    'subject' => $sectionSubject->subject,
                    'section' => $sectionSubject->section,
                    'section_name' => $formattedSectionName,
                    'academic_year' => $sectionSubject->section->academic_year,
                    'semester' => $sectionSubject->section->semester,
                    'schedule_days' => $sectionSubject->schedule_days,
                    'start_time' => $sectionSubject->start_time,
                    'end_time' => $sectionSubject->end_time,
                    'room' => $sectionSubject->room,
                    'enrolled_count' => $enrolledCount,
                ];
            });

        // Paginate the collection
        $perPage = 8;
        $currentPage = $request->get('page', 1);
        $total = $subjects->count();
        $subjects = $subjects->forPage($currentPage, $perPage);

        $paginatedSubjects = new \Illuminate\Pagination\LengthAwarePaginator(
            $subjects,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/Subjects/College', [
            'subjects' => $paginatedSubjects,
            'filters' => $request->only(['search']),
        ]);
    }

    public function shs(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        // Get subjects that this teacher teaches for SHS programs
        $query = SectionSubject::with([
            'subject',
            'section.program',
            'section' => function ($q) {
                $q->whereHas('program', function ($programQuery) {
                    $programQuery->where('education_level', 'shs');
                });
            },
        ])
            ->where('teacher_id', $teacher->id)
            ->where('section_subjects.status', 'active')
            ->whereHas('section.program', function ($q) {
                $q->where('education_level', 'shs');
            });

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('subject', function ($subjectQuery) use ($request) {
                    $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                        ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                })
                    ->orWhereHas('section', function ($sectionQuery) use ($request) {
                        $sectionQuery->where('section_name', 'like', '%'.$request->search.'%')
                            ->orWhereHas('program', function ($programQuery) use ($request) {
                                $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                            });
                    });
            });
        }

        $subjects = $query->with(['section'])
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->orderBy('sections.academic_year', 'desc')
            ->orderBy('sections.semester')
            ->select('section_subjects.*')
            ->get()
            ->map(function ($sectionSubject) {
                // Count students enrolled in this specific subject
                $enrolledCount = StudentSubjectEnrollment::where('section_subject_id', $sectionSubject->id)
                    ->where('status', 'active')
                    ->count();

                // Format section name for display
                $sectionName = $sectionSubject->section->section_name ?? 'Unknown';
                $programCode = $sectionSubject->section->program->program_code ?? '';
                $yearLevel = $sectionSubject->section->year_level ?? '';

                $formattedSectionName = $programCode ? "{$programCode}-{$yearLevel}{$sectionName}" : $sectionName;

                return [
                    'id' => $sectionSubject->id,
                    'subject' => $sectionSubject->subject,
                    'section' => $sectionSubject->section,
                    'section_name' => $formattedSectionName,
                    'academic_year' => $sectionSubject->section->academic_year,
                    'semester' => $sectionSubject->section->semester,
                    'schedule_days' => $sectionSubject->schedule_days,
                    'start_time' => $sectionSubject->start_time,
                    'end_time' => $sectionSubject->end_time,
                    'room' => $sectionSubject->room,
                    'enrolled_count' => $enrolledCount,
                ];
            });

        // Paginate the collection
        $perPage = 8;
        $currentPage = $request->get('page', 1);
        $total = $subjects->count();
        $subjects = $subjects->forPage($currentPage, $perPage);

        $paginatedSubjects = new \Illuminate\Pagination\LengthAwarePaginator(
            $subjects,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/Subjects/Shs', [
            'subjects' => $paginatedSubjects,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display college sections for teacher with proper section data structure
     */
    public function collegeSections(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        // Get sections that this teacher teaches for college programs
        $query = SectionSubject::with([
            'subject',
            'section.program',
        ])
            ->where('teacher_id', $teacher->id)
            ->where('section_subjects.status', 'active')
            ->whereHas('section.program', function ($q) {
                $q->where('education_level', 'college');
            });

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('subject', function ($subjectQuery) use ($request) {
                    $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                        ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                })
                    ->orWhereHas('section', function ($sectionQuery) use ($request) {
                        $sectionQuery->where('section_name', 'like', '%'.$request->search.'%')
                            ->orWhereHas('program', function ($programQuery) use ($request) {
                                $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                            });
                    });
            });
        }

        $sectionSubjects = $query->with(['section.program'])
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->orderBy('sections.academic_year', 'desc')
            ->orderBy('sections.semester')
            ->select('section_subjects.*')
            ->get()
            ->groupBy('section_id')
            ->map(function ($subjectGroup) {
                $firstSubject = $subjectGroup->first();
                $section = $firstSubject->section;

                // Count total students enrolled in this section
                $enrolledCount = StudentSubjectEnrollment::whereIn('section_subject_id', $subjectGroup->pluck('id'))
                    ->where('status', 'active')
                    ->distinct('student_id')
                    ->count('student_id');

                // Get the teacher's subject for this section (just pick the first one for now)
                $teacherSubject = $subjectGroup->first();

                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'program' => $section->program,
                    'year_level' => $section->year_level,
                    'semester' => $section->semester,
                    'academic_year' => $section->academic_year,
                    'enrolled_count' => $enrolledCount,
                    'teacher_subject' => [
                        'subject' => $teacherSubject->subject,
                        'schedule_days' => $teacherSubject->schedule_days,
                        'start_time' => $teacherSubject->start_time ? $teacherSubject->start_time->format('H:i') : null,
                        'end_time' => $teacherSubject->end_time ? $teacherSubject->end_time->format('H:i') : null,
                        'room' => $teacherSubject->room,
                    ],
                ];
            })
            ->values();

        // Paginate the collection
        $perPage = 8;
        $currentPage = $request->get('page', 1);
        $total = $sectionSubjects->count();
        $sectionSubjects = $sectionSubjects->forPage($currentPage, $perPage);

        $paginatedSections = new \Illuminate\Pagination\LengthAwarePaginator(
            $sectionSubjects,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/Sections/College', [
            'sections' => $paginatedSections,
            'filters' => $request->only(['search']),
        ]);
    }

    /**
     * Display SHS sections for teacher with proper section data structure
     */
    public function shsSections(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        // Get sections that this teacher teaches for SHS programs
        $query = SectionSubject::with([
            'subject',
            'section.program',
        ])
            ->where('teacher_id', $teacher->id)
            ->where('section_subjects.status', 'active')
            ->whereHas('section.program', function ($q) {
                $q->where('education_level', 'senior_high');
            });

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('subject', function ($subjectQuery) use ($request) {
                    $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                        ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                })
                    ->orWhereHas('section', function ($sectionQuery) use ($request) {
                        $sectionQuery->where('section_name', 'like', '%'.$request->search.'%')
                            ->orWhereHas('program', function ($programQuery) use ($request) {
                                $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                            });
                    });
            });
        }

        $sectionSubjects = $query->with(['section.program'])
            ->join('sections', 'section_subjects.section_id', '=', 'sections.id')
            ->orderBy('sections.academic_year', 'desc')
            ->orderBy('sections.semester')
            ->select('section_subjects.*')
            ->get()
            ->groupBy('section_id')
            ->map(function ($subjectGroup) {
                $firstSubject = $subjectGroup->first();
                $section = $firstSubject->section;

                // Count total students enrolled in this section
                $enrolledCount = StudentSubjectEnrollment::whereIn('section_subject_id', $subjectGroup->pluck('id'))
                    ->where('status', 'active')
                    ->distinct('student_id')
                    ->count('student_id');

                // Get the teacher's subject for this section (just pick the first one for now)
                $teacherSubject = $subjectGroup->first();

                return [
                    'id' => $section->id,
                    'section_name' => $section->section_name,
                    'program' => $section->program,
                    'year_level' => $section->year_level,
                    'semester' => $section->semester,
                    'academic_year' => $section->academic_year,
                    'enrolled_count' => $enrolledCount,
                    'teacher_subject' => [
                        'subject' => $teacherSubject->subject,
                        'schedule_days' => $teacherSubject->schedule_days,
                        'start_time' => $teacherSubject->start_time ? $teacherSubject->start_time->format('H:i') : null,
                        'end_time' => $teacherSubject->end_time ? $teacherSubject->end_time->format('H:i') : null,
                        'room' => $teacherSubject->room,
                    ],
                ];
            })
            ->values();

        // Paginate the collection
        $perPage = 8;
        $currentPage = $request->get('page', 1);
        $total = $sectionSubjects->count();
        $sectionSubjects = $sectionSubjects->forPage($currentPage, $perPage);

        $paginatedSections = new \Illuminate\Pagination\LengthAwarePaginator(
            $sectionSubjects,
            $total,
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        return Inertia::render('Teacher/Sections/Shs', [
            'sections' => $paginatedSections,
            'filters' => $request->only(['search']),
        ]);
    }
}
