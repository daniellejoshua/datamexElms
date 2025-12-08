import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
    GraduationCap, 
    BookOpen, 
    TrendingUp, 
    CreditCard,
    Calendar,
    User,
    ArrowRight,
    Eye
} from 'lucide-react'

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'N/A';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'N/A';
};

export default function Dashboard({ 
    auth,
    student, 
    enrollments, 
    recentGrades, 
    paymentStatus, 
    stats, 
    currentAcademicInfo 
}) {
    // Debug logging for development
    if (import.meta.env.DEV) {
        console.log('Dashboard props:', { auth, student, enrollments, stats });
    }

    // Defensive coding - ensure we have the required data
    if (!student?.user) {
        return (
            <AuthenticatedLayout auth={auth}>
                <Head title="Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900 dark:text-gray-100">
                                <p>Loading student data...</p>
                                {import.meta.env.DEV && (
                                    <div className="mt-4 text-sm text-gray-600">
                                        <p>Student data: {JSON.stringify(student)}</p>
                                        <p>Auth data: {JSON.stringify(auth)}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    const getGradeColor = (grade) => {
        if (grade >= 90) return 'text-green-600'
        if (grade >= 80) return 'text-blue-600'
        if (grade >= 75) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPaymentStatusColor = () => {
        if (stats.balance === 0) return 'text-green-600'
        if (stats.balance > 0 && stats.totalPaid > 0) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <AuthenticatedLayout 
            auth={auth}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Student Dashboard</h2>
                            <p className="text-sm text-gray-600 mt-1">Welcome back, {student.user.name}! Here's your academic overview</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                            <Link href={route('student.subjects')}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                My Subjects
                            </Link>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Student Dashboard" />
            
            <div className="p-6 space-y-6">
                {/* Academic Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5" />
                            Academic Information
                        </CardTitle>
                        <CardDescription>
                            Your current enrollment details for {currentAcademicInfo.year} - {currentAcademicInfo.semester} Semester
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center p-4 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-600 font-semibold">Student Number</p>
                                <p className="text-lg font-bold text-blue-800">{student.student_number}</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <p className="text-sm text-green-600 font-semibold">Year Level</p>
                                <p className="text-lg font-bold text-green-800">{student.year_level}</p>
                            </div>
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                                <p className="text-sm text-purple-600 font-semibold">
                                    {student.education_level === 'shs' ? 'Track' : 'Program'}
                                </p>
                                <p className="text-lg font-bold text-purple-800">
                                    {student.education_level === 'shs' ? (student.track || 'N/A') : (student.program || 'N/A')}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold">Enrolled Subjects</p>
                                    <p className="text-2xl font-bold text-blue-700">{stats.totalSubjects}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-100 text-green-600">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold">Average Grade</p>
                                    <p className={`text-2xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                                        {stats.averageGrade ? stats.averageGrade.toFixed(1) : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-full bg-green-100 text-green-600">
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold">Total Paid</p>
                                    <p className="text-2xl font-bold text-green-700">₱{stats.totalPaid.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${stats.balance === 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                    <CreditCard className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 font-semibold">Balance</p>
                                    <p className={`text-2xl font-bold ${getPaymentStatusColor()}`}>₱{stats.balance.toLocaleString()}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Enrollments */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="w-5 h-5" />
                                    Current Subjects
                                </CardTitle>
                                <CardDescription>
                                    Your enrolled subjects for this semester
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={route('student.subjects')}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View All
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {enrollments && enrollments.length > 0 ? (
                            <div className="space-y-3">
                                {enrollments.slice(0, 5).map((enrollment) => (
                                    <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {formatSectionName(enrollment.section)}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {enrollment.section?.program?.program_name || 'N/A'}
                                            </p>
                                        </div>
                                        <Badge variant="secondary">
                                            {enrollment.status}
                                        </Badge>
                                    </div>
                                ))}
                                {enrollments.length > 5 && (
                                    <div className="pt-3 border-t text-center">
                                        <p className="text-sm text-gray-600">
                                            Showing 5 of {enrollments.length} subjects
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No current enrollments found</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Recent Grades */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Recent Grades
                        </CardTitle>
                        <CardDescription>
                            Your latest academic performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentGrades && recentGrades.length > 0 ? (
                            <div className="space-y-3">
                                {recentGrades.map((grade, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div>
                                            <h4 className="font-semibold text-gray-900">
                                                {formatSectionName(grade.student_enrollment?.section)}
                                            </h4>
                                            <p className="text-sm text-gray-600">
                                                {grade.grading_period} - {grade.semester_grade ? 'Semester' : 'Partial'} Grade
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-lg font-bold ${getGradeColor(grade.semester_grade || grade.prelim_grade)}`}>
                                                {grade.semester_grade || grade.prelim_grade || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No grades available yet</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Archived Grades */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <GraduationCap className="w-5 h-5" />
                                    Past Grades
                                </CardTitle>
                                <CardDescription>
                                    View your archived grades from previous semesters
                                </CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link href={route('student.archived-grades')}>
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Archived Grades
                                </Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8">
                            <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-4">Access your complete academic history</p>
                            <Button asChild>
                                <Link href={route('student.archived-grades')}>
                                    View Past Grades
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}