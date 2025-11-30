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
        Schema::create('archived_sections', function (Blueprint $table) {
            $table->id();
            $table->string('original_section_id'); // Reference to original section
            $table->string('section_name');
            $table->string('academic_year');
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->string('room')->nullable();
            $table->enum('status', ['completed', 'cancelled'])->default('completed');

            // Course information (snapshot)
            $table->json('course_data'); // Store course details at time of archival

            // Statistics at time of archival
            $table->integer('total_enrolled_students');
            $table->integer('completed_students');
            $table->integer('dropped_students');
            $table->decimal('section_average_grade', 5, 2)->nullable();

            // Archival metadata
            $table->timestamp('archived_at');
            $table->foreignId('archived_by')->constrained('users');
            $table->text('archive_notes')->nullable();

            $table->timestamps();

            // Indexes for efficient querying
            $table->index(['academic_year', 'semester']);
            $table->index('archived_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archived_sections');
    }
};
