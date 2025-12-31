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

        $announcements = Announcement::with(['creator', 'attachments'])
            ->published()
            ->orderBy('priority', 'desc')
            ->orderBy('published_at', 'desc')
            ->get();

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
                'visibility' => 'required|in:teachers_only,all_users,students_only',
                'priority' => 'required|in:low,medium,high,urgent',
                'is_published' => 'boolean',
                'published_at' => 'nullable|date',
                'expires_at' => 'nullable|date|after:published_at',
            ]);

            $announcement = Announcement::create([
                ...$validated,
                'created_by' => Auth::id(),
                'published_at' => $validated['is_published'] ? ($validated['published_at'] ?? now()) : null,
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

        return Inertia::render('Announcements/Show', [
            'announcement' => $announcement,
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
            'visibility' => 'required|in:teachers_only,all_users,students_only',
            'priority' => 'required|in:low,medium,high,urgent',
            'is_published' => 'boolean',
            'published_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:published_at',
        ]);

        $announcement->update([
            ...$validated,
            'published_at' => $validated['is_published'] ? ($validated['published_at'] ?? now()) : null,
        ]);

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
}
