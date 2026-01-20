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
        Schema::table('student_credit_transfers', function (Blueprint $table) {
            $table->dropColumn(['fee_adjustment', 'grade_verified_at', 'rejection_reason']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_credit_transfers', function (Blueprint $table) {
            $table->decimal('fee_adjustment', 10, 2)->default(0)->after('credit_status');
            $table->timestamp('grade_verified_at')->nullable()->after('approved_at');
            $table->text('rejection_reason')->nullable()->after('verified_semester_grade');
        });
    }
};
