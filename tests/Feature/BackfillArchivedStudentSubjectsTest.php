<?php

use App\Models\ArchivedStudentEnrollment;
use App\Models\ArchivedStudentSubject;
use App\Models\SectionSubject;
use App\Models\Section;
use App\Models\ArchivedSection;
use App\Models\Program;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentGrade;
use App\Models\StudentSubjectEnrollment;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;

it('backfills missing archived_student_subjects from StudentGrade and is idempotent', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);

    // Create student, section, subject and a student enrollment with grade
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $teacher = Teacher::factory()->create();
    $subject = Subject::factory()->create(['subject_code' => 'BF101', 'subject_name' => 'Backfill Test']);

    // Ensure there's a program for the section and archived section
    $program = Program::factory()->create(['education_level' => 'college']);

    // Create a Section required by section_subjects and matching ArchivedSection for archived enrollments
    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Backfill Section',
        'year_level' => 1,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'BF-SEC-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'Backfill Section',
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'total_enrolled_students' => 0,
        'completed_students' => 0,
        'dropped_students' => 0,
        'section_average_grade' => null,
        'archived_at' => now(),
        'archived_by' => $admin->id,
    ]);

    $sectionSubject = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject->id,
        'teacher_id' => $teacher->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSubject->id,
        'prelim_grade' => 75,
        'midterm_grade' => 76,
        'prefinal_grade' => 77,
        'final_grade' => 78,
        'teacher_id' => $teacher->id,
    ]);

    // Create archived enrollment linked to original enrollment (observer would normally create archived_student_subjects)
    $archived = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => (string) $enrollment->id,
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => null,
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    // Remove any archived subject rows to simulate a legacy/missing state
    DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->delete();
    expect(DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->count())->toBe(0);

    // Run backfill (actual run)
    $this->artisan('app:backfill-archived-student-subjects --batch=50')->assertExitCode(0);

    $rows = DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->get();
    expect($rows->count())->toBeGreaterThan(0);

    $row = $rows->first();
    expect($row->subject_code)->toBe('BF101');
    expect((float) $row->final_grade)->toBe(78.0);
    // Semester grade should be computed from the four period grades: (75+76+77+78)/4 = 76.50
    expect((float) $row->semester_grade)->toBe(76.5);

    // Run again — should be idempotent (no additional rows)
    $this->artisan('app:backfill-archived-student-subjects --batch=50')->assertExitCode(0);
    $rowsAfter = DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->get();
    expect($rowsAfter->count())->toBe($rows->count());
});

