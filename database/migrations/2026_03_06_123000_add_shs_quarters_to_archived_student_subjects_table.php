<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            $table->decimal('first_quarter_grade', 5, 2)->nullable()->after('units');
            $table->decimal('second_quarter_grade', 5, 2)->nullable()->after('first_quarter_grade');
        });
    }

    public function down(): void
    {
        Schema::table('archived_student_subjects', function (Blueprint $table) {
            $table->dropColumn(['first_quarter_grade', 'second_quarter_grade']);
        });
    }
};

