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
        Schema::table('year_level_curriculum_guides', function (Blueprint $table) {
            if (! Schema::hasColumn('year_level_curriculum_guides', 'academic_year')) {
                $table->string('academic_year')->after('program_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('year_level_curriculum_guides', function (Blueprint $table) {
            $table->dropColumn('academic_year');
        });
    }
};
