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
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            
            // User information
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('user_type')->nullable(); // Backup if user is deleted
            $table->string('user_name')->nullable(); // Backup if user is deleted
            
            // Action details
            $table->string('event'); // created, updated, deleted, login, logout
            $table->string('auditable_type'); // Model class name
            $table->unsignedBigInteger('auditable_id')->nullable(); // Model ID
            
            // Change tracking
            $table->json('old_values')->nullable(); // Previous values
            $table->json('new_values')->nullable(); // New values
            $table->json('metadata')->nullable(); // Additional context
            
            // Request context
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->string('url')->nullable();
            $table->string('method', 10)->nullable(); // GET, POST, PUT, DELETE
            
            // Academic context
            $table->string('academic_year')->nullable();
            $table->enum('semester', ['1st', '2nd'])->nullable();
            
            $table->timestamps();
            
            // Indexes for performance
            $table->index(['user_id', 'created_at']);
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['event', 'created_at']);
            $table->index(['created_at']); // For cleanup jobs
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
