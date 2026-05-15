<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            $table->text('teacher_remarks')->nullable()->after('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            $table->dropColumn('teacher_remarks');
        });
    }
};

