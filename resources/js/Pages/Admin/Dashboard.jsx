import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Users, School, GraduationCap, BookOpen, Calendar, AlertTriangle, Clock, BarChart3, ArrowRight, TrendingUp } from 'lucide-react'

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
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Students */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.totalStudents || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active enrollments
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Sections */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalSections || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active sections
                            </p>
                        </CardContent>
                    </Card>

                    {/* Total Teachers */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Teachers</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {stats?.totalTeachers || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Active faculty
                            </p>
                        </CardContent>
                    </Card>

                    {/* Active Courses */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats?.totalCourses || 0}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Subject offerings
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Grid - Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Management Hub - Takes up 2/3 on large screens */}
                    <div className="lg:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-xl font-semibold">Management Hub</CardTitle>
                                <CardDescription>Quick access to administrative functions</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Section Management Card */}
                                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 hover:border-blue-500/50 cursor-pointer">
                                        <Link 
                                            href={route('admin.sections.index')}
                                            className="block"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300" />
                                            <CardHeader className="relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="p-3 bg-blue-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                                        <School className="w-6 h-6 text-white" />
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    Sections Management
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative pt-0">
                                                <CardDescription className="text-gray-600 leading-relaxed">
                                                    Create and manage academic sections, student enrollments, and class assignments.
                                                </CardDescription>
                                                <div className="flex items-center mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                                                    <span>Manage Sections</span>
                                                    <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>

                                    {/* Academic Years Card */}
                                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 hover:border-red-500/50 cursor-pointer">
                                        <Link 
                                            href={route('admin.academic-years.index')}
                                            className="block"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 group-hover:from-red-500/10 group-hover:to-red-600/20 transition-all duration-300" />
                                            <CardHeader className="relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="p-3 bg-red-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                                        <Calendar className="w-6 h-6 text-white" />
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-red-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-red-700 transition-colors">
                                                    Academic Years
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative pt-0">
                                                <CardDescription className="text-gray-600 leading-relaxed">
                                                    Manage academic year transitions, semester records, and annual configurations.
                                                </CardDescription>
                                                <div className="flex items-center mt-4 text-sm font-medium text-red-600 group-hover:text-red-700">
                                                    <span>Manage Years</span>
                                                    <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>

                                    {/* Schedule Management Card */}
                                    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl border-2 hover:border-blue-500/50 cursor-pointer">
                                        <Link 
                                            href={route('admin.schedules.index')}
                                            className="block"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 group-hover:from-blue-500/10 group-hover:to-blue-600/20 transition-all duration-300" />
                                            <CardHeader className="relative">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="p-3 bg-blue-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                                        <Clock className="w-6 h-6 text-white" />
                                                    </div>
                                                    <ArrowRight className="w-5 h-5 text-blue-600 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-2 transition-all duration-300" />
                                                </div>
                                                <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                                    Schedule Management
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="relative pt-0">
                                                <CardDescription className="text-gray-600 leading-relaxed">
                                                    Manage class timetables, room assignments, and teaching schedules.
                                                </CardDescription>
                                                <div className="flex items-center mt-4 text-sm font-medium text-blue-600 group-hover:text-blue-700">
                                                    <span>Manage Schedules</span>
                                                    <ArrowRight className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" />
                                                </div>
                                            </CardContent>
                                        </Link>
                                    </Card>

                                    {/* Reports Card */}
                                    <Card className="relative overflow-hidden transition-all duration-300 border-2 border-gray-200 bg-gray-50/50">
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-100/30 to-gray-200/20" />
                                        <CardHeader className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-3 bg-gray-400 rounded-xl shadow-md">
                                                    <BarChart3 className="w-6 h-6 text-white" />
                                                </div>
                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 shadow-sm">
                                                    Coming Soon
                                                </Badge>
                                            </div>
                                            <CardTitle className="text-lg font-bold text-gray-700">
                                                Analytics & Reports
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="relative pt-0">
                                            <CardDescription className="text-gray-500 leading-relaxed">
                                                Comprehensive analytics, performance reports, and data insights.
                                            </CardDescription>
                                            <div className="flex items-center mt-4 text-sm font-medium text-gray-400">
                                                <span>Available Soon</span>
                                                <Clock className="w-4 h-4 ml-1" />
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar - Responsive */}
                    <div className="space-y-6">
                        {/* Low Enrollment Warning */}
                        {lowEnrollmentSections && lowEnrollmentSections.length > 0 && (
                            <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-amber-800 font-bold">Low Enrollment Alert</CardTitle>
                                            <CardDescription className="text-amber-700 font-medium">Sections requiring attention</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {lowEnrollmentSections.slice(0, 3).map((section, index) => (
                                        <Card key={index} className="p-4 border border-amber-200 bg-white/80 hover:bg-white hover:shadow-sm transition-all duration-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-sm text-gray-900 truncate">{section.section_name}</p>
                                                    <p className="text-xs text-gray-600 truncate mt-1">{section.program_name}</p>
                                                </div>
                                                <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 font-semibold ml-3">
                                                    {section.student_count} students
                                                </Badge>
                                            </div>
                                        </Card>
                                    ))}
                                    {lowEnrollmentSections.length > 3 && (
                                        <div className="text-center pt-3 border-t border-amber-200">
                                            <Badge variant="secondary" className="text-amber-700 bg-amber-100">
                                                +{lowEnrollmentSections.length - 3} more sections need attention
                                            </Badge>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )}

                        {/* Enrollment Overview */}
                        {enrollmentStats && (
                            <Card className="shadow-md border-2 border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-gray-900 font-bold">Enrollment Overview</CardTitle>
                                            <CardDescription className="text-gray-600">Current semester statistics</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-4">
                                        <Card className="p-4 bg-blue-50/50 border border-blue-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <GraduationCap className="w-4 h-4 text-blue-600" />
                                                    <span className="text-sm font-semibold text-gray-700">College</span>
                                                </div>
                                                <Badge className="bg-blue-600 text-white font-bold">{enrollmentStats.college || 0}</Badge>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-700 ease-out" 
                                                    style={{
                                                        width: `${enrollmentStats.total ? (enrollmentStats.college / enrollmentStats.total) * 100 : 0}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </Card>
                                        
                                        <Card className="p-4 bg-red-50/50 border border-red-100">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-2">
                                                    <School className="w-4 h-4 text-red-600" />
                                                    <span className="text-sm font-semibold text-gray-700">Senior High</span>
                                                </div>
                                                <Badge className="bg-red-600 text-white font-bold">{enrollmentStats.shs || 0}</Badge>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div 
                                                    className="bg-red-600 h-2.5 rounded-full transition-all duration-700 ease-out" 
                                                    style={{
                                                        width: `${enrollmentStats.total ? (enrollmentStats.shs / enrollmentStats.total) * 100 : 0}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </Card>
                                        
                                        <div className="pt-4 border-t border-gray-200">
                                            <div className="flex items-center justify-between">
                                                <span className="text-base font-bold text-gray-900">Total Enrollment</span>
                                                <Badge variant="outline" className="text-lg font-bold text-gray-900 border-gray-300 px-3 py-1">
                                                    {enrollmentStats.total || 0}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Recent Activity */}
                        {recentActivity && recentActivity.length > 0 && (
                            <Card className="shadow-md border-2 border-gray-100 hover:shadow-lg transition-shadow duration-300">
                                <CardHeader className="pb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-green-100 rounded-lg">
                                            <Clock className="w-5 h-5 text-green-600" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg text-gray-900 font-bold">Recent Activity</CardTitle>
                                            <CardDescription className="text-gray-600">Latest system updates</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentActivity.slice(0, 4).map((activity, index) => (
                                            <Card key={index} className="p-4 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200">
                                                <div className="flex items-start space-x-4">
                                                    <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2 shadow-sm"></div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 truncate leading-relaxed">
                                                            {activity.description || activity.title}
                                                        </p>
                                                        <div className="flex items-center mt-2">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {activity.time || activity.created_at}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Card>
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