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
            $table->string('academic_year', 16);
            $table->string('semester', 16);
            $table->string('education_level', 32);
            $table->string('track', 32)->nullable();
            $table->timestamp('finalized_at');
            $table->foreignId('finalized_by')->constrained('users');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['academic_year', 'semester', 'education_level', 'track'], 'semester_finalizations_unique');
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
