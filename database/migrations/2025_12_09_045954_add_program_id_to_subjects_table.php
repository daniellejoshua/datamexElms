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
        Schema::table('subjects', function (Blueprint $table) {
            $table->foreignId('program_id')->nullable()->constrained('programs')->onDelete('cascade')->after('id');
            $table->index(['program_id', 'education_level', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::disableForeignKeyConstraints();

        // drop index directly in case foreign key requires it
        try {
            DB::statement('ALTER TABLE `subjects` DROP INDEX `subjects_program_id_education_level_status_index`');
        } catch (\Exception $e) {
            // ignore
        }

        Schema::table('subjects', function (Blueprint $table) {
            try {
                $table->dropForeign(['program_id']);
            } catch (\Exception $e) {
                // ignore if not exists
            }

            try {
                $table->dropColumn('program_id');
            } catch (\Exception $e) {
                // ignore
            }
        });

        Schema::enableForeignKeyConstraints();
    }
};
