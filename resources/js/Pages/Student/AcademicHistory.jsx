import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    CheckCircle2,
    Circle,
    GraduationCap,
    Clock,
    Award,
    TrendingUp,
    User,
    School,
    AlertCircle
} from 'lucide-react'

export default function AcademicHistory({ student, curriculumSubjects, completedSubjects, subjectGrades, creditedSubjects, archivedEnrollments, completionStats }) {
    const formatStudentName = (student) => {
        const parts = [student.first_name, student.middle_name, student.last_name]
        if (student.suffix) {
            parts.push(student.suffix)
        }
        return parts.filter(Boolean).join(' ')
    }

    const isSubjectCompleted = (subjectCode) => {
        return completedSubjects?.some(completed =>
            completed.subject_code === subjectCode ||
            completed.subject_id === subjectCode
        )
    }

    const getSubjectGradeInfo = (subjectCode) => {
        return subjectGrades?.find(grade =>
            grade.subject_code === subjectCode ||
            grade.subject_id === subjectCode
        )
    }

    const formatSectionName = (section) => {
        if (!section) return 'N/A'
        if (section.program?.program_code && section.year_level) {
            const identifier = section.section_name
            return `${section.program.program_code}-${section.year_level}${identifier}`
        }
        return section.section_name || 'N/A'
    }

    // Group curriculum subjects by year and semester
    const groupedSubjects = curriculumSubjects?.reduce((acc, subject) => {
        const yearKey = `Year ${subject.year_level}`
        const semesterKey = subject.semester === '1st' ? '1st Semester' : '2nd Semester'

        if (!acc[yearKey]) {
            acc[yearKey] = {}
        }
        if (!acc[yearKey][semesterKey]) {
            acc[yearKey][semesterKey] = []
        }
        acc[yearKey][semesterKey].push(subject)
        return acc
    }, {}) || {}

    // Calculate completion statistics (excluding credited subjects)
    const totalSubjects = completionStats?.totalSubjects || 0
    const completedCount = completionStats?.completedSubjects || 0
    // Count credited subjects with passing grades (>= 75)
    const creditedCount = subjectGrades?.filter(grade => {
        if (grade.type !== 'credited') return false;
        const gradeValue = parseFloat(grade.final_grade);
        // Include subjects with no grade (CR) or grades >= 75
        return isNaN(gradeValue) || gradeValue >= 75;
    }).length || 0
    const completionPercentage = completionStats?.completionPercentage || 0

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('student.dashboard')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Dashboard</span>
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Academic History</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">View your complete academic record and progress</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Academic History" />

            <div className="p-6 space-y-6">
                {/* Student Overview Card */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-900">{student.program?.program_code || 'N/A'}</div>
                                <div className="text-sm text-blue-600">Program</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-900">{completedCount} / {totalSubjects}</div>
                                <div className="text-sm text-green-600">
                                    Subjects Completed
                                </div>
                                {creditedCount > 0 && (
                                    <div className="text-xs text-green-700 mt-2">
                                        {creditedCount} credited from other schools
                                    </div>
                                )}
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <TrendingUp className="w-8 h-8 text-purple-600" />
                                </div>
                                <div className="text-2xl font-bold text-purple-900">{completionPercentage}%</div>
                                <div className="text-sm text-purple-600">Completion Rate</div>
                            </div>
                            <div className="text-center p-4 bg-orange-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <Award className="w-8 h-8 text-orange-600" />
                                </div>
                                <div className="text-2xl font-bold text-orange-900">{student.year_level || 'N/A'}</div>
                                <div className="text-sm text-orange-600">Current Year Level</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Curriculum Progress */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Curriculum Progress
                        </CardTitle>
                        <p className="text-sm text-gray-600">Track your progress through the curriculum requirements</p>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {Object.entries(groupedSubjects).map(([year, semesters], yearIndex) => (
                                <div key={year} className="relative">
                                    {/* Year Header */}
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 bg-gradient-to-br bg-red-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                                            {yearIndex + 1}
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">{year}</h3>
                                            <p className="text-sm text-gray-600">
                                                {Object.values(semesters).flat().filter(s => isSubjectCompleted(s.subject_code)).length} of {Object.values(semesters).flat().length} subjects completed
                                            </p>
                                        </div>
                                    </div>

                                    {/* Timeline connector to next year */}
                                    {yearIndex < Object.keys(groupedSubjects).length - 1 && (
                                        <div className="absolute left-6 top-20 w-0.5 h-full bg-gradient-to-b bg-red-500"></div>
                                    )}

                                    {/* Semesters */}
                                    <div className="ml-16 space-y-6">
                                        {Object.entries(semesters).map(([semester, subjects]) => (
                                            <div key={semester} className="relative">
                                                {/* Semester Header */}
                                                <div className="flex items-center gap-3 mb-4">
                                                    <Calendar className="w-5 h-5 text-blue-600" />
                                                    <h4 className="text-lg font-semibold text-gray-800">{semester}</h4>
                                                    <Badge variant="secondary">
                                                        {subjects.filter(s => isSubjectCompleted(s.subject_code)).length}/{subjects.length} Completed
                                                    </Badge>
                                                </div>

                                                {/* Subjects Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    {subjects.map((subject) => {
                                                        const completed = isSubjectCompleted(subject.subject_code)
                                                        const gradeInfo = getSubjectGradeInfo(subject.subject_code)
                                                        const hasMissingGrades = gradeInfo && gradeInfo.missing_grades && gradeInfo.missing_grades.length > 0

                                                        return (
                                                            <Card
                                                                key={subject.id}
                                                                className={`transition-all duration-200 ${
                                                                    completed
                                                                        ? 'bg-green-50 border-green-200 shadow-sm'
                                                                        : hasMissingGrades
                                                                        ? 'bg-yellow-50 border-yellow-200'
                                                                        : 'hover:shadow-md border-gray-200'
                                                                }`}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`mt-1 ${
                                                                            completed ? 'text-green-600' :
                                                                            hasMissingGrades ? 'text-yellow-600' :
                                                                            'text-gray-400'
                                                                        }`}>
                                                                            {completed ? (
                                                                                <CheckCircle2 className="w-5 h-5" />
                                                                            ) : hasMissingGrades ? (
                                                                                <AlertCircle className="w-5 h-5" />
                                                                            ) : (
                                                                                <Circle className="w-5 h-5" />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                                <Badge variant="outline" className="text-xs">
                                                                                    {subject.subject_code}
                                                                                </Badge>
                                                                                {subject.units && (
                                                                                    <span className="text-xs text-gray-500">
                                                                                        {subject.units} units
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                            <h5 className={`font-medium text-sm break-words ${
                                                                                completed
                                                                                    ? 'text-green-900 line-through'
                                                                                    : 'text-gray-900'
                                                                            }`}>
                                                                                {subject.subject_name}
                                                                            </h5>

                                                                            {/* Teacher Info */}
                                                                            {gradeInfo?.teacher_name && (
                                                                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-600">
                                                                                    <User className="w-3 h-3" />
                                                                                    <span>{gradeInfo.teacher_name}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Credit Info */}
                                                                            {gradeInfo?.type === 'credited' && gradeInfo.credited_from && (
                                                                                <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
                                                                                    <School className="w-3 h-3 bg-gray-200 rounded-full flex items-center justify-center">
                                                                                        <div className="w-1.5 h-1.5 bg-gray-500 rounded-full"></div>
                                                                                    </School>
                                                                                    <span>{gradeInfo.credited_from}</span>
                                                                                </div>
                                                                            )}

                                                                            {/* Missing Grades Warning */}
                                                                            {hasMissingGrades && (
                                                                                <div className="mt-2 text-xs">
                                                                                    <div className="flex items-center gap-1 text-yellow-700 font-medium mb-1">
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        Missing Grades:
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {gradeInfo.missing_grades.map((grade, idx) => (
                                                                                            <Badge key={idx} variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                                                {grade}
                                                                                            </Badge>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>
                                                                            )}

                                                                            {subject.description && subject.description !== subject.subject_name && (
                                                                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                                                    {subject.description}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {totalSubjects === 0 && (
                            <div className="text-center py-12">
                                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">No curriculum subjects found</p>
                                <p className="text-gray-400 text-sm">Please contact the registrar to set up your curriculum</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Credited Subjects */}
                {(() => {
                    // Use paginated credited subjects data
                    const creditedSubjectsData = creditedSubjects?.data || [];
                    const passingCreditedSubjects = creditedSubjectsData.filter(subject => {
                        const grade = subject.final_grade;
                        if (!grade || grade === 'CR') return true; // No grade = CR = passing

                        const numericGrade = parseFloat(grade);
                        if (isNaN(numericGrade)) return false; // Invalid grade

                        // Check if it's GPA (1.00-5.00) or percentage (0-100)
                        // GPA grades: 1.00-3.00 are passing
                        // Percentage grades: >= 75 are passing
                        if (numericGrade <= 5.0 && numericGrade >= 1.0) {
                            // Likely GPA format (1.00-5.00)
                            return numericGrade <= 3.0; // 1.00-3.00 are passing GPAs
                        } else {
                            // Likely percentage format (0-100)
                            return numericGrade >= 75; // >= 75% is passing
                        }
                    });

                    return passingCreditedSubjects.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Credited Subjects ({passingCreditedSubjects.length})
                                </CardTitle>
                                <p className="text-sm text-gray-600">Subjects credited through transfers, course shifts, or equivalency (passing grades only)</p>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject Code</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject Name</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Units</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Credit Type</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Date Credited</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {passingCreditedSubjects.map((subject, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {subject.subject_code}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900">{subject.subject_name}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {curriculumSubjects?.find(curr => curr.subject_code === subject.subject_code)?.units || 'N/A'} units
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge className="bg-blue-500 text-white">
                                                            {subject.final_grade || 'CR'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="capitalize">
                                                            {subject.credit_type || 'Transfer'}
                                                        </Badge>
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {subject.credited_from ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                <span className="text-sm text-gray-700">{subject.credited_from}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm text-gray-500">Internal</span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {subject.credited_at ? new Date(subject.credited_at).toLocaleDateString() : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination */}
                                {creditedSubjects.last_page > 1 && (
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 px-4 py-3 border-t bg-gray-50 rounded-b-lg mt-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <span>Showing</span>
                                            <span className="font-medium">{creditedSubjects.from}</span>
                                            <span>to</span>
                                            <span className="font-medium">{creditedSubjects.to}</span>
                                            <span>of</span>
                                            <span className="font-medium">{creditedSubjects.total}</span>
                                            <span>credited subjects</span>
                                        </div>

                                        {/* Responsive Pagination */}
                                        <div className="flex items-center gap-1 overflow-x-auto">
                                            {(() => {
                                                const links = creditedSubjects.links.slice(1, -1);
                                                const pages = [];

                                                // Always ensure first page is included
                                                if (links.length > 0 && links[0].label !== '1') {
                                                    pages.push({
                                                        url: creditedSubjects.links[0]?.url || null,
                                                        label: '1',
                                                        active: creditedSubjects.current_page === 1
                                                    });
                                                    if (links[0].label === '...') {
                                                        // Keep the ellipsis if it was there
                                                        pages.push(links[0]);
                                                    }
                                                }

                                                // Add all existing links
                                                pages.push(...links);

                                                // Always ensure last page is included
                                                const lastPageNum = creditedSubjects.last_page.toString();
                                                const hasLastPage = pages.some(link => link.label === lastPageNum);
                                                if (!hasLastPage && links.length > 0) {
                                                    const lastLink = links[links.length - 1];
                                                    if (lastLink.label === '...') {
                                                        // Add ellipsis before last page
                                                        pages.push(lastLink);
                                                    }
                                                    pages.push({
                                                        url: creditedSubjects.links[creditedSubjects.links.length - 1]?.url || null,
                                                        label: lastPageNum,
                                                        active: creditedSubjects.current_page === creditedSubjects.last_page
                                                    });
                                                }

                                                return pages.map((link, index) => (
                                                    link.url ? (
                                                        <Link
                                                            key={`${link.label}-${index}`}
                                                            href={link.url}
                                                            className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium border border-gray-300 transition-colors ${
                                                                link.active
                                                                    ? 'bg-blue-50 border-blue-500 text-blue-600 z-10'
                                                                    : 'bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                                                            } ${index === 0 ? 'border-l rounded-l-md' : ''} ${index === pages.length - 1 ? 'border-r rounded-r-md' : 'border-r'}`}
                                                            preserveScroll
                                                        >
                                                            {link.label}
                                                        </Link>
                                                    ) : (
                                                        <span
                                                            key={`${link.label}-${index}`}
                                                            className={`flex-shrink-0 px-2 py-1.5 text-xs font-medium border border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed ${
                                                                index === 0 ? 'border-l rounded-l-md' : ''} ${index === pages.length - 1 ? 'border-r rounded-r-md' : 'border-r'
                                                            }`}
                                                        >
                                                            {link.label}
                                                        </span>
                                                    )
                                                ));
                                            })()}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })()}

                {/* Enrollment History Timeline */}
                {archivedEnrollments && archivedEnrollments.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="w-5 h-5" />
                                Enrollment History Timeline
                            </CardTitle>
                            <p className="text-sm text-gray-600">Complete record of past semester enrollments</p>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {archivedEnrollments.map((enrollment, index) => (
                                    <div key={index} className="relative">
                                        {/* Timeline connector */}
                                        {index < archivedEnrollments.length - 1 && (
                                            <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200"></div>
                                        )}

                                        <div className="flex gap-4">
                                            {/* Timeline dot */}
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                enrollment.final_status === 'completed'
                                                    ? 'bg-green-100 text-green-600'
                                                    : enrollment.final_status === 'dropped'
                                                    ? 'bg-yellow-100 text-yellow-600'
                                                    : 'bg-red-100 text-red-600'
                                            }`}>
                                                <span className="text-sm font-bold">
                                                    {enrollment.semester === '1st' || enrollment.semester === 'first' ? '1' : 
                                                     enrollment.semester === '2nd' || enrollment.semester === 'second' ? '2' : 'S'}
                                                </span>
                                            </div>

                                            {/* Enrollment details */}
                                            <div className="flex-1 pb-8">
                                                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                                    <div className="mb-2">
                                                        <h4 className="font-semibold text-gray-900">
                                                            {enrollment.academic_year} - {enrollment.semester} Semester
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            Section: {formatSectionName(enrollment.archived_section)}
                                                        </p>
                                                    </div>
                                                    {enrollment.total_units && (
                                                        <div className="text-sm text-gray-600">
                                                            Total Units: {enrollment.total_units}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    )
}