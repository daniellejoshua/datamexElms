<?php

// @formatter:off
// phpcs:ignoreFile
/**
 * A helper file for your Eloquent Models
 * Copy the phpDocs from this file to the correct Model,
 * And remove them from this file, to prevent double declarations.
 *
 * @author Barry vd. Heuvel <barryvdh@gmail.com>
 */


namespace App\Models{
/**
 * @property int $id
 * @property string $title
 * @property string $content
 * @property int $created_by
 * @property string $visibility
 * @property string $priority
 * @property int $is_published
 * @property string|null $published_at
 * @property string|null $expires_at
 * @property int $is_archived
 * @property string|null $archived_at
 * @property string|null $rich_content
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereArchivedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereExpiresAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereIsArchived($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereIsPublished($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement wherePriority($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement wherePublishedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereRichContent($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Announcement whereVisibility($value)
 */
	class Announcement extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $announcement_id
 * @property string $file_name
 * @property string $file_path
 * @property string $file_type
 * @property int $file_size
 * @property string $original_name
 * @property int $download_count
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereAnnouncementId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereDownloadCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereFileType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereOriginalName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementAttachment whereUpdatedAt($value)
 */
	class AnnouncementAttachment extends \Eloquent {}
}

namespace App\Models{
/**
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementReadStatus newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementReadStatus newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|AnnouncementReadStatus query()
 */
	class AnnouncementReadStatus extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $section_id
 * @property string $day_of_week
 * @property string $start_time
 * @property string $end_time
 * @property string|null $room
 * @property int $created_by
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereCreatedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereDayOfWeek($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereEndTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereRoom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereSectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereStartTime($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ClassSchedule whereUpdatedAt($value)
 */
	class ClassSchedule extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $subject_name
 * @property string $course_code
 * @property string|null $description
 * @property int $units
 * @property string $education_level
 * @property string|null $track
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\Section> $sections
 * @property-read int|null $sections_count
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course college()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course shs()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course track(string $track)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereCourseCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereEducationLevel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereSubjectName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereTrack($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereUnits($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Course whereUpdatedAt($value)
 */
	class Course extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $section_id
 * @property int $teacher_id
 * @property string $title
 * @property string|null $description
 * @property string $file_name
 * @property string $file_path
 * @property string $file_type
 * @property int $file_size
 * @property string $original_name
 * @property string $category
 * @property string $visibility
 * @property int $is_active
 * @property string $upload_date
 * @property int $download_count
 * @property int $version_number
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereCategory($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereDescription($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereDownloadCount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereFileName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereFilePath($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereFileSize($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereFileType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereOriginalName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereSectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereTitle($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereUploadDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereVersionNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|CourseMaterial whereVisibility($value)
 */
	class CourseMaterial extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property int $material_id
 * @property string $accessed_at
 * @property int $download_completed
 * @property string|null $ip_address
 * @property string|null $user_agent
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereAccessedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereDownloadCompleted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereIpAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereMaterialId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|MaterialAccessLog whereUserAgent($value)
 */
	class MaterialAccessLog extends \Eloquent {}
}

namespace App\Models{
/**
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Post newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Post newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Post query()
 */
	class Post extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $course_id
 * @property string $academic_year
 * @property string $semester
 * @property string $section_name
 * @property string|null $room
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereCourseId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereRoom($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereSectionName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Section whereUpdatedAt($value)
 */
	class Section extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_enrollment_id
 * @property int $teacher_id
 * @property numeric|null $first_quarter_grade
 * @property \Illuminate\Support\Carbon|null $first_quarter_submitted_at
 * @property numeric|null $second_quarter_grade
 * @property \Illuminate\Support\Carbon|null $second_quarter_submitted_at
 * @property numeric|null $third_quarter_grade
 * @property \Illuminate\Support\Carbon|null $third_quarter_submitted_at
 * @property numeric|null $fourth_quarter_grade
 * @property \Illuminate\Support\Carbon|null $fourth_quarter_submitted_at
 * @property numeric|null $final_grade
 * @property string $completion_status
 * @property string|null $teacher_remarks
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\StudentEnrollment $studentEnrollment
 * @property-read \App\Models\Teacher $teacher
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereCompletionStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereFinalGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereFirstQuarterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereFirstQuarterSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereFourthQuarterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereFourthQuarterSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereSecondQuarterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereSecondQuarterSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereStudentEnrollmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereTeacherRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereThirdQuarterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereThirdQuarterSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentGrade whereUpdatedAt($value)
 */
	class ShsStudentGrade extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property string $academic_year
 * @property string $semester
 * @property numeric $first_quarter_amount
 * @property bool $first_quarter_paid
 * @property \Illuminate\Support\Carbon|null $first_quarter_payment_date
 * @property numeric $second_quarter_amount
 * @property bool $second_quarter_paid
 * @property \Illuminate\Support\Carbon|null $second_quarter_payment_date
 * @property numeric $third_quarter_amount
 * @property bool $third_quarter_paid
 * @property \Illuminate\Support\Carbon|null $third_quarter_payment_date
 * @property numeric $fourth_quarter_amount
 * @property bool $fourth_quarter_paid
 * @property \Illuminate\Support\Carbon|null $fourth_quarter_payment_date
 * @property numeric $total_semester_fee
 * @property numeric $total_paid
 * @property numeric $balance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \App\Models\Student $student
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereBalance($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFirstQuarterAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFirstQuarterPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFirstQuarterPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFourthQuarterAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFourthQuarterPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereFourthQuarterPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereSecondQuarterAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereSecondQuarterPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereSecondQuarterPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereThirdQuarterAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereThirdQuarterPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereThirdQuarterPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereTotalPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereTotalSemesterFee($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|ShsStudentPayment whereUpdatedAt($value)
 */
	class ShsStudentPayment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property string $student_number
 * @property string $first_name
 * @property string $last_name
 * @property string|null $middle_name
 * @property \Illuminate\Support\Carbon|null $birth_date
 * @property string|null $address
 * @property string|null $phone
 * @property string|null $year_level
 * @property string|null $program
 * @property string|null $parent_contact
 * @property string $student_type
 * @property string $education_level
 * @property string|null $track
 * @property string|null $strand
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $enrolled_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StudentEnrollment> $enrollments
 * @property-read int|null $enrollments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StudentSemesterPayment> $payments
 * @property-read int|null $payments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\StudentSemesterPayment> $semesterPayments
 * @property-read int|null $semester_payments_count
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \App\Models\ShsStudentPayment> $shsPayments
 * @property-read int|null $shs_payments_count
 * @property-read \App\Models\User $user
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereAddress($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereBirthDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereEducationLevel($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereEnrolledDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereFirstName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereLastName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereMiddleName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereParentContact($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student wherePhone($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereProgram($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereStrand($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereStudentNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereStudentType($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereTrack($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereUserId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Student whereYearLevel($value)
 */
	class Student extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property string $academic_year
 * @property string $semester
 * @property string $year_level
 * @property string $course_code
 * @property string $subject_name
 * @property int $units
 * @property int $student_enrollment_id
 * @property string $section_name
 * @property int $teacher_id
 * @property string $teacher_name
 * @property string|null $prelim_grade
 * @property string|null $midterm_grade
 * @property string|null $prefinal_grade
 * @property string|null $final_grade
 * @property string|null $semester_grade
 * @property string $completion_status
 * @property string|null $grade_status
 * @property int $attempt_number
 * @property string|null $grade_points
 * @property string|null $quality_points
 * @property string $enrollment_date
 * @property string|null $completion_date
 * @property string|null $remarks
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereAttemptNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereCompletionDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereCompletionStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereCourseCode($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereEnrollmentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereFinalGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereGradePoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereGradeStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereMidtermGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript wherePrefinalGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript wherePrelimGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereQualityPoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereSectionName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereSemesterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereStudentEnrollmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereSubjectName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereTeacherName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereUnits($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentAcademicTranscript whereYearLevel($value)
 */
	class StudentAcademicTranscript extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property int $section_id
 * @property string $enrollment_date
 * @property int $enrolled_by
 * @property string $status
 * @property string|null $transfer_date
 * @property int|null $transfer_to
 * @property string $academic_year
 * @property string $semester
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereEnrolledBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereEnrollmentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereSectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereTransferDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereTransferTo($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentEnrollment whereUpdatedAt($value)
 */
	class StudentEnrollment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_enrollment_id
 * @property int $teacher_id
 * @property string|null $prelim_grade Grade out of 100
 * @property string|null $midterm_grade Grade out of 100
 * @property string|null $prefinal_grade Grade out of 100
 * @property string|null $final_grade Grade out of 100
 * @property string|null $semester_grade Average of all terms
 * @property string|null $prelim_submitted_at
 * @property string|null $midterm_submitted_at
 * @property string|null $prefinal_submitted_at
 * @property string|null $final_submitted_at
 * @property string|null $semester_grade_computed_at
 * @property string $overall_status
 * @property string|null $teacher_remarks
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereFinalGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereFinalSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereMidtermGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereMidtermSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereOverallStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade wherePrefinalGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade wherePrefinalSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade wherePrelimGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade wherePrelimSubmittedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereSemesterGrade($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereSemesterGradeComputedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereStudentEnrollmentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereTeacherRemarks($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGrade whereUpdatedAt($value)
 */
	class StudentGrade extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property string $academic_year
 * @property string $semester
 * @property string $year_level
 * @property int $total_units_enrolled
 * @property int $total_units_completed
 * @property int $total_units_passed
 * @property int $total_units_failed
 * @property int $total_subjects_enrolled
 * @property int $total_subjects_completed
 * @property int $total_subjects_passed
 * @property int $total_subjects_failed
 * @property string|null $semester_gpa
 * @property string|null $cumulative_gpa
 * @property string $total_quality_points
 * @property string $total_grade_points
 * @property string|null $academic_standing
 * @property int $honors_eligibility
 * @property int $semester_completed
 * @property string|null $semester_completion_date
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereAcademicStanding($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereCumulativeGpa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereHonorsEligibility($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereSemesterCompleted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereSemesterCompletionDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereSemesterGpa($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalGradePoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalQualityPoints($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalSubjectsCompleted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalSubjectsEnrolled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalSubjectsFailed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalSubjectsPassed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalUnitsCompleted($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalUnitsEnrolled($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalUnitsFailed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereTotalUnitsPassed($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentGradeSummary whereYearLevel($value)
 */
	class StudentGradeSummary extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $student_id
 * @property string $academic_year
 * @property string $semester
 * @property string $prelim_amount
 * @property int $prelim_paid
 * @property string|null $prelim_payment_date
 * @property string $midterm_amount
 * @property int $midterm_paid
 * @property string|null $midterm_payment_date
 * @property string $prefinal_amount
 * @property int $prefinal_paid
 * @property string|null $prefinal_payment_date
 * @property string $final_amount
 * @property int $final_paid
 * @property string|null $final_payment_date
 * @property string $total_semester_fee
 * @property string $total_paid
 * @property string $balance
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereAcademicYear($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereBalance($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereFinalAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereFinalPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereFinalPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereMidtermAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereMidtermPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereMidtermPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrefinalAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrefinalPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrefinalPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrelimAmount($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrelimPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment wherePrelimPaymentDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereSemester($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereStudentId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereTotalPaid($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereTotalSemesterFee($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|StudentSemesterPayment whereUpdatedAt($value)
 */
	class StudentSemesterPayment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property string $employee_number
 * @property string $first_name
 * @property string $last_name
 * @property string|null $middle_name
 * @property string|null $department
 * @property string|null $specialization
 * @property string|null $hire_date
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereDepartment($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereEmployeeNumber($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereFirstName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereHireDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereLastName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereMiddleName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereSpecialization($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|Teacher whereUserId($value)
 */
	class Teacher extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $teacher_id
 * @property int $section_id
 * @property string $assigned_date
 * @property int $assigned_by
 * @property string $status
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereAssignedBy($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereAssignedDate($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereSectionId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereStatus($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereTeacherId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|TeacherAssignment whereUpdatedAt($value)
 */
	class TeacherAssignment extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property \Illuminate\Support\Carbon|null $email_verified_at
 * @property string $password
 * @property string $role
 * @property int $is_active
 * @property string|null $remember_token
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @property-read \Illuminate\Notifications\DatabaseNotificationCollection<int, \Illuminate\Notifications\DatabaseNotification> $notifications
 * @property-read int|null $notifications_count
 * @property-read \App\Models\Student|null $student
 * @property-read \App\Models\Teacher|null $teacher
 * @property-read \Illuminate\Database\Eloquent\Collection<int, \Laravel\Sanctum\PersonalAccessToken> $tokens
 * @property-read int|null $tokens_count
 * @method static \Database\Factories\UserFactory factory($count = null, $state = [])
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmail($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereEmailVerifiedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereIsActive($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereName($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User wherePassword($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRememberToken($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereRole($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|User whereUpdatedAt($value)
 */
	class User extends \Eloquent {}
}

namespace App\Models{
/**
 * @property int $id
 * @property int $user_id
 * @property int $show_archived_announcements
 * @property string $default_announcement_priority
 * @property string|null $theme_preferences
 * @property string|null $notification_preferences
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference newModelQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference newQuery()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference query()
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereCreatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereDefaultAnnouncementPriority($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereId($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereNotificationPreferences($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereShowArchivedAnnouncements($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereThemePreferences($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereUpdatedAt($value)
 * @method static \Illuminate\Database\Eloquent\Builder<static>|UserPreference whereUserId($value)
 */
	class UserPreference extends \Eloquent {}
}

