<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Drop foreign key constraints first
        DB::statement('ALTER TABLE program_curriculum DROP FOREIGN KEY program_curricula_program_id_foreign');
        DB::statement('ALTER TABLE program_curriculum DROP FOREIGN KEY program_curricula_curriculum_id_foreign');

        // Drop the unique index
        DB::statement('ALTER TABLE program_curriculum DROP INDEX program_curricula_program_id_academic_year_unique');

        // Recreate with new names
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curriculum_program_id_academic_year_unique UNIQUE (program_id, academic_year)');
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curriculum_program_id_foreign FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curriculum_curriculum_id_foreign FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop new constraints
        DB::statement('ALTER TABLE program_curriculum DROP FOREIGN KEY program_curriculum_program_id_foreign');
        DB::statement('ALTER TABLE program_curriculum DROP FOREIGN KEY program_curriculum_curriculum_id_foreign');
        DB::statement('ALTER TABLE program_curriculum DROP INDEX program_curriculum_program_id_academic_year_unique');

        // Recreate with old names
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curricula_program_id_academic_year_unique UNIQUE (program_id, academic_year)');
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curricula_program_id_foreign FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE');
        DB::statement('ALTER TABLE program_curriculum ADD CONSTRAINT program_curricula_curriculum_id_foreign FOREIGN KEY (curriculum_id) REFERENCES curriculum(id) ON DELETE CASCADE');
    }
};
