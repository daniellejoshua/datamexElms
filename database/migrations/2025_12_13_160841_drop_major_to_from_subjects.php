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
        // Only drop the column if it exists to avoid errors in test or fresh installs
        if (Schema::hasColumn('subjects', 'major_to')) {
            Schema::table('subjects', function (Blueprint $table) {
                $table->dropColumn('major_to');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->unsignedBigInteger('major_to')->nullable();
        });
    }
};
