<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SubjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Subject::query();

        // Apply filters
        if ($request->filled('education_level') && $request->education_level !== 'all') {
            $query->where('education_level', $request->education_level);
        }

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject_code', 'like', "%{$search}%")
                    ->orWhere('subject_name', 'like', "%{$search}%");
            });
        }

        $subjects = $query->orderBy('education_level')
            ->orderBy('year_level')
            ->orderBy('semester')
            ->orderBy('subject_code')
            ->paginate(8)
            ->appends($request->query());

        return Inertia::render('Admin/Subjects/Index', [
            'subjects' => $subjects,
            'filters' => $request->only(['education_level', 'status', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Admin/Subjects/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_code' => 'required|string|max:20|unique:subjects',
            'subject_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'education_level' => 'required|in:college,shs',
            'year_level' => 'required|integer|min:1|max:4',
            'semester' => 'required|in:first,second',
            'units' => 'required|numeric|min:0|max:10',
            'subject_type' => 'required|in:major,minor,general,elective',
            'prerequisites' => 'nullable|string|max:500',
            'status' => 'required|in:active,inactive',
        ]);

        Subject::create($validated);

        return redirect()->route('registrar.subjects.index')
            ->with('success', 'Subject created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Subject $subject)
    {
        $subject->load(['programs']);

        return Inertia::render('Admin/Subjects/Show', [
            'subject' => $subject,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Subject $subject)
    {
        return Inertia::render('Admin/Subjects/Edit', [
            'subject' => $subject,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'subject_code' => 'required|string|max:20|unique:subjects,subject_code,'.$subject->id,
            'subject_name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'education_level' => 'required|in:college,shs',
            'year_level' => 'required|integer|min:1|max:4',
            'semester' => 'required|in:first,second',
            'units' => 'required|numeric|min:0|max:10',
            'subject_type' => 'required|in:major,minor,general,elective',
            'prerequisites' => 'nullable|string|max:500',
            'status' => 'required|in:active,inactive',
        ]);

        $subject->update($validated);

        return redirect()->route('registrar.subjects.index')
            ->with('success', 'Subject updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Subject $subject)
    {
        // Check if subject is assigned to any programs
        if ($subject->programs()->count() > 0) {
            return redirect()->route('registrar.subjects.index')
                ->with('error', 'Cannot delete subject that is assigned to programs.');
        }

        $subject->delete();

        return redirect()->route('registrar.subjects.index')
            ->with('success', 'Subject deleted successfully.');
    }
}
