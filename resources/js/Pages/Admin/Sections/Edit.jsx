import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Edit = ({ section, courses }) => {
    const { data, setData, put, processing, errors } = useForm({
        course_id: section.course_id || '',
        section_name: section.section_name || '',
        academic_year: section.academic_year || '',
        semester: section.semester || '',
        room: section.room || '',
        status: section.status || 'active'
    });

    const currentYear = new Date().getFullYear();
    const academicYears = [];
    for (let i = -2; i < 5; i++) {
        const year = currentYear + i;
        academicYears.push(`${year}-${year + 1}`);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('admin.sections.update', section.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Edit Section: {section.section_name}
                    </h2>
                    <a
                        href={route('admin.sections.index')}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                        Back to Sections
                    </a>
                </div>
            }
        >
            <Head title={`Edit Section: ${section.section_name}`} />
            
            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Course Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Course
                                    </label>
                                    <select
                                        value={data.course_id}
                                        onChange={(e) => setData('course_id', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select a course</option>
                                        {courses?.map((course) => (
                                            <option key={course.id} value={course.id}>
                                                {course.course_code} - {course.subject_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.course_id && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.course_id}</p>
                                    )}
                                </div>

                                {/* Section Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Section Name
                                    </label>
                                    <input
                                        type="text"
                                        value={data.section_name}
                                        onChange={(e) => setData('section_name', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., BSIT-3A, BSCS-2B"
                                        required
                                    />
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Format: Course-YearLevel+SectionLetter (e.g., BSIT-3A)
                                    </p>
                                    {errors.section_name && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.section_name}</p>
                                    )}
                                </div>

                                {/* Academic Year */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Academic Year
                                    </label>
                                    <select
                                        value={data.academic_year}
                                        onChange={(e) => setData('academic_year', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select academic year</option>
                                        {academicYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.academic_year && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.academic_year}</p>
                                    )}
                                </div>

                                {/* Semester */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Semester
                                    </label>
                                    <select
                                        value={data.semester}
                                        onChange={(e) => setData('semester', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select semester</option>
                                        <option value="first">First Semester</option>
                                        <option value="second">Second Semester</option>
                                        <option value="summer">Summer</option>
                                    </select>
                                    {errors.semester && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.semester}</p>
                                    )}
                                </div>

                                {/* Room */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Room
                                    </label>
                                    <input
                                        type="text"
                                        value={data.room}
                                        onChange={(e) => setData('room', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        placeholder="e.g., 101, Lab-A, Auditorium"
                                        required
                                    />
                                    {errors.room && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.room}</p>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={data.status}
                                        onChange={(e) => setData('status', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                    {errors.status && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.status}</p>
                                    )}
                                </div>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-end space-x-4 pt-6">
                                    <a
                                        href={route('admin.sections.index')}
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'Updating...' : 'Update Section'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Edit;