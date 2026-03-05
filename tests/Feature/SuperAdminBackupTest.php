<?php

use App\Models\User;
use Illuminate\Support\Facades\Storage;

use function Pest\Laravel\actingAs;

uses(Tests\TestCase::class, Illuminate\Foundation\Testing\RefreshDatabase::class);

beforeEach(function () {
    // ensure storage disk clean
    Storage::fake('local');
});

it('allows super admin to view the backup page', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($user)->get('/super-admin/backup');

    $response->assertStatus(200);
    $response->assertInertia(fn ($page) =>
        $page->component('SuperAdmin/Backup')
            ->has('settings')
            ->has('backups')
            // lastRestore may be null when no restore has occurred yet
            ->where('lastRestore', fn ($v) => is_null($v) || is_array($v))
    );
});

it('saves automatic backup settings and returns updated values', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    $payload = [
        'automatic_enabled' => true,
        'frequency' => 'weekly',
        'time' => '04:30',
        'destination' => 'local',
    ];

    $response = $this->actingAs($user)
        ->patchJson(route('superadmin.backup.settings.update'), $payload);

    $response->assertSuccessful();
    $response->assertJsonFragment(['success' => true]);
    $response->assertJsonPath('settings.frequency', 'weekly');
    $response->assertJsonPath('settings.destination', 'local');

    // confirm file was written
    Storage::disk('local')->assertExists('backups/settings.json');
});

it('can run automatic backup immediately via endpoint', function () {
    $user = User::factory()->create(['role' => 'super_admin']);

    // ensure there is at least one table to dump (users)
    User::factory()->count(2)->create();

    $response = $this->actingAs($user)
        ->postJson(route('superadmin.backup.automatic.run'));

    $response->assertSuccessful();
    $response->assertJson(['success' => true]);

    // backup file should exist
    $files = Storage::disk('local')->files('backups/auto');
    expect($files)->not->toBeEmpty();
});

it('restore service uses the SQL in the file to alter the database state', function () {
    Storage::fake('local');

    // start with an inactive user and record its id
    $user = User::factory()->create(['active' => false]);

    // create a tiny SQL file that sets active=0 for that id
    $sql = "UPDATE users SET active = 0 WHERE id = {$user->id};";
    Storage::disk('local')->put('backups/test_restore.sql', $sql);

    // change the user so it no longer matches the dump
    $user->update(['active' => true]);
    expect($user->fresh()->active)->toBeTrue();

    // run restore directly via service (bypassing the controller/job)
    app(App\Services\BackupManagerService::class)
        ->restoreBackup('backups/test_restore.sql');

    // after restore the flag should be flipped back
    expect($user->fresh()->active)->toBeFalse();
});

it('numeric transferee grades ≥75 count as passing', function () {
    $subjects = collect([
        ['subject_id' => 1, 'subject_code' => 'TEST1', 'grade' => '100'],
        ['subject_id' => 2, 'subject_code' => 'TEST2', 'grade' => '60'],
    ]);

    // emulate the filtering logic from the component
    $passing = $subjects->filter(function ($s) {
        $grade = (float) $s['grade'];
        // transferee + numeric
        return !is_nan($grade) && $grade >= 75;
    })->values();

    expect($passing->pluck('subject_id')->all())->toEqual([1]);
});

it('gpa transferee grades ≤3.00 count as passing', function () {
    $subjects = collect([
        ['subject_id' => 1, 'subject_code' => 'TEST1', 'grade' => '1.50'],
        ['subject_id' => 2, 'subject_code' => 'TEST2', 'grade' => '4.00'],
    ]);

    $passing = $subjects->filter(function ($s) {
        $grade = (float) $s['grade'];
        // transferee + gpa
        return !is_nan($grade) && $grade >= 1.00 && $grade <= 3.00;
    })->values();

    expect($passing->pluck('subject_id')->all())->toEqual([1]);
});

it('preview calculation respects gradingType for transferees', function () {
    $subjects = collect([
        ['subject_id' => 1, 'subject_code' => 'TEST1', 'grade' => '100'],
        ['subject_id' => 2, 'subject_code' => 'TEST2', 'grade' => '60'],
        ['subject_id' => 3, 'subject_code' => 'TEST3', 'grade' => '2.50'],
    ]);

    foreach (['numeric', 'gpa'] as $gradingType) {
        $passed = [];
        $failed = [];

        foreach ($subjects as $s) {
            $grade = (float) $s['grade'];
            if (!is_nan($grade)) {
                if ($gradingType === 'gpa') {
                    $isPassing = $grade <= 3.0;
                } else {
                    $isPassing = $grade >= 75;
                }
                if ($isPassing) {
                    $passed[] = $s['subject_id'];
                } else {
                    $failed[] = $s['subject_id'];
                }
            }
        }

        if ($gradingType === 'numeric') {
            expect($passed)->toEqual([1]);
            expect($failed)->toEqual([2]);
        } else {
            expect($passed)->toEqual([1, 3]);
            expect($failed)->toEqual([2]);
        }
    }
});
