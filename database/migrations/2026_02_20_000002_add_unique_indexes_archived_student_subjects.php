<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

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
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            $table->dropUnique('arch_subj_enroll_section_unique');
            $table->dropUnique('arch_subj_enroll_code_unique');
        });
    }
};
