import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { ArrowLeft } from 'lucide-react';

const Subjects = ({ section, subjects, teachers }) => {
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    
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
        { value: 'monday', label: 'Monday', abbr: 'M' },
        { value: 'tuesday', label: 'Tuesday', abbr: 'T' },
        { value: 'wednesday', label: 'Wednesday', abbr: 'W' },
        { value: 'thursday', label: 'Thursday', abbr: 'TH' },
        { value: 'friday', label: 'Friday', abbr: 'F' },
        { value: 'saturday', label: 'Saturday', abbr: 'S' },
    ];

    // Create common day patterns
    const getCommonDayPattern = (days) => {
        if (!days || !Array.isArray(days)) return null;
        
        const daySet = new Set(days);
        
        // Check for MWF pattern
        if (daySet.has('monday') && daySet.has('wednesday') && daySet.has('friday') && daySet.size === 3) {
            return 'MWF';
        }
        
        // Check for TTH pattern  
        if (daySet.has('tuesday') && daySet.has('thursday') && daySet.size === 2) {
            return 'TTH';
        }
        
        // Check for weekdays
        if (daySet.has('monday') && daySet.has('tuesday') && daySet.has('wednesday') && 
            daySet.has('thursday') && daySet.has('friday') && daySet.size === 5) {
            return 'M-F';
        }
        
        return null;
    };

    const formatScheduleDays = (days) => {
        if (!days || !Array.isArray(days)) return 'Not scheduled';
        
        // Check for common patterns first
        const pattern = getCommonDayPattern(days);
        if (pattern) return pattern;
        
        // Otherwise, use abbreviations
        return days.map(day => {
            const dayOption = dayOptions.find(d => d.value === day);
            return dayOption ? dayOption.abbr : day.charAt(0).toUpperCase();
        }).join('');
    };

    const formatTime = (time) => {
        if (!time) return 'Not set';
        
        const [hours, minutes] = time.split(':');
        const hour24 = parseInt(hours);
        const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
        const ampm = hour24 >= 12 ? 'PM' : 'AM';
        
        return `${hour12}:${minutes} ${ampm}`;
    };

    const toggleDropdown = (id) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors">
                        <Link href={route('admin.sections.index')} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sections
                        </Link>
                    </button>
                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Subject Assignments: {section.program?.program_code}-{section.year_level}{section.section_name}
                        </h2>
                        <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mt-1">
                            {section.academic_year} • {section.semester} Semester
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Subjects - ${section.program?.program_code}-${section.year_level}${section.section_name}`} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    
                    {/* Assign Subject Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAssignForm(!showAssignForm)}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                            {showAssignForm ? 'Cancel' : 'Assign Subject'}
                        </button>
                    </div>
                    
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
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                                {dayOptions.map((day) => (
                                                    <div key={day.value} 
                                                         onClick={() => {
                                                             const isSelected = data.schedule_days.includes(day.value);
                                                             if (isSelected) {
                                                                 setData('schedule_days', data.schedule_days.filter(d => d !== day.value));
                                                             } else {
                                                                 setData('schedule_days', [...data.schedule_days, day.value]);
                                                             }
                                                         }}
                                                         className={`flex flex-col items-center space-y-2 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                                                        data.schedule_days.includes(day.value)
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}>
                                                        <span className={`text-2xl font-bold transition-colors ${
                                                            data.schedule_days.includes(day.value)
                                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }`}>{day.abbr}</span>
                                                        <span className={`text-sm transition-colors ${
                                                            data.schedule_days.includes(day.value)
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{day.label}</span>
                                                    </div>
                                                ))}                               </div>
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
                                            <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                                                {dayOptions.map((day) => (
                                                    <div key={day.value} 
                                                         onClick={() => {
                                                             const isSelected = editData.schedule_days.includes(day.value);
                                                             if (isSelected) {
                                                                 setEditData('schedule_days', editData.schedule_days.filter(d => d !== day.value));
                                                             } else {
                                                                 setEditData('schedule_days', [...editData.schedule_days, day.value]);
                                                             }
                                                         }}
                                                         className={`flex flex-col items-center space-y-2 cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 ${
                                                        editData.schedule_days.includes(day.value)
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}>
                                                        <span className={`text-2xl font-bold transition-colors ${
                                                            editData.schedule_days.includes(day.value)
                                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }`}>{day.abbr}</span>
                                                        <span className={`text-sm transition-colors ${
                                                            editData.schedule_days.includes(day.value)
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{day.label}</span>
                                                    </div>
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
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100" title={sectionSubject.subject.subject_name}>
                                                                {sectionSubject.subject.subject_code}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {sectionSubject.subject.units}h/week
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
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                                {formatScheduleDays(sectionSubject.schedule_days)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        <div className="flex flex-col">
                                                            <div className="text-sm font-medium">
                                                                {formatTime(sectionSubject.start_time)}
                                                            </div>
                                                            {sectionSubject.start_time && sectionSubject.end_time && (
                                                                <div className="text-xs text-gray-500 dark:text-gray-400">
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
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
                                                        <button
                                                            onClick={() => toggleDropdown(sectionSubject.id)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {openDropdown === sectionSubject.id && (
                                                            <div className="absolute right-0 top-0 mt-8 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                                                                <div className="py-1 flex">
                                                                    <button
                                                                        onClick={() => {
                                                                            handleEditSubject(sectionSubject);
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        className="flex-1 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-600"
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDetachSubject(sectionSubject.subject.id);
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        className="flex-1 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                    >
                                                                        Remove
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Get started by assigning a subject to this section using the button above.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Click outside handler for dropdown */}
            {openDropdown && (
                <div 
                    className="fixed inset-0 z-0" 
                    onClick={() => setOpenDropdown(null)}
                ></div>
            )}
        </AuthenticatedLayout>
    );
};

export default Subjects;