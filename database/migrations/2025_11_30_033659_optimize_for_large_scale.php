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
        // Optimize audit_logs for high volume (5K+ students)
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->index(['created_at', 'user_id'], 'audit_logs_created_user_idx');
            $table->index(['academic_year', 'semester'], 'audit_logs_academic_idx');
            $table->index(['auditable_type', 'auditable_id', 'event'], 'audit_logs_auditable_idx');
        });
        
        // Optimize grade_versions for frequent access (only if is_pre_finalization exists)
        if (Schema::hasColumn('grade_versions', 'is_pre_finalization')) {
            Schema::table('grade_versions', function (Blueprint $table) {
                $table->index(['student_grade_id', 'version_number'], 'grade_versions_student_ver_idx');
                $table->index(['shs_student_grade_id', 'version_number'], 'grade_versions_shs_ver_idx');
                $table->index(['teacher_id', 'created_at'], 'grade_versions_teacher_idx');
                $table->index(['academic_year', 'semester', 'is_pre_finalization'], 'grade_versions_academic_idx');
            });
        } else {
            Schema::table('grade_versions', function (Blueprint $table) {
                $table->index(['student_grade_id', 'version_number'], 'grade_versions_student_ver_idx');
                $table->index(['shs_student_grade_id', 'version_number'], 'grade_versions_shs_ver_idx');
                $table->index(['teacher_id', 'created_at'], 'grade_versions_teacher_idx');
                $table->index(['academic_year', 'semester'], 'grade_versions_academic_basic_idx');
            });
        }
        
        // Student performance indexes for large scale
        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->index(['student_id', 'academic_year', 'semester'], 'enrollments_student_period_idx');
            $table->index(['section_id', 'status'], 'enrollments_section_status_idx');
        });
        
        Schema::table('student_grades', function (Blueprint $table) {
            $table->index(['status', 'finalized_at'], 'grades_status_finalized_idx');
            $table->index(['teacher_id', 'status'], 'grades_teacher_status_idx');
        });
        
        Schema::table('shs_student_grades', function (Blueprint $table) {
            $table->index(['status', 'finalized_at'], 'shs_grades_status_finalized_idx');
            $table->index(['teacher_id', 'status'], 'shs_grades_teacher_status_idx');
        });
        
        // Teacher workload indexes for 5K+ students
        Schema::table('sections', function (Blueprint $table) {
            $table->index(['course_id', 'academic_year', 'semester'], 'sections_course_period_idx');
            $table->index(['academic_year', 'semester', 'status'], 'sections_period_status_idx');
        });
        
        Schema::table('teacher_assignments', function (Blueprint $table) {
            $table->index(['teacher_id', 'status'], 'teacher_assign_teacher_status_idx');
            $table->index(['section_id', 'status'], 'teacher_assign_section_status_idx');
            $table->index(['assigned_date'], 'teacher_assign_date_idx');
        });
        
        // User session optimization for concurrent access
        Schema::table('sessions', function (Blueprint $table) {
            $table->index(['user_id', 'last_activity'], 'sessions_user_activity_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropIndex('audit_logs_created_user_idx');
            $table->dropIndex('audit_logs_academic_idx');
            $table->dropIndex('audit_logs_auditable_idx');
        });
        
        Schema::table('grade_versions', function (Blueprint $table) {
            $table->dropIndex('grade_versions_student_ver_idx');
            $table->dropIndex('grade_versions_shs_ver_idx');
            $table->dropIndex('grade_versions_teacher_idx');
            $table->dropIndex('grade_versions_academic_idx');
        });
        
        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->dropIndex('enrollments_student_period_idx');
            $table->dropIndex('enrollments_section_status_idx');
        });
        
        Schema::table('student_grades', function (Blueprint $table) {
            $table->dropIndex('grades_status_finalized_idx');
            $table->dropIndex('grades_teacher_status_idx');
        });
        
        Schema::table('shs_student_grades', function (Blueprint $table) {
            $table->dropIndex('shs_grades_status_finalized_idx');
            $table->dropIndex('shs_grades_teacher_status_idx');
        });
        
        Schema::table('sections', function (Blueprint $table) {
            $table->dropIndex('sections_teacher_period_idx');
            $table->dropIndex('sections_course_year_idx');
        });
        
        Schema::table('sessions', function (Blueprint $table) {
            $table->dropIndex('sessions_user_activity_idx');
        });
    }
};
