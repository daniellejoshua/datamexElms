import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, School, GraduationCap, BookOpen, Calendar, AlertTriangle, Clock, BarChart3 } from 'lucide-react'

export default function AdminDashboard({ 
    stats, 
    recentActivity, 
    enrollmentStats, 
    programStats, 
    lowEnrollmentSections 
}) {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Head Teacher Dashboard</h2>
                        <p className="text-sm text-blue-600 font-medium mt-1">Manage academic sections and oversight</p>
                    </div>
                </div>
            }
        >
            <Head title="Head Teacher Dashboard" />
            
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Stats Overview - Responsive Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Students */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.totalStudents || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active enrollments
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Sections */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalSections || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active sections
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Teachers */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.totalTeachers || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Active faculty
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Courses */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalCourses || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Subject offerings
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid - Responsive Layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Management Cards - Takes up 2/3 on large screens */}
                    <div className="xl:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl">Management Hub</CardTitle>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                {/* Section Management Card */}
                                <Link 
                                    href={route('admin.sections.index')}
                                    className="group block"
                                >
                                    <Card className="transition-all duration-200 hover:shadow-md border-2 hover:border-blue-600 bg-blue-50 group-hover:bg-blue-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-blue-600 rounded-lg">
                                                    <School className="w-6 h-6 text-white" />
                                                </div>
                                                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Manage Sections</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">Create, edit, and organize academic sections.</p>
                                        </CardContent>
                                    </Card>
                                </Link>

                                {/* Academic Years Card */}
                                <Link 
                                    href={route('admin.academic-years.index')}
                                    className="group block"
                                >
                                    <Card className="transition-all duration-200 hover:shadow-md border-2 hover:border-red-600 bg-red-50 group-hover:bg-red-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-red-600 rounded-lg">
                                                    <Calendar className="w-6 h-6 text-white" />
                                                </div>
                                                <svg className="w-5 h-5 text-red-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Academic Years</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">Manage academic year transitions.</p>
                                        </CardContent>
                                    </Card>
                                </Link>

                                {/* Schedule Management Card */}
                                <Link 
                                    href={route('admin.schedules.index')}
                                    className="group block"
                                >
                                    <Card className="transition-all duration-200 hover:shadow-md border-2 hover:border-blue-600 bg-blue-50 group-hover:bg-blue-100">
                                        <CardContent className="p-6">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="p-3 bg-blue-600 rounded-lg">
                                                    <Clock className="w-6 h-6 text-white" />
                                                </div>
                                                <svg className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-900 mb-2">Class Schedules</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">Manage class timetables and assignments.</p>
                                        </CardContent>
                                    </Card>
                                </Link>

                                {/* Reports Card */}
                                <Card className="bg-red-50">
                                    <CardContent className="p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="p-3 bg-red-600 rounded-lg">
                                                <BarChart3 className="w-6 h-6 text-white" />
                                            </div>
                                            <Badge variant="secondary" className="bg-red-200 text-red-800">Coming Soon</Badge>
                                        </div>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2">Reports & Analytics</h4>
                                        <p className="text-sm text-gray-600 leading-relaxed">Generate comprehensive reports.</p>
                                    </CardContent>
                                </Card>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Low Enrollment Warning */}
                        {lowEnrollmentSections && lowEnrollmentSections.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <div className="flex items-start space-x-3">
                                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-1" />
                                        <div>
                                            <CardTitle className="text-lg">Low Enrollment Alert</CardTitle>
                                            <CardDescription>Sections requiring attention</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {lowEnrollmentSections.slice(0, 3).map((section, index) => (
                                            <div key={index} className="p-3 rounded-lg border border-yellow-200 bg-yellow-50">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-sm text-gray-900">{section.section_name}</p>
                                                        <p className="text-xs text-gray-600">{section.program_name}</p>
                                                    </div>
                                                    <Badge variant="outline" className="text-yellow-700 border-yellow-700">
                                                        {section.student_count} students
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activities */}
                        {recentActivity && recentActivity.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recent Activity</CardTitle>
                                    <CardDescription>Latest system updates</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentActivity.slice(0, 5).map((activity, index) => (
                                            <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                                                <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {activity.description || activity.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {activity.time || activity.created_at}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}