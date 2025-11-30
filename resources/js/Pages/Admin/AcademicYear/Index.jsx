import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Index = ({ archivedSections, academicYears, currentAcademicYear }) => {
    const [showArchiveForm, setShowArchiveForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        academic_year: currentAcademicYear,
        semester: '',
        archive_notes: ''
    });

    const handleArchiveSemester = (e) => {
        e.preventDefault();
        post('/admin/academic-years/archive', {
            onSuccess: () => {
                reset();
                setShowArchiveForm(false);
            }
        });
    };

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Academic Year Management
                    </h2>
                    <button
                        onClick={() => setShowArchiveForm(!showArchiveForm)}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                    >
                        {showArchiveForm ? 'Cancel' : 'Archive Semester'}
                    </button>
                </div>
            }
        >
            <Head title="Academic Year Management" />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Archive Semester Form */}
                    {showArchiveForm && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 border-l-4 border-red-500">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                    ⚠️ Archive Semester - This Action Cannot Be Undone
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                                    Archiving a semester will move all sections and student enrollments to historical records. 
                                    Current sections will be deleted and only accessible through this archive system.
                                </p>
                                
                                <form onSubmit={handleArchiveSemester} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Academic Year
                                            </label>
                                            <input
                                                type="text"
                                                value={data.academic_year}
                                                onChange={(e) => setData('academic_year', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                placeholder="2024-2025"
                                                required
                                            />
                                            {errors.academic_year && (
                                                <p className="mt-1 text-sm text-red-600">{errors.academic_year}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Semester
                                            </label>
                                            <select
                                                value={data.semester}
                                                onChange={(e) => setData('semester', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                                required
                                            >
                                                <option value="">Select semester to archive</option>
                                                <option value="first">First Semester</option>
                                                <option value="second">Second Semester</option>
                                                <option value="summer">Summer</option>
                                            </select>
                                            {errors.semester && (
                                                <p className="mt-1 text-sm text-red-600">{errors.semester}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Archive Notes (Optional)
                                        </label>
                                        <textarea
                                            value={data.archive_notes}
                                            onChange={(e) => setData('archive_notes', e.target.value)}
                                            rows={3}
                                            className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                            placeholder="Add any notes about this archival..."
                                        />
                                        {errors.archive_notes && (
                                            <p className="mt-1 text-sm text-red-600">{errors.archive_notes}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex justify-end space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowArchiveForm(false)}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                                        >
                                            {processing ? 'Archiving...' : 'Archive Semester'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Academic Years Summary */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                                Academic Years Summary
                            </h3>
                            
                            {academicYears.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No archived academic years yet.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {academicYears.map((year) => (
                                        <div key={year.academic_year} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                {year.academic_year}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                {year.sections_count} sections archived
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Archived Sections */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                Archived Sections History
                            </h3>
                            
                            {archivedSections.data.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No archived sections yet. Use the "Archive Semester" button to move completed sections to history.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {archivedSections.data.map((section) => (
                                        <div key={section.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1">
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {section.section_name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {section.course_data.subject_name} ({section.course_data.course_code})
                                                    </p>
                                                    <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                        <div>
                                                            <span className="font-medium">Academic Year:</span> {section.academic_year}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Semester:</span> {getSemesterDisplay(section.semester)}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Room:</span> {section.room || 'N/A'}
                                                        </div>
                                                        <div>
                                                            <span className="font-medium">Students:</span> {section.total_enrolled_students}
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                        Completed: {section.completed_students} | Dropped: {section.dropped_students}
                                                        {section.section_average_grade && (
                                                            <span> | Average: {section.section_average_grade}%</span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        Archived on {formatDate(section.archived_at)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        by {section.archived_by.name}
                                                    </p>
                                                    <a
                                                        href={route('admin.academic-years.show', section.id)}
                                                        className="mt-2 inline-block text-indigo-600 hover:text-indigo-800 text-sm"
                                                    >
                                                        View Details
                                                    </a>
                                                </div>
                                            </div>
                                            
                                            {section.archive_notes && (
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        <span className="font-medium">Notes:</span> {section.archive_notes}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* Pagination */}
                            {archivedSections.links && archivedSections.links.length > 3 && (
                                <div className="mt-6 flex justify-center">
                                    {/* Add pagination component here if needed */}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;