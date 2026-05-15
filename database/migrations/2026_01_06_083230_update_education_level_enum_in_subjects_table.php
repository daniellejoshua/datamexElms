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
        DB::statement("ALTER TABLE subjects MODIFY COLUMN education_level ENUM('college', 'shs', 'senior_high', 'associate') NOT NULL DEFAULT 'college'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // temporarily allow all possible values so we can normalise existing
        // rows back into the smaller set
        DB::statement("ALTER TABLE subjects MODIFY COLUMN education_level ENUM('college', 'shs', 'senior_high', 'associate') NOT NULL DEFAULT 'college'");

        // convert any non-supported levels to a safe default
        DB::table('subjects')
            ->whereNotIn('education_level', ['college', 'shs'])
            ->update(['education_level' => 'college']);

        DB::statement("ALTER TABLE subjects MODIFY COLUMN education_level ENUM('college', 'shs') NOT NULL DEFAULT 'college'");
    }
};
