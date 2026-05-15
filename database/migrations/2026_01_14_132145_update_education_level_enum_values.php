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
        // first expand the enum to allow both old and new values so we can safely
        // convert existing rows.
        DB::statement("ALTER TABLE students MODIFY COLUMN education_level ENUM('shs', 'senior_high', 'college') DEFAULT 'college'");

        DB::table('students')
            ->where('education_level', 'senior_high')
            ->update(['education_level' => 'shs']);

        // now shrink back to the original set
        DB::statement("ALTER TABLE students MODIFY COLUMN education_level ENUM('shs', 'college') DEFAULT 'college'");
    }
};
