import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { School, Clock, Users, Calendar, GraduationCap, BookOpen, ChevronRight } from 'lucide-react'

export default function TeacherDashboard({ 
    teacher, 
    stats, 
    sections, 
    todaySchedule, 
    upcomingClasses, 
    recentActivities 
}) {
    // Get current semester sections only
    const currentSemester = '1st' // This should come from your app settings
    const currentAcademicYear = '2024-2025' // This should come from your app settings

    // Filter sections by current semester
    const currentSemesterSections = useMemo(() => {
        if (!sections) return []
        
        return sections.filter(section => 
            section.semester === currentSemester && section.academic_year === currentAcademicYear
        )
    }, [sections])

    // Separate college and SHS sections
    const collegeSections = useMemo(() => {
        return currentSemesterSections.filter(section => section.year_level >= 1 && section.year_level <= 4)
    }, [currentSemesterSections])

    const shsSections = useMemo(() => {
        return currentSemesterSections.filter(section => section.year_level >= 11 && section.year_level <= 12)
    }, [currentSemesterSections])

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
                        <p className="text-sm text-blue-600 font-medium mt-1">
                            Welcome back, {teacher.name} - Employee #{teacher.employee_number}
                        </p>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 sm:mt-0">
                        <Button asChild className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 shadow-md">
                            <Link href="/teacher/grades">
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Manage Grades
                            </Link>
                        </Button>
                        
                        <Badge variant="outline" className="bg-white border-blue-200 text-blue-600 px-3 py-2">
                            <Calendar className="w-4 h-4 mr-2" />
                            Today's Classes: {todaySchedule?.length || 0}
                        </Badge>
                    </div>
                </div>
            }
        >
            <Head title="Teacher Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sections</CardTitle>
                            <School className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats?.totalSections || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Active sections</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">{stats?.totalStudents || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Enrolled students</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Assignments</CardTitle>
                            <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">{stats?.totalAssignments || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Total assignments</p>
                        </CardContent>
                    </Card>

                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Classes</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-600">{todaySchedule?.length || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Classes today</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                {/* Navigation Cards */}
                <div className="grid md:grid-cols-2 gap-6">
                    {/* College Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-200/30 to-indigo-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                        
                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                    <School className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                                        College Sections
                                    </CardTitle>
                                    <CardDescription className="text-blue-600 font-medium">
                                        Manage your college section assignments
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <School className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-blue-700">{collegeSections.length}</span>
                                    <p className="text-xs text-blue-600 font-semibold">Sections</p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-green-700">
                                        {collegeSections.reduce((total, section) => total + (section.enrolled_students_count || 0), 0)}
                                    </span>
                                    <p className="text-xs text-green-600 font-semibold">Students</p>
                                </div>
                            </div>
                            
                            <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                                <Link href={route('teacher.sections.college')}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    View College Sections
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* SHS Sections Card */}
                    <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-200/30 to-pink-300/30 rounded-bl-full transform translate-x-6 -translate-y-6 group-hover:scale-110 transition-transform duration-300"></div>
                        
                        <CardHeader className="pb-4 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:shadow-xl transition-shadow">
                                    <GraduationCap className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                                        SHS Sections
                                    </CardTitle>
                                    <CardDescription className="text-purple-600 font-medium">
                                        Manage your senior high section assignments
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4 relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <GraduationCap className="w-4 h-4 text-purple-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-purple-700">{shsSections.length}</span>
                                    <p className="text-xs text-purple-600 font-semibold">Sections</p>
                                </div>
                                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-100 rounded-xl border border-green-200">
                                    <div className="flex items-center justify-center gap-1 mb-1">
                                        <Users className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="text-2xl font-bold text-green-700">
                                        {shsSections.reduce((total, section) => total + (section.enrolled_students_count || 0), 0)}
                                    </span>
                                    <p className="text-xs text-green-600 font-semibold">Students</p>
                                </div>
                            </div>
                            
                            <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-md hover:shadow-lg transition-all duration-200 font-semibold">
                                <Link href={route('teacher.sections.shs')}>
                                    <BookOpen className="w-4 h-4 mr-2" />
                                    View SHS Sections
                                    <ChevronRight className="w-4 h-4 ml-auto" />
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Today's Schedule */}
                {todaySchedule && todaySchedule.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-600" />
                                Today's Schedule
                            </CardTitle>
                            <CardDescription>Your classes scheduled for today</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {todaySchedule.map((schedule, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 rounded-lg hover:from-gray-100 hover:to-blue-100/50 transition-all duration-200">
                                        <div className="flex items-center space-x-4 flex-1">
                                            <div className="p-2 bg-blue-100 rounded-lg">
                                                <Clock className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 truncate">{schedule.subject_name}</p>
                                                <p className="text-sm text-gray-600 truncate">{schedule.section_name}</p>
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <Badge variant="outline" className="font-medium border-blue-200 text-blue-700">
                                                {schedule.start_time} - {schedule.end_time}
                                            </Badge>
                                            <p className="text-sm text-gray-600 mt-1">{schedule.room}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    );
}