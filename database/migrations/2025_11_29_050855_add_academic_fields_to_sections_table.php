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
        Schema::table('sections', function (Blueprint $table) {
            $table->string('academic_year')->after('course_id'); // e.g., "2024-2025"
            $table->enum('semester', ['1st', '2nd', 'summer'])->default('1st')->after('academic_year');

            // Index for efficient historical queries
            $table->index(['academic_year', 'semester']);
            $table->index(['course_id', 'academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sections', function (Blueprint $table) {
            $table->dropIndex(['academic_year', 'semester']);
            $table->dropIndex(['course_id', 'academic_year', 'semester']);
            $table->dropColumn(['academic_year', 'semester']);
        });
    }
};
