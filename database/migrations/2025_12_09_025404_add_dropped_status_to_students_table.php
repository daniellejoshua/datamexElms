<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

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
