import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { School, Clock, Users, Calendar, Search, GraduationCap, BookOpen, ChevronRight } from 'lucide-react'

export default function TeacherDashboard({ 
    teacher, 
    stats, 
    sections, 
    todaySchedule, 
    upcomingClasses, 
    recentActivities 
}) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedSemester, setSelectedSemester] = useState('current')
    const [activeTab, setActiveTab] = useState('college')

    // Get current semester sections only
    const currentSemester = '1st' // This should come from your app settings
    const currentAcademicYear = '2024-2025' // This should come from your app settings

    // Filter sections by current semester
    const currentSemesterSections = useMemo(() => {
        if (!sections) return []
        
        return sections.filter(section => {
            if (selectedSemester === 'current') {
                return section.semester === currentSemester && section.academic_year === currentAcademicYear
            }
            return section.semester === selectedSemester
        })
    }, [sections, selectedSemester])

    // Filter sections by search term
    const filteredSections = useMemo(() => {
        if (!searchTerm) return currentSemesterSections
        
        return currentSemesterSections.filter(section =>
            section.section_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.program_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            section.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
        )
    }, [currentSemesterSections, searchTerm])

    // Separate college and SHS sections
    const collegeSections = useMemo(() => {
        return filteredSections.filter(section => section.year_level >= 1 && section.year_level <= 4)
    }, [filteredSections])

    const shsSections = useMemo(() => {
        return filteredSections.filter(section => section.year_level >= 11 && section.year_level <= 12)
    }, [filteredSections])

    const formatScheduleDays = (days) => {
        if (!days) return 'N/A'
        try {
            const daysArray = typeof days === 'string' ? JSON.parse(days) : days
            return Array.isArray(daysArray) ? daysArray.join(', ') : days
        } catch (error) {
            return days
        }
    }

    const SectionCard = ({ section }) => (
        <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-red-200">
            <CardContent className="p-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 rounded-lg bg-red-600 flex-shrink-0">
                                <School className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-lg text-gray-900 truncate">{section.section_name}</h3>
                                <p className="text-sm text-blue-600 font-medium truncate">{section.program_name}</p>
                            </div>
                        </div>
                        <Badge variant="outline" className="ml-2 flex-shrink-0">
                            Year {section.year_level}
                        </Badge>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                            <BookOpen className="w-4 h-4 mr-3 text-red-500 flex-shrink-0" />
                            <span className="font-medium text-red-600">{section.subject_code}</span>
                            <span className="mx-2">-</span>
                            <span className="truncate">{section.subject_name}</span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-3 text-blue-500 flex-shrink-0" />
                            <span>
                                {section.start_time} - {section.end_time}
                            </span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                                {formatScheduleDays(section.schedule_days)}
                            </Badge>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-3 text-green-500 flex-shrink-0" />
                            <span>{section.enrolled_students_count || 0} students enrolled</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                        <Button asChild className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 flex-1">
                            <Link href={route('teacher.grades.show', section.id)}>
                                <GraduationCap className="w-4 h-4 mr-2" />
                                Manage Grades
                            </Link>
                        </Button>
                        <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none">
                            View Details
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )

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
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                            <div className="flex-1 max-w-md">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <Input
                                        type="text"
                                        placeholder="Search sections, subjects, or programs..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                                    <SelectTrigger className="w-48">
                                        <SelectValue placeholder="Select semester" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="current">Current Semester</SelectItem>
                                        <SelectItem value="1st">1st Semester</SelectItem>
                                        <SelectItem value="2nd">2nd Semester</SelectItem>
                                        <SelectItem value="summer">Summer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Education Level Tabs */}
                <Card>
                    <CardContent className="p-0">
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <div className="border-b border-gray-200 px-6 pt-6">
                                <TabsList className="grid w-full max-w-md grid-cols-2">
                                    <TabsTrigger 
                                        value="college" 
                                        className="data-[state=active]:bg-red-50 data-[state=active]:text-red-600 data-[state=active]:border-red-200"
                                    >
                                        <School className="w-4 h-4 mr-2" />
                                        College ({collegeSections.length})
                                    </TabsTrigger>
                                    <TabsTrigger 
                                        value="shs" 
                                        className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 data-[state=active]:border-blue-200"
                                    >
                                        <GraduationCap className="w-4 h-4 mr-2" />
                                        Senior High ({shsSections.length})
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="p-6">
                                <TabsContent value="college" className="space-y-6 mt-0">
                                    {collegeSections.length > 0 ? (
                                        <div className="grid gap-6">
                                            {collegeSections.map((section) => (
                                                <SectionCard key={section.id} section={section} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <School className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No college sections found</h3>
                                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                                {searchTerm ? 'Try adjusting your search criteria or clear the search to see all sections.' : 'No college sections are currently assigned to you for the selected semester.'}
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="shs" className="space-y-6 mt-0">
                                    {shsSections.length > 0 ? (
                                        <div className="grid gap-6">
                                            {shsSections.map((section) => (
                                                <SectionCard key={section.id} section={section} />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-2">No senior high sections found</h3>
                                            <p className="text-sm text-gray-500 max-w-md mx-auto">
                                                {searchTerm ? 'Try adjusting your search criteria or clear the search to see all sections.' : 'No senior high sections are currently assigned to you for the selected semester.'}
                                            </p>
                                        </div>
                                    )}
                                </TabsContent>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>

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