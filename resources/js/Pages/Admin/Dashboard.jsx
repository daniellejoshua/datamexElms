import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Users, School, GraduationCap, BookOpen, Calendar, AlertTriangle, TrendingUp, UserX, UserCheck, ClipboardList, Target, Activity, BarChart3 } from 'lucide-react'

export default function AdminDashboard({ 
    stats, 
    enrollmentStats, 
    programStats, 
    lowEnrollmentSections,
    studentsWithoutSections,
    sectionsWithoutTeachers,
    pendingGradeTeachers
}) {
    // Enhanced data processing for better visualization
    const processedEnrollmentStats = enrollmentStats?.map(item => ({
        ...item,
        education_level: item.education_level === 'senior_high' ? 'Senior High School' : 'College',
        percentage: ((item.count / (stats?.totalStudents || 1)) * 100).toFixed(1)
    })) || []

    const alertSummary = {
        total: (lowEnrollmentSections?.length || 0) + 
               (studentsWithoutSections?.length || 0) + 
               (sectionsWithoutTeachers?.length || 0) + 
               (pendingGradeTeachers?.length || 0),
        lowEnrollment: lowEnrollmentSections?.length || 0,
        unassignedStudents: studentsWithoutSections?.length || 0,
        unassignedSubjects: sectionsWithoutTeachers?.length || 0,
        pendingGrades: pendingGradeTeachers?.length || 0
    }

    const alertData = [
        { name: 'Low Enrollment', count: alertSummary.lowEnrollment, color: '#f59e0b' },
        { name: 'Unassigned Students', count: alertSummary.unassignedStudents, color: '#ef4444' },
        { name: 'Unassigned Subjects', count: alertSummary.unassignedSubjects, color: '#f97316' },
        { name: 'Pending Grades', count: alertSummary.pendingGrades, color: '#8b5cf6' }
    ].filter(item => item.count > 0)
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <BarChart3 className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Dashboard</h2>
                            <p className="text-xs text-gray-500 mt-0.5">System overview and management</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard" />
            
            <div className="p-6 lg:p-8 space-y-8">
                {/* Progress Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalUsers}</div>
                            <Progress value={100} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                All registered
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Students</CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalStudents}</div>
                            <Progress value={stats.totalUsers > 0 ? (stats.totalStudents / stats.totalUsers) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.totalUsers > 0 ? Math.round((stats.totalStudents / stats.totalUsers) * 100) : 0}% of total users
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                            <Progress value={stats.totalUsers > 0 ? (stats.totalTeachers / stats.totalUsers) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.totalUsers > 0 ? Math.round((stats.totalTeachers / stats.totalUsers) * 100) : 0}% of total users
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
                            <Progress value={stats.totalStudents > 0 ? (stats.activeEnrollments / stats.totalStudents) * 100 : 0} className="h-1 mt-2" />
                            <div className="text-xs text-muted-foreground mt-1">
                                {stats.totalStudents > 0 ? Math.round((stats.activeEnrollments / stats.totalStudents) * 100) : 0}% of students enrolled
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Enrollment & Program Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Enrollment Distribution */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="w-5 h-5 text-blue-600" />
                                Enrollment Distribution
                            </CardTitle>
                            <CardDescription>Student distribution by education level</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {processedEnrollmentStats.map((item, index) => {
                                const percentage = parseFloat(item.percentage);
                                return (
                                    <div key={index} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 ${item.education_level === 'College' ? 'bg-blue-500' : 'bg-emerald-500'} rounded-full`}></div>
                                                <span className="text-sm font-medium">{item.education_level} Students</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{item.count.toLocaleString()}</div>
                                                <div className="text-xs text-gray-500">{percentage}%</div>
                                            </div>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Students</span>
                                    <Badge variant="default" className="bg-blue-100 text-blue-800">
                                        {stats.totalStudents.toLocaleString()}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Regular and Irregular */}
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                                Regular and Irregular
                            </CardTitle>
                            <CardDescription>Student enrollment by type</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {programStats && programStats.map((program, index) => {
                                const totalPrograms = programStats.reduce((sum, p) => sum + p.count, 0);
                                const percentage = totalPrograms > 0 ? Math.round((program.count / totalPrograms) * 100) : 0;
                                const colorClass = program.student_type === 'regular' ? 'bg-green-500' : 'bg-orange-500';

                                return (
                                    <div key={program.student_type} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 ${colorClass} rounded-full`}></div>
                                                <span className="text-sm font-medium">
                                                    {program.student_type === 'regular' ? 'Regular Students' : 'Irregular Students'}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{program.count}</div>
                                                <div className="text-xs text-gray-500">{percentage}%</div>
                                            </div>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Students</span>
                                    <Badge variant="default" className="bg-green-100 text-green-800">
                                        {stats.totalStudents}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Alert Overview */}
                {alertData.length > 0 && (
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Target className="w-5 h-5 text-red-600" />
                                        System Alerts Overview
                                    </CardTitle>
                                    <CardDescription>Current system alerts by category</CardDescription>
                                </div>
                                <Link href={route('admin.alerts.index')}>
                                    <Button variant="outline" size="sm" className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        View All Alerts
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {alertData.map((item, index) => {
                                const totalAlerts = alertData.reduce((sum, alert) => sum + alert.count, 0);
                                const percentage = totalAlerts > 0 ? Math.round((item.count / totalAlerts) * 100) : 0;

                                return (
                                    <div key={index} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-sm font-medium">{item.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold">{item.count}</div>
                                                <div className="text-xs text-gray-500">{percentage}%</div>
                                            </div>
                                        </div>
                                        <Progress value={percentage} className="h-2" />
                                    </div>
                                );
                            })}
                            <div className="pt-4 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Total Alerts</span>
                                    <Badge variant="destructive">
                                        {alertSummary.total}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

            </div>
        </AuthenticatedLayout>
    );
}