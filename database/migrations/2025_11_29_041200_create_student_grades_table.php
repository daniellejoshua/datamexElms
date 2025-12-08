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
        Schema::create('student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');

            // The 5 grade components
            $table->decimal('prelim_grade', 5, 2)->nullable()->comment('Grade out of 100');
            $table->decimal('midterm_grade', 5, 2)->nullable()->comment('Grade out of 100');
            $table->decimal('prefinal_grade', 5, 2)->nullable()->comment('Grade out of 100');
            $table->decimal('final_grade', 5, 2)->nullable()->comment('Grade out of 100');
            $table->decimal('semester_grade', 5, 2)->nullable()->comment('Average of all terms');

            // Grade submission tracking
            $table->timestamp('prelim_submitted_at')->nullable();
            $table->timestamp('midterm_submitted_at')->nullable();
            $table->timestamp('prefinal_submitted_at')->nullable();
            $table->timestamp('final_submitted_at')->nullable();
            $table->timestamp('semester_grade_computed_at')->nullable();

            // Overall status and remarks
            $table->enum('overall_status', ['pending', 'passed', 'failed', 'incomplete'])->default('pending');
            $table->text('teacher_remarks')->nullable();

            $table->timestamps();

            // Indexes for efficient querying
            $table->index(['student_enrollment_id']);
            $table->index(['teacher_id', 'created_at']);
            $table->index(['overall_status']);

            // Ensure one grade record per enrollment
            $table->unique(['student_enrollment_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grades');
    }
};
