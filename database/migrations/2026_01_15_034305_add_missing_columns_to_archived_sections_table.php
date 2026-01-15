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
            if (! Schema::hasColumn('archived_sections', 'program_id')) {
                $table->foreignId('program_id')->nullable()->constrained('programs');
            }

            if (! Schema::hasColumn('archived_sections', 'curriculum_id')) {
                $table->foreignId('curriculum_id')->nullable()->constrained('curriculum');
            }

            if (! Schema::hasColumn('archived_sections', 'year_level')) {
                $table->integer('year_level')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('archived_sections', function (Blueprint $table) {
            if (Schema::hasColumn('archived_sections', 'program_id')) {
                $table->dropForeign(['program_id']);
                $table->dropColumn('program_id');
            }

            if (Schema::hasColumn('archived_sections', 'curriculum_id')) {
                $table->dropForeign(['curriculum_id']);
                $table->dropColumn('curriculum_id');
            }

            if (Schema::hasColumn('archived_sections', 'year_level')) {
                $table->dropColumn('year_level');
            }
        });
    }
};
