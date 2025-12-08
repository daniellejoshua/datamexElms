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
        Schema::create('shs_student_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('academic_year'); // e.g., "2024-2025"
            $table->enum('semester', ['1st', '2nd']); // SHS still has semesters

            // SHS Quarterly Payment Structure
            $table->decimal('first_quarter_amount', 10, 2)->default(0);
            $table->boolean('first_quarter_paid')->default(false);
            $table->date('first_quarter_payment_date')->nullable();

            $table->decimal('second_quarter_amount', 10, 2)->default(0);
            $table->boolean('second_quarter_paid')->default(false);
            $table->date('second_quarter_payment_date')->nullable();

            $table->decimal('third_quarter_amount', 10, 2)->default(0);
            $table->boolean('third_quarter_paid')->default(false);
            $table->date('third_quarter_payment_date')->nullable();

            $table->decimal('fourth_quarter_amount', 10, 2)->default(0);
            $table->boolean('fourth_quarter_paid')->default(false);
            $table->date('fourth_quarter_payment_date')->nullable();

            // Total tracking
            $table->decimal('total_semester_fee', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->decimal('balance', 10, 2)->default(0);

            $table->timestamps();

            $table->unique(['student_id', 'academic_year', 'semester']);
            $table->index(['academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('shs_student_payments');
    }
};
