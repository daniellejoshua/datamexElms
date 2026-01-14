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
        Schema::table('course_materials', function (Blueprint $table) {
            $table->foreignId('section_subject_id')->nullable()->after('section_id')->constrained()->onDelete('cascade');
            $table->index(['section_subject_id', 'teacher_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            $table->dropForeign(['section_subject_id']);
            $table->dropColumn('section_subject_id');
        });
    }
};
