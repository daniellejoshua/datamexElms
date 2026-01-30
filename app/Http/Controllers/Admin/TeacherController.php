<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ShsStudentGrade;
use App\Models\StudentGrade;
use App\Models\Teacher;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class TeacherController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Teacher::with('user')
            ->withCount(['sectionSubjects as active_subjects_count' => function ($query) {
                $query->active();
            }]);

        // Apply search filter
        if ($request->has('search') && $request->search) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', '%'.$search.'%')
                    ->orWhere('last_name', 'like', '%'.$search.'%')
                    ->orWhere('middle_name', 'like', '%'.$search.'%')
                    ->orWhere('department', 'like', '%'.$search.'%')
                    ->orWhere('specialization', 'like', '%'.$search.'%')
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('email', 'like', '%'.$search.'%')
                            ->orWhere('employee_number', 'like', '%'.$search.'%');
                    });
            });
        }

        // Apply status filter
        if ($request->has('status') && $request->status && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        // Apply department filter
        if ($request->has('department') && $request->department && $request->department !== 'all') {
            $query->where('department', $request->department);
        }

        $teachers = $query->orderBy('last_name')
            ->orderBy('first_name')
            ->paginate(15)
            ->withQueryString();

        // Get unique departments for filter dropdown
        $departments = Teacher::whereNotNull('department')
            ->distinct()
            ->pluck('department')
            ->sort()
            ->values();

        return Inertia::render('Admin/Teachers/Index', [
            'teachers' => $teachers,
            'departments' => $departments,
            'filters' => $request->only(['search', 'status', 'department']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Teachers/Create');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|email|max:255|unique:users,email',
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120', // 5MB max
        ]);

        try {
            // Handle profile picture upload
            $profilePictureUrl = null;
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $cloudinaryResponse = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'teachers/profile-pictures',
                    'public_id' => 'teacher_'.time().'_'.uniqid(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $cloudinaryResponse['secure_url'];
            }

            // Create user account
            $user = User::create([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
                'password' => Hash::make('password123'), // Default password
                'role' => 'teacher',
            ]);

            // Set formatted employee number
            $user->update([
                'employee_number' => $user->formatted_employee_number,
            ]);

            // Create teacher record
            $teacher = Teacher::create([
                'user_id' => $user->id,
                'employee_number' => $user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'department' => $validated['department'],
                'specialization' => $validated['specialization'],
                'hire_date' => $validated['hire_date'],
                'status' => $validated['status'],
                'profile_picture' => $profilePictureUrl,
            ]);

            Log::info('Teacher created successfully', [
                'teacher_id' => $teacher->id,
                'user_id' => $user->id,
                'created_by' => Auth::id(),
            ]);

            return redirect()->back()
                ->with('success', 'Teacher created successfully');

        } catch (\Exception $e) {
            Log::error('Failed to create teacher', [
                'error' => $e->getMessage(),
                'data' => $validated,
            ]);

            return back()->withErrors(['error' => 'Oops! Something went wrong while creating the teacher account. Please double-check your details and try again.']);
        }
    }

    public function show(Teacher $teacher): Response
    {
        $teacher->load([
            'user',
            'sectionSubjects' => function ($query) {
                $query->with(['subject', 'section' => function ($sectionQuery) {
                    $sectionQuery->with(['program', 'studentEnrollments.student.user']);
                }, 'classSchedules'])
                    ->active()
                    ->orderBy('created_at', 'desc');
            },
        ]);

        return Inertia::render('Admin/Teachers/Show', [
            'teacher' => $teacher,
        ]);
    }

    public function edit(Teacher $teacher): Response
    {
        $teacher->load('user');

        Log::info('Teacher edit data:', $teacher->toArray());

        return Inertia::render('Admin/Teachers/Edit', [
            'teacher' => $teacher,
        ]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        \Log::info('=== TEACHER UPDATE METHOD CALLED ===');
        \Log::info('Teacher ID: '.$teacher->id);
        \Log::info('Request method: '.$request->method());
        \Log::info('Request path: '.$request->path());
        \Log::info('All request data: ', $request->all());
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('users')->ignore($teacher->user_id)],
            'department' => 'nullable|string|max:255',
            'specialization' => 'nullable|string|max:255',
            'hire_date' => 'nullable|date',
            'status' => 'required|in:active,inactive',
            'profile_picture' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:5120',
        ]);

        // Check if status is being changed to inactive
        if ($validated['status'] === 'inactive') {
            // Check for incomplete grades
            $incompleteGrades = $this->getIncompleteGradesForTeacher($teacher->id);

            if (! empty($incompleteGrades)) {
                // Prevent status change and show incomplete grades
                return redirect()->back()->with([
                    'show_confirmation' => true,
                    'incomplete_grades' => $incompleteGrades,
                    'incomplete_count' => count($incompleteGrades),
                ])->withErrors(['status' => 'Cannot change status to inactive. Teacher has incomplete grades that must be submitted first.']);
            }
        }

        // Proceed with the update (either status change confirmed or no incomplete grades)
        return $this->performTeacherUpdate($request, $teacher, $validated);
    }

    private function getIncompleteGradesForTeacher($teacherId)
    {
        $incompleteGrades = [];

        // Check college grades with missing components
        $collegeGrades = StudentGrade::join('section_subjects', 'student_grades.section_subject_id', '=', 'section_subjects.id')
            ->where('section_subjects.teacher_id', $teacherId)
            ->join('student_enrollments', 'student_grades.student_enrollment_id', '=', 'student_enrollments.id')
            ->join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->join('sections', 'student_enrollments.section_id', '=', 'sections.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->where('students.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->whereRaw('(student_grades.prelim_grade IS NULL OR student_grades.midterm_grade IS NULL OR student_grades.prefinal_grade IS NULL OR student_grades.final_grade IS NULL)')
            ->select(
                'students.first_name',
                'students.last_name',
                'subjects.subject_code',
                'sections.section_name',
                'sections.year_level',
                'sections.program_id',
                'sections.academic_year',
                'sections.semester',
                'student_grades.prelim_grade',
                'student_grades.midterm_grade',
                'student_grades.prefinal_grade',
                'student_grades.final_grade'
            )
            ->get();

        foreach ($collegeGrades as $grade) {
            // Determine which grades are missing
            $missingGrades = [];
            if (is_null($grade->prelim_grade)) {
                $missingGrades[] = 'P';
            }
            if (is_null($grade->midterm_grade)) {
                $missingGrades[] = 'M';
            }
            if (is_null($grade->prefinal_grade)) {
                $missingGrades[] = 'PF';
            }
            if (is_null($grade->final_grade)) {
                $missingGrades[] = 'F';
            }

            $incompleteGrades[] = [
                'student' => $grade->first_name.' '.$grade->last_name,
                'subject' => $grade->subject_code,
                'section' => $grade->year_level.($grade->program_id ? '-'.$grade->section_name : $grade->section_name),
                'missing_grades' => implode(', ', $missingGrades),
                'academic_year' => $grade->academic_year,
                'semester' => ucfirst($grade->semester),
                'type' => 'College',
            ];
        }

        // Check SHS grades with missing components
        $shsGrades = ShsStudentGrade::join('section_subjects', 'shs_student_grades.section_subject_id', '=', 'section_subjects.id')
            ->where('section_subjects.teacher_id', $teacherId)
            ->join('student_enrollments', 'shs_student_grades.student_enrollment_id', '=', 'student_enrollments.id')
            ->join('students', 'student_enrollments.student_id', '=', 'students.id')
            ->join('sections', 'student_enrollments.section_id', '=', 'sections.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->leftJoin('programs', 'sections.program_id', '=', 'programs.id')
            ->where('students.status', 'active')
            ->where('student_enrollments.status', 'active')
            ->whereRaw('(shs_student_grades.first_quarter_grade IS NULL OR shs_student_grades.second_quarter_grade IS NULL OR shs_student_grades.final_grade IS NULL)')
            ->select(
                'students.first_name',
                'students.last_name',
                'subjects.subject_code',
                'sections.section_name',
                'sections.year_level',
                'programs.track',
                'sections.academic_year',
                'sections.semester',
                'shs_student_grades.first_quarter_grade',
                'shs_student_grades.second_quarter_grade',
                'shs_student_grades.final_grade'
            )
            ->get();

        foreach ($shsGrades as $grade) {
            // Determine which grades are missing
            $missingGrades = [];
            if (is_null($grade->first_quarter_grade)) {
                $missingGrades[] = '1Q';
            }
            if (is_null($grade->second_quarter_grade)) {
                $missingGrades[] = '2Q';
            }
            if (is_null($grade->final_grade)) {
                $missingGrades[] = 'F';
            }

            $incompleteGrades[] = [
                'student' => $grade->first_name.' '.$grade->last_name,
                'subject' => $grade->subject_code,
                'section' => 'Grade '.$grade->year_level.($grade->track ? ' - '.$grade->track : ''),
                'missing_grades' => implode(', ', $missingGrades),
                'academic_year' => $grade->academic_year,
                'semester' => ucfirst($grade->semester),
                'type' => 'SHS',
            ];
        }

        return $incompleteGrades;
    }

    private function performTeacherUpdate(Request $request, Teacher $teacher, array $validated)
    {
        try {
            // Handle profile picture upload
            $profilePictureUrl = $teacher->profile_picture;
            if ($request->hasFile('profile_picture')) {
                $uploadedFile = $request->file('profile_picture');
                $uploadResult = Cloudinary::uploadApi()->upload($uploadedFile->getRealPath(), [
                    'folder' => 'datamex_elms/teachers',
                    'public_id' => 'teacher_'.$teacher->id.'_'.time(),
                    'transformation' => [
                        ['width' => 300, 'height' => 300, 'crop' => 'fill'],
                        ['quality' => 'auto'],
                    ],
                ]);
                $profilePictureUrl = $uploadResult['secure_url'];
            }

            // Update user account
            $teacher->user->update([
                'name' => trim($validated['first_name'].' '.($validated['middle_name'] ? $validated['middle_name'].' ' : '').$validated['last_name']),
                'email' => $validated['email'],
            ]);

            // Update teacher record
            $teacher->update([
                'employee_number' => $teacher->user->formatted_employee_number,
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'middle_name' => $validated['middle_name'],
                'department' => $validated['department'],
                'specialization' => $validated['specialization'],
                'hire_date' => $validated['hire_date'],
                'status' => $validated['status'],
                'profile_picture' => $profilePictureUrl,
            ]);

            return redirect()->route('admin.teachers.show', $teacher->id)
                ->with('success', 'Teacher updated successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to update teacher', [
                'teacher_id' => $teacher->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to update teacher. Please try again.']);
        }
    }

    public function destroy(Teacher $teacher)
    {
        try {
            // Check if teacher has active assignments
            $activeSections = $teacher->sections()
                ->whereHas('studentEnrollments', function ($query) {
                    $query->where('status', 'active');
                })
                ->count();

            if ($activeSections > 0) {
                return back()->withErrors([
                    'error' => 'Cannot delete teacher with active section assignments. Please reassign sections first.',
                ]);
            }

            // Delete teacher (this will also delete the user due to cascade)
            $teacher->delete();

            Log::info('Teacher deleted successfully', [
                'teacher_id' => $teacher->id,
                'deleted_by' => Auth::id(),
            ]);

            return redirect()->route('admin.teachers.index')
                ->with('success', 'Teacher deleted successfully.');

        } catch (\Exception $e) {
            Log::error('Failed to delete teacher', [
                'teacher_id' => $teacher->id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete teacher. Please try again.']);
        }
    }

    public function teachersPdf()
    {
        // Get all teachers with their user data
        $teachers = Teacher::with('user')
            ->orderBy('last_name')
            ->orderBy('first_name')
            ->get();

        // Get current date and time in Asia/Manila timezone
        $currentDateTime = now('Asia/Manila')->format('F j, Y g:i A');

        $data = [
            'teachers' => $teachers,
            'currentDateTime' => $currentDateTime,
            'totalTeachers' => $teachers->count(),
        ];

        $pdf = Pdf::loadView('pdf.teachers', $data);

        return $pdf->download('teachers-report-'.now('Asia/Manila')->format('Y-m-d-H-i-s').'.pdf');
    }
}
