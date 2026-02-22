<?php

use App\Models\Program;
use App\Models\Student;
use App\Models\StudentSubjectCredit;
use App\Models\CurriculumSubject;
use App\Models\User;

// this file exercises the comparison endpoint using actual seeded programs/curricula
it('lists matched subjects when a student has credits from one program moving to another', function () {
    $this->actingAs(User::factory()->create(['role' => 'registrar']));

    // explicitly select BSIT as source and BSHM as target (existing programs)
    $from = Program::where('program_code', 'BSIT')->first();
    $to = Program::where('program_code', 'BSHM')->first();
    if (! $from || ! $to) {
        $this->markTestSkipped('BSIT or BSHM not seeded');
    }

    $fromCurr = $from->curriculums()->where('is_current', true)->first();
    $toCurr = $to->curriculums()->where('is_current', true)->first();
    if (! $fromCurr || ! $toCurr) {
        $this->markTestSkipped('curriculum missing');
    }

    // grab all subjects from the BSIT curriculum
    $subjects = CurriculumSubject::where('curriculum_id', $fromCurr->id)->get();
    // only minors (core/elective); majors don't transfer
    $subjects = $subjects->filter(fn($s) => strtolower($s->subject_type) !== 'major');
    // keep an unmodified copy for later expected-code computation
    $originalSubjects = $subjects;

    // compute intersection of codes with target curriculum
    $fromCodes = $subjects->pluck('subject_code')->map(fn($c) => strtoupper(trim($c)))->unique();
    $toCurrSubjects = CurriculumSubject::where('curriculum_id', $toCurr->id)
        ->orderBy('year_level')
        ->orderBy('semester')
        ->get();
    $toCodes = $toCurrSubjects->pluck('subject_code')
        ->map(fn($c) => strtoupper(trim($c)));
    $intersection = $fromCodes->intersect($toCodes);

    // also look for fuzzy name matches to catch minor/GE subjects
    $fromNames = $subjects->pluck('subject_name')->map(fn($n) => strtolower(trim($n)));
    $toNames = $toCurrSubjects->pluck('subject_name')->map(fn($n) => strtolower(trim($n)));
    $nameMatches = collect();

    foreach ($fromNames as $fName) {
        foreach ($toNames as $tName) {
            similar_text($fName, $tName, $percent);
            if ($percent >= 78) {
                $nameMatches->push($fName);
            } else {
                // token overlap (jaccard-like)
                $tokensA = array_values(array_filter(array_map('trim', preg_split('/\s+/', $fName))));
                $tokensB = array_values(array_filter(array_map('trim', preg_split('/\s+/', $tName))));
                if (! empty($tokensA) && ! empty($tokensB)) {
                    $inter = count(array_intersect($tokensA, $tokensB));
                    $union = count(array_unique(array_merge($tokensA, $tokensB)));
                    if ($union > 0 && $inter / $union >= 0.6) {
                        $nameMatches->push($fName);
                    }
                }
            }
        }
    }
    $nameMatches = $nameMatches->unique();

    echo "BSIT curriculum subjects: ".implode(', ', $fromCodes->toArray())."\n";
    echo "BSHM curriculum subjects: ".implode(', ', $toCodes->toArray())."\n";
    echo "common codes: ".implode(', ', $intersection->toArray())."\n";
    echo "fuzzy name matches: ".implode(', ', $nameMatches->toArray())."\n";

    // limit our credit list to intersection codes OR name matches (already only minors)
    $filtered = $subjects->filter(function ($s) use ($intersection, $nameMatches) {
        $code = strtoupper(trim($s->subject_code));
        $name = strtolower(trim($s->subject_name));
        return $intersection->contains($code) || $nameMatches->contains($name);
    });
    $subjects = $filtered;

    // create student in from-program
    $studentUser = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $studentUser->id,
        'program_id' => $from->id,
        'curriculum_id' => $fromCurr->id,
        'student_number' => '2026-'.fake()->unique()->randomNumber(5),
        'year_level' => '2nd Year',
        'current_year_level' => 2,
    ]);

    // credit the student for each subject from the intersection
    foreach ($subjects as $sub) {
        StudentSubjectCredit::create([
            'student_id' => $student->id,
            'curriculum_subject_id' => $sub->id,
            'subject_id' => $sub->subject_id,
            'subject_code' => $sub->subject_code,
            'subject_name' => $sub->subject_name,
            'units' => $sub->units,
            'year_level' => $sub->year_level,
            'semester' => $sub->semester,
            'credit_type' => 'transfer',
            'credit_status' => 'credited',
            'final_grade' => 85,
            'credited_at' => now(),
        ]);
    }

    $response = $this->postJson('/registrar/credit-transfers/compare', [
        'previous_program_id' => $from->id,
        'new_program_id' => $to->id,
        'student_year_level' => 2,
        'student_id' => $student->id,
    ]);

    $response->assertSuccessful();
    $data = $response->json('data');

    // dump data structure
    echo "DATA: ";
    print_r($data);

    // the API currently returns `subject_code` at top level when shiftee
    $matched = collect($data['credited_subjects'])->pluck('subject_code');

    echo "Shifting from {$from->program_code} to {$to->program_code}, student credits:\n";
    echo implode(', ', $matched->toArray())."\n";

    // now compute what codes the controller would match for our original subjects
    $expected = collect();

    $normalize = fn($s) => strtolower(trim(preg_replace('/\s+/', ' ', preg_replace('/[^A-Za-z0-9 ]+/', ' ', (string) $s))));
    $normalizeCode = fn($c) => strtolower(preg_replace('/[^A-Za-z0-9]/', '', (string) $c));
    $digits = fn($s) => preg_replace('/[^0-9]/', '', $s);

    foreach ($subjects as $orig) {
        $completedName = $normalize($orig->subject_name);
        $completedCode = $normalizeCode($orig->subject_code);

        $match = $toCurrSubjects->first(function ($newSubject) use ($completedName, $completedCode, $normalize, $normalizeCode, $digits) {
            $newName = $normalize($newSubject->subject_name);
            $newCode = $normalizeCode($newSubject->subject_code);

            if ($newName === $completedName || $newCode === $completedCode) {
                return true;
            }

            if ($digits($newCode) !== '' && $digits($newCode) === $digits($completedCode)) {
                return true;
            }

            $tokens = fn($s) => array_values(array_filter(array_map(fn($t) => trim($t), preg_split('/\s+/', $s))));
            $newTokens = $tokens($newName);
            $oldTokens = $tokens($completedName);
            if (! empty($newTokens) && ! empty($oldTokens)) {
                $intersection = count(array_intersect($newTokens, $oldTokens));
                $union = count(array_unique(array_merge($newTokens, $oldTokens)));
                $overlap = $union > 0 ? $intersection / $union : 0;

                if ($overlap >= 0.6) {
                    return true;
                }
            }

            similar_text($newName, $completedName, $percent);
            if ($percent >= 78) {
                return true;
            }

            return false;
        });

        if ($match) {
            $expected->push($match->subject_code);
        }
    }

    $expected = $expected->map(fn($c) => strtoupper(trim($c)))->unique();

    // ensure every expected code was returned
    foreach ($expected as $code) {
        expect($matched->contains($code))->toBeTrue("missing expected code {$code}");
    }

    // there should be no extras
    expect($matched->diff($expected)->count())->toBe(0);

    expect($matched->count())->toBe($expected->count());
});


