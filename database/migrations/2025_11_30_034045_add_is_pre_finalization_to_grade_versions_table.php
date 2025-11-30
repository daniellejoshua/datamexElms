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
        Schema::table('grade_versions', function (Blueprint $table) {
            $table->boolean('is_pre_finalization')->default(true);
            $table->index(['student_grade_id', 'is_pre_finalization']);
            $table->index(['shs_student_grade_id', 'is_pre_finalization']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('grade_versions', function (Blueprint $table) {
            $table->dropIndex(['student_grade_id', 'is_pre_finalization']);
            $table->dropIndex(['shs_student_grade_id', 'is_pre_finalization']);
            $table->dropColumn('is_pre_finalization');
        });
    }
};
