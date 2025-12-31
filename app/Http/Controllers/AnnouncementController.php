<?php

namespace App\Http\Controllers;

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\AnnouncementReadStatus;
use CloudinaryLabs\CloudinaryLaravel\Facades\Cloudinary;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AnnouncementController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Automatically process scheduled and expired announcements on every page load
        $this->processScheduledAnnouncements();
        $this->processExpiredAnnouncements();

        // Base query for announcements
        $query = Announcement::with(['creator', 'attachments'])
            ->visibleTo($user)
            ->where('is_archived', false);

        // Add conditions based on user role and announcement status
        if ($user->role === 'head_teacher') {
            // Head teachers see all announcements (published, scheduled, expired)
            $query->where(function ($q) {
                $q->where('is_published', true)
                    ->orWhere(function ($sq) {
                        $sq->where('is_published', false)
                            ->whereNotNull('scheduled_at')
                            ->where('scheduled_at', '>', now());
                    })
                    ->orWhere(function ($sq) {
                        $sq->where('is_published', true)
                            ->whereNotNull('expires_at')
                            ->where('expires_at', '<=', now());
                    });
            });
        } else {
            // Regular users only see published announcements
            $query->where('is_published', true)
                ->where(function ($q) {
                    $q->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                });
        }

        // Order by priority (custom order) and then by date
        $query->orderByRaw("CASE
            WHEN priority = 'urgent' THEN 1
            WHEN priority = 'high' THEN 2
            WHEN priority = 'medium' THEN 3
            WHEN priority = 'low' THEN 4
            ELSE 5 END")
            ->orderBy('published_at', 'desc')
            ->orderBy('scheduled_at', 'desc');

        // Paginate the results
        $announcements = $query->paginate(6);

        // Add flags for scheduled and expired announcements
        foreach ($announcements as $announcement) {
            if (! $announcement->is_published && $announcement->scheduled_at && $announcement->scheduled_at > now()) {
                $announcement->is_scheduled = true;
            }

            if ($announcement->is_published && $announcement->expires_at && $announcement->expires_at <= now()) {
                $announcement->is_expired = true;
            }
        }

        // Mark read status for each announcement
        foreach ($announcements as $announcement) {
            $readStatus = AnnouncementReadStatus::firstOrCreate(
                ['announcement_id' => $announcement->id, 'user_id' => $user->id],
                ['is_read' => false]
            );
            $announcement->is_read = $readStatus->is_read;
        }

        // Return JSON for AJAX requests (not Inertia requests)
        if (request()->expectsJson() && ! request()->header('X-Inertia')) {
            return response()->json([
                'announcements' => $announcements,
            ]);
        }

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    public function create()
    {
        $this->authorize('create', Announcement::class);

        return Inertia::render('Announcements/Create');
    }

    public function store(Request $request)
    {
        try {
            // Debug: Log all request data
            file_put_contents(storage_path('logs/debug.log'), "=== NEW REQUEST ===\n", FILE_APPEND);
            file_put_contents(storage_path('logs/debug.log'), 'All data: '.json_encode($request->all())."\n", FILE_APPEND);
            file_put_contents(storage_path('logs/debug.log'), 'All files: '.json_encode($request->allFiles())."\n", FILE_APPEND);
            file_put_contents(storage_path('logs/debug.log'), 'Has images: '.($request->hasFile('images') ? 'true' : 'false')."\n", FILE_APPEND);
            file_put_contents(storage_path('logs/debug.log'), 'Images count: '.(is_array($request->file('images')) ? count($request->file('images')) : 'not array')."\n", FILE_APPEND);
            file_put_contents(storage_path('logs/debug.log'), 'Content-Type: '.$request->header('Content-Type')."\n", FILE_APPEND);

            $this->authorize('create', Announcement::class);

            $validated = $request->validate([
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'visibility' => 'required|in:teachers_only,all_users,students_only,admins_only,registrars_only,employees_only',
                'priority' => 'required|in:low,medium,high,urgent',
                'is_published' => 'boolean',
                'published_at' => $request->input('is_published') ? 'nullable|date' : 'required|date',
                'expires_at' => 'nullable|date',
            ]);

            // Additional validation: expires_at must be after published_at if both are provided
            if (($validated['published_at'] ?? null) && ($validated['expires_at'] ?? null)) {
                // Parse dates as being in Asia/Manila timezone (user's timezone)
                // Handle datetime-local format (YYYY-MM-DDTHH:MM) by adding seconds if missing
                $publishedAtStr = strlen(($validated['published_at'] ?? '')) == 16 ? ($validated['published_at'] ?? '').':00' : ($validated['published_at'] ?? '');
                $expiresAtStr = strlen(($validated['expires_at'] ?? '')) == 16 ? ($validated['expires_at'] ?? '').':00' : ($validated['expires_at'] ?? '');

                $publishedAt = \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila');
                $expiresAt = \Carbon\Carbon::parse($expiresAtStr, 'Asia/Manila');

                if ($expiresAt->lte($publishedAt)) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'expires_at' => 'The expiration date must be after the publication date.',
                    ]);
                }
            }

            // Handle datetime-local format (YYYY-MM-DDTHH:MM) by adding seconds if missing
            $publishedAtStr = ($validated['published_at'] ?? null) ? (strlen(($validated['published_at'] ?? '')) == 16 ? ($validated['published_at'] ?? '').':00' : ($validated['published_at'] ?? '')) : null;
            $expiresAtStr = ($validated['expires_at'] ?? null) ? (strlen(($validated['expires_at'] ?? '')) == 16 ? ($validated['expires_at'] ?? '').':00' : ($validated['expires_at'] ?? '')) : null;

            $announcement = Announcement::create([
                ...$validated,
                'created_by' => Auth::id(),
                'published_at' => $validated['is_published'] ? now() : ($publishedAtStr ? \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila')->utc() : null),
                'scheduled_at' => ! $validated['is_published'] ? ($publishedAtStr ? \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila')->utc() : null) : null,
                'expires_at' => $expiresAtStr ? \Carbon\Carbon::parse($expiresAtStr, 'Asia/Manila')->utc() : null,
            ]);

            // Handle image attachments with duplicate checking
            if ($request->hasFile('images')) {
                $imageFiles = $request->file('images');
                $imageHashes = $request->input('image_hashes', []);
                $imageNames = $request->input('image_names', []);

                file_put_contents(storage_path('logs/debug.log'), 'Found images: '.count($imageFiles)."\n", FILE_APPEND);
                file_put_contents(storage_path('logs/debug.log'), 'Image hashes: '.json_encode($imageHashes)."\n", FILE_APPEND);
                file_put_contents(storage_path('logs/debug.log'), 'Image names: '.json_encode($imageNames)."\n", FILE_APPEND);

                foreach ($imageFiles as $index => $file) {
                    if (! $file) {
                        file_put_contents(storage_path('logs/debug.log'), "File not found for index {$index}\n", FILE_APPEND);

                        continue;
                    }

                    $hash = $imageHashes[$index] ?? '';
                    $originalName = $imageNames[$index] ?? $file->getClientOriginalName();

                    file_put_contents(storage_path('logs/debug.log'), "Processing file {$index}: {$originalName} ({$file->getSize()} bytes)\n", FILE_APPEND);

                    // Check if image with same hash already exists
                    $existingAttachment = AnnouncementAttachment::where('file_hash', $hash)->first();

                    if ($existingAttachment) {
                        // Reference existing image instead of uploading duplicate
                        AnnouncementAttachment::create([
                            'announcement_id' => $announcement->id,
                            'file_name' => $existingAttachment->file_name,
                            'file_path' => $existingAttachment->file_path,
                            'file_type' => $existingAttachment->file_type,
                            'file_size' => $existingAttachment->file_size,
                            'original_name' => $originalName,
                            'file_hash' => $hash,
                            'is_duplicate' => true,
                            'cloudinary_public_id' => $existingAttachment->cloudinary_public_id,
                            'cloudinary_url' => $existingAttachment->cloudinary_url,
                            'image_format' => $existingAttachment->image_format,
                            'image_width' => $existingAttachment->image_width,
                            'image_height' => $existingAttachment->image_height,
                        ]);
                    } else {
                        // Upload new image to Cloudinary
                        try {
                            // Debug: Check file before upload
                            $realPath = $file->getRealPath();
                            file_put_contents(storage_path('logs/debug.log'), 'File real path: '.$realPath."\n", FILE_APPEND);

                            if (! file_exists($realPath)) {
                                throw new \Exception('File does not exist at path: '.$realPath);
                            }

                            // Use file path directly for Cloudinary upload
                            $uploadResult = Cloudinary::uploadApi()->upload($realPath, [
                                'folder' => 'DatamexELMS/Datamex_Announcements',
                                'resource_type' => 'image',
                                'public_id' => uniqid('announcement_'),
                            ]);

                            file_put_contents(storage_path('logs/debug.log'), 'Cloudinary upload result: '.json_encode($uploadResult)."\n", FILE_APPEND);

                            if (! $uploadResult || ! isset($uploadResult['secure_url'])) {
                                throw new \Exception('Cloudinary upload failed - no secure_url in response: '.json_encode($uploadResult));
                            }

                            $attachment = AnnouncementAttachment::create([
                                'announcement_id' => $announcement->id,
                                'file_name' => $uploadResult['public_id'],
                                'file_path' => $uploadResult['secure_url'],
                                'file_type' => $file->getMimeType(),
                                'file_size' => $file->getSize(),
                                'original_name' => $originalName,
                                'file_hash' => $hash,
                                'is_duplicate' => false,
                                'cloudinary_public_id' => $uploadResult['public_id'],
                                'cloudinary_url' => $uploadResult['secure_url'],
                                'image_format' => $uploadResult['format'] ?? null,
                                'image_width' => $uploadResult['width'] ?? null,
                                'image_height' => $uploadResult['height'] ?? null,
                            ]);
                        } catch (\Exception $e) {
                            file_put_contents(storage_path('logs/debug.log'), 'Error during Cloudinary upload: '.$e->getMessage()."\n", FILE_APPEND);
                            file_put_contents(storage_path('logs/debug.log'), 'Stack trace: '.$e->getTraceAsString()."\n", FILE_APPEND);
                            throw $e;
                        }
                    }
                }
            }

            return response()->json(['success' => true, 'message' => 'Announcement created successfully.']);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show(Announcement $announcement)
    {
        $this->authorize('view', $announcement);

        $announcement->load(['creator', 'attachments']);

        // Mark as read
        AnnouncementReadStatus::updateOrCreate(
            ['announcement_id' => $announcement->id, 'user_id' => Auth::id()],
            ['is_read' => true, 'read_at' => now()]
        );

        // Get recent announcements (excluding current one)
        $recentAnnouncements = Announcement::with(['creator', 'attachments'])
            ->published()
            ->where('id', '!=', $announcement->id)
            ->orderBy('priority', 'desc')
            ->orderBy('published_at', 'desc')
            ->take(3)
            ->get();

        // Mark read status for recent announcements
        foreach ($recentAnnouncements as $recentAnnouncement) {
            $readStatus = AnnouncementReadStatus::firstOrCreate(
                ['announcement_id' => $recentAnnouncement->id, 'user_id' => Auth::id()],
                ['is_read' => false]
            );
            $recentAnnouncement->is_read = $readStatus->is_read;
        }

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement,
            'recentAnnouncements' => $recentAnnouncements,
            'readStats' => [
                'read_count' => $announcement->read_count,
                'total_count' => $announcement->total_read_status_count,
            ],
        ]);
    }

    public function edit(Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        $announcement->load('attachments');

        return Inertia::render('Announcements/Edit', [
            'announcement' => $announcement,
        ]);
    }

    public function update(Request $request, Announcement $announcement)
    {
        $this->authorize('update', $announcement);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'visibility' => 'required|in:teachers_only,all_users,students_only,admins_only,registrars_only,employees_only',
            'priority' => 'required|in:low,medium,high,urgent',
            'is_published' => 'boolean',
            'published_at' => $request->input('is_published') ? 'nullable|date' : 'required|date',
            'expires_at' => 'nullable|date',
        ]);

        // Additional validation: expires_at must be after published_at if both are provided
        if (($validated['published_at'] ?? null) && ($validated['expires_at'] ?? null)) {
            // Parse dates as being in Asia/Manila timezone (user's timezone)
            // Handle datetime-local format (YYYY-MM-DDTHH:MM) by adding seconds if missing
            $publishedAtStr = strlen(($validated['published_at'] ?? '')) == 16 ? ($validated['published_at'] ?? '').':00' : ($validated['published_at'] ?? '');
            $expiresAtStr = strlen(($validated['expires_at'] ?? '')) == 16 ? ($validated['expires_at'] ?? '').':00' : ($validated['expires_at'] ?? '');

            $publishedAt = \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila');
            $expiresAt = \Carbon\Carbon::parse($expiresAtStr, 'Asia/Manila');

            if ($expiresAt->lte($publishedAt)) {
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'expires_at' => 'The expiration date must be after the publication date.',
                ]);
            }
        }

        // Handle datetime-local format (YYYY-MM-DDTHH:MM) by adding seconds if missing
        $publishedAtStr = ($validated['published_at'] ?? null) ? (strlen(($validated['published_at'] ?? '')) == 16 ? ($validated['published_at'] ?? '').':00' : ($validated['published_at'] ?? '')) : null;
        $expiresAtStr = ($validated['expires_at'] ?? null) ? (strlen(($validated['expires_at'] ?? '')) == 16 ? ($validated['expires_at'] ?? '').':00' : ($validated['expires_at'] ?? '')) : null;

        $announcement->update([
            ...$validated,
            'published_at' => $validated['is_published'] ? now() : ($publishedAtStr ? \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila')->utc() : ($validated['published_at'] ?? null)),
            'scheduled_at' => ! $validated['is_published'] ? ($publishedAtStr ? \Carbon\Carbon::parse($publishedAtStr, 'Asia/Manila')->utc() : null) : null,
            'expires_at' => $expiresAtStr ? \Carbon\Carbon::parse($expiresAtStr, 'Asia/Manila')->utc() : null,
        ]);

        // Handle existing images - keep only those specified
        $existingImageIds = $request->input('existing_images', []);
        if (! empty($existingImageIds)) {
            // Remove attachments that are not in the existing_images array
            $announcement->attachments()->whereNotIn('id', $existingImageIds)->delete();
        } else {
            // If no existing images specified, remove all attachments
            $announcement->attachments()->delete();
        }

        // Handle image attachments with duplicate checking
        if ($request->hasFile('images')) {
            $imageFiles = $request->file('images');
            $imageHashes = $request->input('image_hashes', []);
            $imageNames = $request->input('image_names', []);

            file_put_contents(storage_path('logs/debug.log'), 'Found images in update: '.count($imageFiles)."\n", FILE_APPEND);

            foreach ($imageFiles as $index => $file) {
                if (! $file) {
                    file_put_contents(storage_path('logs/debug.log'), "File not found for index {$index} in update\n", FILE_APPEND);

                    continue;
                }

                $hash = $imageHashes[$index] ?? '';
                $originalName = $imageNames[$index] ?? $file->getClientOriginalName();

                file_put_contents(storage_path('logs/debug.log'), "Processing file {$index} in update: {$originalName} ({$file->getSize()} bytes)\n", FILE_APPEND);

                // Check if image with same hash already exists
                $existingAttachment = AnnouncementAttachment::where('file_hash', $hash)->first();

                if ($existingAttachment) {
                    // Reference existing image instead of uploading duplicate
                    AnnouncementAttachment::create([
                        'announcement_id' => $announcement->id,
                        'file_name' => $existingAttachment->file_name,
                        'file_path' => $existingAttachment->file_path,
                        'file_type' => $existingAttachment->file_type,
                        'file_size' => $existingAttachment->file_size,
                        'original_name' => $originalName,
                        'file_hash' => $hash,
                        'is_duplicate' => true,
                        'cloudinary_public_id' => $existingAttachment->cloudinary_public_id,
                        'cloudinary_url' => $existingAttachment->cloudinary_url,
                        'image_format' => $existingAttachment->image_format,
                        'image_width' => $existingAttachment->image_width,
                        'image_height' => $existingAttachment->image_height,
                    ]);
                } else {
                    // Upload new image to Cloudinary
                    try {
                        file_put_contents(storage_path('logs/debug.log'), "About to read file contents for {$originalName}\n", FILE_APPEND);

                        // Use file contents instead of path for more reliable upload
                        $fileContents = file_get_contents($file->getRealPath());
                        if ($fileContents === false) {
                            throw new \Exception('Could not read file contents: '.$file->getRealPath());
                        }

                        file_put_contents(storage_path('logs/debug.log'), 'File contents read successfully, size: '.strlen($fileContents)." bytes\n", FILE_APPEND);

                        $uploadResult = Cloudinary::uploadApi()->upload($fileContents, [
                            'folder' => 'DatamexELMS/Datamex_Announcements',
                            'resource_type' => 'image',
                            'public_id' => uniqid('announcement_'),
                        ]);

                        file_put_contents(storage_path('logs/debug.log'), 'Cloudinary upload result in update: '.json_encode($uploadResult)."\n", FILE_APPEND);

                        if (! $uploadResult || ! isset($uploadResult['secure_url'])) {
                            throw new \Exception('Cloudinary upload failed - no secure_url in response: '.json_encode($uploadResult));
                        }

                        $attachment = AnnouncementAttachment::create([
                            'announcement_id' => $announcement->id,
                            'file_name' => $uploadResult['public_id'],
                            'file_path' => $uploadResult['secure_url'],
                            'file_type' => $file->getMimeType(),
                            'file_size' => $file->getSize(),
                            'original_name' => $originalName,
                            'file_hash' => $hash,
                            'is_duplicate' => false,
                            'cloudinary_public_id' => $uploadResult['public_id'],
                            'cloudinary_url' => $uploadResult['secure_url'],
                            'image_format' => $uploadResult['format'] ?? null,
                            'image_width' => $uploadResult['width'] ?? null,
                            'image_height' => $uploadResult['height'] ?? null,
                        ]);
                    } catch (\Exception $e) {
                        throw $e;
                    }
                }
            }
        }

        // Reset read status for all users when announcement is updated
        // This ensures users need to read the updated announcement again
        AnnouncementReadStatus::where('announcement_id', $announcement->id)
            ->update(['is_read' => false, 'read_at' => null]);

        return response()->json(['success' => true, 'message' => 'Announcement updated successfully.']);
    }

    public function destroy(Announcement $announcement)
    {
        $this->authorize('delete', $announcement);

        // Delete attachments from Cloudinary
        foreach ($announcement->attachments as $attachment) {
            if ($attachment->cloudinary_public_id) {
                Cloudinary::destroy($attachment->cloudinary_public_id);
            }
        }

        $announcement->delete();

        return redirect()->route('announcements.index')->with('success', 'Announcement deleted successfully.');
    }

    public function markAsRead(Announcement $announcement)
    {
        $this->authorize('view', $announcement);

        AnnouncementReadStatus::updateOrCreate(
            ['announcement_id' => $announcement->id, 'user_id' => Auth::id()],
            ['is_read' => true, 'read_at' => now()]
        );

        return response()->json(['success' => true]);
    }

    /**
     * Automatically publish scheduled announcements that are due
     */
    private function processScheduledAnnouncements()
    {
        $scheduledToPublish = Announcement::where('is_published', false)
            ->where('is_archived', false)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->get();

        foreach ($scheduledToPublish as $announcement) {
            $announcement->update([
                'is_published' => true,
                'published_at' => now(),
            ]);

            // Check if this announcement is already expired
            if ($announcement->expires_at && $announcement->expires_at <= now()) {
                $announcement->update(['is_archived' => true, 'archived_at' => now()]);
            }
        }
    }

    /**
     * Automatically archive expired published announcements
     */
    private function processExpiredAnnouncements()
    {
        $expiredToArchive = Announcement::where('is_published', true)
            ->where('is_archived', false)
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expiredToArchive as $announcement) {
            $announcement->update(['is_archived' => true, 'archived_at' => now()]);
        }
    }
}
