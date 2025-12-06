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
        Schema::create('student_balances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->foreignId('program_id')->nullable()->constrained()->onDelete('set null');
            $table->string('course_code')->nullable(); // For specific course balances
            $table->string('course_name')->nullable();
            $table->enum('education_level', ['college', 'shs']);
            $table->string('academic_year');
            $table->string('semester');
            $table->decimal('total_fee', 10, 2);
            $table->decimal('paid_amount', 10, 2)->default(0);
            $table->decimal('balance', 10, 2);
            $table->enum('status', ['active', 'cleared', 'hold'])->default('active');
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null'); // Registrar who set the balance
            $table->timestamps();

            $table->unique(['student_id', 'course_code', 'academic_year', 'semester'], 'student_course_balance_unique');
            $table->index(['education_level', 'academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_balances');
    }
};
