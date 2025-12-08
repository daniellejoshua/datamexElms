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
        Schema::create('course_materials', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained()->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained()->onDelete('cascade');

            $table->string('title');
            $table->text('description')->nullable();

            // File details
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type'); // pdf, doc, ppt, etc.
            $table->bigInteger('file_size'); // in bytes
            $table->string('original_name'); // Original filename

            // Categorization
            $table->enum('category', ['lecture', 'assignment', 'reading', 'exam', 'other'])->default('other');

            // Access control
            $table->enum('visibility', ['all_students', 'specific_students'])->default('all_students');
            $table->boolean('is_active')->default(true);

            // Tracking
            $table->date('upload_date')->default(now());
            $table->integer('download_count')->default(0);
            $table->integer('version_number')->default(1);

            $table->timestamps();

            // Indexes for material queries
            $table->index(['section_id', 'category']);
            $table->index(['teacher_id', 'is_active']);
            $table->index(['category', 'upload_date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_materials');
    }
};
