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
        Schema::table('courses', function (Blueprint $table) {
            $table->enum('education_level', ['shs', 'college', 'both'])->default('college')->after('units');
            $table->string('track')->nullable()->after('education_level'); // STEM, HUMSS, ABM, etc.
            
            $table->index(['education_level', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropIndex(['education_level', 'status']);
            $table->dropColumn(['education_level', 'track']);
        });
    }
};
