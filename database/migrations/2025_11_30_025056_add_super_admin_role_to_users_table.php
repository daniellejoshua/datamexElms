<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Modify the role enum to include super_admin
            $table->enum('role', ['student', 'teacher', 'registrar', 'head_teacher', 'super_admin'])->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // convert any super_admin users to a valid fallback before changing enum
        DB::table('users')
            ->where('role', 'super_admin')
            ->update(['role' => 'student']);

        Schema::table('users', function (Blueprint $table) {
            // Revert to original roles
            $table->enum('role', ['student', 'teacher', 'registrar', 'head_teacher'])->change();
        });
    }
};
