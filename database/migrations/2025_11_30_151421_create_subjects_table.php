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
        Schema::create('subjects', function (Blueprint $table) {
            $table->id();
            $table->string('subject_code', 20)->unique(); // CS101, IT101, etc.
            $table->string('subject_name'); // Introduction to Programming
            $table->text('description')->nullable();
            $table->integer('units')->default(3); // Credit units
            $table->integer('year_level'); // 1, 2, 3, 4
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->enum('subject_type', ['major', 'minor', 'general', 'elective']);
            $table->text('prerequisites')->nullable(); // Subject codes as JSON or comma-separated
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index(['year_level', 'semester', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subjects');
    }
};
