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
        Schema::create('grade_versions', function (Blueprint $table) {
            $table->id();
            
            // Link to original grade record
            $table->foreignId('student_grade_id')->nullable()->constrained('student_grades')->onDelete('cascade');
            $table->foreignId('shs_student_grade_id')->nullable()->constrained('shs_student_grades')->onDelete('cascade');
            
            // Version information
            $table->integer('version_number')->default(1);
            $table->enum('grade_type', ['college', 'shs']);
            
            // Teacher information
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');
            $table->string('teacher_name'); // Backup for reporting
            
            // College grade snapshot
            $table->decimal('prelim_grade', 5, 2)->nullable();
            $table->decimal('midterm_grade', 5, 2)->nullable();
            $table->decimal('prefinals_grade', 5, 2)->nullable();
            $table->decimal('finals_grade', 5, 2)->nullable();
            $table->decimal('semester_grade', 5, 2)->nullable();
            
            // SHS grade snapshot
            $table->decimal('first_quarter_grade', 5, 2)->nullable();
            $table->decimal('second_quarter_grade', 5, 2)->nullable();
            $table->decimal('third_quarter_grade', 5, 2)->nullable();
            $table->decimal('fourth_quarter_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            
            // Change reason and validation
            $table->text('change_reason')->nullable();
            $table->text('teacher_remarks')->nullable();
            $table->enum('change_type', ['initial', 'correction', 'recalculation', 'administrative']);
            $table->boolean('requires_approval')->default(false);
            $table->boolean('is_approved')->default(true);
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();
            
            // Academic context
            $table->string('academic_year');
            $table->enum('semester', ['1st', '2nd']);
            
            $table->timestamps();
            
            // Indexes
            $table->index(['student_grade_id', 'version_number']);
            $table->index(['shs_student_grade_id', 'version_number']);
            $table->index(['teacher_id', 'created_at']);
            $table->index(['academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grade_versions');
    }
};
