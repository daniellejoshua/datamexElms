import { Head } from '@inertiajs/react'
import { Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table'
// import { Badge } from '@/Components/ui/badge'

export default function AdminDashboard({ 
    stats, 
    recentActivity, 
    enrollmentStats, 
    programStats, 
    lowEnrollmentSections 
}) {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getActionColor = (action) => {
        const colors = {
            created: 'default',
            updated: 'secondary',
            deleted: 'destructive',
            enrolled: 'default',
            graduated: 'outline'
        }
        return colors[action.toLowerCase()] || 'secondary'
    }
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Admin Dashboard
                </h2>
            }
        >
            <Head title="Admin Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        {/* Total Users */}
                        <Link href="/admin/users" className="block">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-shadow duration-200">
                                <div className="p-6">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Total Users
                                            </dt>
                                            <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                                {stats?.totalUsers || 0}
                                            </dd>
                                        </div>
                                        <div className="text-indigo-600 dark:text-indigo-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Total Students */}
                        <Link href="/admin/students" className="block">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-shadow duration-200">
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
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Total Teachers */}
                        <Link href="/admin/teachers" className="block">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-shadow duration-200">
                                <div className="p-6">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Total Teachers
                                            </dt>
                                            <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                                {stats?.totalTeachers || 0}
                                            </dd>
                                        </div>
                                        <div className="text-blue-600 dark:text-blue-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>

                        {/* Active Courses */}
                        <Link href="/admin/courses" className="block">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg hover:shadow-lg transition-shadow duration-200">
                                <div className="p-6">
                                    <div className="flex items-center">
                                        <div className="flex-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Active Courses
                                            </dt>
                                            <dd className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                                {stats?.totalCourses || 0}
                                            </dd>
                                        </div>
                                        <div className="text-purple-600 dark:text-purple-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    </div>

                    {/* Quick Actions */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Quick Actions
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Link 
                                    href="/admin/sections" 
                                    className="flex items-center p-3 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-md transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Manage Sections
                                </Link>
                                
                                <Link 
                                    href="/admin/academic-years" 
                                    className="flex items-center p-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors duration-200"
                                >
                                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Academic Year Archives
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Low Enrollment Warning */}
                    {stats?.lowEnrollmentSections && stats.lowEnrollmentSections.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
                            <div className="flex">
                                <div className="ml-3">
                                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                                        Low Enrollment Sections
                                    </h3>
                                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                                        <ul className="list-disc list-inside">
                                            {stats.lowEnrollmentSections.map((section, index) => (
                                                <li key={index}>
                                                    Section {section.section_name} ({section.enrollments_count} students enrolled)
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}