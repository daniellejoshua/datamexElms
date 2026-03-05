<?php

namespace App\Http\Controllers\Admin;

use App\Helpers\AcademicHelper;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSectionRequest;
use App\Http\Requests\Admin\UpdateSectionRequest;
use App\Models\ArchivedSection;
use App\Models\CurriculumSubject;
use App\Models\Program;
use App\Models\SchoolSetting;
use App\Models\Section;
use App\Models\SectionSubject;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Rules\TeacherScheduleConflict;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Response;
use Inertia\ResponseFactory;

class SectionController extends Controller
{
    public function __construct(
        protected ResponseFactory $inertia
    ) {}

    public function index(Request $request): Response
    {
        // Get current academic period for default filtering
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $query = Section::with(['program', 'subjects', 'sectionSubjects.teacher.user'])
            ->withCount(['studentEnrollments as enrolled_count' => function ($query) {
                $query->where('status', 'active');
            }]);

        // Apply filters with defaults
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('section_name', 'like', '%'.$request->search.'%')
                    ->orWhereHas('subjects', function ($subjectQuery) use ($request) {
                        $subjectQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('subject_code', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('program', function ($programQuery) use ($request) {
                        $programQuery->where('program_name', 'like', '%'.$request->search.'%')
                            ->orWhere('program_code', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('sectionSubjects', function ($sectionSubjectQuery) use ($request) {
                        $sectionSubjectQuery->where('room', 'like', '%'.$request->search.'%');
                    });
            });
        }

        if ($request->has('program_id') && $request->program_id) {
            $query->where('program_id', $request->program_id);
        }

        if ($request->has('subject_id') && $request->subject_id) {
            $query->whereHas('subjects', function ($subjectQuery) use ($request) {
                $subjectQuery->where('subjects.id', $request->subject_id);
            });
        }

        // Only apply academic year filter if explicitly provided
        // Don't apply default if user chose "All" (which removes the parameter)
        if ($request->has('academic_year')) {
            $academicYear = $request->get('academic_year');
            if ($academicYear) {
                $query->where('academic_year', $academicYear);
            }
        } else {
            // Only apply default on first load (no filters at all)
            $hasAnyFilter = $request->has('semester') || $request->has('search') || $request->has('program_id') || $request->has('subject_id');
            if (! $hasAnyFilter) {
                $academicYear = $currentAcademicYear;
                $query->where('academic_year', $academicYear);
            } else {
                $academicYear = null;
            }
        }

        // Only apply semester filter if explicitly provided
        // Don't apply default if user chose "All" (which removes the parameter)
        if ($request->has('semester')) {
            $semester = $request->get('semester');
            if ($semester) {
                $query->where('semester', $semester);
            }
        } else {
            // Only apply default on first load (no filters at all)
            $hasAnyFilter = $request->has('academic_year') || $request->has('search') || $request->has('program_id') || $request->has('subject_id');
            if (! $hasAnyFilter) {
                $semester = $currentSemester;
                $query->where('semester', $semester);
            } else {
                $semester = null;
            }
        }

        $sections = $query->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->orderBy('program_id')
            ->orderBy('section_name')
            ->paginate(15)
            ->withQueryString();

        $programs = Program::orderBy('program_code')->get();
        $subjects = Subject::orderBy('subject_code')->get();

        return $this->inertia->render('Admin/Sections/Index', [
            'sections' => $sections,
            'programs' => $programs,
            'subjects' => $subjects,
            'filters' => array_merge([
                'academic_year' => $academicYear ?? '',
                'semester' => $semester ?? '',
            ], $request->only(['search', 'program_id', 'subject_id'])),
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function create(Request $request): Response
    {
        // Get current academic period
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $programs = Program::where('status', 'active')->orderBy('program_code')->get();

        // Get archived sections for reference when creating new sections
        $archivedSections = \App\Models\ArchivedSection::with(['archivedEnrollments'])
            ->whereHas('archivedEnrollments', function ($query) {
                $query->whereNotNull('student_id');
            })
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->limit(50)
            ->get();

        return $this->inertia->render('Admin/Sections/Create', [
            'programs' => $programs,
            'archivedSections' => $archivedSections,
            'currentAcademicPeriod' => [
                'academic_year' => $currentAcademicYear,
                'semester' => $currentSemester,
            ],
            'academicYearOptions' => AcademicHelper::getAcademicYearOptions(),
            'semesterOptions' => AcademicHelper::getSemesterOptions(),
        ]);
    }

    public function store(StoreSectionRequest $request): RedirectResponse
    {
        // Get the curriculum automatically from YearLevelCurriculumGuide
        $curriculumGuide = \App\Models\YearLevelCurriculumGuide::where('program_id', $request->program_id)
            ->where('academic_year', $request->academic_year)
            ->where('year_level', $request->year_level)
            ->first();

        if (! $curriculumGuide) {
            return redirect()->back()
                ->withErrors(['curriculum' => 'No curriculum guide found for this program, academic year, and year level combination.'])
                ->withInput();
        }

        $sectionData = $request->validated();
        $sectionData['curriculum_id'] = $curriculumGuide->curriculum_id;

        $section = Section::create($sectionData);

        // Automatically attach subjects from the curriculum that match the section's year level and semester
        $curriculumSubjects = \App\Models\CurriculumSubject::where('curriculum_id', $curriculumGuide->curriculum_id)
            ->where('year_level', $request->year_level)
            ->where('semester', $request->semester)
            ->where('status', 'active')
            ->get();

        foreach ($curriculumSubjects as $curriculumSubject) {
            $section->sectionSubjects()->create([
                'subject_id' => $curriculumSubject->subject_id,
                'status' => 'active',
            ]);
        }

        return redirect()->route('admin.sections.index')
            ->with('success', 'Section created successfully.');
    }

    public function show(Section $section): Response
    {
        $section->load([
            'program',
            'teacherAssignments.teacher.user',
            'studentEnrollments' => function ($query) {
                $query->with('student.user')->where('status', 'active');
            },
            'classSchedules',
        ]);

        // Load section subjects with relationships
        $sectionSubjects = $section->sectionSubjects()->with(['subject', 'teacher.user'])->get();

        // Get available students for enrollment
        // Check if this is an SHS section
        $isShsSection = $section->program->education_level === 'senior_high';

        // Get available students that match the program and enrollment rules
        $availableStudentsQuery = Student::with(['user', 'program', 'studentEnrollments.section'])
            ->where('status', 'active')
            ->when($section->program->education_level === 'senior_high', function ($query) {
                // For SHS sections, only show SHS students (from any SHS program)
                return $query->whereHas('program', function ($programQuery) {
                    $programQuery->where('education_level', 'senior_high');
                });
            }, function ($query) use ($section) {
                // For college sections, show students from the same program
                return $query->where('program_id', $section->program_id);
            })
            ->when(! empty($section->curriculum_id), function ($query) use ($section) {
                // Only apply curriculum filter to regular students
                // Irregular students can enroll in sections with different curricula since they take individual subjects
                return $query->where(function ($subQuery) use ($section) {
                    $subQuery->where('student_type', '!=', 'irregular')
                        ->where('curriculum_id', $section->curriculum_id);
                })->orWhere('student_type', 'irregular');
            })
            ->where(function ($query) use ($section) {
                if ($section->program->education_level === 'senior_high') {
                    // For SHS sections: show SHS students at correct year level OR SHS irregular students
                    $query->where(function ($subQuery) use ($section) {
                        $subQuery->where('current_year_level', $section->year_level)
                            ->whereHas('program', function ($programQuery) {
                                $programQuery->where('education_level', 'senior_high');
                            });
                    })->orWhere(function ($subQuery) {
                        $subQuery->where('student_type', 'irregular')
                            ->whereHas('program', function ($programQuery) {
                                $programQuery->where('education_level', 'senior_high');
                            });
                    });
                } else {
                    // For college sections: show students at correct year level OR irregular students (from any program)
                    $query->where('current_year_level', $section->year_level)
                        ->orWhere('student_type', 'irregular');
                }
            });

        // Filter students based on enrollment rules
        $availableStudents = $availableStudentsQuery->get()->filter(function ($student) use ($section) {
            // For regular students: ensure year-level matches the section and exclude only if
            // they already have an active enrollment with an assigned section in the current period.
            if ($student->student_type !== 'irregular') {
                // Strictly require the student's numeric year level to match the section's year level
                $studentYear = (int) ($student->current_year_level ?? $student->year_level ?? 0);
                $sectionYear = (int) $section->year_level;

                if ($studentYear !== $sectionYear) {
                    // Regular students on a different year level must not appear as available
                    return false;
                }

                $hasActiveEnrollmentWithSection = $student->studentEnrollments->contains(function ($enrollment) use ($section) {
                    return $enrollment->academic_year === $section->academic_year &&
                           $enrollment->semester === $section->semester &&
                           $enrollment->status === 'active' &&
                           ! empty($enrollment->section_id);
                });

                return ! $hasActiveEnrollmentWithSection;
            }

            // For irregular students: check their current enrollments
            $currentEnrollments = $student->studentEnrollments->filter(function ($enrollment) {
                return $enrollment->status === 'active';
            });

            // Determine numeric year-level for comparisons
            $studentYear = (int) ($student->current_year_level ?? $student->year_level ?? 0);
            $sectionYear = (int) $section->year_level;

            if ($currentEnrollments->isEmpty()) {
                // No current enrollments — still restrict enrolling into a higher year-level section
                if ($studentYear > 0 && $studentYear < $sectionYear) {
                    return false;
                }

                return true;
            }

            // Only consider enrollments with assigned sections for year level calculations
            $enrollmentsWithSections = $currentEnrollments->filter(function ($enrollment) {
                return ! empty($enrollment->section_id);
            });

            // Check if student is already enrolled in this specific section
            $alreadyEnrolledInThisSection = $currentEnrollments->contains(function ($enrollment) use ($section) {
                return $enrollment->section_id === $section->id &&
                       $enrollment->academic_year === $section->academic_year &&
                       $enrollment->semester === $section->semester &&
                       $enrollment->status === 'active';
            });

            if ($alreadyEnrolledInThisSection) {
                return false;
            }

            // Check if student has completed all subjects for this year level
            $hasCompletedAllSubjectsForYearLevel = $this->hasCompletedAllSubjectsForYearLevel($student, $section->year_level);

            // Don't show if student has completed all subjects for this year level
            if ($hasCompletedAllSubjectsForYearLevel) {
                return false;
            }

            // Prevent enrolling irregular students into sections above their current year level
            if ($studentYear > 0 && $studentYear < $sectionYear) {
                return false;
            }

            // Allow enrollment in same or lower year level as long as they haven't completed all subjects
            return true;
        });

        \Log::info('Admin Section show - available students', [
            'section_id' => $section->id,
            'section_year' => $section->year_level,
            'available_count' => $availableStudents->count(),
            'available_ids' => $availableStudents->pluck('id')->toArray(),
        ]);

        return $this->inertia->render('Admin/Sections/Show', [
            'section' => $section,
            'sectionSubjects' => $sectionSubjects,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function edit(Section $section): Response
    {
        $section->load('program');
        $programs = Program::where('status', 'active')->orderBy('program_code')->get();

        return $this->inertia->render('Admin/Sections/Edit', [
            'section' => $section,
            'programs' => $programs,
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

    public function subjects(Section $section): Response
    {
        $section->load(['program', 'sectionSubjects.subject', 'sectionSubjects.teacher.user']);

        $subjects = Subject::where('status', 'active')
            ->orderBy('subject_code')
            ->get();

        $teachers = Teacher::with('user')
            ->where('status', 'active')
            ->get();

        return $this->inertia->render('Admin/Sections/Subjects', [
            'section' => $section,
            'subjects' => $subjects,
            'teachers' => $teachers,
        ]);
    }

    public function attachSubject(Request $request, Section $section): RedirectResponse
    {
        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($validated['teacher_id'] && $validated['schedule_days'] && $validated['start_time'] && $validated['end_time']) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $validated['teacher_id'],
                $validated['subject_id'],
                $section->id,
                $validated['schedule_days'],
                $validated['start_time'],
                $validated['end_time'],
                null,
                $section->academic_year,
                $section->semester
            );

            $validator = validator($validated, [
                'teacher_id' => [$teacherConflictRule],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
        }

        // Check if subject is already attached
        if ($section->subjects()->where('subject_id', $validated['subject_id'])->exists()) {
            return back()->withErrors(['subject_id' => 'This subject is already assigned to this section.']);
        }

        $section->subjects()->attach($validated['subject_id'], [
            'teacher_id' => $validated['teacher_id'],
            'room' => $validated['room'],
            'schedule_days' => $validated['schedule_days'] ? json_encode($validated['schedule_days']) : null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'active',
        ]);

        // Get the newly created section subject
        $sectionSubject = $section->sectionSubjects()->where('subject_id', $validated['subject_id'])->first();

        // Enroll all active students in this section to this new subject
        $activeEnrollments = StudentEnrollment::where('section_id', $section->id)
            ->where('status', 'active')
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->get();

        foreach ($activeEnrollments as $enrollment) {
            // Check if student is already enrolled in this subject
            $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                'student_id' => $enrollment->student_id,
                'section_subject_id' => $sectionSubject->id,
                'academic_year' => $section->academic_year,
                'semester' => $section->semester,
            ])->first();

            if (! $existingSubjectEnrollment) {
                StudentSubjectEnrollment::create([
                    'student_id' => $enrollment->student_id,
                    'section_subject_id' => $sectionSubject->id,
                    'enrollment_type' => 'regular',
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                    'enrollment_date' => now(),
                    'enrolled_by' => Auth::id(),
                ]);
            }
        }

        return back()->with('success', 'Subject assigned to section successfully.');
    }

    public function updateSubject(Request $request, Section $section, Subject $subject): RedirectResponse
    {
        $validated = $request->validate([
            'teacher_id' => 'nullable|exists:teachers,id',
            'room' => 'nullable|string|max:50',
            'schedule_days' => 'nullable|array',
            'schedule_days.*' => 'in:monday,tuesday,wednesday,thursday,friday,saturday,sunday',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i|after:start_time',
        ]);

        // Get the current section subject pivot record for exclusion in conflict check
        $sectionSubject = $section->sectionSubjects()->where('subject_id', $subject->id)->firstOrFail();

        // Additional teacher schedule conflict validation if teacher and schedule are provided
        if ($validated['teacher_id'] && $validated['schedule_days'] && $validated['start_time'] && $validated['end_time']) {
            $teacherConflictRule = new TeacherScheduleConflict(
                $validated['teacher_id'],
                $subject->id,
                $section->id,
                $validated['schedule_days'],
                $validated['start_time'],
                $validated['end_time'],
                $sectionSubject->id, // Exclude current assignment from conflict check
                $section->academic_year,
                $section->semester
            );

            $validator = validator($validated, [
                'teacher_id' => [$teacherConflictRule],
            ]);

            if ($validator->fails()) {
                return back()->withErrors($validator)->withInput();
            }
        }

        $section->subjects()->updateExistingPivot($subject->id, [
            'teacher_id' => $validated['teacher_id'],
            'room' => $validated['room'],
            'schedule_days' => $validated['schedule_days'] ? json_encode($validated['schedule_days']) : null,
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
        ]);

        return back()->with('success', 'Subject schedule updated successfully.');
    }

    public function detachSubject(Section $section, Subject $subject): RedirectResponse
    {
        $section->subjects()->detach($subject->id);

        return back()->with('success', 'Subject removed from section successfully.');
    }

    public function students(Section $section): Response
    {
        \Illuminate\Support\Facades\Log::info('Students page accessed', [
            'section_id' => $section->id,
            'user_id' => Auth::id(),
            'user_name' => Auth::user() ? Auth::user()->name : 'Not authenticated',
            'timestamp' => now(),
        ]);

        // Get current academic period
        $currentAcademicYear = SchoolSetting::getCurrentAcademicYear();
        $currentSemester = SchoolSetting::getCurrentSemester();

        $section->load(['program', 'sectionSubjects.subject', 'studentEnrollments.student.user']);

        $enrolledStudents = $section->studentEnrollments()
            ->with('student.user')
            ->where('status', 'active')
            ->get();

        // Annotate each enrolled student's model with UI flags.
        // Subject-level management is only available for irregular students.
        foreach ($enrolledStudents as $enrollment) {
            $student = $enrollment->student;

            $student->setAttribute('can_manage_subjects', $student->student_type === 'irregular');
        }

        $enrolledStudentIds = $enrolledStudents->pluck('student.id')->toArray();

        // Get available students that match the program and enrollment rules
        $availableStudentsQuery = Student::with(['user', 'program', 'studentEnrollments.section'])
            ->where('status', 'active')
            ->when($section->program->education_level === 'senior_high', function ($query) {
                // For SHS sections, only show SHS students (from any SHS program)
                return $query->whereHas('program', function ($programQuery) {
                    $programQuery->where('education_level', 'senior_high');
                });
            }, function ($query) use ($section) {
                // For college sections, show students from the same program
                return $query->where('program_id', $section->program_id);
            })
            ->when(! empty($section->curriculum_id), function ($query) use ($section) {
                // Only apply curriculum filter to regular students
                // Irregular students can enroll in sections with different curricula since they take individual subjects
                return $query->where(function ($subQuery) use ($section) {
                    $subQuery->where('student_type', '!=', 'irregular')
                        ->where('curriculum_id', $section->curriculum_id);
                })->orWhere('student_type', 'irregular');
            })
            ->where(function ($query) use ($section) {
                if ($section->program->education_level === 'senior_high') {
                    // For SHS sections: show SHS students at correct year level OR SHS irregular students
                    $query->where(function ($subQuery) use ($section) {
                        $subQuery->where('current_year_level', $section->year_level)
                            ->whereHas('program', function ($programQuery) {
                                $programQuery->where('education_level', 'senior_high');
                            });
                    })->orWhere(function ($subQuery) {
                        $subQuery->where('student_type', 'irregular')
                            ->whereHas('program', function ($programQuery) {
                                $programQuery->where('education_level', 'senior_high');
                            });
                    });
                } else {
                    // For college sections: show students at correct year level OR irregular students (from any program)
                    $query->where('current_year_level', $section->year_level)
                        ->orWhere('student_type', 'irregular');
                }
            });

        $availableStudents = $availableStudentsQuery->get()->filter(function ($student) use ($section) {
            // For regular students: require exact year-level match and exclude if they
            // already have an active enrollment with an assigned section in the same period.
            if ($student->student_type !== 'irregular') {
                // Normalize numeric year from either `current_year_level` or `year_level` (handles strings like "1st Year")
                $studentYear = (int) ($student->current_year_level ?? $student->year_level ?? 0);
                $sectionYear = (int) $section->year_level;

                // Exclude regular students whose year level does not equal the section's year level
                if ($studentYear !== $sectionYear) {
                    return false;
                }

                $hasActiveEnrollmentWithSection = $student->studentEnrollments->contains(function ($enrollment) use ($section) {
                    return $enrollment->academic_year === $section->academic_year &&
                           $enrollment->semester === $section->semester &&
                           $enrollment->status === 'active' &&
                           ! empty($enrollment->section_id);
                });

                return ! $hasActiveEnrollmentWithSection;
            }

            // For irregular students: check their current enrollments
            $currentEnrollments = $student->studentEnrollments->filter(function ($enrollment) {
                return $enrollment->status === 'active';
            });

            // Always prevent showing irregular students for sections that are a
            // higher year level than the student's current_year_level — apply
            // this rule regardless of whether they have active enrollments.
            if (! is_null($student->current_year_level) && $section->year_level > $student->current_year_level) {
                return false;
            }

            // If the student has no current enrollments, do not show them in the
            // "available students" list by default (prevents accidental bulk-enroll).
            if ($currentEnrollments->isEmpty()) {
                return false;
            }

            // Only consider enrollments with assigned sections for year level calculations
            $enrollmentsWithSections = $currentEnrollments->filter(function ($enrollment) {
                return ! empty($enrollment->section_id);
            });

            // Check if student is already enrolled in this specific section
            $alreadyEnrolledInThisSection = $currentEnrollments->contains(function ($enrollment) use ($section) {
                return $enrollment->section_id === $section->id &&
                       $enrollment->academic_year === $section->academic_year &&
                       $enrollment->semester === $section->semester &&
                       $enrollment->status === 'active';
            });

            if ($alreadyEnrolledInThisSection) {
                return false;
            }

            // Check if student has completed all subjects for this year level
            $hasCompletedAllSubjectsForYearLevel = $this->hasCompletedAllSubjectsForYearLevel($student, $section->year_level);

            // Don't show if student has completed all subjects for this year level
            if ($hasCompletedAllSubjectsForYearLevel) {
                return false;
            }

            // Determine whether there are any section subjects the irregular student can be
            // enrolled in (exclude credited subjects and existing subject enrollments).
            $enrolledSubjectCodes = \App\Models\StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->where('status', 'active')
                ->with('sectionSubject.subject')
                ->get()
                ->pluck('sectionSubject.subject.subject_code')
                ->filter()
                ->toArray();

            $creditedSubjectCodes = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
                ->where('credit_status', 'credited')
                ->pluck('subject_code')
                ->toArray();

            $creditTransferSubjectCodes = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
                ->where('credit_status', 'credited')
                ->pluck('subject_code')
                ->toArray();

            $allCreditedCodes = array_merge($creditedSubjectCodes, $creditTransferSubjectCodes);

            $sectionSubjectsQuery = \App\Models\SectionSubject::where('section_id', $section->id)
                ->where('status', 'active')
                ->whereHas('subject', function ($q) use ($allCreditedCodes, $enrolledSubjectCodes) {
                    $q->whereNotIn('subject_code', array_merge($allCreditedCodes, $enrolledSubjectCodes));
                });

            // If student is from a different program, only consider subjects present
            // in the student's curriculum for this year level (intersection).
            if ($student->program_id !== $section->program_id && $student->curriculum_id) {
                $studentCurriculumCodes = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                    ->where('year_level', $section->year_level)
                    ->pluck('subject_code')
                    ->toArray();

                if (! empty($studentCurriculumCodes)) {
                    $sectionSubjectsQuery->whereHas('subject', function ($q) use ($studentCurriculumCodes) {
                        $q->whereIn('subject_code', $studentCurriculumCodes);
                    });
                } else {
                    // Student has no curriculum subjects for this year level => none available
                    return false;
                }
            }

            // If there are no available section subjects for this irregular student, do not show them
            if (! $sectionSubjectsQuery->exists()) {
                return false;
            }

            // Allow enrollment in any year level (same or lower) as long as they haven't completed all subjects
            return true;
        });

        // Debug logging
        \Illuminate\Support\Facades\Log::info('Students data prepared', [
            'section_id' => $section->id,
            'section_name' => $section->section_name,
            'section_program_id' => $section->program_id,
            'section_year_level' => $section->year_level,
            'enrolled_students_count' => $enrolledStudents->count(),
            'available_students_count' => $availableStudents->count(),
            'enrolled_student_ids' => $enrolledStudentIds,
            'available_student_sample' => $availableStudents->take(3)->map(function ($student) {
                return [
                    'id' => $student->id,
                    'name' => $student->user->name,
                    'student_number' => $student->student_number,
                    'program_id' => $student->program_id,
                    'year_level' => $student->current_year_level,
                    'student_type' => $student->student_type,
                ];
            }),
        ]);

        return $this->inertia->render('Admin/Sections/Students', [
            'section' => array_merge($section->toArray(), [
                'current_academic_year' => $currentAcademicYear,
                'current_semester' => $currentSemester,
            ]),
            'enrolledStudents' => $enrolledStudents,
            'availableStudents' => $availableStudents->values(), // Reset array keys after filtering
            'canCarryForward' => $this->canCarryForwardStudents($section),
        ]);
    }

    public function studentsPdf(Section $section)
    {
        // Get enrolled students with their user information
        $enrolledStudents = $section->studentEnrollments()
            ->where('status', 'active')
            ->with(['student.user'])
            ->get()
            ->map(function ($enrollment) {
                return $enrollment->student;
            })
            ->filter(function ($student) {
                return $student->user !== null;
            });

        // If we have fewer than 40 students, add example students
        if ($enrolledStudents->count() < 40) {
            $exampleStudents = $this->getExampleStudents();
            $enrolledStudents = $enrolledStudents->merge($exampleStudents);
        }

        // Separate students by gender and sort alphabetically
        $maleStudents = $enrolledStudents
            ->filter(function ($student) {
                return $student->gender === 'male';
            })
            ->sortBy(function ($student) {
                return $student->last_name.' '.$student->first_name;
            })
            ->values();

        $femaleStudents = $enrolledStudents
            ->filter(function ($student) {
                return $student->gender === 'female';
            })
            ->sortBy(function ($student) {
                return $student->last_name.' '.$student->first_name;
            })
            ->values();

        // Generate PDF
        $pdf = Pdf::loadView('pdf.section-students', [
            'section' => $section,
            'maleStudents' => $maleStudents,
            'femaleStudents' => $femaleStudents,
            'totalStudents' => $enrolledStudents->count(),
            'maleCount' => $maleStudents->count(),
            'femaleCount' => $femaleStudents->count(),
        ]);

        $filename = 'section-'.$section->program->program_code.'-'.$section->year_level.$section->section_name.'-students.pdf';

        return $pdf->download($filename);
    }

    /**
     * Get example students for PDF demonstration
     */
    private function getExampleStudents()
    {
        $maleNames = [
            ['first' => 'Juan', 'last' => 'Dela Cruz'],
            ['first' => 'Pedro', 'last' => 'Santos'],
            ['first' => 'Jose', 'last' => 'Garcia'],
            ['first' => 'Miguel', 'last' => 'Rodriguez'],
            ['first' => 'Antonio', 'last' => 'Martinez'],
            ['first' => 'Luis', 'last' => 'Hernandez'],
            ['first' => 'Carlos', 'last' => 'Lopez'],
            ['first' => 'Francisco', 'last' => 'Gonzalez'],
            ['first' => 'Angel', 'last' => 'Perez'],
            ['first' => 'Manuel', 'last' => 'Sanchez'],
            ['first' => 'Rafael', 'last' => 'Ramirez'],
            ['first' => 'Roberto', 'last' => 'Torres'],
            ['first' => 'Fernando', 'last' => 'Flores'],
            ['first' => 'Ricardo', 'last' => 'Rivera'],
            ['first' => 'Eduardo', 'last' => 'Gomez'],
            ['first' => 'Alberto', 'last' => 'Diaz'],
            ['first' => 'Ramon', 'last' => 'Morales'],
            ['first' => 'Victor', 'last' => 'Ortiz'],
            ['first' => 'Mario', 'last' => 'Gutierrez'],
            ['first' => 'Armando', 'last' => 'Chavez'],
        ];

        $femaleNames = [
            ['first' => 'Maria', 'last' => 'Cruz'],
            ['first' => 'Carmen', 'last' => 'Reyes'],
            ['first' => 'Rosa', 'last' => 'Diaz'],
            ['first' => 'Isabel', 'last' => 'Torres'],
            ['first' => 'Ana', 'last' => 'Garcia'],
            ['first' => 'Luisa', 'last' => 'Rodriguez'],
            ['first' => 'Elena', 'last' => 'Martinez'],
            ['first' => 'Teresa', 'last' => 'Lopez'],
            ['first' => 'Pilar', 'last' => 'Gonzalez'],
            ['first' => 'Sofia', 'last' => 'Perez'],
            ['first' => 'Dolores', 'last' => 'Sanchez'],
            ['first' => 'Cristina', 'last' => 'Ramirez'],
            ['first' => 'Beatriz', 'last' => 'Torres'],
            ['first' => 'Mercedes', 'last' => 'Flores'],
            ['first' => 'Victoria', 'last' => 'Rivera'],
            ['first' => 'Concepcion', 'last' => 'Gomez'],
            ['first' => 'Esperanza', 'last' => 'Diaz'],
            ['first' => 'Patricia', 'last' => 'Morales'],
            ['first' => 'Montserrat', 'last' => 'Ortiz'],
            ['first' => 'Francisca', 'last' => 'Gutierrez'],
        ];

        $students = collect();

        // Add male students
        foreach ($maleNames as $index => $name) {
            $students->push((object) [
                'student_number' => '2026-'.str_pad($index + 1, 4, '0', STR_PAD_LEFT),
                'first_name' => $name['first'],
                'last_name' => $name['last'],
                'middle_name' => null,
                'gender' => 'male',
            ]);
        }

        // Add female students
        foreach ($femaleNames as $index => $name) {
            $students->push((object) [
                'student_number' => '2026-'.str_pad($index + 21, 4, '0', STR_PAD_LEFT),
                'first_name' => $name['first'],
                'last_name' => $name['last'],
                'middle_name' => null,
                'gender' => 'female',
            ]);
        }

        return $students;
    }

    /**
     * Check if this section can carry forward students from an archived section
     */
    protected function canCarryForwardStudents(Section $section): bool
    {
        // Check for archived section with same year level (repeating students)
        $sameYearArchived = ArchivedSection::where('section_name', $section->section_name)
            ->where('program_id', $section->program_id)
            ->where('year_level', $section->year_level)
            ->orderBy('archived_at', 'desc')
            ->first();

        if ($sameYearArchived) {
            return true;
        }

        // Check for archived section from previous year level (students progressing)
        $previousYearLevel = $section->year_level - 1;
        if ($previousYearLevel > 0) {
            $previousYearArchived = ArchivedSection::where('section_name', $section->section_name)
                ->where('program_id', $section->program_id)
                ->where('year_level', $previousYearLevel)
                ->orderBy('archived_at', 'desc')
                ->first();

            if ($previousYearArchived) {
                return true;
            }
        }

        return false;
    }

    /**
     * Carry forward students from the last archived version of this section
     * Handles both:
     * 1. Same year level (repeating students)
     * 2. Previous year level (students progressing to next year)
     */
    public function carryForwardStudents(Section $section)
    {
        try {
            $archivedSection = null;
            $isProgression = false;

            // Determine which archived section to look for based on semester progression
            if ($section->semester === '1st') {
                // For 1st semester sections, look for students progressing from previous year (2nd semester)
                $previousYearLevel = $section->year_level - 1;
                if ($previousYearLevel > 0) {
                    $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                        ->where('section_name', $section->section_name)
                        ->where('program_id', $section->program_id)
                        ->where('year_level', $previousYearLevel)
                        ->where('semester', 'second') // Look for 2nd semester of previous year
                        ->orderBy('archived_at', 'desc')
                        ->first();

                    if ($archivedSection) {
                        $isProgression = true;
                    }
                }
            } else {
                // For 2nd semester sections, look for continuing students from same year (1st semester)
                $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                    ->where('section_name', $section->section_name)
                    ->where('program_id', $section->program_id)
                    ->where('year_level', $section->year_level)
                    ->where('semester', 'first') // Look for 1st semester of same year
                    ->orderBy('archived_at', 'desc')
                    ->first();
            }

            // Fallback: if no specific semester match found, try the old logic
            if (! $archivedSection) {
                // First try to find archived section with same year level
                $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                    ->where('section_name', $section->section_name)
                    ->where('program_id', $section->program_id)
                    ->where('year_level', $section->year_level)
                    ->orderBy('archived_at', 'desc')
                    ->first();

                // If no same-year section found, look for previous year level (student progression)
                if (! $archivedSection) {
                    $previousYearLevel = $section->year_level - 1;
                    if ($previousYearLevel > 0) {
                        $archivedSection = ArchivedSection::with(['archivedEnrollments.student.user'])
                            ->where('section_name', $section->section_name)
                            ->where('program_id', $section->program_id)
                            ->where('year_level', $previousYearLevel)
                            ->orderBy('archived_at', 'desc')
                            ->first();

                        if ($archivedSection) {
                            $isProgression = true;
                        }
                    }
                }
            }

            if (! $archivedSection) {
                return response()->json([
                    'success' => false,
                    'message' => 'No archived section found to carry forward students from.',
                    'data' => [
                        'enrolled' => [],
                        'skipped' => [],
                        'not_enrolled' => [],
                        'year_level_mismatch' => [],
                        'archived_students' => [],
                        'is_progression' => false,
                    ],
                ]);
            }

            // Get all archived students for display.  we intentionally exclude
            // students whose final status was "dropped" so they are not offered
            // again and to avoid duplicate enrollment attempts.
            $archivedStudents = $archivedSection->archivedEnrollments
                ->where('final_status', '!=', 'dropped')
                ->map(function ($enrollment) {
                    return [
                        'id' => $enrollment->student_id,
                        'name' => $enrollment->student->user->name ?? 'Unknown Student',
                        'student_number' => $enrollment->student->student_number ?? '',
                        'year_level' => $enrollment->student->current_year_level ?? '',
                    ];
                })
                ->sortBy('name')
                ->values()
                ->toArray();

            $enrolledStudents = [];
            $skippedStudents = [];
            $notEnrolledStudents = [];
            $yearLevelMismatch = [];

            // Get all students who were enrolled in the archived section (excluding dropped)
            $archivedStudentIds = $archivedSection->archivedEnrollments
                ->where('final_status', '!=', 'dropped')
                ->pluck('student_id')
                ->unique()
                ->toArray();

            foreach ($archivedStudentIds as $studentId) {
                $student = Student::with('user')->find($studentId);

                if (! $student) {
                    $skippedStudents[] = [
                        'id' => $studentId,
                        'name' => "Student ID {$studentId}",
                        'reason' => 'not found',
                    ];

                    continue;
                }

                // For regular students, require the year to match exactly.  Irregular
                // students bypass this check since they may be placed in a lower or
                // higher level section by design.
                $studentYear = (int) ($student->current_year_level ?? 0);
                $sectionYear = (int) $section->year_level;

                if ($student->student_type !== 'irregular' && $studentYear !== $sectionYear) {
                    $yearLevelMismatch[] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'current_year_level' => $student->current_year_level,
                        'section_year_level' => $section->year_level,
                        'reason' => 'year level mismatch',
                    ];

                    continue;
                }

                // If the irregular student has already completed all required
                // subjects for this year level then they should not be carried
                // forward, regardless of year mismatch.
                if ($student->student_type === 'irregular') {
                    $hasCompletedAllSubjectsForYearLevel = $this->hasCompletedAllSubjectsForYearLevel($student, $sectionYear);
                    if ($hasCompletedAllSubjectsForYearLevel) {
                        $skippedStudents[] = [
                            'id' => $student->id,
                            'name' => $student->user->name,
                            'reason' => 'already completed all subjects for year level',
                        ];

                        continue;
                    }
                }

                // Skip students who are not enrolled in the current semester OR are already in a current section
                $isCurrentlyEnrolled = StudentEnrollment::where('student_id', $studentId)
                    ->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'active')
                    ->exists();

                if (! $isCurrentlyEnrolled) {
                    $notEnrolledStudents[] = [
                        'id' => $student->id,
                        'name' => $student->user->name,
                        'reason' => 'not enrolled in current semester',
                    ];

                    continue;
                }

                // Before doing anything, if the student is irregular we must
                // ensure there are still subjects they can take in the target
                // section.  We basically re-run the availability filter used when
                // rendering the section page.  If no subjects remain, skip them.
                if ($student->student_type === 'irregular') {
                    $enrolledSubjectCodes = \App\Models\StudentSubjectEnrollment::where('student_id', $studentId)
                        ->where('status', 'active')
                        ->pluck('section_subject_id')
                        ->map(fn ($id) => SectionSubject::find($id)?->subject?->subject_code)
                        ->filter()
                        ->unique()
                        ->toArray();

                    $creditedSubjectCodes = \App\Models\StudentSubjectCredit::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->pluck('subject_code')
                        ->toArray();

                    $creditTransferSubjectCodes = \App\Models\StudentCreditTransfer::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->pluck('subject_code')
                        ->toArray();

                    $allCreditedCodes = array_merge($creditedSubjectCodes, $creditTransferSubjectCodes);

                    $sectionSubjectsQuery = \App\Models\SectionSubject::where('section_id', $section->id)
                        ->where('status', 'active')
                        ->whereHas('subject', function ($q) use ($allCreditedCodes, $enrolledSubjectCodes) {
                            $q->whereNotIn('subject_code', array_merge($allCreditedCodes, $enrolledSubjectCodes));
                        });

                    // extra curriculum filter if coming from different program
                    if ($student->program_id !== $section->program_id && $student->curriculum_id) {
                        $studentCurriculumCodes = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                            ->where('year_level', $section->year_level)
                            ->pluck('subject_code')
                            ->toArray();

                        if (! empty($studentCurriculumCodes)) {
                            $sectionSubjectsQuery->whereHas('subject', function ($q) use ($studentCurriculumCodes) {
                                $q->whereIn('subject_code', $studentCurriculumCodes);
                            });
                        } else {
                            // nothing available
                            $skippedStudents[] = [
                                'id' => $student->id,
                                'name' => $student->user->name,
                                'reason' => 'no available subjects',
                            ];

                            continue;
                        }
                    }

                    if (! $sectionSubjectsQuery->exists()) {
                        $skippedStudents[] = [
                            'id' => $student->id,
                            'name' => $student->user->name,
                            'reason' => 'no available subjects',
                        ];

                        continue;
                    }
                }

                // Check if student is already enrolled in any section for the current semester
                // Regular students cannot be carried forward if they have *any* other
                // active section. Irregular students are allowed to come from other
                // sections, but we still prevent duplicates if they are already in
                // the *target* section itself.
                $existingEnrollment = StudentEnrollment::where([
                    'student_id' => $studentId,
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ])->whereNotNull('section_id')
                    ->first();

                if ($existingEnrollment) {
                    // If it's the same section, skip regardless of student type.
                    if ($existingEnrollment->section_id === $section->id) {
                        $formatted = $section->program->program_code.'-'.$section->year_level.$section->section_name;
                        $skippedStudents[] = [
                            'id' => $student->id,
                            'name' => $student->user->name,
                            'reason' => 'already enrolled in '.$formatted,
                        ];

                        continue;
                    }

                    // If the student is regular and enrolled elsewhere, skip.
                    if ($student->student_type !== 'irregular') {
                        $conflictSection = Section::with('program')->find($existingEnrollment->section_id);
                        $formatted = $conflictSection
                            ? ($conflictSection->program->program_code.'-'.$conflictSection->year_level.$conflictSection->section_name)
                            : 'another section';

                        $skippedStudents[] = [
                            'id' => $student->id,
                            'name' => $student->user->name,
                            'reason' => 'already enrolled in '.$formatted,
                        ];

                        continue;
                    }
                    // irregular student with other section enrollment is fine; carry forward
                }

                // Create the enrollment record
                StudentEnrollment::create([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ]);

                // Only automatically enroll in subjects when the student is a
                // regular enrollee; irregular students choose subjects manually
                // so carrying them forward should not mass‑assign every subject.
                if ($student->student_type !== 'irregular') {
                    $sectionSubjects = SectionSubject::where('section_id', $section->id)
                        ->where('status', 'active')
                        ->get();

                    foreach ($sectionSubjects as $sectionSubject) {
                        $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                            'student_id' => $studentId,
                            'section_subject_id' => $sectionSubject->id,
                            'academic_year' => $section->academic_year,
                            'semester' => $section->semester,
                        ])->first();

                        if (! $existingSubjectEnrollment) {
                            StudentSubjectEnrollment::create([
                                'student_id' => $studentId,
                                'section_subject_id' => $sectionSubject->id,
                                'enrollment_type' => 'regular',
                                'academic_year' => $section->academic_year,
                                'semester' => $section->semester,
                                'status' => 'active',
                                'enrollment_date' => now(),
                                'enrolled_by' => Auth::id(),
                            ]);
                        }
                    }
                }

                // Ensure student has payment records
                if ($student->isShs()) {
                    $student->ensureShsPaymentRecords($section->academic_year, $section->semester);
                } else {
                    $student->ensurePaymentRecords($section->academic_year, $section->semester);
                }

                $enrolledStudents[] = [
                    'id' => $student->id,
                    'name' => $student->user->name,
                ];
            }

            return response()->json([
                'success' => true,
                'message' => 'Carry forward operation completed',
                'data' => [
                    'enrolled' => $enrolledStudents,
                    'skipped' => $skippedStudents,
                    'not_enrolled' => $notEnrolledStudents,
                    'year_level_mismatch' => $yearLevelMismatch,
                    'archived_students' => $archivedStudents,
                    'is_progression' => $isProgression,
                    'archived_section' => [
                        'name' => $archivedSection->section_name,
                        'year_level' => $archivedSection->year_level,
                        'academic_year' => $archivedSection->academic_year,
                        'semester' => $archivedSection->semester,
                    ],
                ],
            ]);

        } catch (\Exception $e) {
            Log::error('Carry forward students failed', [
                'section_id' => $section->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to carry forward students: '.$e->getMessage(),
                'data' => [
                    'enrolled' => [],
                    'skipped' => [],
                    'not_enrolled' => [],
                    'year_level_mismatch' => [],
                    'archived_students' => [],
                    'is_progression' => false,
                ],
            ]);
        }
    }

    public function enrollStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_ids' => 'required|array|min:1',
            'student_ids.*' => 'required|exists:students,id',
        ]);

        $enrolledStudents = [];
        $skippedStudents = [];
        $errorStudents = [];

        try {
            foreach ($request->student_ids as $studentId) {
                $student = Student::with('user')->find($studentId);

                if (! $student) {
                    $errorStudents[] = "Student ID {$studentId} not found";

                    continue;
                }

                // Check if student belongs to the same program or same education level as the section
                $programMatch = $student->program_id === $section->program_id;
                $educationLevelMatch = $student->program->education_level === $section->program->education_level;

                if (! $programMatch && ! $educationLevelMatch) {
                    $skippedStudents[] = $student->user->name.' (program/education level mismatch)';

                    continue;
                }

                // For SHS sections, ensure the student is from SHS
                if ($section->program->education_level === 'senior_high' && $student->program->education_level !== 'senior_high') {
                    $skippedStudents[] = $student->user->name.' (must be SHS student for SHS section)';

                    continue;
                }

                // Check if student is in the same year level as the section (exempt irregular students)
                if ($student->student_type !== 'irregular' && $student->current_year_level != $section->year_level) {
                    $skippedStudents[] = $student->user->name.' (year level mismatch)';

                    continue;
                }

                // Check if student is already enrolled in this section
                $existingEnrollment = StudentEnrollment::where([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'status' => 'active',
                ])->first();

                if ($existingEnrollment) {
                    $skippedStudents[] = $student->user->name.' (already enrolled in this section)';

                    continue;
                }

                // Check enrollment conflicts based on student type
                if ($student->student_type !== 'irregular') {
                    // Regular students cannot be enrolled in multiple sections in the same academic period
                    $conflictingEnrollment = StudentEnrollment::where('student_id', $studentId)
                        ->where('academic_year', $section->academic_year)
                        ->where('semester', $section->semester)
                        ->where('status', 'active')
                        ->whereNotNull('section_id')
                        ->first();

                    if ($conflictingEnrollment) {
                        $conflictSection = Section::with('program')->find($conflictingEnrollment->section_id);
                        if ($conflictSection && $conflictSection->program) {
                            $skippedStudents[] = $student->user->name.' (already enrolled in '.
                                $conflictSection->program->program_code.' Year '.
                                $conflictSection->year_level.' Section '.
                                $conflictSection->section_name.')';
                        } else {
                            $skippedStudents[] = $student->user->name.' (already enrolled in a section that no longer exists or has invalid data)';
                        }

                        continue;
                    }
                } else {
                    // Irregular students: check if they've completed all subjects for this year level
                    $hasCompletedAllSubjects = $this->hasCompletedAllSubjectsForYearLevel($student, $section->year_level);

                    if ($hasCompletedAllSubjects) {
                        $skippedStudents[] = $student->user->name.' (has completed all subjects for year level '.$section->year_level.')';

                        continue;
                    }

                    // Check if student is already enrolled in this specific section
                    $existingSectionEnrollment = StudentEnrollment::where('student_id', $studentId)
                        ->where('section_id', $section->id)
                        ->where('status', 'active')
                        ->first();

                    if ($existingSectionEnrollment) {
                        $skippedStudents[] = $student->user->name.' (already enrolled in this section)';

                        continue;
                    }
                }

                // Create the enrollment record
                $enrollment = StudentEnrollment::create([
                    'student_id' => $studentId,
                    'section_id' => $section->id,
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                ]);

                // Handle subject enrollment based on student type
                if ($student->student_type === 'irregular') {
                    // For irregular students in the same year level as the section,
                    // auto-enroll in all active section subjects.
                    if ((int) ($student->current_year_level ?? 0) === (int) $section->year_level) {
                        $sectionSubjects = SectionSubject::where('section_id', $section->id)
                            ->where('status', 'active')
                            ->get();

                        foreach ($sectionSubjects as $sectionSubject) {
                            // Check if student is already enrolled in this subject
                            $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                                'student_id' => $studentId,
                                'section_subject_id' => $sectionSubject->id,
                                'academic_year' => $section->academic_year,
                                'semester' => $section->semester,
                            ])->first();

                            if (! $existingSubjectEnrollment) {
                                StudentSubjectEnrollment::create([
                                    'student_id' => $studentId,
                                    'section_subject_id' => $sectionSubject->id,
                                    'enrollment_type' => 'irregular',
                                    'academic_year' => $section->academic_year,
                                    'semester' => $section->semester,
                                    'status' => 'active',
                                    'enrollment_date' => now(),
                                    'enrolled_by' => Auth::id(),
                                ]);
                            }
                        }
                    }
                    // For irregular students in different year levels, enroll them in subjects they haven't taken yet
                } else {
                    // For regular students, enroll them in section subjects BUT
                    // exclude any subjects the student already has credited (by code or id).
                    $creditedSubjectCodes = \App\Models\StudentSubjectCredit::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->pluck('subject_code')
                        ->toArray();

                    $creditedSubjectIds = \App\Models\StudentSubjectCredit::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->whereNotNull('subject_id')
                        ->pluck('subject_id')
                        ->toArray();

                    $creditTransferSubjectCodes = \App\Models\StudentCreditTransfer::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->pluck('subject_code')
                        ->toArray();

                    $creditTransferSubjectIds = \App\Models\StudentCreditTransfer::where('student_id', $studentId)
                        ->where('credit_status', 'credited')
                        ->whereNotNull('subject_id')
                        ->pluck('subject_id')
                        ->toArray();

                    $allCreditedCodes = array_unique(array_merge($creditedSubjectCodes, $creditTransferSubjectCodes));
                    $allCreditedIds = array_unique(array_merge($creditedSubjectIds, $creditTransferSubjectIds));

                    $sectionSubjectsQuery = \App\Models\SectionSubject::where('section_id', $section->id)
                        ->where('status', 'active');

                    if (! empty($allCreditedCodes) || ! empty($allCreditedIds)) {
                        $sectionSubjectsQuery->whereHas('subject', function ($q) use ($allCreditedCodes, $allCreditedIds) {
                            if (! empty($allCreditedCodes)) {
                                $q->whereNotIn('subject_code', $allCreditedCodes);
                            }

                            if (! empty($allCreditedIds)) {
                                $q->whereNotIn('id', $allCreditedIds);
                            }
                        });
                    }

                    $sectionSubjects = $sectionSubjectsQuery->get();

                    foreach ($sectionSubjects as $sectionSubject) {
                        // Check if student is already enrolled in this subject
                        $existingSubjectEnrollment = StudentSubjectEnrollment::where([
                            'student_id' => $studentId,
                            'section_subject_id' => $sectionSubject->id,
                            'academic_year' => $section->academic_year,
                            'semester' => $section->semester,
                        ])->first();

                        if (! $existingSubjectEnrollment) {
                            StudentSubjectEnrollment::create([
                                'student_id' => $studentId,
                                'section_subject_id' => $sectionSubject->id,
                                'enrollment_type' => 'regular',
                                'academic_year' => $section->academic_year,
                                'semester' => $section->semester,
                                'status' => 'active',
                                'enrollment_date' => now(),
                                'enrolled_by' => Auth::id(),
                            ]);
                        }
                    }
                }

                // Ensure student has payment records for the academic year/semester
                if ($student->isShs()) {
                    $student->ensureShsPaymentRecords($section->academic_year, $section->semester);
                } else {
                    $student->ensurePaymentRecords($section->academic_year, $section->semester);
                }

                $enrolledStudents[] = $student->user->name;
            }

            // Build success/info messages
            $messages = [];

            if (! empty($enrolledStudents)) {
                $messages[] = count($enrolledStudents).' student(s) enrolled successfully: '.implode(', ', $enrolledStudents);
            }

            if (! empty($skippedStudents)) {
                $messages[] = 'Skipped '.count($skippedStudents).' student(s): '.implode(', ', $skippedStudents);
            }

            if (! empty($errorStudents)) {
                $messages[] = 'Errors: '.implode(', ', $errorStudents);
            }

            if (empty($enrolledStudents)) {
                return redirect()->back()->with('warning', 'No students were enrolled. '.implode(' | ', $messages));
            }

            return redirect()->back()->with('success', implode(' | ', $messages));

        } catch (\Exception $e) {
            Log::error('Student enrollment failed', [
                'section_id' => $section->id,
                'student_ids' => $request->student_ids,
                'error' => $e->getMessage(),
            ]);

            return redirect()->back()->with('error', 'Failed to enroll students: '.$e->getMessage());
        }
    }

    public function removeStudent(Request $request, Section $section): RedirectResponse
    {
        $request->validate([
            'student_id' => 'required|exists:students,id',
        ]);

        try {
            $enrollment = StudentEnrollment::where('section_id', $section->id)
                ->where('student_id', $request->student_id)
                ->where('status', 'active')
                ->first();

            if (! $enrollment) {
                return redirect()->back()->with('error', 'Student not found in this section');
            }

            // Check if student has any grades in this section
            $hasGrades = \App\Models\StudentGrade::where('student_enrollment_id', $enrollment->id)
                ->where(function ($query) {
                    $query->whereNotNull('prelim_grade')
                        ->orWhereNotNull('midterm_grade')
                        ->orWhereNotNull('prefinal_grade')
                        ->orWhereNotNull('final_grade')
                        ->orWhereNotNull('semester_grade');
                })
                ->exists();

            // For SHS students, also check for Q1 and Q2 grades
            $isShsSection = false;
            if ($section->program) {
                $programName = strtolower($section->program->program_name ?? '');
                $shsIndicators = ['senior high', 'shs', 'grade 11', 'grade 12', '11', '12'];
                foreach ($shsIndicators as $indicator) {
                    if (strpos($programName, $indicator) !== false) {
                        $isShsSection = true;
                        break;
                    }
                }
            }

            // If not determined by program, check year level
            if (! $isShsSection) {
                $yearLevel = $section->year_level;
                $shsYearFormats = ['Grade 11', 'Grade 12', '11', '12', 11, 12];
                $isShsSection = in_array($yearLevel, $shsYearFormats, true);
            }

            if ($isShsSection) {
                $hasShsGrades = \App\Models\ShsStudentGrade::where('student_enrollment_id', $enrollment->id)
                    ->where(function ($query) {
                        $query->whereNotNull('first_quarter_grade')
                            ->orWhereNotNull('second_quarter_grade');
                    })
                    ->exists();

                if ($hasShsGrades) {
                    return redirect()->back()->with('error', 'Student already has grades cannot be removed like that.');
                }
            }

            if ($hasGrades) {
                return redirect()->back()->with('error', 'Student already has grades cannot be removed like that.');
            }

            // Mark any active subject-level enrollments (for this student in this section/period) as dropped
            \App\Models\StudentSubjectEnrollment::where('student_id', $request->student_id)
                ->where('academic_year', $section->academic_year)
                ->where('semester', $section->semester)
                ->whereHas('sectionSubject', function ($q) use ($section) {
                    $q->where('section_id', $section->id);
                })
                ->where('status', 'active')
                ->update([
                    'status' => 'dropped',
                    'updated_at' => now(),
                ]);

            $enrollment->update(['status' => 'dropped']);

            \Illuminate\Support\Facades\Log::info('Student removed from section', [
                'student_id' => $request->student_id,
                'section_id' => $section->id,
                'removed_by' => Auth::id(),
            ]);

            return redirect()->back()->with('success', 'Student removed successfully');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove student error: '.$e->getMessage(), [
                'section_id' => $section->id,
                'student_id' => $request->student_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'An error occurred while removing the student');
        }
    }

