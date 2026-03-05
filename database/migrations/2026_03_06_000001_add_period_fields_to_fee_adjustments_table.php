<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('fee_adjustments')) {
            return;
        }

        Schema::table('fee_adjustments', function (Blueprint $table) {
            if (! Schema::hasColumn('fee_adjustments', 'start_date')) {
                $table->date('start_date')->nullable()->after('effective_date');
            }

            if (! Schema::hasColumn('fee_adjustments', 'end_date')) {
                $table->date('end_date')->nullable()->after('start_date');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('fee_adjustments')) {
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
