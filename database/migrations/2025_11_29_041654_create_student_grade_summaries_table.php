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
        Schema::create('student_grade_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            
            // Academic period
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->string('year_level');
            
            // Semester performance metrics
            $table->integer('total_units_enrolled')->default(0);
            $table->integer('total_units_completed')->default(0);
            $table->integer('total_units_passed')->default(0);
            $table->integer('total_units_failed')->default(0);
            $table->integer('total_subjects_enrolled')->default(0);
            $table->integer('total_subjects_completed')->default(0);
            $table->integer('total_subjects_passed')->default(0);
            $table->integer('total_subjects_failed')->default(0);
            
            // GPA calculations  
            $table->decimal('semester_gpa', 4, 2)->nullable(); // GPA for this semester
            $table->decimal('cumulative_gpa', 4, 2)->nullable(); // Overall GPA up to this point
            $table->decimal('total_quality_points', 8, 2)->default(0);
            $table->decimal('total_grade_points', 8, 2)->default(0);
            
            // Academic standing
            $table->enum('academic_standing', ['dean_list', 'good_standing', 'probation', 'dropped'])->nullable();
            $table->boolean('honors_eligibility')->default(false);
            
            // Completion tracking
            $table->boolean('semester_completed')->default(false);
            $table->date('semester_completion_date')->nullable();
            
            $table->timestamps();
            
            // Indexes for efficient querying
            $table->index(['student_id', 'academic_year', 'semester'], 'idx_grade_summary_period');
            $table->index(['student_id', 'semester_completed'], 'idx_student_completion_status');
            $table->index(['academic_standing'], 'idx_academic_standing');
            $table->unique(['student_id', 'academic_year', 'semester'], 'unq_student_semester'); // One record per semester
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_grade_summaries');
    }
};
