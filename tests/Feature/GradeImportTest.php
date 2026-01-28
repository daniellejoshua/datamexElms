<?php

it('can import college grades successfully', function () {
    // Create test data
    $teacher = \App\Models\Teacher::factory()->create();
    $section = \App\Models\Section::factory()->create(['year_level' => 1]); // Use integer
    $sectionSubject = \App\Models\SectionSubject::factory()->create([
        'section_id' => $section->id,
        'teacher_id' => $teacher->id,
    ]);
    $enrollment = \App\Models\StudentEnrollment::factory()->create([
        'section_id' => $section->id,
        'status' => 'active',
    ]);

    // Create a simple CSV content
    $csvContent = "Student ID,Student Name,Prelim,Midterm,PreFinals,Finals\n";
    $csvContent .= "{$enrollment->student->student_number},{$enrollment->student->user->name},85,90,88,92\n";

    // Create a temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'grade_import').'.csv';
    file_put_contents($tempFile, $csvContent);

    // Import the file
    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\GradeImport($sectionSubject, $teacher), $tempFile);

    // Check if grade was saved
    $grade = \App\Models\StudentGrade::where([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
    ])->first();

    expect($grade)->not->toBeNull();
    expect($grade->prelim_grade)->toBe(85.0);
    expect($grade->midterm_grade)->toBe(90.0);
    expect($grade->prefinal_grade)->toBe(88.0);
    expect($grade->final_grade)->toBe(92.0);
    expect($grade->semester_grade)->toBe(88.75);
    expect($grade->overall_status)->toBe('passed');

    // Clean up
    unlink($tempFile);
});

it('can import SHS grades successfully', function () {
    // Create test data
    $teacher = \App\Models\Teacher::factory()->create();
    $section = \App\Models\Section::factory()->create(['year_level' => 11]); // Use integer for Grade 11
    $sectionSubject = \App\Models\SectionSubject::factory()->create([
        'section_id' => $section->id,
        'teacher_id' => $teacher->id,
    ]);
    $enrollment = \App\Models\StudentEnrollment::factory()->create([
        'section_id' => $section->id,
        'status' => 'active',
    ]);

    // Create a simple CSV content
    $csvContent = "Student ID,Student Name,1st Quarter,2nd Quarter,3rd Quarter,4th Quarter\n";
    $csvContent .= "{$enrollment->student->student_number},{$enrollment->student->user->name},85,90,88,92\n";

    // Create a temporary file
    $tempFile = tempnam(sys_get_temp_dir(), 'grade_import').'.csv';
    file_put_contents($tempFile, $csvContent);

    // Import the file
    \Maatwebsite\Excel\Facades\Excel::import(new \App\Imports\GradeImport($sectionSubject, $teacher), $tempFile);

    // Check if grade was saved
    $grade = \App\Models\ShsStudentGrade::where([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'teacher_id' => $teacher->id,
    ])->first();

    expect($grade)->not->toBeNull();
    expect($grade->first_quarter_grade)->toBe(85.0);
    expect($grade->second_quarter_grade)->toBe(90.0);
    expect($grade->third_quarter_grade)->toBe(88.0);
    expect($grade->fourth_quarter_grade)->toBe(92.0);
    expect($grade->final_grade)->toBe(88.75);
    expect($grade->completion_status)->toBe('passed');

    // Clean up
    unlink($tempFile);
});
