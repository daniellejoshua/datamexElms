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
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('section_id')->constrained()->onDelete('cascade');
            $table->date('enrollment_date');
            $table->foreignId('enrolled_by')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['active', 'dropped', 'transferred'])->default('active');
            $table->date('transfer_date')->nullable();
            $table->foreignId('transfer_to')->nullable()->constrained('sections')->onDelete('set null');
            
            // Academic period for this enrollment
            $table->string('academic_year'); // e.g., "2024-2025"
            $table->enum('semester', ['1st', '2nd', 'summer'])->default('1st');
            
            $table->timestamps();
            
            // Strategic indexes for common queries
            $table->index(['student_id', 'status']);
            $table->index(['section_id', 'status']);
            $table->index(['academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
