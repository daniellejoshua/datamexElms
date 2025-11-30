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
        // Enterprise optimization for 5K+ students
        
        // Optimize student enrollments for frequent queries
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS enrollments_student_period_idx ON student_enrollments(student_id, academic_year, semester)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS enrollments_section_status_idx ON student_enrollments(section_id, status)');
        } catch (Exception $e) {
            // Index may already exist
        }
        
        // Optimize grade tables for performance
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS grades_status_finalized_idx ON student_grades(status, finalized_at)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS grades_teacher_status_idx ON student_grades(teacher_id, status)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS shs_grades_status_finalized_idx ON shs_student_grades(status, finalized_at)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS shs_grades_teacher_status_idx ON shs_student_grades(teacher_id, status)');
        } catch (Exception $e) {
            // Index may already exist
        }
        
        // Teacher assignments optimization
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS teacher_assign_teacher_status_idx ON teacher_assignments(teacher_id, status)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS teacher_assign_section_status_idx ON teacher_assignments(section_id, status)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS teacher_assign_date_idx ON teacher_assignments(assigned_date)');
        } catch (Exception $e) {
            // Index may already exist
        }
        
        // Section and course optimization
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS sections_course_period_idx ON sections(course_id, academic_year, semester)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS sections_period_status_idx ON sections(academic_year, semester, status)');
        } catch (Exception $e) {
            // Index may already exist
        }
        
        // User authentication optimization for concurrent access
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS users_email_status_idx ON users(email, status)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS users_role_status_idx ON users(role, status)');
        } catch (Exception $e) {
            // Index may already exist  
        }
        
        // Class schedules for quick lookups
        try {
            DB::unprepared('CREATE INDEX IF NOT EXISTS schedules_section_day_idx ON class_schedules(section_id, day_of_week)');
            DB::unprepared('CREATE INDEX IF NOT EXISTS schedules_time_idx ON class_schedules(start_time, end_time)');
        } catch (Exception $e) {
            // Index may already exist
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove the indexes we created (if they exist)
        try {
            DB::unprepared('DROP INDEX IF EXISTS enrollments_student_period_idx ON student_enrollments');
            DB::unprepared('DROP INDEX IF EXISTS enrollments_section_status_idx ON student_enrollments');
            DB::unprepared('DROP INDEX IF EXISTS grades_status_finalized_idx ON student_grades');
            DB::unprepared('DROP INDEX IF EXISTS grades_teacher_status_idx ON student_grades');
            DB::unprepared('DROP INDEX IF EXISTS shs_grades_status_finalized_idx ON shs_student_grades');
            DB::unprepared('DROP INDEX IF EXISTS shs_grades_teacher_status_idx ON shs_student_grades');
            DB::unprepared('DROP INDEX IF EXISTS teacher_assign_teacher_status_idx ON teacher_assignments');
            DB::unprepared('DROP INDEX IF EXISTS teacher_assign_section_status_idx ON teacher_assignments');
            DB::unprepared('DROP INDEX IF EXISTS teacher_assign_date_idx ON teacher_assignments');
            DB::unprepared('DROP INDEX IF EXISTS sections_course_period_idx ON sections');
            DB::unprepared('DROP INDEX IF EXISTS sections_period_status_idx ON sections');
            DB::unprepared('DROP INDEX IF EXISTS users_email_status_idx ON users');
            DB::unprepared('DROP INDEX IF EXISTS users_role_status_idx ON users');
            DB::unprepared('DROP INDEX IF EXISTS schedules_section_day_idx ON class_schedules');
            DB::unprepared('DROP INDEX IF EXISTS schedules_time_idx ON class_schedules');
        } catch (Exception $e) {
            // Ignore errors during rollback
        }
    }
};
