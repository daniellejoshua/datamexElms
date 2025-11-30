import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Index = ({ courses }) => {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Courses Management
                </h2>
            }
        >
            <Head title="Courses Management" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {courses?.data?.length > 0 ? (
                                courses.data.map((course) => (
                                    <li key={course.id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div>
                                                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                            {course.course_code}
                                                        </p>
                                                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                            {course.subject_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {course.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                        course.status === 'active' 
                                                            ? 'bg-green-100 text-green-800' 
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {course.status}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {course.sections_count} sections
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">No courses found.</p>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Pagination */}
                    {courses?.links && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex space-x-2">
                                {courses.links.map((link, index) => (
                                    <span
                                        key={index}
                                        className={`px-3 py-2 text-sm ${
                                            link.active
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-white text-gray-700 hover:bg-gray-50'
                                        } border border-gray-300 rounded-md`}
                                    >
                                        {link.label}
                                    </span>
                                ))}
                            </nav>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;