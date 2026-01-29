<?php

it('reports correct row and cell numbers when the template validation row is present', function () {
    $teacher = \App\Models\Teacher::factory()->create();
    $section = \App\Models\Section::factory()->create(['year_level' => 1]);
    $sectionSubject = \App\Models\SectionSubject::factory()->create([
        'section_id' => $section->id,
        'teacher_id' => $teacher->id,
    ]);

    $enrollment = \App\Models\StudentEnrollment::factory()->create([
        'section_id' => $section->id,
        'status' => 'active',
    ]);

    // Construct a CSV that includes the heading row, a validation row, and a malformed student row
    $csvContent = "Student ID,Student Name,Prelim,Midterm,PreFinals,Finals\n";
    $csvContent .= "section_subject_id,{$sectionSubject->id},, , , \n"; // validation row (row 2)
    $csvContent .= "18,A, , , , \n"; // malformed row (should be reported as Row 3)

    $tempFile = tempnam(sys_get_temp_dir(), 'grade_import').'.csv';
    file_put_contents($tempFile, $csvContent);

    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\GradeImport($sectionSubject, $teacher), $tempFile);

    $warnings = session('grade_import_warnings');
    expect($warnings)->not->toBeNull();

    // Should mention Row 3 (because headings + validation row occupy rows 1 & 2)
    expect(collect($warnings)->first(fn($w) => str_contains($w, 'Row 3')))->not->toBeNull();
    // Should include the malformed Student ID so it is actionable
    expect(collect($warnings)->first(fn($w) => str_contains($w, "Student ID '18'")))->not->toBeNull();

    unlink($tempFile);
});