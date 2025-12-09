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
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->constrained('programs')->onDelete('cascade')->after('id');
            $table->index(['program_id', 'education_level', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->dropIndex(['program_id', 'education_level', 'status']);
            $table->dropForeign(['program_id']);
            $table->dropColumn('program_id');
        });
    }
};
