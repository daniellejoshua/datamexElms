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
        Schema::create('year_level_curriculum_guides', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained()->onDelete('cascade');
            $table->string('academic_year');
            $table->integer('year_level');
            $table->foreignId('curriculum_id')->constrained('curriculum')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['program_id', 'academic_year', 'year_level'], 'ylcg_program_academic_year_level_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('year_level_curriculum_guides');
    }
};
