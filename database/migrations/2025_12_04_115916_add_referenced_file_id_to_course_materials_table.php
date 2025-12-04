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
            $table->unsignedBigInteger('referenced_file_id')->nullable()->after('file_hash')
                  ->comment('Points to original file ID if this is a reference, NULL if original');
            $table->foreign('referenced_file_id')->references('id')->on('course_materials')->onDelete('cascade');
            $table->index('referenced_file_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('course_materials', function (Blueprint $table) {
            $table->dropForeign(['referenced_file_id']);
            $table->dropColumn('referenced_file_id');
        });
    }
};
