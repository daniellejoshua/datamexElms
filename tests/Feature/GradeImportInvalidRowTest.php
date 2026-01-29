<?php

it('skips malformed rows and records warnings during import', function () {
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

    // Row 2 is malformed (Student ID '18', Student Name 'A'), row 3 is valid
    $csvContent = "Student ID,Student Name,Prelim,Midterm,PreFinals,Finals\n";
    $csvContent .= "18,A, , , , \n"; // malformed row - should be skipped
    $csvContent .= "{$enrollment->student->student_number},{$enrollment->student->user->name},85,90,88,92\n"; // valid row

    $tempFile = tempnam(sys_get_temp_dir(), 'grade_import').'.csv';
    file_put_contents($tempFile, $csvContent);

    // Run import
    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\GradeImport($sectionSubject, $teacher), $tempFile);

    // Valid grade should be saved
    $grade = \App\Models\StudentGrade::where([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
    ])->first();

    expect($grade)->not->toBeNull();
    expect($grade->prelim_grade)->toBe(85.0);

    // Warnings should have been flashed to the session
    $warnings = session('grade_import_warnings');
    expect($warnings)->not->toBeNull();
    expect(collect($warnings)->first(fn($w) => str_contains($w, "Row 2")))->not->toBeNull();
    // Warning should include the malformed Student ID so it's actionable
    expect(collect($warnings)->first(fn($w) => str_contains($w, "Student ID '18'")))->not->toBeNull();

    unlink($tempFile);
});