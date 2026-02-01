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
            // Add fields to store calculated balance for irregular students
            $table->decimal('calculated_total_amount', 10, 2)->nullable()->after('balance');
            $table->json('irregular_balance_breakdown')->nullable()->after('calculated_total_amount');
            $table->boolean('is_balance_calculated')->default(false)->after('irregular_balance_breakdown');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->dropColumn([
                'calculated_total_amount',
                'irregular_balance_breakdown',
                'is_balance_calculated',
            ]);
        });
    }
};
