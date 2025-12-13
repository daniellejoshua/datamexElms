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
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('major', 'minor', 'general', 'elective') DEFAULT 'major' NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE curriculum_subjects MODIFY COLUMN subject_type ENUM('core', 'elective', 'major', 'minor', 'pe', 'internship') DEFAULT 'core' NOT NULL");
    }
};
