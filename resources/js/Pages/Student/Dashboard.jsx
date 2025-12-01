import { Head } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'

export default function Dashboard({ 
    auth,
    student, 
    enrollments, 
    recentGrades, 
    paymentSummary, 
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
        if (grade >= 90) return 'text-green-600'
        if (grade >= 80) return 'text-blue-600'
        if (grade >= 75) return 'text-yellow-600'
        return 'text-red-600'
    }

    const getPaymentStatusColor = () => {
        if (stats.balance === 0) return 'text-green-600'
        if (stats.balance > 0 && stats.totalPaid > 0) return 'text-yellow-600'
        return 'text-red-600'
    }

    return (
        <AuthenticatedLayout auth={auth}>
            <Head title="Student Dashboard" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Welcome Header */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h1 className="text-2xl font-bold">
                                        Welcome back, {student.user.name}!
                                    </h1>
                                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                                        <p>Student Number: <span className="font-medium">{student.student_number}</span></p>
                                        <p>Year Level: <span className="font-medium">{student.year_level}</span></p>
                                        {student.education_level === 'shs' ? (
                                            <p>Track: <span className="font-medium">{student.track || 'N/A'}</span></p>
                                        ) : (
                                            <p>Program: <span className="font-medium">{student.program || 'N/A'}</span></p>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right text-sm text-gray-600 dark:text-gray-400">
                                    <p>Academic Year: {currentAcademicInfo.year}</p>
                                    <p>Semester: {currentAcademicInfo.semester}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                                        📚
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Enrolled Subjects</p>
                                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            {stats.totalSubjects}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                                        📊
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Grade</p>
                                        <p className={`text-2xl font-semibold ${getGradeColor(stats.averageGrade)}`}>
                                            {stats.averageGrade ? stats.averageGrade.toFixed(1) : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400">
                                        💰
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Payments Made</p>
                                        <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                                            ₱{stats.totalPaid.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className={`p-3 rounded-full ${stats.balance > 0 ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400' : 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'}`}>
                                        {stats.balance > 0 ? '⚠️' : '✅'}
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Balance</p>
                                        <p className={`text-2xl font-semibold ${getPaymentStatusColor()}`}>
                                            ₱{stats.balance.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Payment Status</h2>
                            {paymentSummary ? (
                                <div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Due</p>
                                            <p className="text-xl font-semibold text-blue-800 dark:text-blue-300">
                                                ₱{paymentSummary.total_due?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                            <p className="text-sm text-green-600 dark:text-green-400 font-medium">Paid</p>
                                            <p className="text-xl font-semibold text-green-800 dark:text-green-300">
                                                ₱{paymentSummary.total_paid?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-lg ${
                                            paymentSummary.balance > 0 
                                                ? 'bg-red-50 dark:bg-red-900/20' 
                                                : 'bg-green-50 dark:bg-green-900/20'
                                        }`}>
                                            <p className={`text-sm font-medium ${
                                                paymentSummary.balance > 0 
                                                    ? 'text-red-600 dark:text-red-400' 
                                                    : 'text-green-600 dark:text-green-400'
                                            }`}>Balance</p>
                                            <p className={`text-xl font-semibold ${
                                                paymentSummary.balance > 0 
                                                    ? 'text-red-800 dark:text-red-300' 
                                                    : 'text-green-800 dark:text-green-300'
                                            }`}>
                                                ₱{paymentSummary.balance?.toLocaleString() || '0'}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {paymentSummary.unpaid_periods?.length > 0 && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
                                            <h4 className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                                                ⚠️ Payment Required for Grade Access
                                            </h4>
                                            <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-2">
                                                You need to pay for the following periods to view your grades:
                                            </p>
                                            <div className="flex flex-wrap gap-2">
                                                {paymentSummary.unpaid_periods.map((period) => (
                                                    <span 
                                                        key={period}
                                                        className="inline-block bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm font-medium px-2 py-1 rounded"
                                                    >
                                                        {period.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {paymentSummary.paid_periods?.length > 0 && (
                                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg mt-4">
                                            <h4 className="text-green-800 dark:text-green-200 font-medium mb-2">
                                                ✅ Paid Periods (Grade Access Available)
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {paymentSummary.paid_periods.map((period) => (
                                                    <span 
                                                        key={period}
                                                        className="inline-block bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 text-sm font-medium px-2 py-1 rounded"
                                                    >
                                                        {period.replace('_', ' ').toUpperCase()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-2">💳</div>
                                    <p className="text-gray-500 dark:text-gray-400">No payment information available</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Enrollments */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Current Subjects</h2>
                            {enrollments.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Course
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Section
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Teacher
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {enrollments.map((enrollment) => (
                                                <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                            {enrollment.section.course.course_code}
                                                        </div>
                                                        <div className="text-sm text-gray-500 dark:text-gray-400">
                                                            {enrollment.section.course.course_name}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {enrollment.section.section_name}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {enrollment.section.teacher_assignments?.[0]?.teacher?.user?.name || 'TBA'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {enrollment.section.class_schedules?.length > 0 
                                                            ? enrollment.section.class_schedules.map(schedule => 
                                                                `${schedule.day_of_week} ${schedule.start_time}-${schedule.end_time}`
                                                              ).join(', ')
                                                            : 'TBA'
                                                        }
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                            enrollment.status === 'active' 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                        }`}>
                                                            {enrollment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-2">📚</div>
                                    <p className="text-gray-500 dark:text-gray-400">No enrollments found</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Grades */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">Recent Grades</h2>
                            {recentGrades.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Subject
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Prelim
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Midterm
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Finals
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Semester Grade
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {recentGrades.map((grade) => (
                                                <tr key={grade.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {grade.student_enrollment?.section?.course?.course_code || 'N/A'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {grade.payment_required && grade.period === 'prelim' ? (
                                                            <span className="text-red-500 font-medium">Payment Required</span>
                                                        ) : (
                                                            grade.prelim_grade || '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {grade.payment_required && grade.period === 'midterm' ? (
                                                            <span className="text-red-500 font-medium">Payment Required</span>
                                                        ) : (
                                                            grade.midterm_grade || '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {grade.payment_required && grade.period === 'finals' ? (
                                                            <span className="text-red-500 font-medium">Payment Required</span>
                                                        ) : (
                                                            grade.finals_grade || '-'
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {grade.payment_required ? (
                                                            <span className="text-red-500 font-medium">Payment Required</span>
                                                        ) : (
                                                            <span className={`text-sm font-medium ${getGradeColor(grade.semester_grade)}`}>
                                                                {grade.semester_grade || 'Pending'}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 dark:text-gray-500 mb-2">📊</div>
                                    <p className="text-gray-500 dark:text-gray-400">No grades available yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}