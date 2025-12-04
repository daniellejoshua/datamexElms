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
        Schema::create('student_subject_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('section_subject_id')->constrained()->onDelete('cascade'); // Links to section_subjects table
            $table->enum('enrollment_type', ['regular', 'irregular'])->default('regular');
            $table->string('academic_year', 20); // e.g., "2023-2024"
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->enum('status', ['active', 'dropped', 'completed'])->default('active');
            $table->date('enrollment_date');
            $table->foreignId('enrolled_by')->constrained('users')->onDelete('restrict'); // Who enrolled the student
            $table->text('remarks')->nullable(); // For irregular students - reason for taking subject
            $table->timestamps();

            // Ensure a student can't be enrolled in the same subject multiple times in the same semester
            $table->unique(['student_id', 'section_subject_id', 'academic_year', 'semester'], 'unique_student_subject_enrollment');

            // Add indexes for better performance
            $table->index(['student_id', 'status']);
            $table->index(['section_subject_id', 'status']);
            $table->index(['academic_year', 'semester', 'status']);
            $table->index(['enrollment_type', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_subject_enrollments');
    }
};
