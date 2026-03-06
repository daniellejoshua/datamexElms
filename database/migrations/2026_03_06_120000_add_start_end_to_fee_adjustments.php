<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up(): void
    {
        if (!Schema::hasTable('fee_adjustments')) {
            // If the table is missing, do nothing — migration cannot add columns.
            return;
        }

        Schema::table('fee_adjustments', function (Blueprint $table) {
            if (!Schema::hasColumn('fee_adjustments', 'start_date')) {
                $table->date('start_date')->nullable()->after('effective_date');
            }

            if (!Schema::hasColumn('fee_adjustments', 'end_date')) {
                // place end_date after start_date if possible, otherwise append
                $table->date('end_date')->nullable()->after('start_date');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down(): void
    {
        if (!Schema::hasTable('fee_adjustments')) {
            return;
        }

        Schema::table('fee_adjustments', function (Blueprint $table) {
            if (Schema::hasColumn('fee_adjustments', 'end_date')) {
                $table->dropColumn('end_date');
            }
            if (Schema::hasColumn('fee_adjustments', 'start_date')) {
                $table->dropColumn('start_date');
            }
        });
    }
};
