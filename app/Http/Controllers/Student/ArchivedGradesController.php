<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\ArchivedStudentEnrollment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArchivedGradesController extends Controller
{
    public function index(Request $request): Response
    {
        $student = $request->user()->student;

        $archivedEnrollments = ArchivedStudentEnrollment::where('student_id', $student->id)
            ->with('archivedSection')
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->paginate(20);

        return Inertia::render('Student/ArchivedGrades/Index', [
            'archivedEnrollments' => $archivedEnrollments,
        ]);
    }
}
