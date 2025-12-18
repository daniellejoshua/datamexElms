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
        // Add 'dropped' to the status enum
        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('active', 'inactive', 'graduated', 'dropped') DEFAULT 'active'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove 'dropped' from the status enum
        DB::statement("ALTER TABLE students MODIFY COLUMN status ENUM('active', 'inactive', 'graduated') DEFAULT 'active'");
    }
};
