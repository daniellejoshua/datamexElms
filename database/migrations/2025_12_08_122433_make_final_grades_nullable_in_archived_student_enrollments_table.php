<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('archived_student_enrollments', function (Blueprint $table) {
            $table->json('final_grades')->nullable()->change();
        });
    }

    public function down(): void
    {
        // convert NULL JSONs to empty object so the not-null alteration succeeds
        DB::table('archived_student_enrollments')
            ->whereNull('final_grades')
            ->update(['final_grades' => json_encode((object) [])]);

        Schema::table('archived_student_enrollments', function (Blueprint $table) {
            $table->json('final_grades')->nullable(false)->change();
        });
    }
};
