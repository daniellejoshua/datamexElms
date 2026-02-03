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
        DB::statement("ALTER TABLE payment_transactions MODIFY COLUMN payment_method ENUM('cash', 'check', 'bank_transfer', 'online', 'installment')");
    }
};
