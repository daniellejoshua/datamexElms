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
        Schema::create('student_credit_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('previous_program_id')->nullable()->constrained('programs')->onDelete('set null');
            $table->foreignId('new_program_id')->constrained('programs')->onDelete('cascade');
            $table->foreignId('previous_curriculum_id')->nullable()->constrained('curriculum')->onDelete('set null');
            $table->foreignId('new_curriculum_id')->constrained('curriculum')->onDelete('cascade');

            // Credit details
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('set null');
            $table->string('subject_code');
            $table->string('subject_name');
            $table->string('original_subject_code')->nullable(); // For transferees from other schools
            $table->string('original_subject_name')->nullable();
            $table->decimal('units', 5, 2);
            $table->integer('year_level');
            $table->string('semester');

            // Credit status
            $table->enum('transfer_type', ['shiftee', 'transferee']); // Shiftee = internal, Transferee = external
            $table->enum('credit_status', ['credited', 'for_catchup', 'pending', 'rejected'])->default('pending');
            $table->decimal('fee_adjustment', 10, 2)->default(0); // -300 for credited, +300 for catchup
            $table->text('notes')->nullable();
            $table->string('previous_school')->nullable(); // For transferees

            // Approval tracking
            $table->foreignId('approved_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamp('approved_at')->nullable();

            $table->timestamps();

            // Indexes
            $table->index(['student_id', 'transfer_type']);
            $table->index(['credit_status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_credit_transfers');
    }
};