it('archives ungraded subjects alongside graded ones when observing enrollment creation', function () {
    $admin = User::factory()->create(['role' => 'head_teacher']);

    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    $program = Program::factory()->create(['education_level' => 'college']);

    $teacher = Teacher::factory()->create();
    $subject1 = Subject::factory()->create(['subject_code' => 'GRA101', 'subject_name' => 'Graded']);
    $subject2 = Subject::factory()->create(['subject_code' => 'NO_GRADE', 'subject_name' => 'Ungraded']);

    $section = Section::create([
        'program_id' => $program->id,
        'section_name' => 'Mix Section',
        'year_level' => 1,
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
    ]);

    $archivedSection = ArchivedSection::create([
        'original_section_id' => 'MIX-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'Mix Section',
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'total_enrolled_students' => 0,
        'completed_students' => 0,
        'dropped_students' => 0,
        'section_average_grade' => null,
        'archived_at' => now(),
        'archived_by' => $admin->id,
    ]);

    $sectionSub1 = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject1->id,
        'teacher_id' => $teacher->id,
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);
    $sectionSub2 = SectionSubject::create([
        'section_id' => $section->id,
        'subject_id' => $subject2->id,
        'teacher_id' => null, // no teacher assigned
        'academic_year' => '2024-2025',
        'semester' => '1st',
    ]);

    $enrollment = StudentEnrollment::create([
        'student_id' => $student->id,
        'section_id' => $section->id,
        'enrollment_date' => now(),
        'status' => 'active',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'enrolled_by' => $admin->id,
    ]);

    // create both subject enrollments
    StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $sectionSub1->id,
        'enrollment_type' => 'regular',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
        'enrollment_date' => now(),
        'enrolled_by' => $admin->id,
    ]);
    StudentSubjectEnrollment::create([
        'student_id' => $student->id,
        'section_subject_id' => $sectionSub2->id,
        'enrollment_type' => 'regular',
        'academic_year' => '2024-2025',
        'semester' => '1st',
        'status' => 'active',
        'enrollment_date' => now(),
        'enrolled_by' => $admin->id,
    ]);

    // only grade the first subject
    StudentGrade::create([
        'student_enrollment_id' => $enrollment->id,
        'section_subject_id' => $sectionSub1->id,
        'prelim_grade' => 80,
        'midterm_grade' => 85,
        'prefinal_grade' => 88,
        'final_grade' => 90,
        'teacher_id' => $teacher->id,
    ]);

    // sanity check: both student subject enrollments should exist before archiving
    $semesterValuesCheck = ['1st', 'first'];
    $found = StudentSubjectEnrollment::where('student_id', $student->id)
        ->where('academic_year', '2024-2025')
        ->whereIn('semester', $semesterValuesCheck)
        ->pluck('section_subject_id')
        ->toArray();
    expect(in_array($sectionSub1->id, $found))->toBeTrue();
    expect(in_array($sectionSub2->id, $found))->toBeTrue();

    $archived = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection->id,
        'student_id' => $student->id,
        'original_enrollment_id' => (string) $enrollment->id,
        'academic_year' => '2024-2025',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => null,
        'student_data' => [
            'name' => $student->user->name,
            'student_number' => $student->student_number,
        ],
    ]);

    // archived process should not delete original subject enrollments
    $laterEnrolls = StudentSubjectEnrollment::where('student_id', $student->id)
        ->where('academic_year', '2024-2025')
        ->whereIn('semester', ['1st','first'])
        ->pluck('section_subject_id')
        ->toArray();
    expect(in_array($sectionSub1->id, $laterEnrolls))->toBeTrue();
    expect(in_array($sectionSub2->id, $laterEnrolls))->toBeTrue();



    // now both subjects should be present in archived_student_subjects
    $rows = DB::table('archived_student_subjects')
        ->where('archived_student_enrollment_id', $archived->id)
        ->get();

    // expect two rows: one graded and one ungraded
    expect($rows->count())->toBe(2);

    $codes = $rows->pluck('subject_code')->toArray();
    expect(in_array('GRA101', $codes))->toBeTrue();
    expect(in_array('NO_GRADE', $codes))->toBeTrue();
});
it('respects --dry-run and does not insert rows', function () {
    $user = User::factory()->create(['role' => 'student']);
    $student = Student::factory()->create(['user_id' => $user->id]);

    // Create program and admin required for ArchivedSection FK constraints
    $admin = User::factory()->create(['role' => 'head_teacher']);
    $program = Program::factory()->create(['education_level' => 'college']);

    $archivedSection2 = ArchivedSection::create([
        'original_section_id' => 'BF-DRY-1',
        'program_id' => $program->id,
        'year_level' => 1,
        'section_name' => 'DryRun Section',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'status' => 'completed',
        'course_data' => [],
        'total_enrolled_students' => 0,
        'completed_students' => 0,
        'dropped_students' => 0,
        'section_average_grade' => null,
        'archived_at' => now(),
        'archived_by' => $admin->id,
    ]);

    $archived = ArchivedStudentEnrollment::create([
        'archived_section_id' => $archivedSection2->id,
        'student_id' => $student->id,
        'original_enrollment_id' => '0',
        'academic_year' => '2023-2024',
        'semester' => 'first',
        'enrolled_date' => now(),
        'completion_date' => now(),
        'final_status' => 'completed',
        'final_grades' => null,
        'student_data' => [
            'name' => $student->user->name ?? null,
            'student_number' => $student->student_number ?? null,
        ],
    ]);

    DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->delete();

    $this->artisan('app:backfill-archived-student-subjects --dry-run')->assertExitCode(0);

    expect(DB::table('archived_student_subjects')->where('archived_student_enrollment_id', $archived->id)->count())->toBe(0);
});
