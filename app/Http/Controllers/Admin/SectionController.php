<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\Course;
use App\Models\Section;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class SectionController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Section::with(['course', 'teacherAssignments.teacher.user'])
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('section_name', 'like', '%'.$request->search.'%')
                    ->orWhere('room', 'like', '%'.$request->search.'%')
                    ->orWhereHas('course', function ($courseQuery) use ($request) {
                        $courseQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('course_code', 'like', '%'.$request->search.'%');
                    });
            });
        }

        if ($request->has('course_id') && $request->course_id) {
            $query->where('course_id', $request->course_id);
        }

        if ($request->has('academic_year') && $request->academic_year) {
            $query->where('academic_year', $request->academic_year);
        }

        if ($request->has('semester') && $request->semester) {
            $query->where('semester', $request->semester);
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('course_id')
            ->orderBy('section_name')
            ->paginate(15)
            ->withQueryString();

        $courses = Course::orderBy('subject_name')->get();

        return Inertia::render('Admin/Sections/Index', [
            'sections' => $sections,
            'courses' => $courses,
            'filters' => $request->only(['search', 'course_id', 'academic_year', 'semester']),
        ]);
    }

    public function create(Request $request): Response
    {
        $courses = Course::where('status', 'active')->orderBy('subject_name')->get();
        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Sections/Create', [
            'courses' => $courses,
            'teachers' => $teachers,
            'selectedCourse' => $request->course_id ? Course::find($request->course_id) : null,
        ]);
    }

    public function store(StoreSectionRequest $request): RedirectResponse
    {
        $section = Section::create($request->validated());

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function show(Section $section): Response
    {
        $section->load([
            'course',
            'teacherAssignments.teacher.user',
            'studentEnrollments' => function ($query) {
                $query->with('student.user')->where('status', 'active');
            },
            'classSchedules',
        ]);

        // Get available students for enrollment
        $enrolledStudentIds = $section->studentEnrollments()
            ->where('status', 'active')
            ->pluck('student_id');

        $availableStudents = Student::with('user')
            ->whereNotIn('id', $enrolledStudentIds)
            ->where('status', 'active')
            ->orderBy('student_number')
            ->get();

        return Inertia::render('Admin/Sections/Show', [
            'section' => $section,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function edit(Section $section): Response
    {
        $section->load('course', 'teacherAssignments.teacher.user');
        $courses = Course::where('status', 'active')->orderBy('subject_name')->get();
        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Sections/Edit', [
            'section' => $section,
            'courses' => $courses,
            'teachers' => $teachers,
        ]);
    }

    public function update(UpdateSectionRequest $request, Section $section): RedirectResponse
    {
        $section->update($request->validated());

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section updated successfully.');
    }

    public function destroy(Section $section): RedirectResponse
    {
        // Check if section has active enrollments
        $hasActiveEnrollments = $section->studentEnrollments()
            ->where('status', 'active')
            ->exists();

        if ($hasActiveEnrollments) {
            return redirect()->back()
                ->with('error', 'Cannot delete section with active enrollments.');
        }

        $section->delete();

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section deleted successfully.');
    }

    public function students(Section $section): Response
    {
        $section->load(['course', 'studentEnrollments.student.user']);

        $enrolledStudents = $section->studentEnrollments()
            ->with('student.user')
            ->where('status', 'active')
            ->get();

        $enrolledStudentIds = $enrolledStudents->pluck('student.id')->toArray();

        $availableStudents = Student::with('user')
            ->whereNotIn('id', $enrolledStudentIds)
            ->get();

        return Inertia::render('Admin/Sections/Students', [
            'section' => $section,
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function enrollStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:students,id',
        ]);

        $enrolledCount = 0;
        $alreadyEnrolled = [];

        foreach ($request->student_ids as $studentId) {
            // Check if student is already enrolled in this section
            $existingEnrollment = StudentEnrollment::where('student_id', $studentId)
                ->where('section_id', $section->id)
                ->where('status', 'active')
                ->first();

            if ($existingEnrollment) {
                $student = Student::with('user')->find($studentId);
                $alreadyEnrolled[] = $student->user->name;

                continue;
            }

            StudentEnrollment::create([
                'student_id' => $studentId,
                'section_id' => $section->id,
                'enrollment_date' => now()->toDateString(),
                'enrolled_by' => Auth::id(),
                'status' => 'active',
                'academic_year' => $section->academic_year,
                'semester' => $section->semester,
            ]);

            $enrolledCount++;
        }

        $message = '';
        if ($enrolledCount > 0) {
            $message = "{$enrolledCount} student(s) enrolled successfully.";
        }

        if (! empty($alreadyEnrolled)) {
            $names = implode(', ', $alreadyEnrolled);
            $message .= " Note: {$names} ".(count($alreadyEnrolled) === 1 ? 'is' : 'are').' already enrolled.';
        }

        return redirect()->back()->with('success', trim($message));
    }

    public function unenrollStudent(StudentEnrollment $enrollment): RedirectResponse
    {
        $enrollment->update(['status' => 'dropped']);

        return redirect()->back()
            ->with('success', 'Student unenrolled successfully.');
    }
}
