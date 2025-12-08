<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->boolean('is_on_hold')->default(false)->after('status');
            $table->decimal('hold_balance', 10, 2)->nullable()->after('is_on_hold');
            $table->string('hold_reason')->nullable()->after('hold_balance');
        });
    }

    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn(['is_on_hold', 'hold_balance', 'hold_reason']);
        });
    }
};
