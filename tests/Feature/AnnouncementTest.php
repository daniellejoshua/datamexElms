<?php

use App\Models\Announcement;
use App\Models\AnnouncementAttachment;
use App\Models\User;
use Illuminate\Http\UploadedFile;

// uses(RefreshDatabase::class); // Removed to prevent clearing user data

test('head teacher can create announcement with images', function () {
    $headTeacher = User::factory()->create(['role' => 'head_teacher']);

    $response = $this->actingAs($headTeacher)
        ->post(route('announcements.store'), [
            'title' => 'Test Announcement',
            'content' => 'Test content',
            'visibility' => 'all_users',
            'priority' => 'medium',
            'is_published' => true,
            'images' => [
                UploadedFile::fake()->image('test-image.jpg', 1000, 1000)->size(1000),
            ],
            'image_hashes' => ['test-hash-123'],
            'image_names' => ['test-image.jpg'],
        ]);

    $response->assertStatus(200)
        ->assertJson(['success' => true, 'message' => 'Announcement created successfully.']);

    $this->assertDatabaseHas('announcements', [
        'title' => 'Test Announcement',
        'content' => 'Test content',
        'created_by' => $headTeacher->id,
    ]);

    $announcement = Announcement::where('title', 'Test Announcement')->first();
    $this->assertDatabaseHas('announcement_attachments', [
        'announcement_id' => $announcement->id,
        'file_hash' => 'test-hash-123',
        'original_name' => 'test-image.jpg',
    ]);
});

test('duplicate images are referenced instead of uploaded again', function () {
    $headTeacher = User::factory()->create(['role' => 'head_teacher']);

    // Create first announcement with an image
    $this->actingAs($headTeacher)
        ->post(route('announcements.store'), [
            'title' => 'First Announcement',
            'content' => 'First content',
            'visibility' => 'all_users',
            'priority' => 'medium',
            'is_published' => true,
            'images' => [
                UploadedFile::fake()->image('duplicate.jpg', 500, 500)->size(500),
            ],
            'image_hashes' => ['duplicate-hash-456'],
            'image_names' => ['duplicate.jpg'],
        ]);

    // Create second announcement with the same image hash
    $this->actingAs($headTeacher)
        ->post(route('announcements.store'), [
            'title' => 'Second Announcement',
            'content' => 'Second content',
            'visibility' => 'all_users',
            'priority' => 'medium',
            'is_published' => true,
            'images' => [
                UploadedFile::fake()->image('duplicate.jpg', 500, 500)->size(500),
            ],
            'image_hashes' => ['duplicate-hash-456'],
            'image_names' => ['duplicate.jpg'],
        ]);

    // Should have 2 announcements but only 1 unique attachment file
    $this->assertDatabaseCount('announcements', 2);
    $this->assertDatabaseCount('announcement_attachments', 2);

    $attachments = AnnouncementAttachment::where('file_hash', 'duplicate-hash-456')->get();
    $this->assertCount(2, $attachments);

    // One should be original, one should be duplicate
    $original = $attachments->where('is_duplicate', false)->first();
    $duplicate = $attachments->where('is_duplicate', true)->first();

    $this->assertNotNull($original);
    $this->assertNotNull($duplicate);
    $this->assertEquals($original->file_path, $duplicate->file_path);
});
