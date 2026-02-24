import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js';
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
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Download
} from 'lucide-react'
import { useState } from 'react'

export default function AcademicHistory({ student, curriculumSubjects, completedSubjects, subjectGrades, archivedEnrollments }) {
    const [creditedSubjectsPage, setCreditedSubjectsPage] = useState(1)
    const itemsPerPage = 5

    const formatStudentName = (student) => {
        const parts = [student.first_name, student.middle_name, student.last_name]
        if (student.suffix) {
            parts.push(student.suffix)
        }
        return parts.filter(Boolean).join(' ')
    }

    const isSubjectCompleted = (subjectCode) => {
        // Backend has already validated grades and only includes passing subjects in completedSubjects
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

    // credit table helpers
    const renderGradeBadge = (subject) => {
        if (subject.final_grade) {
            return <Badge className="bg-green-500 text-white">{subject.final_grade}</Badge>
        }
        if (subject.credit_type) {
            return <Badge variant="outline" className="text-gray-600">CR</Badge>
        }
        return <span className="text-gray-400">-</span>
    }

    // use optional chaining to avoid runtime errors if `student` is not provided
    const isShiftee = student?.transfer_type === 'shiftee';
    const isTransferee = student?.transfer_type === 'transferee';
    // a credit is considered "internal" if it came from within the school (no
    // credited_from value) – these rows should show professor and hide credit/type
    const isInternalCredit = (subject) => !subject.credited_from;
    // Group curriculum subjects by year and semester
    let groupedSubjects = curriculumSubjects?.reduce((acc, subject) => {
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

    // Make sure each year's semesters are in logical order regardless of
    // how the subjects happened to be iterated above. JavaScript object
    // iteration preserves insertion order, so we rebuild the object with the
    // desired sequence.
    const semesterOrder = ['1st Semester', '2nd Semester', 'Summer']
    groupedSubjects = Object.fromEntries(
        Object.entries(groupedSubjects).map(([year, semObj]) => {
            const ordered = {}
            semesterOrder.forEach(key => {
                if (semObj[key]) {
                    ordered[key] = semObj[key]
                }
            })
            // include any unexpected keys at the end just in case
            Object.keys(semObj).forEach(key => {
                if (!ordered[key]) ordered[key] = semObj[key]
            })
            return [year, ordered]
        })
    )

    // Calculate completion statistics (excluding credited subjects)
    const totalSubjects = curriculumSubjects?.length || 0
    const completedCount = curriculumSubjects?.filter(subject => {
        const gradeInfo = getSubjectGradeInfo(subject.subject_code)
        return isSubjectCompleted(subject.subject_code) && (!gradeInfo || gradeInfo.type !== 'credited')
    }).length || 0
    // Count credited subjects that are in the completedSubjects array (already validated by backend)
    const creditedCount = completedSubjects?.filter(subject => {
        const gradeInfo = getSubjectGradeInfo(subject.subject_code)
        return gradeInfo?.type === 'credited'
    }).length || 0
    const completionPercentage = totalSubjects > 0 ? Math.round(((completedCount + creditedCount) / totalSubjects) * 100) : 0

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('registrar.students')}>
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Students
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Academic History</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                {formatStudentName(student)} - {student.student_number}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Academic History - ${formatStudentName(student)}`} />

            <div className="p-6 space-y-6">
                <div className="flex justify-end -mt-2">
                    <a
                        href={route('registrar.students.academic-history.export', student.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Export academic history as PDF"
                        className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-sm"
                    >
                        <Download className="w-4 h-4 text-red-600" />
                        <span>Export PDF</span>
                    </a>
                </div>
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
                                <div className="text-2xl font-bold text-green-900">{completedCount + creditedCount} / {totalSubjects}</div>
                                <div className="text-sm text-green-600">
                                    Subjects Completed
                                    {(creditedCount > 0) && (
                                        <div className="text-xs mt-1 text-green-700">
                                            {completedCount} graded + {creditedCount} Previous School Credited Subject
                                        </div>
                                    )}
                                </div>
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
                                                        const isEnrolled = gradeInfo && gradeInfo.type === 'enrolled'
                                                        
                                                        return (
                                                            <Card 
                                                                key={subject.id}
                                                                className={`transition-all duration-200 ${
                                                                    completed 
                                                                        ? 'bg-green-50 border-green-200 shadow-sm' 
                                                                        : isEnrolled
                                                                        ? 'bg-blue-50 border-blue-200 shadow-sm'
                                                                        : gradeInfo?.type === 'archived' && !hasMissingGrades
                                                                        ? 'bg-gray-100 border-dashed border-gray-400'
                                                                        : hasMissingGrades
                                                                        ? 'bg-yellow-50 border-yellow-200'
                                                                        : 'hover:shadow-md border-gray-200'
                                                                }`}
                                                            >
                                                                <CardContent className="p-4">
                                                                    <div className="flex items-start gap-3">
                                                                        <div className={`mt-1 ${
                                                                            completed ? 'text-green-600' : 
                                                                            isEnrolled ? 'text-blue-600' :
                                                                            hasMissingGrades ? 'text-yellow-600' : 
                                                                            'text-gray-400'
                                                                        }`}>
                                                                            {completed ? (
                                                                                <CheckCircle2 className="w-5 h-5" />
                                                                            ) : isEnrolled ? (
                                                                                <Clock className="w-5 h-5" />
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
                                                                            {/* original subject from old program (mapped during course shift) */}
                                                                            {gradeInfo?.original_subject_code && (
                                                                                <div className="text-xs text-gray-500 mt-1">
                                                                                    <span className="font-medium">Previously:</span> {gradeInfo.original_subject_code}
                                                                                    {gradeInfo.original_subject_name ? ` – ${gradeInfo.original_subject_name}` : ''}
                                                                                </div>
                                                                            )}
                                                                            
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
                                                                            {(hasMissingGrades || isEnrolled) && (
                                                                                <div className="mt-2 text-xs">
                                                                                    <div className={`flex items-center gap-1 font-medium mb-1 ${
                                                                                        isEnrolled ? 'text-blue-700' : 'text-yellow-700'
                                                                                    }`}>
                                                                                        <AlertCircle className="w-3 h-3" />
                                                                                        {isEnrolled ? 'Currently Enrolled - Grades Pending:' : 'Missing Grades:'}
                                                                                    </div>
                                                                                    <div className="flex flex-wrap gap-1">
                                                                                        {gradeInfo.missing_grades.map((grade, idx) => (
                                                                                            <Badge key={idx} variant="outline" className={`text-[10px] leading-none py-0.5 px-2 ${
                                                                                                isEnrolled 
                                                                                                    ? 'bg-blue-100 text-blue-800 border-blue-300' 
                                                                                                    : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                                                                            }`}>
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
                    // Get all credited subjects (show all credits, not just passing ones)
                    const creditedSubjectsInCompleted = subjectGrades?.filter(grade => 
                        grade.type === 'credited'
                    ) || [];

                    // Pagination logic
                    const totalPages = Math.ceil(creditedSubjectsInCompleted.length / itemsPerPage)
                    const startIndex = (creditedSubjectsPage - 1) * itemsPerPage
                    const endIndex = startIndex + itemsPerPage
                    const paginatedSubjects = creditedSubjectsInCompleted.slice(startIndex, endIndex)

                    return creditedSubjectsInCompleted.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Award className="w-5 h-5" />
                                    Credited Subjects ({creditedSubjectsInCompleted.length})
                                </CardTitle>
                                <p className="text-sm text-gray-600">Subjects credited through transfers, course shifts, or equivalency</p>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full border-collapse">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject Code</th>
                                                {!isTransferee && (
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Original Code</th>
                                                )}
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Subject Name</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Units</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Grade</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Professor</th>
                                                <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                                                {/* date column shown only for external credits */}
                                                {!isShiftee && (
                                                    <th className="text-left py-3 px-4 font-medium text-gray-700">Date Credited</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedSubjects.map((subject, index) => (
                                                <tr key={index} className="border-b hover:bg-gray-50">
                                                    <td className="py-3 px-4">
                                                        <Badge variant="outline" className="font-mono text-xs">
                                                            {subject.subject_code}
                                                        </Badge>
                                                    </td>
                                                    {!isTransferee && (
                                                        <td className="py-3 px-4 text-sm text-gray-600">
                                                            {subject.original_subject_code || '-'}
                                                        </td>
                                                    )}
                                                    <td className="py-3 px-4">
                                                        <div className="font-medium text-gray-900">{subject.subject_name}</div>
                                                    </td>
                                                    <td className="py-3 px-4 text-sm text-gray-600">
                                                        {curriculumSubjects?.find(curr => curr.subject_code === subject.subject_code)?.units || 'N/A'} 
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {renderGradeBadge(subject)}
                                                    </td>
                                                    {isInternalCredit(subject) ? (
                                                        <td className="py-3 px-4 text-sm text-gray-700">
                                                            {subject.teacher_name || '—'}
                                                        </td>
                                                    ) : (
                                                        <td className="py-3 px-4">
                                                            <Badge variant="outline" className="capitalize">
                                                                {subject.credit_type || 'Transfer'}
                                                            </Badge>
                                                        </td>
                                                    )}
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
                                                        {!isShiftee && (
                                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                                {subject.credited_at ? new Date(subject.credited_at).toLocaleDateString() : 'N/A'}
                                                            </td>
                                                        )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex items-center justify-between mt-4 px-4">
                                        <div className="text-sm text-gray-600">
                                            Showing {startIndex + 1} to {Math.min(endIndex, creditedSubjectsInCompleted.length)} of {creditedSubjectsInCompleted.length} subjects
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCreditedSubjectsPage(prev => Math.max(prev - 1, 1))}
                                                disabled={creditedSubjectsPage === 1}
                                            >
                                                <ChevronLeft className="w-4 h-4" />
                                                Previous
                                            </Button>
                                            <span className="text-sm text-gray-600 px-2">
                                                Page {creditedSubjectsPage} of {totalPages}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setCreditedSubjectsPage(prev => Math.min(prev + 1, totalPages))}
                                                disabled={creditedSubjectsPage === totalPages}
                                            >
                                                Next
                                                <ChevronRight className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })()}

            </div>
        </AuthenticatedLayout>
    )
}
