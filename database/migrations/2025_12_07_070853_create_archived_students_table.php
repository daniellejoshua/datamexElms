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
        Schema::create('archived_students', function (Blueprint $table) {
            $table->id();
            $table->foreignId('original_student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('program_id')->nullable()->constrained()->onDelete('set null');
            $table->string('student_number');
            $table->string('first_name');
            $table->string('last_name');
            $table->string('middle_name')->nullable();
            $table->date('birth_date')->nullable();
            $table->text('address')->nullable();
            $table->string('phone')->nullable();
            $table->integer('year_level')->nullable();
            $table->string('program')->nullable();
            $table->string('parent_contact')->nullable();
            $table->string('student_type')->nullable();
            $table->string('education_level')->nullable();
            $table->string('track')->nullable();
            $table->string('strand')->nullable();
            $table->string('status');
            $table->date('enrolled_date')->nullable();
            $table->string('academic_year');
            $table->string('semester');
            $table->timestamp('archived_at');
            $table->foreignId('archived_by')->constrained('users');
            $table->text('archive_notes')->nullable();
            $table->json('student_data')->nullable(); // Store complete student data as backup
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('archived_students');
    }
};
