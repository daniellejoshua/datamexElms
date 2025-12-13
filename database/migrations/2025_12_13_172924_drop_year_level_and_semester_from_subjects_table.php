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
            $table->dropIndex(['year_level', 'semester', 'status']);
            $table->dropColumn(['year_level', 'semester']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('subjects', function (Blueprint $table) {
            $table->integer('year_level'); // 1, 2, 3, 4
            $table->enum('semester', ['first', 'second', 'summer']);
            $table->index(['year_level', 'semester', 'status']);
        });
    }
};
