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
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('program_code', 20)->unique(); // BSIT, BSCS, etc.
            $table->string('program_name'); // Bachelor of Science in Information Technology
            $table->text('description')->nullable();
            $table->enum('education_level', ['college', 'shs']);
            $table->string('track')->nullable(); // For SHS tracks
            $table->integer('total_years')->default(4); // Program duration
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();

            $table->index(['education_level', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // sections.program_id references programs.id
        if (Schema::hasTable('sections')) {
            Schema::table('sections', function (Blueprint $table) {
                try {
                    $table->dropForeign(['program_id']);
                } catch (\Exception $e) {
                    // ignore
                }
            });
        }

        Schema::dropIfExists('programs');
    }
};