    public function unenrollStudent(StudentEnrollment $enrollment): RedirectResponse
    {
        $enrollment->update(['status' => 'dropped']);

        return redirect()->back()
            ->with('success', 'Student unenrolled successfully.');
    }

    /**
     * Show subject-specific enrollment form for irregular students
     */
    public function subjectEnrollment(Section $section, Student $student): Response
    {
        // Ensure this is for irregular students
        if ($student->student_type !== 'irregular') {
            abort(403, 'Subject-level enrollment is only available for irregular students.');
        }

        $section->load(['program', 'sectionSubjects.subject']);

        $isSameYearLevelIrregular = ! is_null($student->current_year_level)
            && (int) $student->current_year_level === (int) $section->year_level;

        // Same-year irregular students should always be enrolled in all section subjects.
        if ($isSameYearLevelIrregular) {
            $sectionSubjects = $section->sectionSubjects()
                ->where('status', 'active')
                ->get();

            foreach ($sectionSubjects as $sectionSubject) {
                $existingEnrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('section_subject_id', $sectionSubject->id)
                    ->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->first();

                if (! $existingEnrollment) {
                    StudentSubjectEnrollment::create([
                        'student_id' => $student->id,
                        'section_subject_id' => $sectionSubject->id,
                        'enrollment_type' => 'irregular',
                        'academic_year' => $section->academic_year,
                        'semester' => $section->semester,
                        'status' => 'active',
                        'enrollment_date' => now()->toDateString(),
                        'enrolled_by' => Auth::id(),
                    ]);
                } elseif ($existingEnrollment->status !== 'active') {
                    $existingEnrollment->update([
                        'status' => 'active',
                        'enrollment_type' => 'irregular',
                        'enrollment_date' => now()->toDateString(),
                        'enrolled_by' => Auth::id(),
                    ]);
                }
            }
        }

        // Get subject codes that the student is already enrolled in
        $enrolledSubjectCodes = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->where('status', 'active')
            ->with('sectionSubject.subject')
            ->get()
            ->pluck('sectionSubject.subject.subject_code')
            ->filter()
            ->toArray();

        // Get subject codes and ids the student already has credits for
        $creditedSubjectCodes = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->pluck('subject_code')
            ->toArray();

        $creditedSubjectIds = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->whereNotNull('subject_id')
            ->pluck('subject_id')
            ->toArray();

        // Also include subjects from credit transfers (codes + subject ids)
        $creditTransferSubjectCodes = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->pluck('subject_code')
            ->toArray();

        $creditTransferSubjectIds = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->whereNotNull('subject_id')
            ->pluck('subject_id')
            ->toArray();

        $allCreditedCodes = array_unique(array_merge($creditedSubjectCodes, $creditTransferSubjectCodes));
        $allCreditedIds = array_unique(array_merge($creditedSubjectIds, $creditTransferSubjectIds));

        // Get available subjects excluding those already enrolled and those with credits
        $availableSubjectsQuery = $section->sectionSubjects()
            ->with(['subject', 'teacher.user'])
            ->where('status', 'active')
            ->whereHas('subject', function ($query) use ($enrolledSubjectCodes, $allCreditedCodes, $allCreditedIds) {
                // exclude by code and by id (if provided)
                if (! empty($enrolledSubjectCodes) || ! empty($allCreditedCodes)) {
                    $codes = array_merge($enrolledSubjectCodes, $allCreditedCodes);
                    $query->whereNotIn('subject_code', $codes);
                }

                if (! empty($allCreditedIds)) {
                    $query->whereNotIn('id', $allCreditedIds);
                }
            });

        // If the student is from a different program, only show subjects that are
        // present in the student's curriculum for this year level (intersection).
        if ($student->program_id !== $section->program_id && $student->curriculum_id) {
            $studentCurriculumCodes = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                ->where('year_level', $section->year_level)
                ->pluck('subject_code')
                ->toArray();

            if (! empty($studentCurriculumCodes)) {
                $availableSubjectsQuery->whereHas('subject', function ($q) use ($studentCurriculumCodes) {
                    $q->whereIn('subject_code', $studentCurriculumCodes);
                });
            } else {
                $availableSubjectsQuery->whereRaw('0 = 1');
            }
        }

        $availableSubjects = $availableSubjectsQuery->get();

        // Get subjects excluded due to credits (for display purposes)
        $creditedSubjects = $section->sectionSubjects()
            ->with(['subject', 'teacher.user'])
            ->where('status', 'active')
            ->whereHas('subject', function ($query) use ($allCreditedCodes, $allCreditedIds) {
                $query->where(function ($q) use ($allCreditedCodes, $allCreditedIds) {
                    if (! empty($allCreditedCodes)) {
                        $q->whereIn('subject_code', $allCreditedCodes);
                    }

                    if (! empty($allCreditedIds)) {
                        $q->orWhereIn('id', $allCreditedIds);
                    }
                });
            })
            ->get();

        // Also include any credited subjects for the student that are NOT part of this section's subjects
        // (so the UI always shows the full set of credited subjects for the student).
        $sectionCreditedSubjectIds = $creditedSubjects->pluck('subject_id')->filter()->map(fn ($v) => (int) $v)->toArray();

        $studentCredits = \App\Models\StudentSubjectCredit::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get();

        $creditTransfers = \App\Models\StudentCreditTransfer::where('student_id', $student->id)
            ->where('credit_status', 'credited')
            ->get();

        $extraCredited = collect();

        foreach ($studentCredits as $credit) {
            $subId = $credit->subject_id;
            $subCode = $credit->subject_code;

            $alreadyIncludedById = $subId && in_array((int) $subId, $sectionCreditedSubjectIds, true);
            $alreadyIncludedByCode = $creditedSubjects->contains(function ($ss) use ($subCode) {
                return optional($ss->subject)->subject_code === $subCode;
            });

            if (! $alreadyIncludedById && ! $alreadyIncludedByCode) {
                $extraCredited->push((object) [
                    'id' => 'credit-'.($credit->id ?? uniqid()),
                    'subject' => (object) [
                        'subject_code' => $credit->subject_code,
                        'subject_name' => $credit->subject_name,
                    ],
                    'teacher' => null,
                ]);
            }
        }

        foreach ($creditTransfers as $ct) {
            $subId = $ct->subject_id;
            $subCode = $ct->subject_code;

            $alreadyIncludedById = $subId && in_array((int) $subId, $sectionCreditedSubjectIds, true);
            $alreadyIncludedByCode = $creditedSubjects->contains(function ($ss) use ($subCode) {
                return optional($ss->subject)->subject_code === $subCode;
            });

            if (! $alreadyIncludedById && ! $alreadyIncludedByCode) {
                $extraCredited->push((object) [
                    'id' => 'ct-'.($ct->id ?? uniqid()),
                    'subject' => (object) [
                        'subject_code' => $ct->subject_code,
                        'subject_name' => $ct->subject_name,
                    ],
                    'teacher' => null,
                ]);
            }
        }

        // Merge section's SectionSubject entries with any extra credited subjects
        if ($extraCredited->isNotEmpty()) {
            // Deduplicate extra credited entries by subject_code (prefer section entries first)
            $uniqueExtra = $extraCredited->unique(fn ($item) => strtolower(optional($item->subject)->subject_code ?? ''));

            // Merge and ensure the final collection is unique by subject_code to avoid duplicates
            $creditedSubjects = $creditedSubjects->concat($uniqueExtra)
                ->unique(fn ($item) => strtolower(optional($item->subject)->subject_code ?? ''))
                ->values();
        } else {
            // Ensure section-sourced creditedSubjects are unique by subject_code as well
            $creditedSubjects = $creditedSubjects->unique(fn ($item) => strtolower(optional($item->subject)->subject_code ?? ''))->values();
        }

        $currentEnrollments = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->where('status', 'active')
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user'])
            ->whereHas('sectionSubject', function ($query) use ($section) {
                $query->where('section_id', $section->id);
            })
            ->get();

        // Get subjects already enrolled in other sections (for display purposes)
        $enrolledInOtherSections = StudentSubjectEnrollment::where('student_id', $student->id)
            ->where('academic_year', $section->academic_year)
            ->where('semester', $section->semester)
            ->where('status', 'active')
            ->whereHas('sectionSubject', function ($query) use ($section) {
                $query->where('section_id', '!=', $section->id); // Exclude current section
            })
            ->whereHas('sectionSubject.section', function ($query) use ($section) {
                $query->where('year_level', $section->year_level); // Only same year level
            })
            ->with(['sectionSubject.subject', 'sectionSubject.teacher.user', 'sectionSubject.section'])
            ->get()
            ->map(function ($enrollment) {
                return $enrollment->sectionSubject;
            });

        // Only irregular students can manage subjects
        $student->setAttribute('can_manage_subjects', $student->student_type === 'irregular');

        return $this->inertia->render('Admin/Sections/SubjectEnrollment', [
            'section' => $section,
            'student' => $student->load('user'),
            'availableSubjects' => $availableSubjects,
            'currentEnrollments' => $currentEnrollments,
            'creditedSubjects' => $creditedSubjects, // Subjects already credited
            'enrolledInOtherSections' => $enrolledInOtherSections->toArray(), // Subjects already enrolled in other sections
        ]);
    }

