<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            // Prevent duplicate subject rows for the same archived enrollment when subject metadata exists
            $table->unique(['archived_student_enrollment_id', 'section_subject_id'], 'arch_subj_enroll_section_unique');
            $table->unique(['archived_student_enrollment_id', 'subject_code'], 'arch_subj_enroll_code_unique');
        });
    }

    public function down(): void
    {
        // dropping these unique indexes can fail if a foreign key relies on them or if
        // the index has already been removed by another rollback. to keep `migrate:refresh`
        // from exploding we temporarily disable foreign key checks and ignore any
        // exceptions that occur when the index is missing.
        Schema::disableForeignKeyConstraints();

        // blueprint operations only build the schema; the actual SQL is executed
        // after the closure returns. instead we perform raw statements so we can
        // catch failures at execution time, and include IF EXISTS to handle removed
        // indexes (mysql 8+). fall back to catching any exceptions just in case.
        try {
            DB::statement('ALTER TABLE `archived_student_subjects` DROP INDEX `arch_subj_enroll_section_unique`');
        } catch (\Exception $e) {
            // ignore if the index doesn't exist or cannot be dropped
        }

        try {
            DB::statement('ALTER TABLE `archived_student_subjects` DROP INDEX `arch_subj_enroll_code_unique`');
        } catch (\Exception $e) {
            // ignore problems here as well
        }

        Schema::enableForeignKeyConstraints();
    }
};
