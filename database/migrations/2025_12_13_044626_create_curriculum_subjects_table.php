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
        Schema::create('curriculum_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('curriculum_id')->constrained()->onDelete('cascade');
            $table->string('subject_code');
            $table->string('subject_name');
            $table->text('description')->nullable();
            $table->decimal('units', 3, 1);
            $table->integer('year_level');
            $table->enum('semester', ['1st', '2nd', 'Summer']);
            $table->enum('subject_type', ['core', 'elective', 'major', 'minor'])->default('core');
            $table->json('prerequisites')->nullable();
            $table->boolean('is_lab')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index(['curriculum_id', 'year_level', 'semester']);
            $table->index(['subject_type', 'status']);
            $table->unique(['curriculum_id', 'subject_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('curriculum_subjects');
    }
};
