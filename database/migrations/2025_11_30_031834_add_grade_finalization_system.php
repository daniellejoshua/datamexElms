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
        // Add finalization fields to student_grades (college)
        Schema::table('student_grades', function (Blueprint $table) {
            $table->enum('status', ['draft', 'submitted', 'finalized'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('finalization_notes')->nullable();
        });
        
        // Add finalization fields to shs_student_grades (SHS)
        Schema::table('shs_student_grades', function (Blueprint $table) {
            $table->enum('status', ['draft', 'submitted', 'finalized'])->default('draft');
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('finalization_notes')->nullable();
        });
        
        // Create semester finalization tracking table
        Schema::create('semester_finalizations', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd', 'summer']);
            $table->enum('education_level', ['college', 'shs']);
            $table->string('track')->nullable(); // For SHS only
            $table->timestamp('finalized_at');
            $table->foreignId('finalized_by')->constrained('users')->onDelete('cascade');
            $table->text('notes')->nullable();
            $table->timestamps();
            
            $table->unique(['academic_year', 'semester', 'education_level', 'track'], 'semester_finalization_unique');
            $table->index(['academic_year', 'semester']);
        });
        
        // Update grade_versions for finalization tracking
        Schema::table('grade_versions', function (Blueprint $table) {
            $table->boolean('is_pre_finalization')->default(true);
            $table->index(['student_grade_id', 'is_pre_finalization']);
            $table->index(['shs_student_grade_id', 'is_pre_finalization']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropForeign(['finalized_by']);
            $table->dropColumn(['status', 'submitted_at', 'finalized_at', 'finalized_by', 'finalization_notes']);
        });
        
        Schema::table('shs_student_grades', function (Blueprint $table) {
            $table->dropForeign(['finalized_by']);
            $table->dropColumn(['status', 'submitted_at', 'finalized_at', 'finalized_by', 'finalization_notes']);
        });
        
        Schema::dropIfExists('semester_finalizations');
        
        Schema::table('grade_versions', function (Blueprint $table) {
            $table->dropIndex(['student_grade_id', 'is_pre_finalization']);
            $table->dropIndex(['shs_student_grade_id', 'is_pre_finalization']);
            $table->dropColumn('is_pre_finalization');
        });
    }
};
