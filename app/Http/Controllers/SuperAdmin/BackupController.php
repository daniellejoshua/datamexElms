<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\BackupManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(private BackupManagerService $backupManager) {}

    public function index(): Response
    {
        // fetch the most recent restore job audit entry so UI can show its output
        $lastRestore = DB::table('audit_logs')
            ->where('event', 'restore')
            ->orderBy('id', 'desc')
            ->first();

        return Inertia::render('SuperAdmin/Backup', [
            'settings' => $this->backupManager->getSettings(),
            'backups' => $this->backupManager->listBackups(),
            'lastRestore' => $lastRestore,
        ]);
    }

    public function backup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination' => 'required|string|in:local',
            // cloud option removed, backups remain local; manual copies elsewhere recommended
        ]);

        try {
            $backup = $this->backupManager->createBackup(
                mode: 'manual',
                destination: $validated['destination'],
            );

            return response()->json([
                'success' => true,
                'message' => 'Backup created successfully.',
                'backup' => $backup,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'automatic_enabled' => 'required|boolean',
            'frequency' => 'required|string|in:hourly,daily,weekly',
            'time' => 'required|string',
            'destination' => 'required|string|in:local',
            // cloud fields removed
        ]);

        $settings = $this->backupManager->saveSettings($validated);

        return response()->json([
            'success' => true,
            'message' => 'Backup settings updated.',
            'settings' => $settings,
        ]);
    }

    public function runAutomaticNow(): JsonResponse
    {
        try {
            $result = $this->backupManager->runAutomaticBackup(force: true);

            return response()->json([
                'success' => true,
                'message' => 'Automatic backup executed.',
                'result' => $result,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    public function restore(Request $request): JsonResponse
    {
        // confirm user password before doing anything
        $request->validate([
            'backup' => 'required|file|mimes:sql,gz,zip|max:51200',
            'current_password' => 'required|string',
        ]);

        $user = $request->user();
        if (! \Hash::check($request->input('current_password'), $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Password confirmation failed.',
            ], 422);
        }

        $file = $request->file('backup');
        $path = $file->storeAs('backups/restores', 'restore-'.time().'-'.$file->getClientOriginalName(), 'local');

        // record audit log for upload action (restore completion logged in job)
        DB::table('audit_logs')->insert([
            'user_id' => $user->id,
            'user_type' => get_class($user),
            'user_name' => $user->name ?? $user->email,
            'event' => 'restore_uploaded',
            'auditable_type' => 'backup',
            'auditable_id' => null,
            'old_values' => null,
            'new_values' => json_encode(['path' => $path]),
            'metadata' => null,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // queue job rather than blocking HTTP thread
        
        \App\Jobs\RestoreBackupJob::dispatch($path, $user->id);

        return response()->json([
            'success' => true,
            'message' => 'Restore file uploaded, restore queued for execution.',
            'path' => $path,
        ]);
    }

    public function download(Request $request): BinaryFileResponse|JsonResponse
    {
        $validated = $request->validate([
            'path' => 'required|string',
        ]);

        $path = ltrim($validated['path'], '/');

        if (! str_starts_with($path, 'backups/')) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid backup path.',
            ], 422);
        }

        if (! \Storage::disk('local')->exists($path)) {
            return response()->json([
                'success' => false,
                'message' => 'Backup file not found.',
            ], 404);
        }

        return response()->download(\Storage::disk('local')->path($path), basename($path));
    }
}
