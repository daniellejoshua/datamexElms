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
            $table->enum('education_level', ['shs', 'college'])->default('college')->after('student_type');
            $table->string('track')->nullable()->after('education_level'); // For SHS: STEM, HUMSS, ABM, etc.
            $table->string('strand')->nullable()->after('track'); // For SHS strand specialization
            
            // Index for efficient queries
            $table->index(['education_level', 'student_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropIndex(['education_level', 'student_type']);
            $table->dropColumn(['education_level', 'track', 'strand']);
        });
    }
};
