<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->boolean('fee_finalized')->default(false)->after('balance');
        });

        Schema::table('shs_student_payments', function (Blueprint $table) {
            $table->boolean('fee_finalized')->default(false)->after('balance');
        });
    }

    public function down()
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->dropColumn('fee_finalized');
        });

        Schema::table('shs_student_payments', function (Blueprint $table) {
            $table->dropColumn('fee_finalized');
        });
    }
};
