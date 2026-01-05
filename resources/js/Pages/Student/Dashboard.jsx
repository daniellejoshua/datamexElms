import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    GraduationCap,
    BookOpen,
    TrendingUp,
    CreditCard,
    Calendar,
    User,
    ArrowRight,
    Eye,
    CheckCircle,
    AlertCircle,
    Clock,
    Award,
    Target,
    MapPin,
    Users,
    CalendarDays,
    Receipt
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

// Helper function to get program display name
const getProgramDisplayName = (student) => {
    if (!student) return 'N/A';

    if (student.education_level === 'shs') {
        if (student.track && student.strand) {
            return `${student.track} - ${student.strand}`;
        }
        return student.track || 'N/A';
    }

    // College program
    if (student.program?.program_name) {
        return student.program.program_name;
    }
    if (student.program?.name) {
        return student.program.name;
    }
    return 'N/A';
};

export default function Dashboard({
    auth,
    student,
    enrollments,
    currentSubjects,
    recentGrades,
    paymentStatus,
    todaySchedule,
    paymentTransactions,
    currentSection,
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
        if (!grade) return 'text-gray-500';
        if (grade >= 90) return 'text-green-600'
        if (grade >= 80) return 'text-blue-600'
        if (grade >= 75) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getGradeStatus = (grade) => {
        if (!grade) return 'No grade yet';
        if (grade >= 90) return 'Excellent'
        if (grade >= 80) return 'Very Good'
        if (grade >= 75) return 'Good'
        return 'Needs Improvement'
    }

    const getPaymentStatusColor = () => {
        if (stats.balance === 0) return 'text-green-600'
        if (stats.balance > 0 && stats.totalPaid > 0) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPaymentStatusText = () => {
        if (stats.balance === 0) return 'Fully Paid'
        if (stats.balance > 0 && stats.totalPaid > 0) return 'Partial Payment'
        return 'Unpaid'
    }

    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg shadow-sm">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">Dashboard</h2>
                            <p className="text-sm text-gray-600">Welcome back, {student.user.first_name || student.user.name}</p>
                        </div>
                    </div>
                   
                </div>
            }
        >
            <Head title="Student Dashboard" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Current Section Card */}
             

                   
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-blue-600">{stats.totalSubjects}</p>
                                    <p className="text-xs text-gray-600">Subjects</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-green-600">
                                        {stats.averageGrade ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-600">Avg Grade</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <CreditCard className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-purple-600">
                                        ₱{stats.balance?.toLocaleString() || '0'}
                                    </p>
                                    <p className="text-xs text-gray-600">Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="mb-4">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Award className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-orange-600">
                                        {student.student_type === 'regular' ? 'Regular' : 'Irregular'}
                                    </p>
                                    <p className="text-xs text-gray-600">Status</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Current Academic Info & Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-6">
                    {/* Current Section Card */}
                    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 mb-4">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2 text-blue-800">
                                <Users className="w-5 h-5 text-blue-600" />
                                Current Section
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {currentSection ? (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-gray-900">
                                                {formatSectionName(currentSection)}
                                            </h3>
                                            <p className="text-sm text-gray-700">
                                                {currentSection.program?.program_name || 'Program not specified'}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                                                Year {currentSection.year_level}
                                            </Badge>
                                            <div className="text-right">
                                                <div className="text-xs text-gray-500 uppercase tracking-wide">AY {currentSection.academic_year}</div>
                                                <div className="text-xs text-gray-500 uppercase tracking-wide">{currentSection.semester} Semester</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Active Section</h3>
                                    <p className="text-xs text-gray-500">You don't have an active section assigned yet.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Schedule Card - Takes 2 columns */}
                    <Card className="lg:col-span-1 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-4">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-lg flex items-center gap-2 text-green-800">
                                        <CalendarDays className="w-5 h-5 text-green-600" />
                                        Today's Schedule
                                    </CardTitle>
                                    <CardDescription className="text-green-700">
                                        {currentAcademicInfo.today}
                                    </CardDescription>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-green-800">
                                        {todaySchedule?.length || 0}
                                    </div>
                                    <div className="text-xs text-green-600">Classes</div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {todaySchedule && todaySchedule.length > 0 ? (
                                <div className="space-y-3">
                                    {todaySchedule.map((schedule, index) => (
                                        <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white rounded-lg border border-green-100 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <Clock className="w-4 h-4 text-green-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0 w-full">
                                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1 gap-2">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {schedule.subject_code}
                                                    </h4>
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs self-start sm:self-auto">
                                                        {schedule.start_time} - {schedule.end_time}
                                                    </Badge>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <MapPin className="w-3 h-3" />
                                                        Room {schedule.room || 'TBA'}
                                                    </span>
                                                    {schedule.teacher_name && (
                                                        <span className="flex items-center gap-1">
                                                            <User className="w-3 h-3" />
                                                            {schedule.teacher_name}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-green-500" />
                                    </div>
                                    <h3 className="text-lg font-medium text-green-800 mb-2">No Classes Today</h3>
                                    <p className="text-green-600 text-sm">Enjoy your day off! 🎉</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions - Compressed */}
                    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 mb-4">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2 text-purple-800">
                                <Target className="w-4 h-4 text-purple-600" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="grid grid-cols-2 gap-2">
                                <Button asChild variant="outline" size="sm" className="h-12 flex-col gap-1 border-blue-300 text-blue-600 hover:bg-blue-50 text-xs">
                                    <Link href={route('student.subjects')}>
                                        <BookOpen className="w-3 h-3" />
                                        <span>My Subjects</span>
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="sm" className="h-12 flex-col gap-1 border-green-300 text-green-600 hover:bg-green-50 text-xs">
                                    <Link href={route('student.grades')}>
                                        <TrendingUp className="w-3 h-3" />
                                        <span>My Grades</span>
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="sm" className="h-12 flex-col gap-1 border-purple-300 text-purple-600 hover:bg-purple-50 text-xs">
                                    <Link href={route('student.payments')}>
                                        <CreditCard className="w-3 h-3" />
                                        <span>Payments</span>
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="sm" className="h-12 flex-col gap-1 border-orange-300 text-orange-600 hover:bg-orange-50 text-xs">
                                    <Link href={route('student.archived-grades')}>
                                        <GraduationCap className="w-3 h-3" />
                                        <span>Past Grades</span>
                                    </Link>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Current Subjects */}
                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                        Current Subjects
                                    </CardTitle>
                                    <CardDescription>
                                        Your enrolled subjects for {currentAcademicInfo.semester} Semester
                                    </CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={route('student.subjects')}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        View All
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {currentSubjects && currentSubjects.length > 0 ? (
                                <div className="space-y-3">
                                    {currentSubjects.slice(0, 3).map((subject) => (
                                        <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {subject.subject_name}
                                                </h4>
                                                <p className="text-sm text-gray-600 truncate">
                                                    {subject.subject_code} • {subject.teacher_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {subject.section_name} • Room {subject.room}
                                                </p>
                                            </div>
                                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                {subject.start_time} - {subject.end_time}
                                            </Badge>
                                        </div>
                                    ))}
                                    {currentSubjects.length > 3 && (
                                        <div className="text-center pt-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('student.subjects')}>
                                                    View {currentSubjects.length - 3} more subjects
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Current Subjects</h3>
                                    <p className="text-gray-500 text-sm">You don't have any active subjects enrolled.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Grades */}
                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Recent Grades
                                    </CardTitle>
                                    <CardDescription>
                                        Your latest academic performance
                                    </CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={route('student.grades')}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        View All
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {recentGrades && recentGrades.length > 0 ? (
                                <div className="space-y-3">
                                    {recentGrades.slice(0, 3).map((grade, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 truncate">
                                                    {formatSectionName(grade.student_enrollment?.section)}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {grade.grading_period}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-lg font-bold ${getGradeColor(grade.semester_grade || grade.prelim_grade)}`}>
                                                    {grade.semester_grade || grade.prelim_grade || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {recentGrades.length > 3 && (
                                        <div className="text-center pt-2">
                                            <Button asChild variant="outline" size="sm">
                                                <Link href={route('student.grades')}>
                                                    View {recentGrades.length - 3} more grades
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Grades Available</h3>
                                    <p className="text-gray-500 text-sm">Your grades will appear here once posted.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

            </div>
        </AuthenticatedLayout>
    )
}