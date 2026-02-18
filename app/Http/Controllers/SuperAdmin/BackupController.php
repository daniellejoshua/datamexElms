<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\Process\Process;

class BackupController extends Controller
{
    public function index()
    {
        return Inertia::render('SuperAdmin/Backup');
    }

    /**
     * Create a database dump (gzip). Uses mysqldump when available.
     * Note: running mysqldump requires the binary to be present in the container.
     */
    public function backup(Request $request)
    {
        $db = config('database.connections.mysql');

        $host = $db['host'] ?? '127.0.0.1';
        $database = $db['database'] ?? null;
        $username = $db['username'] ?? null;
        $password = $db['password'] ?? null;

        if (! $database) {
            return back()->withErrors(['backup' => 'Database configuration missing']);
        }

        $dir = storage_path('app/backups');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $filename = $dir.'/db-backup-'.date('Ymd_His').'.sql.gz';

        // Build mysqldump command — use shell because of gzip pipe
        // Escape password to reduce injection risk
        $escapedPassword = str_replace("'", "'"."'"."'", $password ?? '');
        $command = "mysqldump -h {$host} -u{$username} -p'{$escapedPassword}' {$database} | gzip > {$filename}";

        try {
            $process = Process::fromShellCommandline($command);
            $process->setTimeout(300); // 5 minutes max
            $process->run();

            if (! $process->isSuccessful()) {
                Log::error('Backup failed', ['output' => $process->getErrorOutput()]);
                return back()->withErrors(['backup' => 'Backup failed: '.$process->getErrorOutput()]);
            }

            return response()->download($filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            Log::error('Backup error', ['error' => $e->getMessage()]);
            return back()->withErrors(['backup' => 'Backup is not available on this environment.']);
        }
    }

    /**
     * Accept a backup file upload; for safety we simply store the file and return success.
     * Restoring on the server requires additional operational checks and is intentionally
     * left as a manual step (or require dev ops). If you want an automated restore here
     * we can extend this to run mysql import (dangerous on production).
     */
    public function restore(Request $request)
    {
        $request->validate([
            'backup' => 'required|file',
        ]);

        $file = $request->file('backup');
        $path = $file->storeAs('backups', 'restore-'.time().'-'.$file->getClientOriginalName());

        return back()->with('success', 'Backup uploaded to storage: '.$path.'. To restore, run the restore process on the server (manual step).');
    }
}
