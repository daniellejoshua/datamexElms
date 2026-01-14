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
            // Grade verification fields
            $table->timestamp('grade_verified_at')->nullable()->after('approved_at');
            $table->decimal('verified_semester_grade', 5, 2)->nullable()->after('grade_verified_at');
            $table->text('rejection_reason')->nullable()->after('verified_semester_grade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('student_credit_transfers', function (Blueprint $table) {
            $table->dropColumn(['grade_verified_at', 'verified_semester_grade', 'rejection_reason']);
        });
    }
};
