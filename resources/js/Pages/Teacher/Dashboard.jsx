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

    const formatTime = (timeString) => {
        if (!timeString) return 'N/A'
        const [hours, minutes] = timeString.split(':')
        const date = new Date()
        date.setHours(parseInt(hours), parseInt(minutes))
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        })
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'class':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                )
            case 'grading':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                )
            case 'schedule':
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                )
            default:
                return (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            Teacher Dashboard
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Welcome back, {teacher.name}
                        </p>
                    </div>
                    
                    {/* Right Navbar */}
                    <div className="flex items-center space-x-4">
                        <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400">Employee #</p>
                            <p className="font-semibold text-gray-800 dark:text-gray-200">{teacher.employee_number}</p>
                        </div>
                        
                        {/* Quick Actions Menu */}
                        <div className="flex items-center space-x-2">
                            <Link
                                href="/teacher/grades"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                                Grades
                            </Link>
                            
                            <Link
                                href="/teacher/attendance"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                Attendance
                            </Link>
                            
                            <Link
                                href="/teacher/materials"
                                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                Materials
                            </Link>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Teacher Dashboard" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Sections */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Sections
                                        </dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.totalSections || 0}
                                        </dd>
                                    </div>
                                    <div className="text-indigo-600 dark:text-indigo-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Students */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Students
                                        </dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.totalStudents || 0}
                                        </dd>
                                    </div>
                                    <div className="text-green-600 dark:text-green-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Total Subjects */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Total Subjects
                                        </dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.totalSubjects || 0}
                                        </dd>
                                    </div>
                                    <div className="text-purple-600 dark:text-purple-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Today's Classes */}
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-1">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Today's Classes
                                        </dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats?.activeClasses || 0}
                                        </dd>
                                    </div>
                                    <div className="text-red-600 dark:text-red-400">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* My Sections - Takes 2 columns */}
                        <div className="lg:col-span-2">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                                <div className="p-6">
                                    {/* Header with Search and Filters */}
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                            My Sections ({currentSemester} Semester {currentAcademicYear})
                                        </h3>
                                        
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            {/* Search Input */}
                                            <div className="relative">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                    </svg>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search sections..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                                />
                                            </div>
                                            
                                            {/* Semester Filter */}
                                            <select
                                                value={selectedSemester}
                                                onChange={(e) => setSelectedSemester(e.target.value)}
                                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                            >
                                                <option value="current">Current Semester</option>
                                                <option value="1st">1st Semester</option>
                                                <option value="2nd">2nd Semester</option>
                                                <option value="summer">Summer</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Education Level Tabs */}
                                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                                        <button
                                            onClick={() => setActiveTab('college')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                                activeTab === 'college'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            College ({collegeSections.length})
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('shs')}
                                            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                                activeTab === 'shs'
                                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                                            }`}
                                        >
                                            Senior High School ({shsSections.length})
                                        </button>
                                    </div>
                                    
                                    {/* Sections Grid */}
                                    {activeTab === 'college' && (
                                        <div className="space-y-4">
                                            {collegeSections && collegeSections.length > 0 ? (
                                                collegeSections.map((section) => (
                                                    <div key={section.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                                        {section.section_name}
                                                                    </h4>
                                                                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
                                                                        Year {section.year_level}
                                                                    </span>
                                                                    <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                                                        College
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Program:</strong> {section.program_name}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Subject:</strong> {section.subject_code} - {section.subject_name}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Room:</strong> {section.room || 'TBA'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Schedule:</strong> {section.schedule}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Academic Year:</strong> {section.academic_year}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Semester:</strong> {section.semester}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="text-right ml-6 flex flex-col items-center">
                                                                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                                                    {section.student_count}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                    Students
                                                                </div>
                                                                <Link
                                                                    href={`/teacher/sections/${section.id}`}
                                                                    className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                                >
                                                                    View Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No college sections found</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        No college sections match your current filters.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'shs' && (
                                        <div className="space-y-4">
                                            {shsSections && shsSections.length > 0 ? (
                                                shsSections.map((section) => (
                                                    <div key={section.id} className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-6 hover:shadow-md transition-all duration-200">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3 mb-3">
                                                                    <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                                                        {section.section_name}
                                                                    </h4>
                                                                    <span className="px-3 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-full">
                                                                        Grade {section.year_level}
                                                                    </span>
                                                                    <span className="px-3 py-1 text-xs font-medium bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200 rounded-full">
                                                                        Senior High
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                                                    <div>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Program:</strong> {section.program_name}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Subject:</strong> {section.subject_code} - {section.subject_name}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Room:</strong> {section.room || 'TBA'}</p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Schedule:</strong> {section.schedule}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Academic Year:</strong> {section.academic_year}</p>
                                                                        <p className="text-gray-600 dark:text-gray-400"><strong>Semester:</strong> {section.semester}</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            <div className="text-right ml-6 flex flex-col items-center">
                                                                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                                                    {section.student_count}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                                                                    Students
                                                                </div>
                                                                <Link
                                                                    href={`/teacher/sections/${section.id}`}
                                                                    className="px-3 py-1 text-xs font-medium bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                                                >
                                                                    View Details
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-8">
                                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                    </svg>
                                                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No SHS sections found</h3>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        No senior high school sections match your current filters.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Takes 1 column */}
                        <div className="space-y-6">
                            
                            {/* Today's Schedule */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Today's Schedule
                                    </h3>
                                    
                                    {todaySchedule && todaySchedule.length > 0 ? (
                                        <div className="space-y-3">
                                            {todaySchedule.map((class_, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                            {class_.subject_code}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {class_.section_name} • Room {class_.room}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatTime(class_.start_time)} - {formatTime(class_.end_time)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No classes scheduled today
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Upcoming Classes */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Upcoming Classes
                                    </h3>
                                    
                                    {upcomingClasses && upcomingClasses.length > 0 ? (
                                        <div className="space-y-3">
                                            {upcomingClasses.map((class_, index) => (
                                                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                    <div className="flex-1">
                                                        <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                                            {class_.subject_code}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {class_.section_name} • Room {class_.room}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {class_.next_class_day} - {class_.next_class_date}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                            No upcoming classes
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Recent Activities */}
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                                <div className="p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                        Recent Activities
                                    </h3>
                                    
                                    <div className="space-y-3">
                                        {recentActivities && recentActivities.length > 0 ? (
                                            recentActivities.map((activity, index) => (
                                                <div key={index} className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 text-gray-400 dark:text-gray-500 mt-1">
                                                        {getActivityIcon(activity.type)}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {activity.action}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                                            {activity.description}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                            {formatDate(activity.timestamp)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                                No recent activities
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}