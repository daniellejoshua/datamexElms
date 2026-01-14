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
        Schema::table('students', function (Blueprint $table) {
            // SHS Voucher Program Fields
            $table->boolean('has_voucher')->default(false)->after('status');
            $table->string('voucher_id')->nullable()->unique()->after('has_voucher');
            $table->enum('voucher_status', ['active', 'invalid'])->nullable()->after('voucher_id');
            $table->timestamp('voucher_invalidated_at')->nullable()->after('voucher_status');
            $table->text('voucher_invalidation_reason')->nullable()->after('voucher_invalidated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropColumn([
                'has_voucher',
                'voucher_id',
                'voucher_status',
                'voucher_invalidated_at',
                'voucher_invalidation_reason',
            ]);
        });
    }
};
