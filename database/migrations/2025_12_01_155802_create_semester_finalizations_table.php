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
        Schema::create('semester_finalizations', function (Blueprint $table) {
            $table->id();
            $table->string('academic_year');
            $table->string('semester');
            $table->enum('education_level', ['college', 'shs']);
            $table->string('period_name'); // 'prelim', 'midterm', 'prefinal', 'final' or quarters
            $table->boolean('is_finalized')->default(false);
            $table->timestamp('finalized_at')->nullable();
            $table->foreignId('finalized_by')->nullable()->constrained('users');
            $table->text('finalization_notes')->nullable();
            $table->timestamps();

            // Unique constraint to prevent duplicate finalizations
            $table->unique(['academic_year', 'semester', 'education_level', 'period_name'], 'unique_semester_finalization');
            $table->index(['is_finalized', 'academic_year', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('semester_finalizations');
    }
};
