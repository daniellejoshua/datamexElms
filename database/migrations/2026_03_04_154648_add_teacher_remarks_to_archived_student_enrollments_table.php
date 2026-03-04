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
        Schema::table('archived_student_enrollments', function (Blueprint $table) {
            $table->text('teacher_remarks')->nullable()->after('letter_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('archived_student_enrollments', function (Blueprint $table) {
            $table->dropColumn('teacher_remarks');
        });
    }
};
