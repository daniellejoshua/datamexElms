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
        Schema::table('student_subject_credits', function (Blueprint $table) {
            // Drop the unique constraint that includes curriculum_subject_id
            $table->dropUnique('student_subject_credits_student_id_curriculum_subject_id_unique');

            // Make curriculum_subject_id nullable to support transferee credits
            $table->unsignedBigInteger('curriculum_subject_id')->nullable()->change();

            // Recreate the unique constraint, but it will now allow multiple NULL values
            $table->unique(['student_id', 'curriculum_subject_id'], 'student_subject_credits_student_id_curriculum_subject_id_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_subject_credits', function (Blueprint $table) {
            // Drop the unique constraint
            $table->dropUnique('student_subject_credits_student_id_curriculum_subject_id_unique');

            // Make curriculum_subject_id not nullable again
            $table->unsignedBigInteger('curriculum_subject_id')->nullable(false)->change();

            // Recreate the unique constraint
            $table->unique(['student_id', 'curriculum_subject_id'], 'student_subject_credits_student_id_curriculum_subject_id_unique');
        });
    }
};
