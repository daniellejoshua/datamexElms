import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Show = ({ archivedSection }) => {
    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': 'First Semester',
            'second': 'Second Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Archived Grades: {archivedSection.section_name} ({archivedSection.academic_year} {getSemesterDisplay(archivedSection.semester)})
                </h2>
            }
        >
            <Head title={`Archived Grades - ${archivedSection.section_name}`} />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900 dark:text-gray-100">
                            <div className="mb-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    Section Summary
                                </h3>
                                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Total Students</div>
                                        <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                            {archivedSection.total_enrolled_students}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Completed</div>
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {archivedSection.completed_students}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Dropped</div>
                                        <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                            {archivedSection.dropped_students}
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                        <div className="text-sm text-gray-500 dark:text-gray-400">Average Grade</div>
                                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            {archivedSection.section_average_grade || 'N/A'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Student Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Student Number
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Final Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Letter Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Grade Details
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {archivedSection.archived_enrollments.map((enrollment) => (
                                            <tr key={enrollment.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {enrollment.student_data.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {enrollment.student_data.student_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {enrollment.final_semester_grade || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {enrollment.letter_grade || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                        enrollment.final_status === 'completed'
                                                            ? 'bg-green-100 text-green-800'
                                                            : enrollment.final_status === 'dropped'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {enrollment.final_status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {enrollment.final_grades ? (
                                                        <details className="cursor-pointer">
                                                            <summary className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                                                                View Details
                                                            </summary>
                                                            <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-700 rounded text-xs">
                                                                <pre>{JSON.stringify(enrollment.final_grades, null, 2)}</pre>
                                                            </div>
                                                        </details>
                                                    ) : (
                                                        'No grades recorded'
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;