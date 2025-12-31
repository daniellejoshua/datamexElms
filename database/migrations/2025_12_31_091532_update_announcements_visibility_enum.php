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
        // Modify the enum to include new visibility options
        DB::statement("ALTER TABLE announcements MODIFY COLUMN visibility ENUM('teachers_only', 'all_users', 'students_only', 'admins_only', 'registrars_only', 'employees_only') DEFAULT 'all_users'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum values
        DB::statement("ALTER TABLE announcements MODIFY COLUMN visibility ENUM('teachers_only', 'all_users', 'students_only') DEFAULT 'all_users'");
    }
};