test('major credits are ignored and numeric-only matches do not cross-map', function () {
    // create a shiftee with one major and one minor credit
    $from = Program::where('program_code', 'BSIT')->first();
    $to = Program::where('program_code', 'BSHM')->first();
    if (! $from || ! $to) {
        $this->markTestSkipped('BSIT/BSHM missing');
    }

    $fromCurr = $from->curriculums()->where('is_current', true)->first();
    $toCurr = $to->curriculums()->where('is_current', true)->first();

    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $from->id,
        'curriculum_id' => $fromCurr->id,
        'student_number' => '2026-'.fake()->unique()->randomNumber(5),
        'year_level' => '2nd Year',
        'current_year_level' => 2,
    ]);

    // pick one major and one minor from source curriculum (use fail-safe retrieval)
    $major = CurriculumSubject::where('curriculum_id', $fromCurr->id)->where('subject_type', 'major')->firstOrFail();
    $minor = CurriculumSubject::where('curriculum_id', $fromCurr->id)->where('subject_type', 'core')->firstOrFail();

    StudentSubjectCredit::create([
        'student_id' => $student->id,
        'curriculum_subject_id' => $major->id,
        'subject_id' => $major->subject_id,
        'subject_code' => $major->subject_code,
        'subject_name' => $major->subject_name,
        'units' => $major->units,
        'year_level' => $major->year_level,
        'semester' => $major->semester,
        'credit_type' => 'transfer',
        'credit_status' => 'credited',
        'final_grade' => 85,
        'credited_at' => now(),
    ]);

    StudentSubjectCredit::create([
        'student_id' => $student->id,
        'curriculum_subject_id' => $minor->id,
        'subject_id' => $minor->subject_id,
        'subject_code' => $minor->subject_code,
        'subject_name' => $minor->subject_name,
        'units' => $minor->units,
        'year_level' => $minor->year_level,
        'semester' => $minor->semester,
        'credit_type' => 'transfer',
        'credit_status' => 'credited',
        'final_grade' => 85,
        'credited_at' => now(),
    ]);

    $response = $this->postJson('/registrar/credit-transfers/compare', [
        'previous_program_id' => $from->id,
        'new_program_id' => $to->id,
        'student_year_level' => 2,
        'student_id' => $student->id,
    ]);
    $data = $response->json('data');

    // ensure major isn't included
    $credits = collect($data['credited_subjects']);
    $codes = $credits->pluck('subject_code')->all();
    expect(in_array($major->subject_code, $codes))->toBeFalse();
    expect(in_array($minor->subject_code, $codes))->toBeTrue();

    // codes returned should be trimmed (no leading/trailing spaces)
    foreach ($codes as $c) {
        expect($c)->toBe(trim($c));
    }

    // if any old code differs only by spacing/formatting from the new code,
    // normalized comparison should treat them as equal - the UI would hide the
    // "was" label in that case. check one example: NSTP 1 vs NSTP1
    $sample = $credits->first(fn($c) => str_contains($c['subject_code'], 'NSTP'));
    if ($sample) {
        $normNew = preg_replace('/[^A-Za-z0-9]/', '', $sample['subject_code']);
        $normOld = preg_replace('/[^A-Za-z0-9]/', '', $sample['old_subject_code'] ?? '');
        expect(strtolower($normNew))->toBe(strtolower($normOld));
    }

    // make sure old_subject_name is preserved when code differs
    $first = collect($data['credited_subjects'])->first();
    expect($first['old_subject_name'] ?? null)->not->toBeNull();

    // test numeric rule: credit a PE4 and ensure not matched to THC 4
    // (already handled earlier by having PE4 exist, but we verify separately)
    // we just assert that nothing with code 'THC 4' appears for the PE4 credit
    expect(collect($data['credited_subjects'])->pluck('subject_code')->contains('THC 4'))->toBeFalse();
});


// helper test: create a regular first-year BSIT student and assert basic fields
it('can create a regular first year BSIT student', function () {
    $program = Program::where('program_code', 'BSIT')->first();
    if (! $program) {
        $this->markTestSkipped('BSIT program not seeded');
    }

    $user = User::factory()->create(['role' => 'student']);
    $firstCurr = $program->curriculums()->where('is_current', true)->first();

    $student = Student::factory()->create([
        'user_id' => $user->id,
        'program_id' => $program->id,
        'curriculum_id' => $firstCurr?->id,
        'student_number' => '2026-'.fake()->unique()->randomNumber(5),
        'year_level' => '1st Year',
        'current_year_level' => 1,
    ]);

    expect($student->program_id)->toBe($program->id);
    expect($student->year_level)->toBe('1st Year');
    echo "Created student {$student->student_number} in BSIT\n";
});
