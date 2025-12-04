<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Migrate existing student enrollments to subject-level enrollments
        // This will create individual subject enrollments for all students based on their section enrollments

        DB::statement("
            INSERT INTO student_subject_enrollments (
                student_id,
                section_subject_id,
                enrollment_type,
                enrolled_by,
                enrollment_date,
                academic_year,
                semester,
                status,
                created_at,
                updated_at
            )
            SELECT DISTINCT
                se.student_id,
                ss.id as section_subject_id,
                CASE 
                    WHEN s.student_type = 'irregular' THEN 'irregular'
                    ELSE 'regular'
                END as enrollment_type,
                se.enrolled_by,
                se.enrollment_date,
                se.academic_year,
                se.semester,
                se.status,
                NOW(),
                NOW()
            FROM student_enrollments se
            JOIN students s ON se.student_id = s.id
            JOIN section_subjects ss ON se.section_id = ss.section_id
            WHERE se.status = 'active'
            AND ss.status = 'active'
            AND NOT EXISTS (
                SELECT 1 FROM student_subject_enrollments sse 
                WHERE sse.student_id = se.student_id 
                AND sse.section_subject_id = ss.id
            )
        ");

        // Get and log the migration results
        $migratedCount = DB::table('student_subject_enrollments')->count();
        \Illuminate\Support\Facades\Log::info("Migration completed: Migrated {$migratedCount} existing enrollments to subject-level structure");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Clear all subject enrollments that were created by this migration
        // We can't perfectly reverse this as we don't know which ones were created by the migration vs manually
        // So we'll just truncate the table
        DB::table('student_subject_enrollments')->truncate();
    }
};
