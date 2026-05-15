<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE payment_transactions MODIFY COLUMN payment_method ENUM('cash', 'check', 'bank_transfer', 'online', 'installment', 'voucher')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // assign a valid value to any existing voucher rows before shrinking enum;
        // this mirrors the approach used in other enum-altering migrations.
        DB::table('payment_transactions')
            ->where('payment_method', 'voucher')
            ->update(['payment_method' => 'cash']);

        DB::statement("ALTER TABLE payment_transactions MODIFY COLUMN payment_method ENUM('cash', 'check', 'bank_transfer', 'online', 'installment')");
    }
};
