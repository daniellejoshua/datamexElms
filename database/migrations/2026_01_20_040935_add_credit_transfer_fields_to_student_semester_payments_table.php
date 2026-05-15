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
            // Add credit transfer deduction fields
            $table->decimal('credit_transfer_deduction', 8, 2)->default(300.00)->after('irregular_subjects_count');
            $table->integer('credit_transfer_subjects_count')->default(0)->after('credit_transfer_deduction');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->dropColumn([
                'credit_transfer_deduction',
                'credit_transfer_subjects_count',
            ]);
        });
    }
};
