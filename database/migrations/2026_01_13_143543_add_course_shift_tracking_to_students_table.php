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
        Schema::table('students', function (Blueprint $table) {
            // Only add if doesn't exist
            if (! Schema::hasColumn('students', 'previous_program_id')) {
                $table->foreignId('previous_program_id')->nullable()->after('program_id')->constrained('programs')->nullOnDelete();
            }
            if (! Schema::hasColumn('students', 'previous_curriculum_id')) {
                $table->foreignId('previous_curriculum_id')->nullable()->after('curriculum_id')->constrained('curriculum')->nullOnDelete();
            }
            if (! Schema::hasColumn('students', 'course_shifted_at')) {
                $table->timestamp('course_shifted_at')->nullable()->after('enrolled_date');
            }
            if (! Schema::hasColumn('students', 'credited_subjects')) {
                $table->json('credited_subjects')->nullable()->after('course_shifted_at');
            }
            if (! Schema::hasColumn('students', 'shift_reason')) {
                $table->text('shift_reason')->nullable()->after('credited_subjects');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $table->dropForeign(['previous_program_id']);
            $table->dropForeign(['previous_curriculum_id']);
            $table->dropColumn([
                'previous_program_id',
                'previous_curriculum_id',
                'course_shifted_at',
                'credited_subjects',
                'shift_reason',
            ]);
        });
    }
};
