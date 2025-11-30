<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClassScheduleRequest;
use App\Http\Requests\Admin\UpdateClassScheduleRequest;
use App\Models\ClassSchedule;
use App\Models\Section;
use App\Models\Teacher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClassScheduleController extends Controller
{
    public function index(Request $request): Response
    {
        $query = ClassSchedule::with(['section.course', 'teacher.user']);

        // Apply filters
        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('room', 'like', '%'.$request->search.'%')
                    ->orWhereHas('section.course', function ($courseQuery) use ($request) {
                        $courseQuery->where('subject_name', 'like', '%'.$request->search.'%')
                            ->orWhere('course_code', 'like', '%'.$request->search.'%');
                    })
                    ->orWhereHas('teacher.user', function ($teacherQuery) use ($request) {
                        $teacherQuery->where('name', 'like', '%'.$request->search.'%');
                    });
            });
        }

        if ($request->has('day_of_week') && $request->day_of_week) {
            $query->where('day_of_week', $request->day_of_week);
        }

        if ($request->has('room') && $request->room) {
            $query->where('room', $request->room);
        }

        $schedules = $query->orderBy('day_of_week')
            ->orderBy('start_time')
            ->paginate(15)
            ->withQueryString();

        // Get available rooms for filtering
        $rooms = ClassSchedule::distinct()->pluck('room')->filter()->sort()->values();

        return Inertia::render('Admin/Schedules/Index', [
            'schedules' => $schedules,
            'rooms' => $rooms,
            'filters' => $request->only(['search', 'day_of_week', 'room']),
        ]);
    }

    public function create(Request $request): Response
    {
        $sections = Section::with('course')
            ->where('status', 'active')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->get();

        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Schedules/Create', [
            'sections' => $sections,
            'teachers' => $teachers,
            'selectedSection' => $request->section_id ? Section::with('course')->find($request->section_id) : null,
        ]);
    }

    public function store(StoreClassScheduleRequest $request): RedirectResponse
    {
        // Check for schedule conflicts
        $conflicts = $this->checkScheduleConflicts($request->validated());

        if (! empty($conflicts)) {
            return redirect()->back()
                ->withErrors(['schedule' => 'Schedule conflict detected: '.implode(', ', $conflicts)])
                ->withInput();
        }

        ClassSchedule::create($request->validated());

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Schedule created successfully.');
    }

    public function show(ClassSchedule $schedule): Response
    {
        $schedule->load(['section.course', 'teacher.user', 'section.studentEnrollments.student.user']);

        return Inertia::render('Admin/Schedules/Show', [
            'schedule' => $schedule,
        ]);
    }

    public function edit(ClassSchedule $schedule): Response
    {
        $schedule->load(['section.course', 'teacher.user']);

        $sections = Section::with('course')
            ->where('status', 'active')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester')
            ->get();

        $teachers = Teacher::with('user')->get();

        return Inertia::render('Admin/Schedules/Edit', [
            'schedule' => $schedule,
            'sections' => $sections,
            'teachers' => $teachers,
        ]);
    }

    public function update(UpdateClassScheduleRequest $request, ClassSchedule $schedule): RedirectResponse
    {
        // Check for schedule conflicts (excluding current schedule)
        $conflicts = $this->checkScheduleConflicts($request->validated(), $schedule->id);

        if (! empty($conflicts)) {
            return redirect()->back()
                ->withErrors(['schedule' => 'Schedule conflict detected: '.implode(', ', $conflicts)])
                ->withInput();
        }

        $schedule->update($request->validated());

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Schedule updated successfully.');
    }

    public function destroy(ClassSchedule $schedule): RedirectResponse
    {
        $schedule->delete();

        return redirect()->route('admin.schedules.index')
            ->with('success', 'Schedule deleted successfully.');
    }

    /**
     * Check for schedule conflicts
     */
    private function checkScheduleConflicts(array $data, ?int $excludeId = null): array
    {
        $conflicts = [];

        // Check teacher conflicts
        $teacherConflict = ClassSchedule::where('teacher_id', $data['teacher_id'])
            ->where('day_of_week', $data['day_of_week'])
            ->where(function ($query) use ($data) {
                $query->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                    ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                    ->orWhere(function ($q) use ($data) {
                        $q->where('start_time', '<=', $data['start_time'])
                            ->where('end_time', '>=', $data['end_time']);
                    });
            })
            ->when($excludeId, function ($query, $excludeId) {
                $query->where('id', '!=', $excludeId);
            })
            ->with(['section.course', 'teacher.user'])
            ->first();

        if ($teacherConflict) {
            $conflicts[] = "Teacher {$teacherConflict->teacher->user->name} is already scheduled at this time";
        }

        // Check room conflicts
        if (! empty($data['room'])) {
            $roomConflict = ClassSchedule::where('room', $data['room'])
                ->where('day_of_week', $data['day_of_week'])
                ->where(function ($query) use ($data) {
                    $query->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                        ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                        ->orWhere(function ($q) use ($data) {
                            $q->where('start_time', '<=', $data['start_time'])
                                ->where('end_time', '>=', $data['end_time']);
                        });
                })
                ->when($excludeId, function ($query, $excludeId) {
                    $query->where('id', '!=', $excludeId);
                })
                ->with(['section.course'])
                ->first();

            if ($roomConflict) {
                $conflicts[] = "Room {$data['room']} is already booked at this time for {$roomConflict->section->course->subject_name}";
            }
        }

        return $conflicts;
    }
}
