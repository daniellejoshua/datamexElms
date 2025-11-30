import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const Subjects = ({ section, subjects, teachers }) => {
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    
    const { data, setData, post, processing, errors, reset } = useForm({
        subject_id: '',
        teacher_id: '',
        room: '',
        schedule_days: [],
        start_time: '',
        end_time: '',
    });

    const { data: editData, setData: setEditData, patch, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        teacher_id: '',
        room: '',
        schedule_days: [],
        start_time: '',
        end_time: '',
    });

    const handleAssignSubject = (e) => {
        e.preventDefault();
        post(route('admin.sections.attach-subject', section.id), {
            onSuccess: () => {
                reset();
                setShowAssignForm(false);
            }
        });
    };

    const handleEditSubject = (sectionSubject) => {
        setEditingSubject(sectionSubject);
        setEditData({
            teacher_id: sectionSubject.teacher_id || '',
            room: sectionSubject.room || '',
            schedule_days: sectionSubject.schedule_days || [],
            start_time: sectionSubject.start_time || '',
            end_time: sectionSubject.end_time || '',
        });
    };

    const handleUpdateSubject = (e) => {
        e.preventDefault();
        patch(route('admin.sections.update-subject', [section.id, editingSubject.subject.id]), {
            onSuccess: () => {
                resetEdit();
                setEditingSubject(null);
            }
        });
    };

    const handleCancelEdit = () => {
        setEditingSubject(null);
        resetEdit();
    };

    const handleDetachSubject = (subjectId) => {
        if (confirm('Are you sure you want to remove this subject from the section?')) {
            router.delete(route('admin.sections.detach-subject', [section.id, subjectId]));
        }
    };

    const assignedSubjectIds = section.section_subjects?.map(ss => ss.subject.id) || [];
    const availableSubjects = subjects.filter(subject => 
        !assignedSubjectIds.includes(subject.id)
    );

    const dayOptions = [
        { value: 'monday', label: 'Monday' },
        { value: 'tuesday', label: 'Tuesday' },
        { value: 'wednesday', label: 'Wednesday' },
        { value: 'thursday', label: 'Thursday' },
        { value: 'friday', label: 'Friday' },
        { value: 'saturday', label: 'Saturday' },
        { value: 'sunday', label: 'Sunday' },
    ];

    const handleDayChange = (day, checked) => {
        if (checked) {
            setData('schedule_days', [...data.schedule_days, day]);
        } else {
            setData('schedule_days', data.schedule_days.filter(d => d !== day));
        }
    };

    const handleEditDayChange = (day, checked) => {
        if (checked) {
            setEditData('schedule_days', [...editData.schedule_days, day]);
        } else {
            setEditData('schedule_days', editData.schedule_days.filter(d => d !== day));
        }
    };

    const formatScheduleDays = (days) => {
        if (!days || !Array.isArray(days)) return 'Not scheduled';
        return days.map(day => day.charAt(0).toUpperCase() + day.slice(1)).join(', ');
    };

    const formatTime = (time) => {
        if (!time) return 'Not set';
        return time;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                            Subject Assignments: {section.program?.program_code}-{section.year_level}{section.section_name}
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {section.academic_year} • {section.semester} Semester
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setShowAssignForm(!showAssignForm)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            {showAssignForm ? 'Cancel' : 'Assign Subject'}
                        </button>
                        <a
                            href={route('admin.sections.index')}
                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            Back to Sections
                        </a>
                    </div>
                </div>
            }
        >
            <Head title={`Subjects - ${section.program?.program_code}-${section.year_level}${section.section_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Assignment Form */}
                    {showAssignForm && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Assign Subject to Section
                                </h3>
                                
                                <form onSubmit={handleAssignSubject} className="space-y-6">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Subject Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Subject *
                                            </label>
                                            <select
                                                value={data.subject_id}
                                                onChange={(e) => setData('subject_id', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                required
                                            >
                                                <option value="">Select a subject</option>
                                                {availableSubjects.map((subject) => (
                                                    <option key={subject.id} value={subject.id}>
                                                        {subject.subject_code} - {subject.subject_name} ({subject.units}h/week)
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.subject_id && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.subject_id}</p>
                                            )}
                                        </div>

                                        {/* Teacher Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Teacher
                                            </label>
                                            <select
                                                value={data.teacher_id}
                                                onChange={(e) => setData('teacher_id', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Select a teacher</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.user.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.teacher_id && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.teacher_id}</p>
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
                                                placeholder="e.g., Room 101, Lab-A"
                                            />
                                            {errors.room && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.room}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Schedule Information */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                                            Schedule Information
                                        </h4>
                                        
                                        {/* Days of Week */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Days of Week
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                                {dayOptions.map((day) => (
                                                    <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.schedule_days.includes(day.value)}
                                                            onChange={(e) => handleDayChange(day.value, e.target.checked)}
                                                            className="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {errors.schedule_days && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.schedule_days}</p>
                                            )}
                                        </div>

                                        {/* Time Range */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={data.start_time}
                                                    onChange={(e) => setData('start_time', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {errors.start_time && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.start_time}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={data.end_time}
                                                    onChange={(e) => setData('end_time', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {errors.end_time && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.end_time}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {processing ? 'Assigning...' : 'Assign Subject'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit Subject Form */}
                    {editingSubject && (
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                    Edit Subject Schedule: {editingSubject.subject.subject_code} - {editingSubject.subject.subject_name}
                                </h3>
                                
                                <form onSubmit={handleUpdateSubject} className="space-y-6">
                                    {/* Basic Information */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Teacher Selection */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Teacher
                                            </label>
                                            <select
                                                value={editData.teacher_id}
                                                onChange={(e) => setEditData('teacher_id', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            >
                                                <option value="">Select a teacher</option>
                                                {teachers.map((teacher) => (
                                                    <option key={teacher.id} value={teacher.id}>
                                                        {teacher.user.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {editErrors.teacher_id && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.teacher_id}</p>
                                            )}
                                        </div>

                                        {/* Room */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Room
                                            </label>
                                            <input
                                                type="text"
                                                value={editData.room}
                                                onChange={(e) => setEditData('room', e.target.value)}
                                                className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                placeholder="e.g., Room 101, Lab-A"
                                            />
                                            {editErrors.room && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.room}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Schedule Information */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">
                                            Schedule Information
                                        </h4>
                                        
                                        {/* Days of Week */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                                Days of Week
                                            </label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                                                {dayOptions.map((day) => (
                                                    <label key={day.value} className="flex items-center space-x-2 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={editData.schedule_days.includes(day.value)}
                                                            onChange={(e) => handleEditDayChange(day.value, e.target.checked)}
                                                            className="rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500"
                                                        />
                                                        <span className="text-sm text-gray-700 dark:text-gray-300">{day.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                            {editErrors.schedule_days && (
                                                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.schedule_days}</p>
                                            )}
                                        </div>

                                        {/* Time Range */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    Start Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={editData.start_time}
                                                    onChange={(e) => setEditData('start_time', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {editErrors.start_time && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.start_time}</p>
                                                )}
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                    End Time
                                                </label>
                                                <input
                                                    type="time"
                                                    value={editData.end_time}
                                                    onChange={(e) => setEditData('end_time', e.target.value)}
                                                    className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                />
                                                {editErrors.end_time && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{editErrors.end_time}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editProcessing}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {editProcessing ? 'Updating...' : 'Update Schedule'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Assigned Subjects */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                                Assigned Subjects ({section.section_subjects?.length || 0})
                            </h3>
                            
                            {section.section_subjects && section.section_subjects.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Subject
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Teacher
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Room
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Time
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {section.section_subjects.map((sectionSubject) => (
                                                <tr key={sectionSubject.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {sectionSubject.subject.subject_code}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {sectionSubject.subject.subject_name} • {sectionSubject.subject.units}h/week
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {sectionSubject.teacher ? sectionSubject.teacher.user.name : (
                                                            <span className="text-gray-400 italic">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {sectionSubject.room || (
                                                            <span className="text-gray-400 italic">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        <div className="text-sm">
                                                            {formatScheduleDays(sectionSubject.schedule_days)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        <div>
                                                            <div className="text-sm">
                                                                {formatTime(sectionSubject.start_time)}
                                                            </div>
                                                            {sectionSubject.start_time && sectionSubject.end_time && (
                                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                    to {formatTime(sectionSubject.end_time)}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            sectionSubject.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                        }`}>
                                                            {sectionSubject.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div className="flex justify-end space-x-2">
                                                            <button
                                                                onClick={() => handleEditSubject(sectionSubject)}
                                                                className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDetachSubject(sectionSubject.subject.id)}
                                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                    </svg>
                                    <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No subjects assigned</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Get started by assigning a subject to this section.</p>
                                    <button
                                        onClick={() => setShowAssignForm(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                                    >
                                        Assign First Subject
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Subjects;