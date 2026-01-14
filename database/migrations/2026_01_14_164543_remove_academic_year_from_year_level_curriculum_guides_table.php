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
        // Changes already applied manually
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('year_level_curriculum_guides', function (Blueprint $table) {
            $table->dropUnique('ylcg_program_year_level_unique');
            $table->string('academic_year');
            $table->unique(['program_id', 'academic_year', 'year_level'], 'ylcg_program_academic_year_level_unique');
        });
    }
};
