<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Services\BackupManagerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(private BackupManagerService $backupManager) {}

    public function index(): Response
    {
        return Inertia::render('SuperAdmin/Backup', [
            'settings' => $this->backupManager->getSettings(),
            'backups' => $this->backupManager->listBackups(),
        ]);
    }

    public function backup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'destination' => 'required|string|in:local,cloud',
            'cloud_disk' => 'nullable|string',
        ]);

        try {
            $backup = $this->backupManager->createBackup(
                mode: 'manual',
                destination: $validated['destination'],
                cloudDisk: $validated['cloud_disk'] ?? null,
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
            'destination' => 'required|string|in:local,cloud',
            'cloud_disk' => 'nullable|string',
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
        $request->validate([
            'backup' => 'required|file|mimes:sql,gz,zip|max:51200',
        ]);

        $file = $request->file('backup');
        $path = $file->storeAs('backups/restores', 'restore-'.time().'-'.$file->getClientOriginalName(), 'local');

        return response()->json([
            'success' => true,
            'message' => 'Restore file uploaded. Restore execution remains a manual server-side safety step.',
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
