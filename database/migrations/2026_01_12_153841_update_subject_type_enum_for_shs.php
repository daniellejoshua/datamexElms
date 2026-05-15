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
        // allow both old and new values so we can safely convert any records
        DB::statement("ALTER TABLE subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'core', 'applied', 'specialized') DEFAULT 'major'");
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'core', 'applied', 'specialized', 'pe', 'internship') DEFAULT 'major'");

        // default any of the new types back to 'major' (or another acceptable fallback)
        DB::table('subjects')
            ->whereIn('subject_type', ['core', 'applied', 'specialized'])
            ->update(['subject_type' => 'major']);

        DB::table('curriculum_subjects')
            ->whereIn('subject_type', ['core', 'applied', 'specialized'])
            ->update(['subject_type' => 'major']);

        // now shrink enums to original sets
        DB::statement("ALTER TABLE subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective') DEFAULT 'major'");
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective', 'pe', 'internship') DEFAULT 'major'");
    }
};
