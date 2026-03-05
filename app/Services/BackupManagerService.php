<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Symfony\Component\Process\Process;

class BackupManagerService
{
    private const SETTINGS_PATH = 'backups/settings.json';

    /**
     * @return array<string, mixed>
     */
    public function getSettings(): array
    {
        $defaults = [
            'automatic_enabled' => false,
            'frequency' => 'daily',
            'time' => '02:00',
            'destination' => 'local',
            'cloud_disk' => 's3',
            'last_run_at' => null,
            'last_status' => null,
            'last_error' => null,
        ];

        if (! Storage::disk('local')->exists(self::SETTINGS_PATH)) {
            return $defaults;
        }

        $raw = Storage::disk('local')->get(self::SETTINGS_PATH);
        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        return array_merge($defaults, $decoded);
    }

    /**
     * @param  array<string, mixed>  $settings
     * @return array<string, mixed>
     */
    public function saveSettings(array $settings): array
    {
        $current = $this->getSettings();

        $next = [
            'automatic_enabled' => (bool) ($settings['automatic_enabled'] ?? $current['automatic_enabled']),
            'frequency' => $settings['frequency'] ?? $current['frequency'],
            'time' => $settings['time'] ?? $current['time'],
            'destination' => $settings['destination'] ?? $current['destination'],
            'cloud_disk' => $settings['cloud_disk'] ?? $current['cloud_disk'],
            'last_run_at' => $current['last_run_at'],
            'last_status' => $current['last_status'],
            'last_error' => $current['last_error'],
        ];

        Storage::disk('local')->put(self::SETTINGS_PATH, json_encode($next, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

        return $next;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listBackups(int $limit = 20): array
    {
        $files = collect([
            ...Storage::disk('local')->files('backups/manual'),
            ...Storage::disk('local')->files('backups/auto'),
        ])->map(function (string $path) {
            return [
                'path' => $path,
                'filename' => basename($path),
                'size' => Storage::disk('local')->size($path),
                'last_modified' => Carbon::createFromTimestamp(Storage::disk('local')->lastModified($path))->toIso8601String(),
            ];
        })->sortByDesc('last_modified')->values()->take($limit);

        return $files->all();
    }

    /**
     * @return array<string, mixed>
     */
    public function createBackup(string $mode = 'manual', string $destination = 'local', ?string $cloudDisk = null): array
    {
        $timestamp = now()->format('Ymd_His');
        $relativePath = "backups/{$mode}/db-backup-{$timestamp}.sql.gz";
        // ensure the parent directory exists before dumping
        Storage::disk('local')->makeDirectory(dirname($relativePath));

        $absolutePath = Storage::disk('local')->path($relativePath);

        $this->runDatabaseDump($absolutePath);

        $result = [
            'filename' => basename($relativePath),
            'path' => $relativePath,
            'destination' => $destination,
            'size' => Storage::disk('local')->size($relativePath),
            'created_at' => now()->toIso8601String(),
        ];

        if ($destination === 'cloud') {
            $disk = $cloudDisk ?: (string) $this->getSettings()['cloud_disk'];
            $this->uploadToCloud($disk, $relativePath, $absolutePath);
            $result['cloud_disk'] = $disk;
            $result['cloud_path'] = $relativePath;
        }

        return $result;
    }

    /**
     * @return array<string, mixed>
     */
    public function runAutomaticBackup(bool $force = false): array
    {
        $settings = $this->getSettings();

        if (! $force && ! $settings['automatic_enabled']) {
            return [
                'ran' => false,
                'reason' => 'automatic backups disabled',
            ];
        }

        if (! $force && ! $this->isDue($settings)) {
            return [
                'ran' => false,
                'reason' => 'backup is not due yet',
            ];
        }

        try {
            $backup = $this->createBackup('auto', (string) $settings['destination'], (string) $settings['cloud_disk']);

            $this->persistRunStatus([
                'last_run_at' => now()->toIso8601String(),
                'last_status' => 'success',
                'last_error' => null,
            ]);

            return [
                'ran' => true,
                'backup' => $backup,
            ];
        } catch (\Throwable $exception) {
            Log::error('Automatic backup failed', ['error' => $exception->getMessage()]);

            $this->persistRunStatus([
                'last_run_at' => now()->toIso8601String(),
                'last_status' => 'failed',
                'last_error' => $exception->getMessage(),
            ]);

            throw $exception;
        }
    }

    /**
     * Restore a previously generated backup file directly into the database.
     *
     * This will decompress and pipe the SQL to the MySQL client using the same
     * connection details the application currently uses. The method will throw
     * a RuntimeException on failure.
     *
     * @param  string  $relativePath
     * @throws \RuntimeException
     */
    /**
     * Restore a previously generated backup file directly into the database.
     *
     * This will decompress and pipe the SQL to the MySQL client using the same
     * connection details the application currently uses. The method will throw
     * a RuntimeException on failure. On success the raw output of the mysql
     * process is returned so callers can log or inspect it.
     *
     * @param  string  $relativePath
     * @return string  stdout from the restore command
     * @throws \RuntimeException
     */
    public function restoreBackup(string $relativePath): string
    {
        $absolutePath = Storage::disk('local')->path($relativePath);

        if (! file_exists($absolutePath)) {
            throw new RuntimeException('Backup file not found for restore.');
        }

        $connection = Config::get('database.default', 'mysql');
        $db = Config::get("database.connections.{$connection}");

        if (! is_array($db)) {
            throw new RuntimeException('Database connection configuration is invalid.');
        }

        $host = $db['host'] ?? '127.0.0.1';
        $port = $db['port'] ?? 3306;
        $database = $db['database'] ?? null;
        $username = $db['username'] ?? null;
        $password = $db['password'] ?? null;

        if (! $database || ! $username) {
            throw new RuntimeException('Database credentials are missing.');
        }

        $cmd = '';
        if (str_ends_with($absolutePath, '.gz')) {
            $cmd = "gunzip -c ".escapeshellarg($absolutePath);
        } elseif (str_ends_with($absolutePath, '.sql')) {
            $cmd = "cat ".escapeshellarg($absolutePath);
        } else {
            throw new RuntimeException('Unsupported file type for restore.');
        }

        $escapedPassword = str_replace("'", "'\"'\"'", (string) $password);

        $command = sprintf(
            "%s | mysql -h %s -P %s -u%s -p'%s' %s",
            $cmd,
            escapeshellarg((string) $host),
            escapeshellarg((string) $port),
            escapeshellarg((string) $username),
            $escapedPassword,
            escapeshellarg((string) $database)
        );

        $process = Process::fromShellCommandline($command);
        $process->setTimeout(0);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Restore failed: '.trim($process->getErrorOutput()));
        }

        return $process->getOutput();
    }

    /**
     * @param  array<string, mixed>  $settings
     */
    private function isDue(array $settings): bool
    {
        $lastRunRaw = $settings['last_run_at'] ?? null;
        if (! $lastRunRaw) {
            return true;
        }

        $lastRun = Carbon::parse($lastRunRaw);
        $now = now();

        if (($settings['frequency'] ?? 'daily') === 'hourly') {
            return $now->greaterThanOrEqualTo($lastRun->copy()->addHour());
        }

        $time = $settings['time'] ?? '02:00';

        if (($settings['frequency'] ?? 'daily') === 'weekly') {
            $nextRun = $lastRun->copy()->addWeek();
            [$hour, $minute] = explode(':', $time);
            $nextRun->setTime((int) $hour, (int) $minute);

            return $now->greaterThanOrEqualTo($nextRun);
        }

        $nextRun = $lastRun->copy()->addDay();
        [$hour, $minute] = explode(':', $time);
        $nextRun->setTime((int) $hour, (int) $minute);

        return $now->greaterThanOrEqualTo($nextRun);
    }

    private function runDatabaseDump(string $outputPath): void
    {
        $connection = Config::get('database.default', 'mysql');
        $db = Config::get("database.connections.{$connection}");

        if (! is_array($db)) {
            throw new RuntimeException('Database connection configuration is invalid.');
        }

        $host = $db['host'] ?? '127.0.0.1';
        $port = $db['port'] ?? 3306;
        $database = $db['database'] ?? null;
        $username = $db['username'] ?? null;
        $password = $db['password'] ?? null;

        if (! $database || ! $username) {
            throw new RuntimeException('Database credentials are missing.');
        }

        $escapedPassword = str_replace("'", "'\"'\"'", (string) $password);

        // add --no-tablespaces to avoid PROCESS privilege requirement on modern
        // MySQL versions when running under restricted accounts.
        $command = sprintf(
            "mysqldump --no-tablespaces -h %s -P %s -u%s -p'%s' %s | gzip > %s",
            escapeshellarg((string) $host),
            escapeshellarg((string) $port),
            escapeshellarg((string) $username),
            $escapedPassword,
            escapeshellarg((string) $database),
            escapeshellarg($outputPath)
        );

        $process = Process::fromShellCommandline($command);
        $process->setTimeout(300);
        $process->run();

        if (! $process->isSuccessful()) {
            throw new RuntimeException('Backup failed: '.trim($process->getErrorOutput()));
        }
    }

    private function uploadToCloud(string $disk, string $relativePath, string $absolutePath): void
    {
        $diskConfig = Config::get("filesystems.disks.{$disk}");

        if (! is_array($diskConfig)) {
            throw new RuntimeException("Cloud disk [{$disk}] is not configured.");
        }

        $stream = fopen($absolutePath, 'r');

        if ($stream === false) {
            throw new RuntimeException('Failed to read backup file for cloud upload.');
        }

        try {
            $uploaded = Storage::disk($disk)->put($relativePath, $stream);

            if (! $uploaded) {
                throw new RuntimeException('Cloud upload failed.');
            }
        } finally {
            fclose($stream);
        }
    }

    /**
     * @param  array<string, mixed>  $status
     */
    private function persistRunStatus(array $status): void
    {
        $settings = $this->getSettings();

        $updated = array_merge($settings, $status);

        Storage::disk('local')->put(self::SETTINGS_PATH, json_encode($updated, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }
}
