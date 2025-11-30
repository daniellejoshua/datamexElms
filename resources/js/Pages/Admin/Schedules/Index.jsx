import React from 'react';
import { Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Index = ({ schedules }) => {
    const formatTime = (time) => {
        if (!time) return '';
        return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const getDayName = (day) => {
        const days = {
            'monday': 'Monday',
            'tuesday': 'Tuesday', 
            'wednesday': 'Wednesday',
            'thursday': 'Thursday',
            'friday': 'Friday',
            'saturday': 'Saturday',
            'sunday': 'Sunday'
        };
        return days[day] || day;
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Class Schedules
                </h2>
            }
        >
            <Head title="Class Schedules" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    
                    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                            {schedules?.data?.length > 0 ? (
                                schedules.data.map((schedule) => (
                                    <li key={schedule.id}>
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center">
                                                    <div>
                                                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                                            {schedule.section?.course?.subject_name} ({schedule.section?.course?.course_code})
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Section: {schedule.section?.section_name}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            {getDayName(schedule.day_of_week)} | {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                                                        </p>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                                            Room: {schedule.room}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        Teacher: {schedule.section?.teacherAssignments?.[0]?.teacher?.user?.name || 'Not assigned'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li>
                                    <div className="px-4 py-8 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">No schedules found.</p>
                                    </div>
                                </li>
                            )}
                        </ul>
                    </div>

                    {/* Pagination */}
                    {schedules?.links && (
                        <div className="mt-6 flex justify-center">
                            <nav className="flex space-x-2">
                                {schedules.links.map((link, index) => (
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