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

        Schema::disableForeignKeyConstraints();

        // drop foreign key and column with raw statements so missing objects are ignored
        try {
            DB::statement('ALTER TABLE `class_schedules` DROP FOREIGN KEY `class_schedules_section_subject_id_foreign`');
        } catch (\Exception) {
            // ignore
        }
        try {
            DB::statement('ALTER TABLE `class_schedules` DROP COLUMN `section_subject_id`');
        } catch (\Exception) {
            // ignore
        }

        // restore columns if needed
        if (! Schema::hasColumn('class_schedules', 'section_id')) {
            Schema::table('class_schedules', function (Blueprint $table) {
                $table->foreignId('section_id')->after('id')->constrained()->onDelete('cascade');
            });
        }

        if (! Schema::hasColumn('class_schedules', 'room')) {
            Schema::table('class_schedules', function (Blueprint $table) {
                $table->string('room')->nullable()->after('end_time');
            });
        }

        // repair indexes: drop old ones using raw SQL to avoid blueprint errors
        try {
            DB::statement('ALTER TABLE `class_schedules` DROP INDEX `class_schedules_section_subject_id_day_of_week_index`');
        } catch (\Exception) {
            // ignore if missing
        }
        try {
            DB::statement('ALTER TABLE `class_schedules` DROP INDEX `class_schedules_day_of_week_start_time_end_time_index`');
        } catch (\Exception) {
            // ignore
        }

        // add back the simple indexes using raw SQL to avoid duplicate-key
        // errors during execution
        try {
            DB::statement('ALTER TABLE `class_schedules` ADD INDEX `class_schedules_day_of_week_start_time_index` (`day_of_week`, `start_time`)');
        } catch (\Exception) {
            // ignore if already exists
        }
        try {
            DB::statement('ALTER TABLE `class_schedules` ADD INDEX `class_schedules_room_day_of_week_start_time_index` (`room`, `day_of_week`, `start_time`)');
        } catch (\Exception) {
            // ignore
        }

        Schema::enableForeignKeyConstraints();
    }
};
