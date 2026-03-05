<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\FeeAdjustment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Rule;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index()
    {
        $events = FeeAdjustment::orderBy('effective_date')->get();
        return Inertia::render('Registrar/Calendar', compact('events'));
    }

    public function store(Request $request)
    {
        // once any student exists, only head teachers may make changes
        if (\App\Models\Student::exists() && ! auth()->user()->hasRole('head_teacher')) {
            abort(403, 'Only head teacher may modify adjustments after enrollments begin');
        }

        $data = $request->validate([
            'effective_date' => ['required','date'],
            'type'           => ['required',Rule::in(['early_enrollment','due_date_penalty'])],
            'term'           => ['nullable',Rule::in(['prelim','midterm','prefinals','finals'])],
            'amount'         => ['required','numeric'],
            'notes'          => ['nullable','string'],
            'college_only'   => ['boolean'],
        ]);

        // ensure penalties supply a term
        if ($data['type'] === 'due_date_penalty' && empty($data['term'])) {
            return back()->withErrors(['term' => 'Term is required for penalties']);
        }

        FeeAdjustment::create($data);

        return back()->with('success','Adjustment saved');
    }

    public function destroy(FeeAdjustment $adjustment)
    {
        if (\App\Models\Student::exists() && ! auth()->user()->hasRole('head_teacher')) {
            abort(403, 'Only head teacher may remove adjustments after enrollments begin');
        }

        $adjustment->delete();
        return back();
    }
}
