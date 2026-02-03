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
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained()->onDelete('cascade');

            // Polymorphic relationship to different payment types
            $table->morphs('payable'); // payable_type, payable_id

            $table->decimal('amount', 10, 2);
            $table->enum('payment_type', [
                'enrollment_fee',
                'prelim_payment',
                'midterm_payment',
                'prefinal_payment',
                'final_payment',
                'irregular_subject_fee',
                'penalty',
                'refund',
            ]);

            $table->enum('payment_method', [
                'cash',
                'check',
                'bank_transfer',
                'online',
                'installment',
                'voucher',
            ]);

            $table->string('reference_number')->nullable();
            $table->text('description')->nullable();
            $table->foreignId('processed_by')->constrained('users')->onDelete('restrict');
            $table->timestamp('payment_date');

            $table->enum('status', [
                'pending',
                'completed',
                'failed',
                'refunded',
            ])->default('pending');

            $table->text('notes')->nullable();
            $table->timestamps();

            // Indexes for better performance
            $table->index(['student_id', 'payment_type']);
            $table->index(['payment_date', 'status']);
            $table->index('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
