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
        Schema::table('student_grades', function (Blueprint $table) {
            $table->foreignId('section_subject_id')->after('student_enrollment_id')->nullable()->constrained()->onDelete('cascade');
            // Remove old unique, if exists
            $table->dropUnique('student_grades_enrollment_teacher_unique');
            // Add new unique constraint
            $table->unique(['student_enrollment_id', 'section_subject_id', 'teacher_id'], 'student_grades_enrollment_section_subject_teacher_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropUnique('student_grades_enrollment_section_subject_teacher_unique');
            $table->dropConstrainedForeignId('section_subject_id');
            $table->unique(['student_enrollment_id', 'teacher_id'], 'student_grades_enrollment_teacher_unique');
        });
    }
};
