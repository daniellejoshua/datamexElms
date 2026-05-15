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
        Schema::table('teachers', function (Blueprint $table) {
            $table->string('employee_number')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ensure no nulls exist before making the column not nullable
        // assign a unique placeholder for each null employee number to
        // avoid violating the unique index when we make the column not null.
        DB::table('teachers')
            ->whereNull('employee_number')
            ->update(['employee_number' => DB::raw("CONCAT('T', id)")]);

        Schema::table('teachers', function (Blueprint $table) {
            $table->string('employee_number')->nullable(false)->change();
        });
    }
};
