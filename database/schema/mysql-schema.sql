/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `announcement_attachments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_attachments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `announcement_id` bigint unsigned NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_hash` varchar(64) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloudinary_public_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cloudinary_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_format` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image_width` int DEFAULT NULL,
  `image_height` int DEFAULT NULL,
  `is_duplicate` tinyint(1) NOT NULL DEFAULT '0',
  `download_count` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `announcement_attachments_announcement_id_index` (`announcement_id`),
  KEY `announcement_attachments_file_type_index` (`file_type`),
  KEY `announcement_attachments_file_hash_index` (`file_hash`),
  CONSTRAINT `announcement_attachments_announcement_id_foreign` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `announcement_read_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcement_read_status` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `announcement_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `read_at` timestamp NULL DEFAULT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `announcement_read_status_announcement_id_user_id_unique` (`announcement_id`,`user_id`),
  KEY `announcement_read_status_user_id_is_read_index` (`user_id`,`is_read`),
  CONSTRAINT `announcement_read_status_announcement_id_foreign` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_read_status_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `visibility` enum('teachers_only','all_users','students_only','admins_only','registrars_only','employees_only') COLLATE utf8mb4_unicode_ci DEFAULT 'all_users',
  `priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `is_published` tinyint(1) NOT NULL DEFAULT '0',
  `published_at` timestamp NULL DEFAULT NULL,
  `scheduled_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `is_archived` tinyint(1) NOT NULL DEFAULT '0',
  `archived_at` timestamp NULL DEFAULT NULL,
  `rich_content` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `announcements_visibility_is_published_is_archived_index` (`visibility`,`is_published`,`is_archived`),
  KEY `announcements_created_by_is_published_index` (`created_by`,`is_published`),
  KEY `announcements_priority_published_at_index` (`priority`,`published_at`),
  KEY `announcements_expires_at_index` (`expires_at`),
  CONSTRAINT `announcements_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `archived_sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archived_sections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `original_section_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `section_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('first','second','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('completed','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'completed',
  `course_data` json NOT NULL,
  `total_enrolled_students` int NOT NULL,
  `completed_students` int NOT NULL,
  `dropped_students` int NOT NULL,
  `section_average_grade` decimal(5,2) DEFAULT NULL,
  `archived_at` timestamp NOT NULL,
  `archived_by` bigint unsigned NOT NULL,
  `archive_notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `year_level` int DEFAULT NULL,
  `program_id` bigint unsigned DEFAULT NULL,
  `curriculum_id` bigint unsigned DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `archived_sections_archived_by_foreign` (`archived_by`),
  KEY `archived_sections_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `archived_sections_archived_at_index` (`archived_at`),
  KEY `archived_sections_program_id_foreign` (`program_id`),
  KEY `archived_sections_curriculum_id_foreign` (`curriculum_id`),
  CONSTRAINT `archived_sections_archived_by_foreign` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`),
  CONSTRAINT `archived_sections_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`),
  CONSTRAINT `archived_sections_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `archived_student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archived_student_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `archived_section_id` bigint unsigned NOT NULL,
  `student_id` bigint unsigned NOT NULL,
  `original_enrollment_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('first','second','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrolled_date` date NOT NULL,
  `completion_date` date DEFAULT NULL,
  `final_status` enum('completed','dropped','failed','incomplete') COLLATE utf8mb4_unicode_ci NOT NULL,
  `final_grades` json DEFAULT NULL,
  `final_semester_grade` decimal(5,2) DEFAULT NULL,
  `letter_grade` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_data` json NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `archived_student_enrollments_archived_section_id_foreign` (`archived_section_id`),
  KEY `archived_student_enrollments_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `archived_student_enrollments_student_id_index` (`student_id`),
  KEY `archived_student_enrollments_final_status_index` (`final_status`),
  CONSTRAINT `archived_student_enrollments_archived_section_id_foreign` FOREIGN KEY (`archived_section_id`) REFERENCES `archived_sections` (`id`),
  CONSTRAINT `archived_student_enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `archived_students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archived_students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `original_student_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `program_id` bigint unsigned DEFAULT NULL,
  `student_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` int DEFAULT NULL,
  `parent_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `education_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `track` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `strand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrolled_date` date DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `archived_at` timestamp NOT NULL,
  `archived_by` bigint unsigned NOT NULL,
  `archive_notes` text COLLATE utf8mb4_unicode_ci,
  `student_data` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `archived_students_original_student_id_foreign` (`original_student_id`),
  KEY `archived_students_user_id_foreign` (`user_id`),
  KEY `archived_students_program_id_foreign` (`program_id`),
  KEY `archived_students_archived_by_foreign` (`archived_by`),
  CONSTRAINT `archived_students_archived_by_foreign` FOREIGN KEY (`archived_by`) REFERENCES `users` (`id`),
  CONSTRAINT `archived_students_original_student_id_foreign` FOREIGN KEY (`original_student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `archived_students_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `archived_students_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned DEFAULT NULL,
  `user_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `event` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auditable_id` bigint unsigned DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `semester` enum('1st','2nd') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_user_id_created_at_index` (`user_id`,`created_at`),
  KEY `audit_logs_auditable_type_auditable_id_index` (`auditable_type`,`auditable_id`),
  KEY `audit_logs_event_created_at_index` (`event`,`created_at`),
  KEY `audit_logs_created_at_index` (`created_at`),
  CONSTRAINT `audit_logs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `cache_locks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `class_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `class_schedules` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `section_subject_id` bigint unsigned NOT NULL,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') COLLATE utf8mb4_unicode_ci NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `created_by` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `class_schedules_created_by_foreign` (`created_by`),
  KEY `class_schedules_section_id_day_of_week_index` (`day_of_week`),
  KEY `class_schedules_section_subject_id_day_of_week_index` (`section_subject_id`,`day_of_week`),
  KEY `class_schedules_day_of_week_start_time_end_time_index` (`day_of_week`,`start_time`,`end_time`),
  CONSTRAINT `class_schedules_created_by_foreign` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `class_schedules_section_subject_id_foreign` FOREIGN KEY (`section_subject_id`) REFERENCES `section_subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `course_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_materials` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `section_id` bigint unsigned NOT NULL,
  `section_subject_id` bigint unsigned DEFAULT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SHA256 hash for duplicate detection',
  `referenced_file_id` bigint unsigned DEFAULT NULL COMMENT 'Points to original file ID if this is a reference, NULL if original',
  `file_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_size` bigint NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('lecture','assignment','reading','exam','other') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'other',
  `visibility` enum('all_students','specific_students') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'all_students',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `upload_date` date NOT NULL DEFAULT '2026-01-22',
  `download_count` int NOT NULL DEFAULT '0',
  `version_number` int NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_materials_section_id_category_index` (`section_id`,`category`),
  KEY `course_materials_teacher_id_is_active_index` (`teacher_id`,`is_active`),
  KEY `course_materials_category_upload_date_index` (`category`,`upload_date`),
  KEY `course_materials_file_hash_index` (`file_hash`),
  KEY `course_materials_referenced_file_id_index` (`referenced_file_id`),
  KEY `course_materials_section_subject_id_teacher_id_index` (`section_subject_id`,`teacher_id`),
  CONSTRAINT `course_materials_referenced_file_id_foreign` FOREIGN KEY (`referenced_file_id`) REFERENCES `course_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_materials_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_materials_section_subject_id_foreign` FOREIGN KEY (`section_subject_id`) REFERENCES `section_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_materials_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curriculum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curriculum` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_id` bigint unsigned NOT NULL,
  `curriculum_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `curriculum_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `is_current` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `curricula_curriculum_code_unique` (`curriculum_code`),
  KEY `curricula_program_id_status_index` (`program_id`,`status`),
  CONSTRAINT `curricula_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `curriculum_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `curriculum_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `curriculum_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned DEFAULT NULL,
  `subject_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `units` decimal(3,1) NOT NULL,
  `hours` int DEFAULT NULL,
  `year_level` int NOT NULL,
  `semester` enum('1st','2nd','Summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_type` enum('major','minor','general','elective','core','applied','specialized','pe','internship') COLLATE utf8mb4_unicode_ci DEFAULT 'major',
  `prerequisites` json DEFAULT NULL,
  `is_lab` tinyint(1) NOT NULL DEFAULT '0',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `curriculum_subjects_curriculum_id_subject_id_unique` (`curriculum_id`,`subject_id`),
  KEY `curriculum_subjects_curriculum_id_year_level_semester_index` (`curriculum_id`,`year_level`,`semester`),
  KEY `curriculum_subjects_subject_type_status_index` (`subject_type`,`status`),
  KEY `curriculum_subjects_subject_id_foreign` (`subject_id`),
  CONSTRAINT `curriculum_subjects_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `curriculum_subjects_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `grade_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grade_versions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_grade_id` bigint unsigned DEFAULT NULL,
  `shs_student_grade_id` bigint unsigned DEFAULT NULL,
  `version_number` int NOT NULL DEFAULT '1',
  `grade_type` enum('college','shs') COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prelim_grade` decimal(5,2) DEFAULT NULL,
  `midterm_grade` decimal(5,2) DEFAULT NULL,
  `prefinals_grade` decimal(5,2) DEFAULT NULL,
  `finals_grade` decimal(5,2) DEFAULT NULL,
  `semester_grade` decimal(5,2) DEFAULT NULL,
  `first_quarter_grade` decimal(5,2) DEFAULT NULL,
  `second_quarter_grade` decimal(5,2) DEFAULT NULL,
  `third_quarter_grade` decimal(5,2) DEFAULT NULL,
  `fourth_quarter_grade` decimal(5,2) DEFAULT NULL,
  `final_grade` decimal(5,2) DEFAULT NULL,
  `change_reason` text COLLATE utf8mb4_unicode_ci,
  `teacher_remarks` text COLLATE utf8mb4_unicode_ci,
  `change_type` enum('initial','correction','recalculation','administrative') COLLATE utf8mb4_unicode_ci NOT NULL,
  `requires_approval` tinyint(1) NOT NULL DEFAULT '0',
  `is_approved` tinyint(1) NOT NULL DEFAULT '1',
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd') COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `is_pre_finalization` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `grade_versions_approved_by_foreign` (`approved_by`),
  KEY `grade_versions_student_grade_id_version_number_index` (`student_grade_id`,`version_number`),
  KEY `grade_versions_shs_student_grade_id_version_number_index` (`shs_student_grade_id`,`version_number`),
  KEY `grade_versions_teacher_id_created_at_index` (`teacher_id`,`created_at`),
  KEY `grade_versions_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `grade_versions_student_grade_id_is_pre_finalization_index` (`student_grade_id`,`is_pre_finalization`),
  KEY `grade_versions_shs_student_grade_id_is_pre_finalization_index` (`shs_student_grade_id`,`is_pre_finalization`),
  CONSTRAINT `grade_versions_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `grade_versions_shs_student_grade_id_foreign` FOREIGN KEY (`shs_student_grade_id`) REFERENCES `shs_student_grades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grade_versions_student_grade_id_foreign` FOREIGN KEY (`student_grade_id`) REFERENCES `student_grades` (`id`) ON DELETE CASCADE,
  CONSTRAINT `grade_versions_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `material_access_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material_access_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `material_id` bigint unsigned NOT NULL,
  `accessed_at` timestamp NOT NULL DEFAULT '2026-01-22 05:51:08',
  `download_completed` tinyint(1) NOT NULL DEFAULT '0',
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `material_access_logs_student_id_accessed_at_index` (`student_id`,`accessed_at`),
  KEY `material_access_logs_material_id_accessed_at_index` (`material_id`,`accessed_at`),
  KEY `material_access_logs_accessed_at_index` (`accessed_at`),
  CONSTRAINT `material_access_logs_material_id_foreign` FOREIGN KEY (`material_id`) REFERENCES `course_materials` (`id`) ON DELETE CASCADE,
  CONSTRAINT `material_access_logs_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `password_reset_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `payment_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payment_transactions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `payable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payable_id` bigint unsigned NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_type` enum('enrollment_fee','prelim_payment','midterm_payment','prefinal_payment','final_payment','irregular_subject_fee','penalty','refund') COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_method` enum('cash','check','bank_transfer','online','installment') COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `processed_by` bigint unsigned NOT NULL,
  `payment_date` timestamp NOT NULL,
  `status` enum('pending','completed','failed','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `payment_transactions_payable_type_payable_id_index` (`payable_type`,`payable_id`),
  KEY `payment_transactions_processed_by_foreign` (`processed_by`),
  KEY `payment_transactions_student_id_payment_type_index` (`student_id`,`payment_type`),
  KEY `payment_transactions_payment_date_status_index` (`payment_date`,`status`),
  KEY `payment_transactions_reference_number_index` (`reference_number`),
  CONSTRAINT `payment_transactions_processed_by_foreign` FOREIGN KEY (`processed_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `payment_transactions_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `personal_access_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `personal_access_tokens` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `tokenable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tokenable_id` bigint unsigned NOT NULL,
  `name` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `abilities` text COLLATE utf8mb4_unicode_ci,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `personal_access_tokens_token_unique` (`token`),
  KEY `personal_access_tokens_tokenable_type_tokenable_id_index` (`tokenable_type`,`tokenable_id`),
  KEY `personal_access_tokens_expires_at_index` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `program_curriculum`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_curriculum` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `curriculum_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_curriculum_program_id_academic_year_unique` (`program_id`,`academic_year`),
  KEY `program_curriculum_curriculum_id_foreign` (`curriculum_id`),
  CONSTRAINT `program_curriculum_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `program_curriculum_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `program_fees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `program_fees` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_id` bigint unsigned NOT NULL,
  `year_level` int NOT NULL,
  `education_level` enum('college','shs') COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fee_type` enum('regular','irregular') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_year_fee_unique` (`program_id`,`year_level`,`education_level`,`fee_type`),
  KEY `program_fees_program_id_year_level_education_level_index` (`program_id`,`year_level`,`education_level`),
  CONSTRAINT `program_fees_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `programs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `program_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `education_level` enum('college','senior_high','associate') COLLATE utf8mb4_unicode_ci NOT NULL,
  `track` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_years` int NOT NULL DEFAULT '4',
  `semester_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `programs_program_code_unique` (`program_code`),
  KEY `programs_education_level_status_index` (`education_level`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `school_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `school_settings` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'string',
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `school_settings_key_unique` (`key`),
  KEY `school_settings_key_index` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `section_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `section_subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `section_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `teacher_id` bigint unsigned DEFAULT NULL,
  `room` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `schedule_days` json DEFAULT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `section_subjects_section_id_subject_id_unique` (`section_id`,`subject_id`),
  KEY `section_subjects_section_id_status_index` (`section_id`,`status`),
  KEY `section_subjects_subject_id_status_index` (`subject_id`,`status`),
  KEY `section_subjects_teacher_id_index` (`teacher_id`),
  CONSTRAINT `section_subjects_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `section_subjects_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `section_subjects_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sections`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sections` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_id` bigint unsigned NOT NULL,
  `curriculum_id` bigint unsigned DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1st',
  `section_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` int DEFAULT NULL,
  `status` enum('active','inactive','archived') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `sections_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `sections_course_id_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `sections_program_id_foreign` (`program_id`),
  KEY `sections_curriculum_id_foreign` (`curriculum_id`),
  CONSTRAINT `sections_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sections_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `semester_finalizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `semester_finalizations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `academic_year` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `education_level` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `track` varchar(32) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `finalized_at` timestamp NOT NULL,
  `finalized_by` bigint unsigned NOT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `semester_finalizations_unique` (`academic_year`,`semester`,`education_level`,`track`),
  KEY `semester_finalizations_finalized_by_foreign` (`finalized_by`),
  CONSTRAINT `semester_finalizations_finalized_by_foreign` FOREIGN KEY (`finalized_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shs_student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shs_student_grades` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_enrollment_id` bigint unsigned NOT NULL,
  `section_subject_id` bigint unsigned DEFAULT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `first_quarter_grade` decimal(5,2) DEFAULT NULL,
  `first_quarter_submitted_at` timestamp NULL DEFAULT NULL,
  `second_quarter_grade` decimal(5,2) DEFAULT NULL,
  `second_quarter_submitted_at` timestamp NULL DEFAULT NULL,
  `third_quarter_grade` decimal(5,2) DEFAULT NULL,
  `third_quarter_submitted_at` timestamp NULL DEFAULT NULL,
  `fourth_quarter_grade` decimal(5,2) DEFAULT NULL,
  `fourth_quarter_submitted_at` timestamp NULL DEFAULT NULL,
  `final_grade` decimal(5,2) DEFAULT NULL,
  `completion_status` enum('passed','failed','incomplete','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `teacher_remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shs_student_grades_student_enrollment_id_teacher_id_unique` (`student_enrollment_id`,`teacher_id`),
  UNIQUE KEY `shs_student_grades_enrollment_section_subject_teacher_unique` (`student_enrollment_id`,`section_subject_id`,`teacher_id`),
  KEY `shs_student_grades_teacher_id_foreign` (`teacher_id`),
  KEY `shs_student_grades_student_enrollment_id_completion_status_index` (`student_enrollment_id`,`completion_status`),
  KEY `shs_student_grades_section_subject_id_foreign` (`section_subject_id`),
  CONSTRAINT `shs_student_grades_section_subject_id_foreign` FOREIGN KEY (`section_subject_id`) REFERENCES `section_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shs_student_grades_student_enrollment_id_foreign` FOREIGN KEY (`student_enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `shs_student_grades_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `shs_student_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shs_student_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','annual') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_quarter_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `first_quarter_paid` tinyint(1) NOT NULL DEFAULT '0',
  `first_quarter_payment_date` date DEFAULT NULL,
  `second_quarter_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `second_quarter_paid` tinyint(1) NOT NULL DEFAULT '0',
  `second_quarter_payment_date` date DEFAULT NULL,
  `third_quarter_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `third_quarter_paid` tinyint(1) NOT NULL DEFAULT '0',
  `third_quarter_payment_date` date DEFAULT NULL,
  `fourth_quarter_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `fourth_quarter_paid` tinyint(1) NOT NULL DEFAULT '0',
  `fourth_quarter_payment_date` date DEFAULT NULL,
  `total_semester_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shs_student_payments_student_id_academic_year_semester_unique` (`student_id`,`academic_year`,`semester`),
  KEY `shs_student_payments_academic_year_semester_index` (`academic_year`,`semester`),
  CONSTRAINT `shs_student_payments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_academic_transcripts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_academic_transcripts` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `course_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `units` int NOT NULL,
  `student_enrollment_id` bigint unsigned NOT NULL,
  `section_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `teacher_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prelim_grade` decimal(5,2) DEFAULT NULL,
  `midterm_grade` decimal(5,2) DEFAULT NULL,
  `prefinal_grade` decimal(5,2) DEFAULT NULL,
  `final_grade` decimal(5,2) DEFAULT NULL,
  `semester_grade` decimal(5,2) DEFAULT NULL,
  `completion_status` enum('completed','incomplete','dropped','failed','transferred') COLLATE utf8mb4_unicode_ci NOT NULL,
  `grade_status` enum('passed','failed','inc','drp') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `attempt_number` int NOT NULL DEFAULT '1',
  `grade_points` decimal(5,2) DEFAULT NULL,
  `quality_points` decimal(5,2) DEFAULT NULL,
  `enrollment_date` date NOT NULL,
  `completion_date` date DEFAULT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_academic_transcripts_student_enrollment_id_foreign` (`student_enrollment_id`),
  KEY `student_academic_transcripts_teacher_id_foreign` (`teacher_id`),
  KEY `idx_student_academic_period` (`student_id`,`academic_year`,`semester`),
  KEY `idx_student_course` (`student_id`,`course_code`),
  KEY `idx_student_completion` (`student_id`,`completion_status`),
  KEY `idx_academic_period` (`academic_year`,`semester`),
  KEY `idx_course_year` (`course_code`,`academic_year`),
  CONSTRAINT `student_academic_transcripts_student_enrollment_id_foreign` FOREIGN KEY (`student_enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_academic_transcripts_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_academic_transcripts_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_credit_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_credit_transfers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `previous_program_id` bigint unsigned DEFAULT NULL,
  `new_program_id` bigint unsigned NOT NULL,
  `previous_curriculum_id` bigint unsigned DEFAULT NULL,
  `new_curriculum_id` bigint unsigned NOT NULL,
  `subject_id` bigint unsigned DEFAULT NULL,
  `subject_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_subject_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `original_subject_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `units` decimal(5,2) NOT NULL,
  `year_level` int NOT NULL,
  `semester` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transfer_type` enum('shiftee','transferee') COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_status` enum('credited','for_catchup','pending','rejected') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `previous_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `verified_semester_grade` decimal(5,2) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_credit_transfers_previous_program_id_foreign` (`previous_program_id`),
  KEY `student_credit_transfers_new_program_id_foreign` (`new_program_id`),
  KEY `student_credit_transfers_previous_curriculum_id_foreign` (`previous_curriculum_id`),
  KEY `student_credit_transfers_new_curriculum_id_foreign` (`new_curriculum_id`),
  KEY `student_credit_transfers_subject_id_foreign` (`subject_id`),
  KEY `student_credit_transfers_approved_by_foreign` (`approved_by`),
  KEY `student_credit_transfers_student_id_transfer_type_index` (`student_id`,`transfer_type`),
  KEY `student_credit_transfers_credit_status_index` (`credit_status`),
  CONSTRAINT `student_credit_transfers_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_credit_transfers_new_curriculum_id_foreign` FOREIGN KEY (`new_curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_credit_transfers_new_program_id_foreign` FOREIGN KEY (`new_program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_credit_transfers_previous_curriculum_id_foreign` FOREIGN KEY (`previous_curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_credit_transfers_previous_program_id_foreign` FOREIGN KEY (`previous_program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_credit_transfers_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_credit_transfers_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `section_id` bigint unsigned DEFAULT NULL,
  `enrollment_date` date NOT NULL,
  `completion_date` datetime DEFAULT NULL,
  `enrolled_by` bigint unsigned NOT NULL,
  `status` enum('active','dropped','transferred','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `transfer_date` date DEFAULT NULL,
  `transfer_to` bigint unsigned DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1st',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_enrollments_enrolled_by_foreign` (`enrolled_by`),
  KEY `student_enrollments_transfer_to_foreign` (`transfer_to`),
  KEY `student_enrollments_student_id_status_index` (`student_id`,`status`),
  KEY `student_enrollments_section_id_status_index` (`section_id`,`status`),
  KEY `student_enrollments_academic_year_semester_index` (`academic_year`,`semester`),
  CONSTRAINT `student_enrollments_enrolled_by_foreign` FOREIGN KEY (`enrolled_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_enrollments_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_enrollments_transfer_to_foreign` FOREIGN KEY (`transfer_to`) REFERENCES `sections` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_grade_summaries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_grade_summaries` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_units_enrolled` int NOT NULL DEFAULT '0',
  `total_units_completed` int NOT NULL DEFAULT '0',
  `total_units_passed` int NOT NULL DEFAULT '0',
  `total_units_failed` int NOT NULL DEFAULT '0',
  `total_subjects_enrolled` int NOT NULL DEFAULT '0',
  `total_subjects_completed` int NOT NULL DEFAULT '0',
  `total_subjects_passed` int NOT NULL DEFAULT '0',
  `total_subjects_failed` int NOT NULL DEFAULT '0',
  `semester_gpa` decimal(4,2) DEFAULT NULL,
  `cumulative_gpa` decimal(4,2) DEFAULT NULL,
  `total_quality_points` decimal(8,2) NOT NULL DEFAULT '0.00',
  `total_grade_points` decimal(8,2) NOT NULL DEFAULT '0.00',
  `academic_standing` enum('dean_list','good_standing','probation','dropped') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `honors_eligibility` tinyint(1) NOT NULL DEFAULT '0',
  `semester_completed` tinyint(1) NOT NULL DEFAULT '0',
  `semester_completion_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unq_student_semester` (`student_id`,`academic_year`,`semester`),
  KEY `idx_grade_summary_period` (`student_id`,`academic_year`,`semester`),
  KEY `idx_student_completion_status` (`student_id`,`semester_completed`),
  KEY `idx_academic_standing` (`academic_standing`),
  CONSTRAINT `student_grade_summaries_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_grades`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_grades` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_enrollment_id` bigint unsigned NOT NULL,
  `section_subject_id` bigint unsigned DEFAULT NULL,
  `teacher_id` bigint unsigned NOT NULL,
  `prelim_grade` decimal(5,2) DEFAULT NULL COMMENT 'Grade out of 100',
  `midterm_grade` decimal(5,2) DEFAULT NULL COMMENT 'Grade out of 100',
  `prefinal_grade` decimal(5,2) DEFAULT NULL COMMENT 'Grade out of 100',
  `final_grade` decimal(5,2) DEFAULT NULL COMMENT 'Grade out of 100',
  `semester_grade` decimal(5,2) DEFAULT NULL COMMENT 'Average of all terms',
  `prelim_submitted_at` timestamp NULL DEFAULT NULL,
  `midterm_submitted_at` timestamp NULL DEFAULT NULL,
  `prefinal_submitted_at` timestamp NULL DEFAULT NULL,
  `final_submitted_at` timestamp NULL DEFAULT NULL,
  `semester_grade_computed_at` timestamp NULL DEFAULT NULL,
  `overall_status` enum('pending','passed','failed','incomplete') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `teacher_remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_grades_enrollment_section_subject_teacher_unique` (`student_enrollment_id`,`section_subject_id`,`teacher_id`),
  KEY `student_grades_student_enrollment_id_index` (`student_enrollment_id`),
  KEY `student_grades_teacher_id_created_at_index` (`teacher_id`,`created_at`),
  KEY `student_grades_overall_status_index` (`overall_status`),
  KEY `student_grades_section_subject_id_foreign` (`section_subject_id`),
  CONSTRAINT `student_grades_section_subject_id_foreign` FOREIGN KEY (`section_subject_id`) REFERENCES `section_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_grades_student_enrollment_id_foreign` FOREIGN KEY (`student_enrollment_id`) REFERENCES `student_enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_grades_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_semester_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_semester_payments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `enrollment_fee` decimal(8,2) NOT NULL DEFAULT '0.00',
  `enrollment_paid` tinyint(1) NOT NULL DEFAULT '0',
  `enrollment_payment_date` date DEFAULT NULL,
  `prelim_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prelim_paid` tinyint(1) NOT NULL DEFAULT '0',
  `prelim_payment_date` date DEFAULT NULL,
  `midterm_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `midterm_paid` tinyint(1) NOT NULL DEFAULT '0',
  `midterm_payment_date` date DEFAULT NULL,
  `prefinal_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `prefinal_paid` tinyint(1) NOT NULL DEFAULT '0',
  `prefinal_payment_date` date DEFAULT NULL,
  `final_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `final_paid` tinyint(1) NOT NULL DEFAULT '0',
  `final_payment_date` date DEFAULT NULL,
  `irregular_subject_fee` decimal(8,2) NOT NULL DEFAULT '300.00',
  `irregular_subjects_count` int NOT NULL DEFAULT '0',
  `credit_transfer_deduction` decimal(8,2) NOT NULL DEFAULT '300.00',
  `credit_transfer_subjects_count` int NOT NULL DEFAULT '0',
  `total_semester_fee` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `balance` decimal(10,2) NOT NULL DEFAULT '0.00',
  `payment_plan` enum('full','installment','custom') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'installment',
  `status` enum('pending','partial','completed','overdue') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_semester_payment` (`student_id`,`academic_year`,`semester`),
  KEY `student_semester_payments_academic_year_semester_index` (`academic_year`,`semester`),
  KEY `student_semester_payments_student_id_academic_year_index` (`student_id`,`academic_year`),
  KEY `student_semester_payments_student_id_status_index` (`student_id`,`status`),
  KEY `student_semester_payments_academic_year_semester_status_index` (`academic_year`,`semester`,`status`),
  CONSTRAINT `student_semester_payments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_subject_credits`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_subject_credits` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `curriculum_subject_id` bigint unsigned DEFAULT NULL,
  `subject_id` bigint unsigned NOT NULL,
  `subject_code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `units` int NOT NULL,
  `year_level` int NOT NULL,
  `semester` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `credit_type` enum('regular','transfer','equivalency') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `credit_status` enum('credited','in_progress','failed','pending') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'in_progress',
  `final_grade` decimal(5,2) DEFAULT NULL,
  `credited_at` timestamp NULL DEFAULT NULL,
  `student_grade_id` bigint unsigned DEFAULT NULL,
  `student_credit_transfer_id` bigint unsigned DEFAULT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `semester_taken` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `approved_by` bigint unsigned DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_subject_credits_student_id_curriculum_subject_id_unique` (`student_id`,`curriculum_subject_id`),
  KEY `student_subject_credits_curriculum_subject_id_foreign` (`curriculum_subject_id`),
  KEY `student_subject_credits_subject_id_foreign` (`subject_id`),
  KEY `student_subject_credits_student_grade_id_foreign` (`student_grade_id`),
  KEY `student_subject_credits_student_credit_transfer_id_foreign` (`student_credit_transfer_id`),
  KEY `student_subject_credits_approved_by_foreign` (`approved_by`),
  KEY `student_subject_credits_student_id_credit_status_index` (`student_id`,`credit_status`),
  KEY `student_subject_credits_student_id_curriculum_subject_id_index` (`student_id`,`curriculum_subject_id`),
  CONSTRAINT `student_subject_credits_approved_by_foreign` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_subject_credits_curriculum_subject_id_foreign` FOREIGN KEY (`curriculum_subject_id`) REFERENCES `curriculum_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_subject_credits_student_credit_transfer_id_foreign` FOREIGN KEY (`student_credit_transfer_id`) REFERENCES `student_credit_transfers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_subject_credits_student_grade_id_foreign` FOREIGN KEY (`student_grade_id`) REFERENCES `student_grades` (`id`) ON DELETE SET NULL,
  CONSTRAINT `student_subject_credits_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_subject_credits_subject_id_foreign` FOREIGN KEY (`subject_id`) REFERENCES `subjects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `student_subject_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_subject_enrollments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `student_id` bigint unsigned NOT NULL,
  `section_subject_id` bigint unsigned NOT NULL,
  `enrollment_type` enum('regular','irregular') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `academic_year` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `semester` enum('1st','2nd','summer') COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('active','dropped','completed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `enrollment_date` date NOT NULL,
  `enrolled_by` bigint unsigned NOT NULL,
  `remarks` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_subject_enrollment` (`student_id`,`section_subject_id`,`academic_year`,`semester`),
  KEY `student_subject_enrollments_enrolled_by_foreign` (`enrolled_by`),
  KEY `student_subject_enrollments_student_id_status_index` (`student_id`,`status`),
  KEY `student_subject_enrollments_section_subject_id_status_index` (`section_subject_id`,`status`),
  KEY `student_subject_enrollments_academic_year_semester_status_index` (`academic_year`,`semester`,`status`),
  KEY `student_subject_enrollments_enrollment_type_status_index` (`enrollment_type`,`status`),
  CONSTRAINT `student_subject_enrollments_enrolled_by_foreign` FOREIGN KEY (`enrolled_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT,
  CONSTRAINT `student_subject_enrollments_section_subject_id_foreign` FOREIGN KEY (`section_subject_id`) REFERENCES `section_subjects` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_subject_enrollments_student_id_foreign` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `program_id` bigint unsigned NOT NULL,
  `previous_program_id` bigint unsigned DEFAULT NULL,
  `previous_school` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_year_level` int NOT NULL DEFAULT '1',
  `current_academic_year` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `current_semester` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_number` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender` enum('male','female') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suffix` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `birth_date` date DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `year_level` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_contact` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `student_type` enum('regular','irregular') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'regular',
  `education_level` enum('senior_high','college') COLLATE utf8mb4_unicode_ci DEFAULT 'college',
  `track` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `strand` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('active','inactive','graduated','dropped') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `has_voucher` tinyint(1) NOT NULL DEFAULT '0',
  `voucher_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voucher_status` enum('active','invalid') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `voucher_invalidated_at` timestamp NULL DEFAULT NULL,
  `voucher_invalidation_reason` text COLLATE utf8mb4_unicode_ci,
  `is_on_hold` tinyint(1) NOT NULL DEFAULT '0',
  `hold_balance` decimal(10,2) DEFAULT NULL,
  `hold_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `enrolled_date` date DEFAULT NULL,
  `course_shifted_at` timestamp NULL DEFAULT NULL,
  `credited_subjects` json DEFAULT NULL,
  `shift_reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `curriculum_id` bigint unsigned DEFAULT NULL,
  `previous_curriculum_id` bigint unsigned DEFAULT NULL,
  `batch_year` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `students_student_number_unique` (`student_number`),
  UNIQUE KEY `students_voucher_id_unique` (`voucher_id`),
  KEY `students_user_id_foreign` (`user_id`),
  KEY `students_education_level_student_type_index` (`education_level`,`student_type`),
  KEY `students_program_id_foreign` (`program_id`),
  KEY `students_curriculum_id_index` (`curriculum_id`),
  KEY `students_previous_program_id_foreign` (`previous_program_id`),
  KEY `students_previous_curriculum_id_foreign` (`previous_curriculum_id`),
  CONSTRAINT `students_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_previous_curriculum_id_foreign` FOREIGN KEY (`previous_curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_previous_program_id_foreign` FOREIGN KEY (`previous_program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`),
  CONSTRAINT `students_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subject_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subject_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `units` int NOT NULL DEFAULT '3',
  `subject_type` enum('major','minor','general','elective','core','applied','specialized') COLLATE utf8mb4_unicode_ci DEFAULT 'major',
  `education_level` enum('college','shs','senior_high','associate') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'college',
  `prerequisites` text COLLATE utf8mb4_unicode_ci,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `program_id` bigint unsigned DEFAULT NULL,
  `major` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subjects_subject_code_unique` (`subject_code`),
  KEY `subjects_education_level_status_index` (`education_level`,`status`),
  KEY `subjects_program_id_education_level_status_index` (`program_id`,`education_level`,`status`),
  CONSTRAINT `subjects_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `teacher_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teacher_assignments` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `teacher_id` bigint unsigned NOT NULL,
  `section_id` bigint unsigned NOT NULL,
  `assigned_date` date NOT NULL,
  `assigned_by` bigint unsigned NOT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teacher_assignments_teacher_id_section_id_unique` (`teacher_id`,`section_id`),
  KEY `teacher_assignments_assigned_by_foreign` (`assigned_by`),
  KEY `teacher_assignments_teacher_id_status_index` (`teacher_id`,`status`),
  KEY `teacher_assignments_section_id_status_index` (`section_id`,`status`),
  CONSTRAINT `teacher_assignments_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_assignments_section_id_foreign` FOREIGN KEY (`section_id`) REFERENCES `sections` (`id`) ON DELETE CASCADE,
  CONSTRAINT `teacher_assignments_teacher_id_foreign` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `employee_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `department` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialization` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'active',
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `teachers_employee_number_unique` (`employee_number`),
  KEY `teachers_user_id_foreign` (`user_id`),
  CONSTRAINT `teachers_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `user_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_preferences` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `show_archived_announcements` tinyint(1) NOT NULL DEFAULT '0',
  `default_announcement_priority` enum('low','medium','high','urgent') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'medium',
  `theme_preferences` json DEFAULT NULL,
  `notification_preferences` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `user_preferences_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('student','teacher','registrar','head_teacher','super_admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `employee_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_picture` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  UNIQUE KEY `users_employee_number_unique` (`employee_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `year_level_curriculum_guides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `year_level_curriculum_guides` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `program_id` bigint unsigned NOT NULL,
  `academic_year` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `year_level` int NOT NULL,
  `curriculum_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ylcg_program_academic_year_level_unique` (`program_id`,`academic_year`,`year_level`),
  KEY `year_level_curriculum_guides_curriculum_id_foreign` (`curriculum_id`),
  CONSTRAINT `year_level_curriculum_guides_curriculum_id_foreign` FOREIGN KEY (`curriculum_id`) REFERENCES `curriculum` (`id`) ON DELETE CASCADE,
  CONSTRAINT `year_level_curriculum_guides_program_id_foreign` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (1,'0001_01_01_000000_create_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (2,'2025_11_20_025510_create_personal_access_tokens_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (3,'2025_11_28_072235_create_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (4,'2025_11_28_072456_create_teachers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (5,'2025_11_28_075543_create_courses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (6,'2025_11_28_083354_create_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (7,'2025_11_28_105934_create_teacher_assignments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (8,'2025_11_28_113118_create_student_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (9,'2025_11_29_041200_create_student_grades_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (10,'2025_11_29_041630_create_student_academic_transcripts_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (11,'2025_11_29_041654_create_student_grade_summaries_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (12,'2025_11_29_043756_create_student_semester_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (13,'2025_11_29_044034_create_announcements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (14,'2025_11_29_044034_create_class_schedules_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (15,'2025_11_29_044040_create_announcement_attachments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (16,'2025_11_29_044041_create_announcement_read_status_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (17,'2025_11_29_044041_create_course_materials_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (18,'2025_11_29_044042_create_material_access_logs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (19,'2025_11_29_044042_create_user_preferences_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (20,'2025_11_29_050850_remove_academic_fields_from_courses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (21,'2025_11_29_050855_add_academic_fields_to_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (22,'2025_11_29_092635_add_education_level_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (23,'2025_11_29_092710_add_education_level_to_courses_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (24,'2025_11_29_092729_create_shs_student_grades_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (25,'2025_11_29_092831_create_shs_student_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (26,'2025_11_29_095701_create_cache_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (27,'2025_11_30_025056_add_super_admin_role_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (28,'2025_11_30_030015_create_audit_logs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (29,'2025_11_30_030021_create_grade_versions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (30,'2025_11_30_034045_add_is_pre_finalization_to_grade_versions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (31,'2025_11_30_034229_optimize_database_for_enterprise',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (32,'2025_11_30_150244_create_archived_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (33,'2025_11_30_150250_create_archived_student_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (34,'2025_11_30_151416_create_programs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (35,'2025_11_30_151421_create_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (36,'2025_11_30_151559_add_program_id_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (37,'2025_11_30_153659_create_section_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (38,'2025_11_30_153723_update_class_schedules_for_section_subjects',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (39,'2025_11_30_154236_finalize_academic_restructure',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (40,'2025_11_30_162458_add_schedule_fields_to_section_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (41,'2025_12_02_102240_create_school_settings_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (42,'2025_12_02_113732_add_education_level_to_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (43,'2025_12_04_000000_create_student_subject_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (44,'2025_12_04_032338_migrate_existing_enrollments_to_subject_level',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (45,'2025_12_04_110407_add_file_hash_to_course_materials_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (46,'2025_12_04_115916_add_referenced_file_id_to_course_materials_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (47,'2025_12_05_004820_fix_student_grades_unique_constraint',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (48,'2025_12_05_114321_create_payment_transactions_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (49,'2025_12_05_114402_enhance_student_semester_payments_for_registrar_functions',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (50,'2025_12_05_122102_create_registrars_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (51,'2025_12_05_123435_create_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (52,'2025_12_05_123439_create_payment_items_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (53,'2025_12_05_123443_create_student_balances_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (54,'2025_12_06_000001_add_section_subject_id_to_student_grades_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (55,'2025_12_06_000002_add_section_subject_id_to_shs_student_grades_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (56,'2025_12_07_000000_add_hold_fields_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (57,'2025_12_07_070853_create_archived_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (58,'2025_12_08_000001_add_current_period_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (59,'2025_12_08_000002_add_completion_date_to_student_enrollments',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (60,'2025_12_08_000003_add_completed_status_to_student_enrollments',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (61,'2025_12_08_000004_add_archived_status_to_sections',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (62,'2025_12_08_040524_make_section_id_nullable_in_student_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (63,'2025_12_08_045357_drop_program_column_from_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (64,'2025_12_08_045434_drop_program_column_from_archived_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (65,'2025_12_08_122433_make_final_grades_nullable_in_archived_student_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (66,'2025_12_09_025404_add_dropped_status_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (67,'2025_12_09_045938_add_semester_fee_to_programs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (68,'2025_12_09_045954_add_program_id_to_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (69,'2025_12_09_051506_create_program_fees_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (70,'2025_12_10_111649_add_partitioning_to_student_enrollments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (71,'2025_12_10_112718_add_suffix_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (72,'2025_12_10_153127_drop_unused_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (73,'2025_12_10_153212_create_semester_finalizations_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (74,'2025_12_10_155331_recreate_program_fees_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (75,'2025_12_13_044623_create_curricula_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (76,'2025_12_13_044626_create_curriculum_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (77,'2025_12_13_051820_add_hours_to_curriculum_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (78,'2025_12_13_051838_modify_subject_type_enum_in_curriculum_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (79,'2025_12_13_052956_add_subject_id_to_curriculum_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (80,'2025_12_13_053138_update_curriculum_subjects_unique_constraint',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (81,'2025_12_13_053154_update_curriculum_subjects_subject_type_enum',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (82,'2025_12_13_054629_rename_curricula_table_to_curriculum',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (83,'2025_12_13_123011_create_program_curricula_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (84,'2025_12_13_125400_rename_program_curricula_table_to_program_curriculum',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (85,'2025_12_13_125419_add_curriculum_id_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (86,'2025_12_13_125953_rename_program_curriculum_constraints',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (87,'2025_12_13_131023_update_education_level_enum_in_programs_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (88,'2025_12_13_132428_recreate_registrars_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (89,'2025_12_13_132812_drop_registrars_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (90,'2025_12_13_133034_drop_all_student_related_tables',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (91,'2025_12_13_135341_add_batch_year_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (92,'2025_12_13_154208_add_major_to_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (93,'2025_12_13_160841_drop_major_to_from_subjects',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (94,'2025_12_13_172924_drop_year_level_and_semester_from_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (95,'2025_12_14_034452_drop_academic_year_from_curricula_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (96,'2025_12_14_042913_rename_is_active_to_is_current_in_curriculum_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (97,'2025_12_15_035516_add_curriculum_id_to_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (98,'2025_12_17_060000_add_is_current_to_curriculum_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (99,'2025_12_17_074337_create_year_level_curriculum_guides_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (100,'2025_12_17_105029_add_academic_year_to_year_level_curriculum_guides_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (101,'2025_12_17_105144_update_year_level_curriculum_guides_unique_constraint',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (102,'2025_12_30_060235_add_file_hash_and_duplicate_to_announcement_attachments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (103,'2025_12_30_061457_add_cloudinary_fields_to_announcement_attachments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (104,'2025_12_31_060628_add_scheduled_at_to_announcements_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (105,'2025_12_31_091532_update_announcements_visibility_enum',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (106,'2026_01_04_083016_add_employee_number_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (107,'2026_01_04_084735_make_employee_number_nullable_in_teachers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (108,'2026_01_04_092039_add_profile_picture_to_teachers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (109,'2026_01_04_103826_add_profile_picture_to_users_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (110,'2026_01_05_130455_add_program_and_curriculum_to_archived_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (111,'2026_01_06_083230_update_education_level_enum_in_subjects_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (112,'2026_01_10_135142_add_gender_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (113,'2026_01_12_153841_update_subject_type_enum_for_shs',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (114,'2026_01_13_143543_add_course_shift_tracking_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (115,'2026_01_13_170622_add_section_subject_id_to_course_materials_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (116,'2026_01_14_130917_add_voucher_fields_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (117,'2026_01_14_132145_update_education_level_enum_values',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (118,'2026_01_14_132622_add_voucher_id_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (119,'2026_01_14_145444_create_student_credit_transfers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (120,'2026_01_14_150651_add_grade_verification_to_student_credit_transfers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (121,'2026_01_14_152921_create_student_subject_credits_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (122,'2026_01_14_164543_remove_academic_year_from_year_level_curriculum_guides_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (123,'2026_01_15_034305_add_missing_columns_to_archived_sections_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (124,'2026_01_17_034335_add_previous_school_to_students_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (125,'2026_01_18_065315_make_curriculum_subject_id_nullable_in_student_subject_credits_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (126,'2026_01_20_035529_remove_unwanted_fields_from_student_credit_transfers_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (127,'2026_01_20_040935_add_credit_transfer_fields_to_student_semester_payments_table',1);
INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES (128,'2026_01_27_103233_update_shs_student_payments_semester_enum',2);
