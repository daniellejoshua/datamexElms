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
        Schema::create('shs_student_grades', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_enrollment_id')->constrained('student_enrollments')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            
            // SHS Quarterly Grading System
            $table->decimal('first_quarter_grade', 5, 2)->nullable();
            $table->timestamp('first_quarter_submitted_at')->nullable();
            
            $table->decimal('second_quarter_grade', 5, 2)->nullable();
            $table->timestamp('second_quarter_submitted_at')->nullable();
            
            $table->decimal('third_quarter_grade', 5, 2)->nullable();
            $table->timestamp('third_quarter_submitted_at')->nullable();
            
            $table->decimal('fourth_quarter_grade', 5, 2)->nullable();
            $table->timestamp('fourth_quarter_submitted_at')->nullable();
            
            // Final grade calculation (average of 4 quarters)
            $table->decimal('final_grade', 5, 2)->nullable();
            
            // SHS specific status
            $table->enum('completion_status', ['passed', 'failed', 'incomplete', 'pending'])->default('pending');
            $table->text('teacher_remarks')->nullable();
            
            $table->timestamps();
            
            $table->index(['student_enrollment_id', 'completion_status']);
            $table->unique(['student_enrollment_id', 'teacher_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shs_student_grades');
    }
};
