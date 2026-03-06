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
        // SQLite does not support dropping columns or indexes easily, so skip
        // this migration when running tests on the in-memory sqlite connection.
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('class_schedules', function (Blueprint $table) {
            // Drop existing foreign key and column
            $table->dropForeign(['section_id']);
            $table->dropColumn('section_id');

            // Add new foreign key to section_subjects
            $table->foreignId('section_subject_id')->after('id')->constrained('section_subjects')->onDelete('cascade');

            // Remove room column since it's now in section_subjects
            $table->dropColumn('room');

            // Update indexes
            $table->dropIndex(['day_of_week', 'start_time']);
            $table->dropIndex(['room', 'day_of_week', 'start_time']);

            // Add new indexes
            $table->index(['section_subject_id', 'day_of_week']);
            $table->index(['day_of_week', 'start_time', 'end_time']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::getConnection()->getDriverName() === 'sqlite') {
            return;
        }

        Schema::table('class_schedules', function (Blueprint $table) {
            // Drop new foreign key and column
            $table->dropForeign(['section_subject_id']);
            $table->dropColumn('section_subject_id');

            // Restore original structure
            $table->foreignId('section_id')->after('id')->constrained()->onDelete('cascade');
            $table->string('room')->nullable()->after('end_time');

            // Restore original indexes
            $table->dropIndex(['section_subject_id', 'day_of_week']);
            $table->dropIndex(['day_of_week', 'start_time', 'end_time']);

            $table->index(['day_of_week', 'start_time']);
            $table->index(['room', 'day_of_week', 'start_time']);
        });
    }
};
