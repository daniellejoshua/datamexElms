<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Section;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function college(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        $query = Section::with(['program', 'sectionSubjects.subject'])
            ->whereHas('sectionSubjects', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->whereHas('program', function ($q) {
                $q->where('education_level', 'college');
            })
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('section_name', 'like', '%'.$request->search.'%')
                    ->orWhereHas('program', function ($programQuery) use ($request) {
                        $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('sectionSubjects.subject', function ($subjectQuery) use ($request) {
                        $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                    });
            });
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('section_name')
            ->paginate(8)
            ->withQueryString();

        // Get the section subjects for each section to show what subject the teacher teaches
        $sections->getCollection()->transform(function ($section) use ($teacher) {
            $section->teacher_subject = $section->sectionSubjects()
                ->where('teacher_id', $teacher->id)
                ->with('subject')
                ->first();

            return $section;
        });

        return Inertia::render('Teacher/Sections/College', [
            'sections' => $sections,
            'filters' => $request->only(['search']),
        ]);
    }

    public function shs(Request $request): Response
    {
        $teacher = Auth::user()->teacher;

        $query = Section::with(['program', 'sectionSubjects.subject'])
            ->whereHas('sectionSubjects', function ($q) use ($teacher) {
                $q->where('teacher_id', $teacher->id);
            })
            ->whereHas('program', function ($q) {
                $q->where('education_level', 'shs');
            })
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply search filter if provided
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('section_name', 'like', '%'.$request->search.'%')
                    ->orWhereHas('program', function ($programQuery) use ($request) {
                        $programQuery->where('program_name', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('sectionSubjects.subject', function ($subjectQuery) use ($request) {
                        $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                    });
            });
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('section_name')
            ->paginate(8)
            ->withQueryString();

        // Get the section subjects for each section to show what subject the teacher teaches
        $sections->getCollection()->transform(function ($section) use ($teacher) {
            $section->teacher_subject = $section->sectionSubjects()
                ->where('teacher_id', $teacher->id)
                ->with('subject')
                ->first();

            return $section;
        });

        return Inertia::render('Teacher/Sections/Shs', [
            'sections' => $sections,
            'filters' => $request->only(['search']),
        ]);
    }
}
