<?php

namespace App\Http\Controllers\Registrar;

use App\Http\Controllers\Controller;
use App\Models\FeeAdjustment;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CalendarController extends Controller
{
    public function index()
    {
        $events = FeeAdjustment::query()
            ->where('type', 'early_enrollment')
            ->where('college_only', true)
            ->orderByRaw('COALESCE(start_date, effective_date) ASC')
            ->get();

        return Inertia::render('Registrar/Calendar', compact('events'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'start_date'     => ['required', 'date'],
            'end_date'       => ['required', 'date', 'after_or_equal:start_date'],
            'amount'         => ['required', 'numeric', 'min:0'],
            'notes'          => ['nullable','string'],
        ]);

        $data['type'] = 'early_enrollment';
        $data['college_only'] = true;
        // Keep effective_date for backwards compatibility with any existing logic.
        $data['effective_date'] = $data['start_date'];
        $data['term'] = null;

        FeeAdjustment::create($data);

        return back()->with('success','Early enrollment discount period saved.');
    }

    public function destroy(FeeAdjustment $adjustment)
    {
        $adjustment->delete();
        return back();
    }
}
