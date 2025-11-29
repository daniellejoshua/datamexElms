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
        Schema::create('material_access_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('material_id')->constrained('course_materials')->onDelete('cascade');
            
            $table->timestamp('accessed_at')->default(now());
            $table->boolean('download_completed')->default(false);
            $table->string('ip_address')->nullable();
            $table->text('user_agent')->nullable();
            
            $table->timestamps();
            
            // Indexes for access tracking
            $table->index(['student_id', 'accessed_at']);
            $table->index(['material_id', 'accessed_at']);
            $table->index(['accessed_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_access_logs');
    }
};