    /**
     * Enroll irregular student in specific subjects
     */
    public function enrollStudentInSubjects(Request $request, Section $section, Student $student): RedirectResponse
    {
        // Ensure this is for irregular students
        if ($student->student_type !== 'irregular') {
            return redirect()->back()->withErrors(['error' => 'Subject-level enrollment is only available for irregular students.']);
        }

        $request->validate([
            'subject_ids' => 'required|array|min:1',
            'subject_ids.*' => [
                'required',
                'exists:section_subjects,id',
                function ($attribute, $value, $fail) use ($section, $student) {
                    $sectionSubject = \App\Models\SectionSubject::with('subject')->find($value);
                    if (! $sectionSubject || $sectionSubject->section_id !== $section->id) {
                        $fail('The selected subject does not belong to this section.');

                        return;
                    }

                    // If the student is from a different program, ensure the subject exists
                    // in the student's curriculum for this year level (prevent cross-program auto-selection).
                    if ($student->program_id !== $section->program_id && $student->curriculum_id) {
                        $studentCurriculumCodes = \App\Models\CurriculumSubject::where('curriculum_id', $student->curriculum_id)
                            ->where('year_level', $section->year_level)
                            ->pluck('subject_code')
                            ->toArray();

                        if (! in_array($sectionSubject->subject->subject_code, $studentCurriculumCodes)) {
                            $fail('The selected subject is not part of the student\'s curriculum.');
                        }
                    }
                },
            ],
        ]);

        try {
            $enrollmentsToCreate = [];
            $alreadyEnrolled = [];
            $enrolledCount = 0;

            foreach ($request->subject_ids as $sectionSubjectId) {
                $sectionSubject = SectionSubject::with('subject')->find($sectionSubjectId);
                if (! $sectionSubject || ! $sectionSubject->subject_id) {
                    continue;
                }

                // Prevent parallel active attempts for the same subject in the same period.
                $existingSameSubjectThisTerm = StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'active')
                    ->whereHas('sectionSubject', function ($query) use ($sectionSubject) {
                        $query->where('subject_id', $sectionSubject->subject_id);
                    })
                    ->first();

                if ($existingSameSubjectThisTerm) {
                    $alreadyEnrolled[] = $sectionSubject->subject->subject_name;

                    continue;
                }

                // Check if already enrolled in this subject (active enrollment)
                $existingActiveEnrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('section_subject_id', $sectionSubjectId)
                    ->where('status', 'active')
                    ->first();

                if ($existingActiveEnrollment) {
                    $alreadyEnrolled[] = $sectionSubject->subject->subject_name;

                    continue;
                }

                // Check if there's a dropped enrollment that can be reactivated
                $existingDroppedEnrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                    ->where('section_subject_id', $sectionSubjectId)
                    ->where('academic_year', $section->academic_year)
                    ->where('semester', $section->semester)
                    ->where('status', 'dropped')
                    ->first();

                if ($existingDroppedEnrollment) {
                    // Reactivate the dropped enrollment
                    $existingDroppedEnrollment->update([
                        'status' => 'active',
                        'enrolled_by' => Auth::id(),
                        'enrollment_date' => now()->toDateString(),
                        'updated_at' => now(),
                    ]);
                    $enrolledCount++;

                    continue;
                }

                // Create new enrollment
                $enrollmentsToCreate[] = [
                    'student_id' => $student->id,
                    'section_subject_id' => $sectionSubjectId,
                    'enrollment_type' => 'irregular',
                    'enrolled_by' => Auth::id(),
                    'enrollment_date' => now()->toDateString(),
                    'academic_year' => $section->academic_year,
                    'semester' => $section->semester,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ];

                $enrolledCount++;
            }

            if (! empty($enrollmentsToCreate)) {
                StudentSubjectEnrollment::insert($enrollmentsToCreate);
            }

            $messages = [];
            if ($enrolledCount > 0) {
                $messages[] = "Student enrolled in {$enrolledCount} subject(s) successfully.";
            }

            if (! empty($alreadyEnrolled)) {
                $names = implode(', ', $alreadyEnrolled);
                $messages[] = "Already enrolled in: {$names}";
            }

            $message = implode(' | ', $messages);
            $type = $enrolledCount > 0 ? 'success' : 'warning';

            return redirect()->back()->with($type, $message ?: 'No subjects were enrolled.');

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Subject enrollment error: '.$e->getMessage(), [
                'section_id' => $section->id,
                'student_id' => $student->id,
                'subject_ids' => $request->subject_ids,
                'trace' => $e->getTraceAsString(),
            ]);

            return redirect()->back()->with('error', 'An error occurred during subject enrollment. Please try again.');
        }
    }

    /**
     * Remove irregular student from specific subject
     */
    public function removeStudentFromSubject(Request $request, Section $section, Student $student): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'section_subject_id' => 'required|exists:section_subjects,id',
        ]);

        try {
            // If this irregular student is in the same year level as the section,
            // treat them like regular enrollment for subject removal (disallow).
            if ($student->student_type === 'irregular'
                && ! is_null($student->current_year_level)
                && $student->current_year_level == $section->year_level
            ) {
                return response()->json(['error' => 'Cannot remove subject for an irregular student who is in the same year level as this section'], 422);
            }

            $enrollment = StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('section_subject_id', $request->section_subject_id)
                ->where('status', 'active')
                ->first();

            if (! $enrollment) {
                return response()->json(['error' => 'Student not enrolled in this subject'], 404);
            }

            // Check if student has any college/regular grades for this specific subject
            $hasGrades = \App\Models\StudentGrade::where('section_subject_id', $request->section_subject_id)
                ->whereHas('studentEnrollment', function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                })
                ->where(function ($query) {
                    $query->whereNotNull('prelim_grade')
                        ->orWhereNotNull('midterm_grade')
                        ->orWhereNotNull('prefinal_grade')
                        ->orWhereNotNull('final_grade')
                        ->orWhereNotNull('semester_grade');
                })
                ->exists();

            // Also check SHS grades (first/second/third/fourth/final)
            $hasShsGrades = \App\Models\ShsStudentGrade::where('section_subject_id', $request->section_subject_id)
                ->whereHas('studentEnrollment', function ($query) use ($student) {
                    $query->where('student_id', $student->id);
                })
                ->where(function ($query) {
                    $query->whereNotNull('first_quarter_grade')
                        ->orWhereNotNull('second_quarter_grade')
                        ->orWhereNotNull('third_quarter_grade')
                        ->orWhereNotNull('fourth_quarter_grade')
                        ->orWhereNotNull('final_grade');
                })
                ->exists();

            if ($hasGrades || $hasShsGrades) {
                return response()->json(['error' => 'Cannot remove student from subject because they already have grades recorded for this subject'], 422);
            }

            // Mark all active enrollments for this student/section_subject as dropped (defensive)
            StudentSubjectEnrollment::where('student_id', $student->id)
                ->where('section_subject_id', $request->section_subject_id)
                ->where('status', 'active')
                ->update(['status' => 'dropped']);

            \Illuminate\Support\Facades\Log::info('Student removed from subject', [
                'student_id' => $student->id,
                'section_subject_id' => $request->section_subject_id,
                'removed_by' => Auth::id(),
            ]);

            return response()->json(['message' => 'Student removed from subject successfully']);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Remove student from subject error: '.$e->getMessage(), [
                'student_id' => $student->id,
                'section_subject_id' => $request->section_subject_id,
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'An error occurred while removing the student from subject'], 500);
        }
    }

    /**
     * Check if a student has completed all subjects for a given year level
     */
    private function hasCompletedAllSubjectsForYearLevel(Student $student, int $yearLevel): bool
    {
        // Get all subjects required for this year level in the student's curriculum
        $requiredSubjects = CurriculumSubject::where('curriculum_id', $student->curriculum_id)
            ->where('year_level', $yearLevel)
            ->pluck('subject_id')
            ->toArray();

        if (empty($requiredSubjects)) {
            // No subjects required for this year level, so they haven't "completed" it
            return false;
        }

        // Get all subjects the student has completed for this year level
        // Use a join to get the subject_id from the section_subjects table
        $completedSubjectIds = StudentSubjectEnrollment::join('section_subjects', 'student_subject_enrollments.section_subject_id', '=', 'section_subjects.id')
            ->join('subjects', 'section_subjects.subject_id', '=', 'subjects.id')
            ->join('curriculum_subjects', 'subjects.id', '=', 'curriculum_subjects.subject_id')
            ->where('student_subject_enrollments.student_id', $student->id)
            ->where('student_subject_enrollments.status', 'completed')
            ->where('curriculum_subjects.curriculum_id', $student->curriculum_id)
            ->where('curriculum_subjects.year_level', $yearLevel)
            ->pluck('section_subjects.subject_id')
            ->unique()
            ->toArray();

        // Check if student has completed all required subjects
        return count(array_intersect($requiredSubjects, $completedSubjectIds)) === count($requiredSubjects);
    }
}
