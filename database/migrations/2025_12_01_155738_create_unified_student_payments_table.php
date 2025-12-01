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
        Schema::create('student_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->cascadeOnDelete();
            $table->string('academic_year'); // e.g., '2024-2025'
            $table->string('semester'); // e.g., '1st', '2nd', 'summer'
            $table->enum('education_level', ['college', 'shs']);
            $table->string('period_name'); // 'prelim', 'midterm', 'prefinal', 'final' or '1st_quarter', '2nd_quarter', etc.
            $table->decimal('amount_due', 10, 2);
            $table->decimal('amount_paid', 10, 2)->default(0);
            $table->boolean('is_paid')->default(false);
            $table->timestamp('payment_date')->nullable();
            $table->enum('payment_status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->text('payment_notes')->nullable();
            $table->timestamps();

            // Indexes for performance
            $table->index(['student_id', 'academic_year', 'semester']);
            $table->index(['education_level', 'period_name']);
            $table->index('payment_status');

            // Unique constraint to prevent duplicate period payments
            $table->unique(['student_id', 'academic_year', 'semester', 'period_name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_payments');
    }
};
