<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('announcements', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->longText('content');
            
            $table->foreignId('created_by')->constrained('users')->onDelete('cascade');
            
            // Visibility controls
            $table->enum('visibility', ['teachers_only', 'all_users', 'students_only'])->default('all_users');
            
            // Priority levels
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            
            // Publishing controls
            $table->boolean('is_published')->default(false);
            $table->timestamp('published_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            
            // Archive functionality
            $table->boolean('is_archived')->default(false);
            $table->timestamp('archived_at')->nullable();
            
            // Rich content support
            $table->json('rich_content')->nullable(); // For HTML, formatting, etc.
            
            $table->timestamps();
            
            // Indexes for announcement queries
            $table->index(['visibility', 'is_published', 'is_archived']);
            $table->index(['created_by', 'is_published']);
            $table->index(['priority', 'published_at']);
            $table->index(['expires_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('announcements');
    }
};
