<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCourseRequest;
use App\Http\Requests\Admin\UpdateCourseRequest;
use App\Models\Course;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CourseController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Course::query();

        // Apply filters
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('subject_name', 'like', '%'.$request->search.'%')
                    ->orWhere('course_code', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        if ($request->has('education_level') && $request->education_level) {
            $query->where('education_level', $request->education_level);
        }

        if ($request->has('status') && $request->status) {
            $query->where('status', $request->status);
        }

        $courses = $query->withCount('sections')
            ->orderBy('subject_name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Courses/Index', [
            'courses' => $courses,
            'filters' => $request->only(['search', 'education_level', 'status']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Courses/Create');
    }

    public function store(StoreCourseRequest $request): RedirectResponse
    {
        Course::create($request->validated());

        return redirect()->route('admin.courses.index')
            ->with('success', 'Course created successfully.');
    }

    public function show(Course $course): Response
    {
        $course->load(['sections.studentEnrollments' => function ($query) {
            $query->where('status', 'active');
        }]);

        return Inertia::render('Admin/Courses/Show', [
            'course' => $course,
        ]);
    }

    public function edit(Course $course): Response
    {
        return Inertia::render('Admin/Courses/Edit', [
            'course' => $course,
        ]);
    }

    public function update(UpdateCourseRequest $request, Course $course): RedirectResponse
    {
        $course->update($request->validated());

        return redirect()->route('admin.courses.index')
            ->with('success', 'Course updated successfully.');
    }

    public function destroy(Course $course): RedirectResponse
    {
        // Check if course has active enrollments
        $hasActiveEnrollments = $course->sections()
            ->whereHas('studentEnrollments', function ($query) {
                $query->where('status', 'active');
            })
            ->exists();

        if ($hasActiveEnrollments) {
            return redirect()->back()
                ->with('error', 'Cannot delete course with active enrollments.');
        }

        $course->delete();

        return redirect()->route('admin.courses.index')
            ->with('success', 'Course deleted successfully.');
    }
}
