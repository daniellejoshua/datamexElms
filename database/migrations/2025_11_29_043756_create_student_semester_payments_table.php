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
        Schema::create('student_semester_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('academic_year'); // e.g., "2024-2025"
            $table->enum('semester', ['1st', '2nd', 'summer']);
            
            // Payment breakdown per grading period
            $table->decimal('prelim_amount', 10, 2)->default(0);
            $table->boolean('prelim_paid')->default(false);
            $table->date('prelim_payment_date')->nullable();
            
            $table->decimal('midterm_amount', 10, 2)->default(0);
            $table->boolean('midterm_paid')->default(false);
            $table->date('midterm_payment_date')->nullable();
            
            $table->decimal('prefinal_amount', 10, 2)->default(0);
            $table->boolean('prefinal_paid')->default(false);
            $table->date('prefinal_payment_date')->nullable();
            
            $table->decimal('final_amount', 10, 2)->default(0);
            $table->boolean('final_paid')->default(false);
            $table->date('final_payment_date')->nullable();
            
            // Total calculation fields
            $table->decimal('total_semester_fee', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);
            
            $table->timestamps();
            
            // One payment record per student per academic period
            $table->unique(['student_id', 'academic_year', 'semester'], 'unique_student_semester_payment');
            $table->index(['academic_year', 'semester']);
            $table->index(['student_id', 'academic_year']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_semester_payments');
    }
};
