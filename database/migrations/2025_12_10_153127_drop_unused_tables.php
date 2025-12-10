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
        // Drop unused tables that have no data and are not referenced
        Schema::dropIfExists('registrars');
        Schema::dropIfExists('program_fees');
        Schema::dropIfExists('student_balances');
        Schema::dropIfExists('payment_items');
        Schema::dropIfExists('payments');
    }

    /**
     * Reverse the migrations.
     * Note: These tables were empty and unused, so rollback will not recreate them.
     * If you need them back, restore from a backup or recreate the original migrations.
     */
    public function down(): void
    {
        // Tables were dropped because they were unused and empty
        // No rollback needed as they contained no data
    }
};
