import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { useState, useMemo } from 'react'

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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 rounded-lg bg-gradient-to-r from-red-500 to-blue-600">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900">{section.section_name}</h3>
                            <p className="text-sm text-blue-600 font-medium">{section.program_name}</p>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                            <span className="font-medium">{section.subject_code}</span> - {section.subject_name}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {section.start_time} - {section.end_time} ({formatScheduleDays(section.schedule_days)})
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {section.enrolled_students_count || 0} students
                        </div>
                    </div>
                </div>
                
                <div className="flex flex-col gap-2 ml-4">
                    <Link
                        href={route('teacher.grades.show', section.id)}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-blue-600 rounded-lg hover:from-red-600 hover:to-blue-700 transition-all duration-200"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Manage Grades
                    </Link>
                    <button className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Details
                    </button>
                </div>
            </div>
        </div>
    )

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h2>
                        <p className="text-sm text-blue-600 font-medium mt-1">
                            Welcome back, {teacher.name} - Employee #{teacher.employee_number}
                        </p>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        <Link
                            href="/teacher/grades"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-blue-600 rounded-lg hover:from-red-600 hover:to-blue-700 transition-all duration-200 shadow-md"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Manage Grades
                        </Link>
                        
                        <div className="bg-white border-2 border-blue-200 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium">
                            Today's Classes: {todaySchedule?.length || 0}
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Teacher Dashboard" />

            <div className="p-6 space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-red-50 text-red-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Sections</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalSections || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Total Students</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-green-50 text-green-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Assignments</p>
                                <p className="text-2xl font-bold text-gray-900">{stats?.totalAssignments || 0}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Today's Classes</p>
                                <p className="text-2xl font-bold text-gray-900">{todaySchedule?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search sections..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                                />
                            </div>
                        </div>
                        
                        <div className="flex gap-3">
                            <select
                                value={selectedSemester}
                                onChange={(e) => setSelectedSemester(e.target.value)}
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                            >
                                <option value="current">Current Semester</option>
                                <option value="1st">1st Semester</option>
                                <option value="2nd">2nd Semester</option>
                                <option value="summer">Summer</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Education Level Tabs */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="border-b border-gray-200">
                        <nav className="flex">
                            <button
                                onClick={() => setActiveTab('college')}
                                className={`px-6 py-4 text-sm font-medium transition-colors ${
                                    activeTab === 'college'
                                        ? 'text-red-600 border-b-2 border-red-600 bg-red-50'
                                        : 'text-gray-500 hover:text-red-600 hover:bg-red-50'
                                }`}
                            >
                                College ({collegeSections.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('shs')}
                                className={`px-6 py-4 text-sm font-medium transition-colors ${
                                    activeTab === 'shs'
                                        ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                                        : 'text-gray-500 hover:text-blue-600 hover:bg-blue-50'
                                }`}
                            >
                                Senior High ({shsSections.length})
                            </button>
                        </nav>
                    </div>

                    {/* Sections Content */}
                    <div className="p-6">
                        {activeTab === 'college' && (
                            <div className="space-y-6">
                                {collegeSections.length > 0 ? (
                                    <div className="grid gap-6">
                                        {collegeSections.map((section) => (
                                            <SectionCard key={section.id} section={section} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No college sections found</h3>
                                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or check back later.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'shs' && (
                            <div className="space-y-6">
                                {shsSections.length > 0 ? (
                                    <div className="grid gap-6">
                                        {shsSections.map((section) => (
                                            <SectionCard key={section.id} section={section} />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No senior high sections found</h3>
                                        <p className="mt-1 text-sm text-gray-500">Try adjusting your search criteria or check back later.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Today's Schedule */}
                {todaySchedule && todaySchedule.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Today's Schedule</h3>
                        <div className="space-y-3">
                            {todaySchedule.map((schedule, index) => (
                                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <p className="font-medium text-gray-900">{schedule.subject_name}</p>
                                        <p className="text-sm text-gray-600">{schedule.section_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-blue-600">{schedule.start_time} - {schedule.end_time}</p>
                                        <p className="text-sm text-gray-600">{schedule.room}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    )
}