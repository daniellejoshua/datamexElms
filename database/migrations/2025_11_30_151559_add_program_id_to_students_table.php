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
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->after('user_id')->constrained('programs');
            $table->integer('current_year_level')->after('program_id')->default(1);
        });

        // Set default program for existing students
        DB::statement('UPDATE students SET program_id = 1 WHERE program_id IS NULL');

        // Make program_id required
        Schema::table('students', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['program_id']);
            $table->dropColumn(['program_id', 'current_year_level']);
        });
    }
};
