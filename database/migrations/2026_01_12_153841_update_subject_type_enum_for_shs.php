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
        // Update subjects table to include 'core', 'applied', 'specialized' for SHS
        DB::statement("ALTER TABLE subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'core', 'applied', 'specialized') DEFAULT 'major'");

        // Update curriculum_subjects table to include 'core', 'applied', 'specialized' for SHS
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'core', 'applied', 'specialized', 'pe', 'internship') DEFAULT 'major'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to previous enum values
        DB::statement("ALTER TABLE subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective') DEFAULT 'major'");
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'pe', 'internship') DEFAULT 'major'");
    }
};
