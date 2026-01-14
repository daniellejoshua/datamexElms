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
        Schema::create('student_subject_credits', function (Blueprint $table) {
            $table->id();

            // Student and subject relationship
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('curriculum_subject_id')->constrained('curriculum_subjects')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();

            // Subject details (denormalized for historical reference)
            $table->string('subject_code');
            $table->string('subject_name');
            $table->integer('units');
            $table->integer('year_level');
            $table->string('semester');

            // Credit source and status
            $table->enum('credit_type', ['regular', 'transfer', 'equivalency'])->default('regular');
            // regular = passed the subject normally
            // transfer = credited from previous program (shiftee/transferee)
            // equivalency = credited via equivalency exam or special approval

            $table->enum('credit_status', ['credited', 'in_progress', 'failed', 'pending'])->default('in_progress');
            // credited = successfully completed and credited
            // in_progress = currently enrolled/taking the subject
            // failed = failed the subject (needs retake)
            // pending = awaiting verification (for transfers)

            // Grade information
            $table->decimal('final_grade', 5, 2)->nullable();
            $table->timestamp('credited_at')->nullable(); // When the credit was awarded

            // Source tracking
            $table->foreignId('student_grade_id')->nullable()->constrained('student_grades')->nullOnDelete();
            $table->foreignId('student_credit_transfer_id')->nullable()->constrained('student_credit_transfers')->nullOnDelete();

            // Academic period
            $table->string('academic_year')->nullable();
            $table->string('semester_taken')->nullable();

            // Approval tracking (for transfers/equivalencies)
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();

            // Indexes for performance
            $table->index(['student_id', 'credit_status']);
            $table->index(['student_id', 'curriculum_subject_id']);
            $table->unique(['student_id', 'curriculum_subject_id']); // One credit record per curriculum subject per student
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_subject_credits');
    }
};
