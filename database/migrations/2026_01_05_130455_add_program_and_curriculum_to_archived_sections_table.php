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
        Schema::table('archived_sections', function (Blueprint $table) {
            // Only add year_level since program_id and curriculum_id already exist
            if (! Schema::hasColumn('archived_sections', 'year_level')) {
                $table->integer('year_level')->nullable()->after('curriculum_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('archived_sections', function (Blueprint $table) {
            // Only drop year_level since program_id and curriculum_id should be kept
            if (Schema::hasColumn('archived_sections', 'year_level')) {
                $table->dropColumn('year_level');
            }
        });
    }
};
