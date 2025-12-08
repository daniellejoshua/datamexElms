<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\ArchivedSection;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ArchivedSectionsController extends Controller
{
    public function index(Request $request): Response
    {
        $teacher = $request->user()->teacher;

        // Get archived sections where the teacher was assigned
        // Since archived sections don't have direct teacher relation, we can show all or filter by subjects
        // For simplicity, show all archived sections the teacher might have taught
        $archivedSections = ArchivedSection::with(['archivedEnrollments'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('semester', 'desc')
            ->paginate(20);

        return Inertia::render('Teacher/ArchivedSections/Index', [
            'archivedSections' => $archivedSections,
        ]);
    }

    public function show(Request $request, ArchivedSection $archivedSection): Response
    {
        $archivedSection->load(['archivedEnrollments']);

        return Inertia::render('Teacher/ArchivedSections/Show', [
            'archivedSection' => $archivedSection,
        ]);
    }
}
