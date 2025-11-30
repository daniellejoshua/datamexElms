<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration finalizes the academic structure restructuring:
     * - Ensures Programs and Subjects tables exist with correct structure
     * - Creates SectionSubject pivot table for many-to-many relationships
     * - Updates Sections table to remove subject_id (keeping only program_id)
     * - Updates ClassSchedules to reference section_subjects instead of sections
     * - Removes redundant tables and relationships
     */
    public function up(): void
    {
        // Ensure Programs table has correct structure
        if (! Schema::hasTable('programs')) {
            Schema::create('programs', function (Blueprint $table) {
                $table->id();
                $table->string('program_code', 20)->unique();
                $table->string('program_name', 255);
                $table->text('description')->nullable();
                $table->enum('education_level', ['college', 'shs', 'both'])->default('college');
                $table->string('track', 50)->nullable(); // For SHS tracks
                $table->integer('total_years')->default(4);
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->index(['education_level', 'status']);
            });
        }

        // Ensure Subjects table has correct structure
        if (! Schema::hasTable('subjects')) {
            Schema::create('subjects', function (Blueprint $table) {
                $table->id();
                $table->string('subject_code', 20)->unique();
                $table->string('subject_name', 255);
                $table->text('description')->nullable();
                $table->integer('units')->default(3);
                $table->integer('year_level'); // 1-4
                $table->enum('semester', [1, 2]); // 1st or 2nd semester
                $table->enum('subject_type', ['major', 'minor', 'general'])->default('major');
                $table->text('prerequisites')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                $table->index(['year_level', 'semester', 'status']);
            });
        }

        // Remove subject_id from sections if it exists
        if (Schema::hasColumn('sections', 'subject_id')) {
            Schema::table('sections', function (Blueprint $table) {
                // Only drop the column since the foreign key was already removed
                $table->dropColumn('subject_id');
            });
        }

        // Add year_level to sections if it doesn't exist
        if (! Schema::hasColumn('sections', 'year_level')) {
            Schema::table('sections', function (Blueprint $table) {
                $table->integer('year_level')->after('section_name')->nullable();
            });
        }

        // Add program_id to sections if it doesn't exist
        if (! Schema::hasColumn('sections', 'program_id')) {
            Schema::table('sections', function (Blueprint $table) {
                $table->foreignId('program_id')->after('id')->constrained('programs')->onDelete('cascade');
            });
        }

        // Remove course_id from sections (replaced by program_id)
        if (Schema::hasColumn('sections', 'course_id')) {
            Schema::table('sections', function (Blueprint $table) {
                $table->dropForeign(['course_id']);
                $table->dropColumn('course_id');
            });
        }

        // Remove room from sections (moved to section_subjects)
        if (Schema::hasColumn('sections', 'room')) {
            Schema::table('sections', function (Blueprint $table) {
                $table->dropColumn('room');
            });
        }

        // Create section_subjects pivot table
        if (! Schema::hasTable('section_subjects')) {
            Schema::create('section_subjects', function (Blueprint $table) {
                $table->id();
                $table->foreignId('section_id')->constrained()->onDelete('cascade');
                $table->foreignId('subject_id')->constrained()->onDelete('cascade');
                $table->foreignId('teacher_id')->nullable()->constrained()->onDelete('set null');
                $table->string('room')->nullable();
                $table->enum('status', ['active', 'inactive'])->default('active');
                $table->timestamps();

                // Ensure unique combination of section and subject
                $table->unique(['section_id', 'subject_id']);

                // Add indexes for better performance
                $table->index(['section_id', 'status']);
                $table->index(['subject_id', 'status']);
                $table->index(['teacher_id']);
            });
        }

        // Update class_schedules to reference section_subjects (skip if already done)
        if (Schema::hasColumn('class_schedules', 'section_id')) {
            Schema::table('class_schedules', function (Blueprint $table) {
                // Drop existing foreign key and column
                $table->dropForeign(['section_id']);
                $table->dropColumn('section_id');

                // Add new foreign key to section_subjects
                $table->foreignId('section_subject_id')->after('id')->constrained('section_subjects')->onDelete('cascade');

                // Remove room column since it's now in section_subjects
                if (Schema::hasColumn('class_schedules', 'room')) {
                    $table->dropColumn('room');
                }

                // Update indexes
                $table->dropIndex(['day_of_week', 'start_time']);
                if (Schema::hasColumn('class_schedules', 'room')) {
                    $table->dropIndex(['room', 'day_of_week', 'start_time']);
                }

                // Add new indexes
                $table->index(['section_subject_id', 'day_of_week']);
                $table->index(['day_of_week', 'start_time', 'end_time']);
            });
        }

        // Drop the courses table since it's no longer needed in the new structure
        Schema::dropIfExists('courses');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Restore class_schedules structure
        if (Schema::hasColumn('class_schedules', 'section_subject_id')) {
            Schema::table('class_schedules', function (Blueprint $table) {
                $table->dropForeign(['section_subject_id']);
                $table->dropColumn('section_subject_id');

                $table->foreignId('section_id')->after('id')->constrained()->onDelete('cascade');
                $table->string('room')->nullable()->after('end_time');

                $table->dropIndex(['section_subject_id', 'day_of_week']);
                $table->dropIndex(['day_of_week', 'start_time', 'end_time']);

                $table->index(['day_of_week', 'start_time']);
                $table->index(['room', 'day_of_week', 'start_time']);
            });
        }

        // Drop section_subjects table
        Schema::dropIfExists('section_subjects');

        // Restore sections structure
        Schema::table('sections', function (Blueprint $table) {
            $table->foreignId('subject_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('room')->nullable();
        });
    }
};
