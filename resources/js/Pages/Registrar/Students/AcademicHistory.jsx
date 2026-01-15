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
    AlertCircle
} from 'lucide-react'

export default function AcademicHistory({ student, curriculumSubjects, completedSubjects, subjectGrades, archivedEnrollments }) {
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

    // Calculate completion statistics
    const totalSubjects = curriculumSubjects?.length || 0
    const completedCount = curriculumSubjects?.filter(subject => 
        isSubjectCompleted(subject.subject_code)
    ).length || 0
    const completionPercentage = totalSubjects > 0 ? Math.round((completedCount / totalSubjects) * 100) : 0

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
                {/* Student Overview Card */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <GraduationCap className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="text-2xl font-bold text-blue-900">{student.program?.program_name || 'N/A'}</div>
                                <div className="text-sm text-blue-600">Program</div>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <div className="flex justify-center mb-2">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="text-2xl font-bold text-green-900">{completedCount} / {totalSubjects}</div>
                                <div className="text-sm text-green-600">Subjects Completed</div>
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
                                <div className="text-2xl font-bold text-orange-900">Year {student.year_level || 'N/A'}</div>
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
                                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
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
                                        <div className="absolute left-6 top-20 w-0.5 h-full bg-gradient-to-b from-purple-300 to-blue-300"></div>
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
                                                                                {gradeInfo?.type === 'credited' && (
                                                                                    <Badge className="text-xs bg-blue-500">
                                                                                        Credited
                                                                                    </Badge>
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
                                                                                <div className="mt-2 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">
                                                                                    From: {gradeInfo.credited_from}
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
