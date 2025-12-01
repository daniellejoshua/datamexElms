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
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending')->after('balance');
            $table->text('notes')->nullable()->after('payment_status');
        });

        Schema::table('shs_student_payments', function (Blueprint $table) {
            $table->enum('payment_status', ['pending', 'partial', 'paid'])->default('pending')->after('balance');
            $table->text('notes')->nullable()->after('payment_status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_semester_payments', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'notes']);
        });

        Schema::table('shs_student_payments', function (Blueprint $table) {
            $table->dropColumn(['payment_status', 'notes']);
        });
    }
};