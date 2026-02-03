import { Head, Link } from '@inertiajs/react'
import { route } from 'ziggy-js'
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

    if (student.education_level === 'senior_high') {
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

// Helper function to format time to AM/PM
const formatTime = (timeString) => {
    if (!timeString) return 'TBA';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
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
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Student Dashboard</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Your academic overview and progress</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Student Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Academic Year & Semester Badge */}
                <div className="flex justify-end">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        {currentAcademicInfo?.year || '2025-2026'} - {currentAcademicInfo?.semester || '1st'} Semester
                    </Badge>
                </div>

                {/* Stats Overview - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Subjects */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                {student.student_type === 'irregular' ? 'Total Attempted' : 'Total Subjects'}
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.totalCurriculumSubjects || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Curriculum subjects
                            </p>
                        </CardContent>
                    </Card>

                    {/* Completion Rate */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completion Rate</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.completionRate || 0}%
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Academic progress
                            </p>
                        </CardContent>
                    </Card>

                    {/* Outstanding Balance */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Balance</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">
                                ₱{stats.balance?.toLocaleString() || '0'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Payment status
                            </p>
                        </CardContent>
                    </Card>

                    {/* Student Type */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Student Type</CardTitle>
                            <User className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600 capitalize">
                                {student.student_type || 'Regular'}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Enrollment status
                            </p>
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
                                {student.student_type === 'irregular' ? 'Enrolled Sections' : 'Current Section'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {student.student_type === 'irregular' ? (
                                // Show all sections for irregular students
                                <div className="space-y-3">
                                    {enrollments && enrollments.length > 0 ? (
                                        enrollments.map((enrollment, index) => (
                                            <div key={index} className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                                                <div className="flex-1">
                                                    <h4 className="font-semibold text-gray-900">
                                                        {formatSectionName(enrollment.section)}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {enrollment.section?.program?.program_name || 'Program not specified'}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4">
                                            <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                            <h3 className="text-sm font-medium text-gray-900 mb-1">No Enrolled Sections</h3>
                                            <p className="text-xs text-gray-500">You don't have any active section enrollments.</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Show single section for regular students
                                currentSection ? (
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
                                )
                            )}
                        </CardContent>
                    </Card>

                    {/* Today's Schedule Card - Takes 2 columns */}
                    <Card className="lg:col-span-2 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 mb-4">
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
                                                        {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
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

                            {/* Quick Actions - Moved to bottom of schedule card */}
                            <div className="mt-6 pt-4 border-t border-green-200">
                                <h4 className="text-sm font-medium text-green-800 mb-3 flex items-center gap-2">
                                    <Target className="w-4 h-4 text-green-600" />
                                    Quick Actions
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                            </div>
                        </CardContent>
                    </Card>
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
                        <CardContent className="pt-3">
                            {currentSubjects && currentSubjects.length > 0 ? (
                                <div className="space-y-2">
                                    {currentSubjects.slice(0, 3).map((subject) => (
                                        <div key={subject.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm truncate">
                                                    {subject.subject_name}
                                                </h4>
                                                <p className="text-xs text-gray-600 truncate">
                                                    {subject.subject_code} • {subject.teacher_name}
                                                </p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    {formatSectionName(subject.section)} • Room {subject.room}
                                                </p>
                                            </div>
                                            <div className="flex-shrink-0">
                                                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                                                    {formatTime(subject.start_time)} - {formatTime(subject.end_time)}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                    {currentSubjects.length > 3 && (
                                        <div className="text-center pt-1">
                                            <Button asChild variant="outline" size="sm" className="h-7 text-xs">
                                                <Link href={route('student.subjects')}>
                                                    View {currentSubjects.length - 3} more
                                                </Link>
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <BookOpen className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                                    <h3 className="text-sm font-medium text-gray-900 mb-1">No Current Subjects</h3>
                                    <p className="text-gray-500 text-xs">You don't have any active subjects enrolled.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Academic History */}
                    <Card className="mb-4">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-purple-600" />
                                        Academic Progress
                                    </CardTitle>
                                    <CardDescription>
                                        {student.student_type === 'irregular' 
                                            ? 'Your completion status across attempted subjects'
                                            : 'Your completion status and progress'
                                        }
                                    </CardDescription>
                                </div>
                                <Button asChild variant="ghost" size="sm">
                                    <Link href={route('student.academic-history')}>
                                        <Eye className="w-4 h-4 mr-1" />
                                        View Details
                                    </Link>
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-3">
                            <div className="grid grid-cols-2 gap-4">
                                {/* Completed Subjects */}
                                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg border border-green-200">
                                    <div className="text-2xl font-bold text-green-700 mb-1">
                                        {stats.completedSubjects || 0}/{stats.totalCurriculumSubjects || 0}
                                    </div>
                                    <div className="text-sm text-green-600 font-medium">
                                        Subjects Completed
                                    </div>
                                </div>

                                {/* Completion Percentage */}
                                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-blue-200">
                                    <div className="text-2xl font-bold text-blue-700 mb-1">
                                        {stats.completionRate ? `${stats.completionRate}%` : '0%'}
                                    </div>
                                    <div className="text-sm text-blue-600 font-medium">Completion Rate</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </AuthenticatedLayout>
    )
}