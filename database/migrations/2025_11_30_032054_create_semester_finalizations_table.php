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
        
        // Add is_pre_finalization to grade_versions if not exists
        if (!Schema::hasColumn('grade_versions', 'is_pre_finalization')) {
            Schema::table('grade_versions', function (Blueprint $table) {
                $table->boolean('is_pre_finalization')->default(true);
                $table->index(['student_grade_id', 'is_pre_finalization']);
                $table->index(['shs_student_grade_id', 'is_pre_finalization']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('semester_finalizations');
        
        if (Schema::hasColumn('grade_versions', 'is_pre_finalization')) {
            Schema::table('grade_versions', function (Blueprint $table) {
                $table->dropIndex(['student_grade_id', 'is_pre_finalization']);
                $table->dropIndex(['shs_student_grade_id', 'is_pre_finalization']);
                $table->dropColumn('is_pre_finalization');
            });
        }
    }
};
