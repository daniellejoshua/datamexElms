import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Students = ({ section, enrolledStudents, availableStudents }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showEnrollForm, setShowEnrollForm] = useState(false);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        student_ids: []
    });

    // Parse section name for display
    const parseSectionName = (sectionName) => {
        const match = sectionName.match(/^([A-Z]+)-?(\d+)([A-Z])$/);
        if (match) {
            const [, course, year, sectionLetter] = match;
            return {
                course,
                year,
                section: sectionLetter,
                display: `${course} ${year}${sectionLetter}`
            };
        }
        return { display: sectionName };
    };

    const sectionInfo = parseSectionName(section.section_name);

    // Filter available students based on search
    const filteredStudents = availableStudents.filter(student =>
        student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleEnrollStudents = (e) => {
        e.preventDefault();
        if (data.student_ids.length === 0) return;

        post(route('admin.sections.enroll', section.id), {
            onSuccess: () => {
                reset();
                setShowEnrollForm(false);
                setSearchTerm('');
            }
        });
    };

    const handleStudentSelection = (studentId) => {
        const isSelected = data.student_ids.includes(studentId);
        if (isSelected) {
            setData('student_ids', data.student_ids.filter(id => id !== studentId));
        } else {
            setData('student_ids', [...data.student_ids, studentId]);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Section {sectionInfo.display} - Manage Students
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
            <Head title={`Section ${sectionInfo.display} - Students`} />
            
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Section Info Card */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Course</h3>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {section.course?.subject_name}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Room</h3>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{section.room}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Academic Year</h3>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{section.academic_year}</p>
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrolled Students</h3>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                        {enrolledStudents.length} students
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enrolled Students */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    Enrolled Students
                                </h3>
                                <button
                                    onClick={() => setShowEnrollForm(!showEnrollForm)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                >
                                    {showEnrollForm ? 'Cancel' : 'Add Students'}
                                </button>
                            </div>

                            {enrolledStudents.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                    No students enrolled in this section yet.
                                </p>
                            ) : (
                                <div className="grid gap-3">
                                    {enrolledStudents.map((enrollment) => (
                                        <div 
                                            key={enrollment.id}
                                            className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                        >
                                            <div className="flex items-center space-x-4">
                                                <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                                                        {enrollment.student.user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                                        {enrollment.student.user.name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        Student ID: {enrollment.student.student_id}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <span className="inline-flex px-2 py-1 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                                    {enrollment.status}
                                                </span>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                                    Enrolled: {new Date(enrollment.created_at).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Add Students Form */}
                    {showEnrollForm && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
                                    Add Students to Section
                                </h3>

                                {/* Search */}
                                <div className="mb-6">
                                    <input
                                        type="text"
                                        placeholder="Search students by name or ID..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                    />
                                </div>

                                <form onSubmit={handleEnrollStudents}>
                                    {/* Available Students */}
                                    <div className="mb-6">
                                        {filteredStudents.length === 0 ? (
                                            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                                                {searchTerm ? 'No students found matching your search.' : 'No available students to enroll.'}
                                            </p>
                                        ) : (
                                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                                {filteredStudents.map((student) => (
                                                    <label 
                                                        key={student.id}
                                                        className="flex items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={data.student_ids.includes(student.id)}
                                                            onChange={() => handleStudentSelection(student.id)}
                                                            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                        />
                                                        <div className="ml-3 flex items-center space-x-4">
                                                            <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                                                                <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                                                                    {student.user.name.charAt(0).toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                                                    {student.user.name}
                                                                </p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    ID: {student.student_id}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {errors.student_ids && (
                                        <p className="mb-4 text-sm text-red-600 dark:text-red-400">{errors.student_ids}</p>
                                    )}

                                    {/* Submit Button */}
                                    <div className="flex justify-end space-x-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowEnrollForm(false);
                                                reset();
                                            }}
                                            className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || data.student_ids.length === 0}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {processing ? 'Enrolling...' : `Enroll ${data.student_ids.length} Student${data.student_ids.length !== 1 ? 's' : ''}`}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Students;