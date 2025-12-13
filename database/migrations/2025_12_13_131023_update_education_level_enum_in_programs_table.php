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
        DB::statement("ALTER TABLE programs MODIFY COLUMN education_level ENUM('college', 'shs') NOT NULL");
    }
};
