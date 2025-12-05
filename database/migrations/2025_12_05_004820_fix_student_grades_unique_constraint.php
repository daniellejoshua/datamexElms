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
            // Drop the old unique constraint on student_enrollment_id alone
            $table->dropUnique('student_grades_student_enrollment_id_unique');
            
            // Add a new unique constraint on the combination of student_enrollment_id and teacher_id
            $table->unique(['student_enrollment_id', 'teacher_id'], 'student_grades_enrollment_teacher_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_grades', function (Blueprint $table) {
            // Drop the combined unique constraint
            $table->dropUnique('student_grades_enrollment_teacher_unique');
            
            // Restore the original unique constraint on student_enrollment_id alone
            $table->unique('student_enrollment_id', 'student_grades_student_enrollment_id_unique');
        });
    }
};
