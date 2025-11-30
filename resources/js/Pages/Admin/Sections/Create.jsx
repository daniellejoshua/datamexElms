import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Create = ({ programs }) => {
    const { data, setData, post, processing, errors } = useForm({
        program_id: '',
        section_name: '',
        year_level: 1,
        academic_year: '',
        semester: '1st',
        status: 'active'
    });

    const currentYear = new Date().getFullYear();
    const academicYears = [];
    for (let i = 0; i < 5; i++) {
        const year = currentYear + i;
        academicYears.push(`${year}-${year + 1}`);
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/admin/sections');
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Create New Section
                </h2>
            }
        >
            <Head title="Create Section" />
            
            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Program Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Program
                                    </label>
                                    <select
                                        value={data.program_id}
                                        onChange={(e) => setData('program_id', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select a program</option>
                                        {programs?.map((program) => (
                                            <option key={program.id} value={program.id}>
                                                {program.program_code} - {program.program_name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.program_id && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.program_id}</p>
                                    )}
                                </div>

                                {/* Year Level */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Year Level
                                    </label>
                                    <select
                                        value={data.year_level}
                                        onChange={(e) => setData('year_level', parseInt(e.target.value))}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value={1}>1st Year</option>
                                        <option value={2}>2nd Year</option>
                                        <option value={3}>3rd Year</option>
                                        <option value={4}>4th Year</option>
                                    </select>
                                    {errors.year_level && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.year_level}</p>
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
                                        placeholder="e.g., A, B, C"
                                        required
                                    />
                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                        Section identifier (A, B, C, etc.)
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
                                        <option value="1st">First Semester</option>
                                        <option value="2nd">Second Semester</option>
                                        <option value="summer">Summer</option>
                                    </select>
                                    {errors.semester && (
                                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.semester}</p>
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
                                        href="/admin/sections"
                                        className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                    >
                                        {processing ? 'Creating...' : 'Create Section'}
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

export default Create;