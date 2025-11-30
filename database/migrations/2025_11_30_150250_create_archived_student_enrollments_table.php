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
        Schema::create('archived_student_enrollments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('archived_section_id')->constrained('archived_sections');
            $table->foreignId('student_id')->constrained('students');
            $table->string('original_enrollment_id'); // Reference to original enrollment

            // Enrollment details snapshot
            $table->string('academic_year');
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->date('enrolled_date');
            $table->date('completion_date')->nullable();
            $table->enum('final_status', ['completed', 'dropped', 'failed', 'incomplete']);

            // Final grades snapshot
            $table->json('final_grades'); // Store complete grade breakdown
            $table->decimal('final_semester_grade', 5, 2)->nullable();
            $table->string('letter_grade', 5)->nullable();

            // Student information snapshot
            $table->json('student_data'); // Student details at time of completion

            $table->timestamps();

            // Indexes
            $table->index(['academic_year', 'semester']);
            $table->index('student_id');
            $table->index('final_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archived_student_enrollments');
    }
};
