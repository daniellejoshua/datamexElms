<?php

use App\Models\ArchivedSection;
use App\Models\Section;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\post;

uses(RefreshDatabase::class);

describe('AcademicYearController archiving', function () {
    it('only head teacher can archive a semester with password confirmation', function () {
        $user = User::factory()->create(['role' => 'head_teacher', 'password' => bcrypt('secret123')]);
        actingAs($user);

        // Create a section for the current academic year and semester
        $section = Section::factory()->create([
            'academic_year' => '2023-2024',
            'semester' => '1st',
        ]);

        // Create a section-subject relationship
        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => \App\Models\Subject::factory(),
        ]);

        $response = post('/admin/academic-years/archive', [
            'academic_year' => '2023-2024',
            'semester' => '1st',
            'archive_notes' => 'Archiving test',
            'password' => 'secret123',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect();
        expect(ArchivedSection::where('academic_year', '2023-2024')->where('semester', 'first')->exists())->toBeTrue();
    });

    it('fails with wrong password', function () {
        $user = User::factory()->create(['role' => 'head_teacher', 'password' => bcrypt('secret123')]);
        actingAs($user);
        $section = Section::factory()->create([
            'academic_year' => '2023-2024',
            'semester' => '1st',
        ]);
        // Create a section-subject relationship
        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => \App\Models\Subject::factory(),
        ]);
        $response = post('/admin/academic-years/archive', [
            'academic_year' => '2023-2024',
            'semester' => '1st',
            'archive_notes' => 'Archiving test',
            'password' => 'wrongpass',
        ]);
        $response->assertSessionHasErrors('password');
        expect(ArchivedSection::where('academic_year', '2023-2024')->where('semester', 'first')->exists())->toBeFalse();
    });

    it('prevents duplicate archiving', function () {
        $user = User::factory()->create(['role' => 'head_teacher', 'password' => bcrypt('secret123')]);
        actingAs($user);
        $section = Section::factory()->create([
            'academic_year' => '2023-2024',
            'semester' => '1st',
        ]);
        // Create a section-subject relationship
        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => \App\Models\Subject::factory(),
        ]);
        // First archive
        post('/admin/academic-years/archive', [
            'academic_year' => '2023-2024',
            'semester' => '1st',
            'archive_notes' => 'Archiving test',
            'password' => 'secret123',
        ]);
        // Try again
        $response = post('/admin/academic-years/archive', [
            'academic_year' => '2023-2024',
            'semester' => '1st',
            'archive_notes' => 'Archiving test',
            'password' => 'secret123',
        ]);
        $response->assertSessionHasErrors('error');
    });

    it('prevents non-head_teacher from archiving', function () {
        $user = User::factory()->create(['role' => 'teacher', 'password' => bcrypt('secret123')]);
        actingAs($user);
        $section = Section::factory()->create([
            'academic_year' => '2023-2024',
            'semester' => '1st',
        ]);
        // Create a section-subject relationship
        \App\Models\SectionSubject::factory()->create([
            'section_id' => $section->id,
            'subject_id' => \App\Models\Subject::factory(),
        ]);
        $response = post('/admin/academic-years/archive', [
            'academic_year' => '2023-2024',
            'semester' => '1st',
            'archive_notes' => 'Archiving test',
            'password' => 'secret123',
        ]);
        $response->assertForbidden();
    });
});
