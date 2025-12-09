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
        Schema::create('program_fees', function (Blueprint $table) {
            $table->id();
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->integer('year_level'); // 1, 2, 3, 4, etc.
            $table->enum('education_level', ['college', 'shs']);
            $table->decimal('semester_fee', 10, 2)->default(0);
            $table->enum('fee_type', ['regular', 'irregular'])->default('regular');
            $table->timestamps();

            $table->unique(['program_id', 'year_level', 'education_level', 'fee_type'], 'program_year_fee_unique');
            $table->index(['program_id', 'year_level', 'education_level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('program_fees');
    }
};
