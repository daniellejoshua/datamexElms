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
            $table->foreignId('archived_student_subject_id')->nullable()->constrained('archived_student_subjects')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_subject_credits', function (Blueprint $table) {
            $table->dropForeign(['archived_student_subject_id']);
            $table->dropColumn('archived_student_subject_id');
        });
    }
};