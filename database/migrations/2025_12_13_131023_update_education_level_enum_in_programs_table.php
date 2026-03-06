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
        DB::statement("ALTER TABLE programs MODIFY COLUMN education_level ENUM('college', 'senior_high', 'associate') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // temporarily allow all values so data can be cleaned
        DB::statement("ALTER TABLE programs MODIFY COLUMN education_level ENUM('college', 'senior_high', 'associate', 'shs') NOT NULL");

        DB::table('programs')
            ->whereNotIn('education_level', ['college', 'shs'])
            ->update(['education_level' => 'college']);

        DB::statement("ALTER TABLE programs MODIFY COLUMN education_level ENUM('college', 'shs') NOT NULL");
    }
};
