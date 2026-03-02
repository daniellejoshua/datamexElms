<?php

use App\Models\User;
use App\Services\BackupManagerService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('shows backup page with settings and backup history', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $this->mock(BackupManagerService::class, function ($mock) {
        $mock->shouldReceive('getSettings')->once()->andReturn([
            'automatic_enabled' => true,
            'frequency' => 'daily',
            'time' => '02:00',
            'destination' => 'local',
            'cloud_disk' => 's3',
            'last_run_at' => null,
            'last_status' => null,
            'last_error' => null,
        ]);

        $mock->shouldReceive('listBackups')->once()->andReturn([]);
    });

    $response = $this->actingAs($superAdmin)->get(route('superadmin.backup.index'));

    $response->assertSuccessful();
    $response->assertInertia(fn (Assert $page) => $page
        ->component('SuperAdmin/Backup')
        ->where('settings.frequency', 'daily')
        ->has('backups')
    );
});

it('updates backup settings', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $this->mock(BackupManagerService::class, function ($mock) {
        $mock->shouldReceive('saveSettings')->once()->andReturn([
            'automatic_enabled' => true,
            'frequency' => 'weekly',
            'time' => '03:30',
            'destination' => 'cloud',
            'cloud_disk' => 's3',
            'last_run_at' => null,
            'last_status' => null,
            'last_error' => null,
        ]);
    });

    $response = $this->actingAs($superAdmin)->patchJson(route('superadmin.backup.settings.update'), [
        'automatic_enabled' => true,
        'frequency' => 'weekly',
        'time' => '03:30',
        'destination' => 'cloud',
        'cloud_disk' => 's3',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('settings.frequency', 'weekly')
        ->assertJsonPath('settings.destination', 'cloud');
});

it('creates manual backup via api endpoint', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $this->mock(BackupManagerService::class, function ($mock) {
        $mock->shouldReceive('createBackup')->once()->andReturn([
            'filename' => 'db-backup-20260302_120000.sql.gz',
            'path' => 'backups/manual/db-backup-20260302_120000.sql.gz',
            'destination' => 'local',
            'size' => 1024,
            'created_at' => now()->toIso8601String(),
        ]);
    });

    $response = $this->actingAs($superAdmin)->postJson(route('superadmin.backup.create'), [
        'destination' => 'local',
    ]);

    $response->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('backup.destination', 'local');
});

it('runs automatic backup manually via api endpoint', function () {
    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $this->mock(BackupManagerService::class, function ($mock) {
        $mock->shouldReceive('runAutomaticBackup')->once()->with(true)->andReturn([
            'ran' => true,
            'backup' => [
                'filename' => 'db-backup-20260302_120000.sql.gz',
                'destination' => 'local',
            ],
        ]);
    });

    $response = $this->actingAs($superAdmin)->postJson(route('superadmin.backup.automatic.run'));

    $response->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('result.ran', true);
});

it('uploads restore file to local backup restore directory', function () {
    Storage::fake('local');

    $superAdmin = User::factory()->create(['role' => 'super_admin']);

    $response = $this->actingAs($superAdmin)->post(route('superadmin.backup.restore'), [
        'backup' => UploadedFile::fake()->create('restore.sql', 10, 'application/sql'),
    ]);

    $response->assertSuccessful();

    $files = Storage::disk('local')->files('backups/restores');

    expect($files)->toHaveCount(1);
});

it('downloads a local backup file from history endpoint', function () {
    Storage::fake('local');

    $superAdmin = User::factory()->create(['role' => 'super_admin']);
    $path = 'backups/manual/test-download.sql.gz';

    Storage::disk('local')->put($path, 'backup-content');

    $response = $this->actingAs($superAdmin)->get(route('superadmin.backup.download', [
        'path' => $path,
    ]));

    $response->assertSuccessful();
    $response->assertDownload('test-download.sql.gz');
});
