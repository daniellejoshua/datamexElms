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
        // add followup_payment to the payment_type enum
        Schema::table('payment_transactions', function (Blueprint $table) {
            // MySQL only: use raw modify statement since enum alteration is awkward
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE `payment_transactions` MODIFY `payment_type` ENUM('enrollment_fee','prelim_payment','midterm_payment','prefinal_payment','final_payment','irregular_subject_fee','penalty','refund','followup_payment') NOT NULL");
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // cleanse any rows before shrinking the enum so there are no invalid values
        DB::table('payment_transactions')
            ->where('payment_type', 'followup_payment')
            ->update(['payment_type' => 'enrollment_fee']);

        Schema::table('payment_transactions', function (Blueprint $table) {
            if (Schema::getConnection()->getDriverName() === 'mysql') {
                DB::statement("ALTER TABLE `payment_transactions` MODIFY `payment_type` ENUM('enrollment_fee','prelim_payment','midterm_payment','prefinal_payment','final_payment','irregular_subject_fee','penalty','refund') NOT NULL");
            }
        });
    }
};
