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
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');
            $table->string('payment_type'); // 'tuition', 'miscellaneous', 'laboratory', 'library', etc.
            $table->enum('education_level', ['college', 'shs']);
            $table->string('academic_year');
            $table->string('semester');
            $table->decimal('amount', 10, 2);
            $table->decimal('total_due', 10, 2);
            $table->decimal('balance', 10, 2)->default(0);
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue'])->default('pending');
            $table->date('due_date');
            $table->text('description')->nullable();
            $table->json('payment_plan')->nullable(); // For installment plans
            $table->timestamps();

            $table->index(['student_id', 'education_level']);
            $table->index(['academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
