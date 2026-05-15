<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

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
        // disable foreign key checks to allow dropping the index even if it's
        // referenced elsewhere
        Schema::disableForeignKeyConstraints();

        try {
            DB::statement('ALTER TABLE `year_level_curriculum_guides` DROP INDEX `ylcg_program_academic_year_level_unique`');
        } catch (\Exception $e) {
            // ignore if it doesn't exist or cannot be dropped
        }

        Schema::table('year_level_curriculum_guides', function (Blueprint $table) {
            // re-create the original two-column unique index only if missing
            $indexes = DB::select("SHOW INDEX FROM year_level_curriculum_guides WHERE Key_name = 'year_level_curriculum_guides_program_id_year_level_unique'");
            if (count($indexes) === 0) {
                $table->unique(['program_id', 'year_level']);
            }
        });

        Schema::enableForeignKeyConstraints();
    }
};
