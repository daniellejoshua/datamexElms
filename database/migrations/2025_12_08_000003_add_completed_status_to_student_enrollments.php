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
        // Extend enum to include 'completed'
        DB::statement("ALTER TABLE student_enrollments MODIFY `status` ENUM('active','dropped','transferred','completed') NOT NULL DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE student_enrollments MODIFY `status` ENUM('active','dropped','transferred') NOT NULL DEFAULT 'active'");
    }
};
