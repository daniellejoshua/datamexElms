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
        if (! Schema::hasTable('curriculum')) {
            return;
        }

        if (! Schema::hasColumn('curriculum', 'is_current')) {
            Schema::table('curriculum', function (Blueprint $table) {
                $table->boolean('is_current')->default(false)->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('curriculum', 'is_current')) {
            Schema::table('curriculum', function (Blueprint $table) {
                $table->dropColumn('is_current');
            });
        }
    }
};
