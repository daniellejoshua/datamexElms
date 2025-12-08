<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CollegeSubjectController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Subject::where('education_level', 'college');

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('subject_name', 'like', '%'.$request->search.'%')
                    ->orWhere('subject_code', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('year_level') && $request->year_level) {
            $query->where('year_level', $request->year_level);
        }

        if ($request->has('semester') && $request->semester) {
            $query->where('semester', $request->semester);
        }

        if ($request->has('subject_type') && $request->subject_type) {
            $query->where('subject_type', $request->subject_type);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $subjects = $query->orderBy('year_level')
            ->orderBy('semester')
            ->orderBy('subject_code')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Sections/College/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['search', 'year_level', 'semester', 'subject_type', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Sections/College/Subjects/Create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject_code' => 'required|string|max:20|unique:subjects,subject_code',
            'subject_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:6',
            'year_level' => 'required|integer|in:1,2,3,4',
            'semester' => 'required|in:first,second,summer',
            'subject_type' => 'required|in:major,minor,general,elective',
            'prerequisites' => 'nullable|array',
            'status' => 'required|in:active,inactive',
        ]);

        // Force education level to college
        $validated['education_level'] = 'college';

        Subject::create($validated);

        return redirect()->route('admin.college.subjects.index')
            ->with('success', 'College subject created successfully.');
    }

    public function show(Subject $subject): Response
    {
        if ($subject->education_level !== 'college') {
            abort(404);
        }

        return Inertia::render('Admin/Sections/College/Subjects/Show', [
            'subject' => $subject,
        ]);
    }

    public function edit(Subject $subject): Response
    {
        if ($subject->education_level !== 'college') {
            abort(404);
        }

        return Inertia::render('Admin/Sections/College/Subjects/Edit', [
            'subject' => $subject,
        ]);
    }

    public function update(Request $request, Subject $subject): RedirectResponse
    {
        if ($subject->education_level !== 'college') {
            abort(404);
        }

        $validated = $request->validate([
            'subject_code' => 'required|string|max:20|unique:subjects,subject_code,'.$subject->id,
            'subject_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'units' => 'required|integer|min:1|max:6',
            'year_level' => 'required|integer|in:1,2,3,4',
            'semester' => 'required|in:first,second,summer',
            'subject_type' => 'required|in:major,minor,general,elective',
            'prerequisites' => 'nullable|array',
            'status' => 'required|in:active,inactive',
        ]);

        // Ensure education level stays college
        $validated['education_level'] = 'college';

        $subject->update($validated);

        return redirect()->route('admin.college.subjects.index')
            ->with('success', 'College subject updated successfully.');
    }

    public function destroy(Subject $subject): RedirectResponse
    {
        if ($subject->education_level !== 'college') {
            abort(404);
        }

        $subject->delete();

        return redirect()->route('admin.college.subjects.index')
            ->with('success', 'College subject deleted successfully.');
    }
}
