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
            // Check if the old unique constraint exists before dropping
            $oldIndexes = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM year_level_curriculum_guides WHERE Key_name = 'year_level_curriculum_guides_program_id_year_level_unique'");
            if (count($oldIndexes) > 0) {
                $table->dropUnique(['program_id', 'year_level']);
            }

            // Check if the new unique constraint already exists
            $newIndexes = \Illuminate\Support\Facades\DB::select("SHOW INDEX FROM year_level_curriculum_guides WHERE Key_name = 'ylcg_program_academic_year_level_unique'");
            if (count($newIndexes) === 0) {
                $table->unique(['program_id', 'academic_year', 'year_level'], 'ylcg_program_academic_year_level_unique');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('year_level_curriculum_guides', function (Blueprint $table) {
            $table->dropUnique('ylcg_program_academic_year_level_unique');
            $table->unique(['program_id', 'year_level']);
        });
    }
};
