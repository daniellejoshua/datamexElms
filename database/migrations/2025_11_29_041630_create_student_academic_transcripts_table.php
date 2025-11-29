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
        Schema::create('student_academic_transcripts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            
            // Academic period information  
            $table->string('academic_year'); // e.g., "2023-2024", "2024-2025"
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->string('year_level'); // e.g., "1st Year", "2nd Year", etc.
            
            // Course/Subject information (denormalized for historical data)
            $table->string('course_code'); // Store course code for historical reference
            $table->string('subject_name'); // Store subject name for historical reference
            $table->integer('units'); // Course units/credits
            
            // Enrollment and section details
            $table->foreignId('student_enrollment_id')->constrained()->onDelete('cascade');
            $table->string('section_name'); // Denormalized for historical reference
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->string('teacher_name'); // Denormalized for historical reference
            
            // Grade components (copied from student_grades for historical preservation)
            $table->decimal('prelim_grade', 5, 2)->nullable();
            $table->decimal('midterm_grade', 5, 2)->nullable();
            $table->decimal('prefinal_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->decimal('semester_grade', 5, 2)->nullable();
            
            // Academic status and completion
            $table->enum('completion_status', ['completed', 'incomplete', 'dropped', 'failed', 'transferred']);
            $table->enum('grade_status', ['passed', 'failed', 'inc', 'drp'])->nullable();
            $table->integer('attempt_number')->default(1); // For repeated subjects
            
            // GPA calculation
            $table->decimal('grade_points', 5, 2)->nullable(); // Grade points earned
            $table->decimal('quality_points', 5, 2)->nullable(); // Quality points (grade_points * units)
            
            // Timestamps and audit
            $table->date('enrollment_date');
            $table->date('completion_date')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();
            
            // Indexes for efficient querying
            $table->index(['student_id', 'academic_year', 'semester'], 'idx_student_academic_period');
            $table->index(['student_id', 'course_code'], 'idx_student_course');
            $table->index(['student_id', 'completion_status'], 'idx_student_completion');
            $table->index(['academic_year', 'semester'], 'idx_academic_period');
            $table->index(['course_code', 'academic_year'], 'idx_course_year');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_academic_transcripts');
    }
};
