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
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            // Display preferences
            $table->boolean('show_archived_announcements')->default(false);
            $table->enum('default_announcement_priority', ['low', 'medium', 'high', 'urgent'])->default('medium');

            // Theme and layout
            $table->json('theme_preferences')->nullable(); // For dark/light mode, colors, etc.
            $table->json('notification_preferences')->nullable(); // For in-app notification settings

            $table->timestamps();

            // One preference record per user
            $table->unique(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};
