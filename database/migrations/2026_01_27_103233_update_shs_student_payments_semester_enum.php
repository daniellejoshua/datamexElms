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
        // Update the semester enum to include 'annual' for yearly payments
        DB::statement("ALTER TABLE shs_student_payments MODIFY COLUMN semester ENUM('1st', '2nd', 'annual')");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert back to original enum values
        DB::statement("ALTER TABLE shs_student_payments MODIFY COLUMN semester ENUM('1st', '2nd')");
    }
};
