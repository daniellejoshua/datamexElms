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
        // Update enum to include 'senior_high' instead of 'shs'
        DB::statement("ALTER TABLE students MODIFY COLUMN education_level ENUM('senior_high', 'college') DEFAULT 'college'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE students MODIFY COLUMN education_level ENUM('shs', 'college') DEFAULT 'college'");
    }
};
