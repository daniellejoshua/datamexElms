import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

const Show = ({ archivedSection }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long', 
            day: 'numeric'
        });
    };

    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': 'First Semester',
            'second': 'Second Semester', 
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const getStatusBadge = (status) => {
        const colors = {
            'completed': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
            'dropped': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'failed': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
            'incomplete': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
        };
        
        return `inline-flex px-2 py-1 text-xs font-medium rounded-full ${colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.location.href = route('admin.academic-years.index')}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Archives
                        </button>
                        <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Archived Section</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                {archivedSection.section_name}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Archived Section: ${archivedSection.section_name}`} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Section Overview */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                Section Overview
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Course Information</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {archivedSection.course_data.subject_name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {archivedSection.course_data.course_code} • {archivedSection.course_data.credits} credits
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Period</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {archivedSection.academic_year}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {getSemesterDisplay(archivedSection.semester)}
                                    </p>
                                </div>
                                
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Room & Status</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {archivedSection.room || 'No room assigned'}
                                    </p>
                                    <span className={getStatusBadge(archivedSection.status)}>
                                        {archivedSection.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Statistics */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                Final Statistics
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {archivedSection.total_enrolled_students}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Enrolled</div>
                                </div>
                                
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {archivedSection.completed_students}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                                </div>
                                
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                                        {archivedSection.dropped_students}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Dropped</div>
                                </div>
                                
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                        {archivedSection.section_average_grade ? `${archivedSection.section_average_grade}%` : 'N/A'}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Section Average</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Student Records */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                Student Records ({archivedSection.archived_enrollments.length})
                            </h3>
                            
                            {archivedSection.archived_enrollments.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No student enrollment records found.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Student
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Enrollment Period
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Final Grade
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {archivedSection.archived_enrollments.map((enrollment) => (
                                                <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {enrollment.student_data.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.student_data.student_id}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                        <div>Enrolled: {formatDate(enrollment.enrolled_date)}</div>
                                                        {enrollment.completion_date && (
                                                            <div>Completed: {formatDate(enrollment.completion_date)}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {enrollment.final_semester_grade ? (
                                                            <div className="text-sm text-gray-900 dark:text-gray-100">
                                                                <span className="font-medium">{enrollment.final_semester_grade}%</span>
                                                                {enrollment.letter_grade && (
                                                                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                                                                        ({enrollment.letter_grade})
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">No grade recorded</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={getStatusBadge(enrollment.final_status)}>
                                                            {enrollment.final_status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Archive Information */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Archive Information
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Archived By</h4>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {archivedSection.archived_by.name}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {formatDate(archivedSection.archived_at)}
                                    </p>
                                </div>
                                
                                {archivedSection.archive_notes && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">Archive Notes</h4>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                            {archivedSection.archive_notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;