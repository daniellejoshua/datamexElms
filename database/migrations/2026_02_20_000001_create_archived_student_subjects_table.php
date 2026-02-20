<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('archived_student_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('archived_student_enrollment_id')->constrained('archived_student_enrollments')->cascadeOnDelete();
            $table->foreignId('student_id')->nullable()->constrained('students')->nullOnDelete();
            $table->unsignedBigInteger('original_enrollment_id')->nullable();
            $table->unsignedBigInteger('section_subject_id')->nullable();
            $table->unsignedBigInteger('subject_id')->nullable();
            $table->string('subject_code')->nullable();
            $table->string('subject_name')->nullable();
            $table->decimal('units', 5, 2)->nullable();

            // grading periods
            $table->decimal('prelim_grade', 5, 2)->nullable();
            $table->decimal('midterm_grade', 5, 2)->nullable();
            $table->decimal('prefinal_grade', 5, 2)->nullable();
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->decimal('semester_grade', 5, 2)->nullable();

            $table->unsignedBigInteger('teacher_id')->nullable();
            $table->timestamps();

            // Use shorter index names to avoid MySQL identifier length limits
            $table->index(['student_id', 'archived_student_enrollment_id'], 'arch_subj_student_enroll_idx');
            $table->index(['subject_id'], 'arch_subj_subject_id_idx');
            $table->index(['subject_code'], 'arch_subj_subject_code_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('archived_student_subjects');
    }
};
