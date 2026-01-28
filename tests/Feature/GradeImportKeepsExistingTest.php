<?php

it('does not erase existing grades when importing blanks', function () {
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

    // Create an existing grade
    $grade = \App\Models\StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
        'prelim_grade' => 80.0,
        'midterm_grade' => 85.0,
        'prefinal_grade' => 82.0,
        'final_grade' => 88.0,
        'semester_grade' => 83.75,
    ]);

    // CSV with blank grade cells (should not overwrite existing grades)
    $csvContent = "Student ID,Student Name,Prelim,Midterm,PreFinals,Finals\n";
    $csvContent .= "{$enrollment->student->student_number},{$enrollment->student->user->name},,, ,\n";

    $tempFile = tempnam(sys_get_temp_dir(), 'grade_import').'.csv';
    file_put_contents($tempFile, $csvContent);

    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\GradeImport($sectionSubject, $teacher), $tempFile);

    $fresh = $grade->fresh();

    expect($fresh->prelim_grade)->toBe(80.0);
    expect($fresh->midterm_grade)->toBe(85.0);
    expect($fresh->prefinal_grade)->toBe(82.0);
    expect($fresh->final_grade)->toBe(88.0);
    expect($fresh->semester_grade)->toBe(83.75);

    unlink($tempFile);
});