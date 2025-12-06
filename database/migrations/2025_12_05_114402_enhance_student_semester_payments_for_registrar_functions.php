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
        Schema::table('student_semester_payments', function (Blueprint $table) {
            // Add enrollment fee tracking (downpayment system)
            $table->decimal('enrollment_fee', 8, 2)->default(0)->after('semester');
            $table->boolean('enrollment_paid')->default(false)->after('enrollment_fee');
            $table->date('enrollment_payment_date')->nullable()->after('enrollment_paid');

            // Add irregular student fees support
            $table->decimal('irregular_subject_fee', 8, 2)->default(300.00)->after('final_payment_date');
            $table->integer('irregular_subjects_count')->default(0)->after('irregular_subject_fee');

            // Add payment plan and status tracking
            $table->enum('payment_plan', ['full', 'installment', 'custom'])->default('installment')->after('balance');
            $table->enum('status', ['pending', 'partial', 'completed', 'overdue'])->default('pending')->after('payment_plan');

            // Add indexes for better performance
            $table->index(['student_id', 'status']);
            $table->index(['academic_year', 'semester', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->dropIndex(['student_id', 'status']);
            $table->dropIndex(['academic_year', 'semester', 'status']);

            $table->dropColumn([
                'enrollment_fee',
                'enrollment_paid',
                'enrollment_payment_date',
                'irregular_subject_fee',
                'irregular_subjects_count',
                'payment_plan',
                'status',
            ]);
        });
    }
};
