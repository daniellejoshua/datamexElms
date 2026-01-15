import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import TeacherScheduleModal from '@/Components/TeacherScheduleModal';
import Modal from '@/Components/Modal';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const Subjects = ({ section, subjects, teachers }) => {
    const [showAssignForm, setShowAssignForm] = useState(false);
    const [editingSubject, setEditingSubject] = useState(null);
    const [openDropdown, setOpenDropdown] = useState(null);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [teacherSchedule, setTeacherSchedule] = useState([]);
    const [proposedSchedule, setProposedSchedule] = useState(null);
    const [selectedTeacherName, setSelectedTeacherName] = useState('');
    const [checkingSchedule, setCheckingSchedule] = useState(false);
    const [showTimeErrorModal, setShowTimeErrorModal] = useState(false);
    const [showUnitsErrorModal, setShowUnitsErrorModal] = useState(false);
    const [unitsErrorMessage, setUnitsErrorMessage] = useState('');

    // Check if section is read-only (past academic year or past semester in current year)
    const isReadOnly = (() => {
        const sectionYear = parseInt(section.academic_year);
        const currentYear = parseInt(section.current_academic_year);
        
        if (sectionYear < currentYear) return true;
        if (sectionYear > currentYear) return false;
        
        // Same year, check semester
        const semesterOrder = { '1st': 1, '2nd': 2, 'summer': 3 };
        const sectionSemesterOrder = semesterOrder[section.semester] || 0;
        const currentSemesterOrder = semesterOrder[section.current_semester] || 0;
        
        return sectionSemesterOrder < currentSemesterOrder;
    })();
    
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

    const fetchTeacherSchedule = async (teacherId, scheduleData) => {
        if (!teacherId || !scheduleData.schedule_days?.length || !scheduleData.start_time || !scheduleData.end_time) {
            return;
        }

        setCheckingSchedule(true);
        try {
            const params = new URLSearchParams();
            params.append('teacher_id', teacherId);
            params.append('schedule_days', JSON.stringify(scheduleData.schedule_days));
            params.append('start_time', scheduleData.start_time);
            params.append('end_time', scheduleData.end_time);

            const response = await fetch(
                route('admin.shs.sections.teacher-schedule', section.id) + '?' + params.toString()
            );
            const responseData = await response.json();
            
            setTeacherSchedule(responseData.schedule);
            setProposedSchedule(responseData.proposed);
            const teacher = teachers.find(t => t.id === parseInt(teacherId));
            const teacherName = teacher ? 
                `${teacher.user?.first_name || teacher.first_name || 'Unknown'} ${teacher.user?.last_name || teacher.last_name || 'Teacher'}`.trim() : 
                'Unknown Teacher';
            setSelectedTeacherName(teacherName);
            setShowScheduleModal(true);
        } catch (error) {
            console.error('Error fetching teacher schedule:', error);
        } finally {
            setCheckingSchedule(false);
        }
    };

    const handleAssignSubject = (e) => {
        e.preventDefault();
        post(route('admin.shs.sections.attach-subject', section.id), {
            onSuccess: () => {
                reset();
                setShowAssignForm(false);
            }
        });
    };

    const handleEditSubject = (sectionSubject) => {
        setEditingSubject(sectionSubject);
        
        // Extract time portion in HH:mm format for time input
        const extractTime = (timeValue) => {
            if (!timeValue) return '';
            
            const timeString = String(timeValue);
            
            // Handle datetime format: "2024-01-15 14:00:00"
            if (timeString.includes(' ')) {
                const timePart = timeString.split(' ')[1];
                return timePart ? timePart.substring(0, 5) : ''; // Get HH:mm
            }
            
            // Handle time format: "14:00:00" or "14:00"
            if (timeString.includes(':')) {
                return timeString.substring(0, 5); // Get HH:mm
            }
            
            return '';
        };
        
        setEditData({
            teacher_id: sectionSubject.teacher_id || '',
            room: sectionSubject.room || '',
            schedule_days: sectionSubject.schedule_days || [],
            start_time: extractTime(sectionSubject.start_time),
            end_time: extractTime(sectionSubject.end_time),
        });
    };

    const handleUpdateSubject = (e) => {
        e.preventDefault();
        patch(route('admin.shs.sections.update-subject', [section.id, editingSubject.subject.id]), {
            onSuccess: () => {
                resetEdit();
                setEditingSubject(null);
            },
            onError: (errors) => {
                if (errors.teacher_id && errors.teacher_id.includes('conflict')) {
                    // Clear the error and show modal instead
                    delete errors.teacher_id;
                    fetchTeacherSchedule(editData.teacher_id, {
                        schedule_days: editData.schedule_days,
                        start_time: editData.start_time,
                        end_time: editData.end_time
                    });
                } else if (errors.teacher_id && errors.teacher_id.includes('requires') && errors.teacher_id.includes('hours per week')) {
                    // Handle units validation error with modal
                    setUnitsErrorMessage(errors.teacher_id);
                    setShowUnitsErrorModal(true);
                    delete errors.teacher_id;
                }
            }
        });
    };

    const handleCancelEdit = () => {
        setEditingSubject(null);
        resetEdit();
    };

    const handleDetachSubject = (subjectId) => {
        if (confirm('Are you sure you want to remove this subject from the section?')) {
            router.delete(route('admin.shs.sections.detach-subject', [section.id, subjectId]));
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
        
        // Convert to string to handle different input types
        const timeString = String(time);
        
        // Handle different time formats: "14:00", "14:00:00", "2024-01-15 14:00:00"
        let timeStr = timeString;
        if (timeString.includes(' ')) {
            timeStr = timeString.split(' ')[1]; // Extract time part from datetime
        }
        
        if (timeStr && timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const hours = parseInt(parts[0], 10);
            const minutes = parts[1] ? parts[1].substring(0, 2) : '00';
            
            if (isNaN(hours)) return 'Not set';
            
            const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            return `${hour12}:${minutes} ${ampm}`;
        }
        
        return 'Not set';
    };

    const toggleDropdown = (id) => {
        setOpenDropdown(openDropdown === id ? null : id);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2 sm:gap-3 min-h-[44px]">
                    {/* Back Navigation - Icon only */}
                    <button className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors flex-shrink-0">
                        <Link href={route('admin.shs.sections.index')} className="flex items-center justify-center w-full h-full">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                    </button>

                    {/* Title Section */}
                    <div className="min-w-0 flex-1">
                        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">
                            {section.program?.program_code}-{section.year_level}{section.section_name}
                        </h2>
                        <p className="text-xs sm:text-sm text-blue-600 font-medium mt-0.5 hidden sm:block">
                            {section.academic_year} • {section.semester} Semester
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Subjects - ${section.program?.program_code}-${section.year_level}${section.section_name}`} />

<div className="py-6 sm:py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">

                    {/* Header Actions */}
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                            {section.section_subjects?.length || 0} subject{section.section_subjects?.length !== 1 ? 's' : ''} assigned
                        </div>
                        <button
                            onClick={() => setShowAssignForm(!showAssignForm)}
                            disabled={isReadOnly}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 w-full sm:w-auto ${
                                isReadOnly 
                                    ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {showAssignForm ? 'Cancel Assignment' : '+ Assign Subject'}
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
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
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
                                                         className={`flex flex-col items-center space-y-1 sm:space-y-2 cursor-pointer p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                                                        data.schedule_days.includes(day.value)
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}>
                                                        <span className={`text-lg sm:text-2xl font-bold transition-colors ${
                                                            data.schedule_days.includes(day.value)
                                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }`}>{day.abbr}</span>
                                                        <span className={`text-xs sm:text-sm transition-colors ${
                                                            data.schedule_days.includes(day.value)
                                                                ? 'text-indigo-600 dark:text-indigo-400'
                                                                : 'text-gray-500 dark:text-gray-400'
                                                        }`}>{day.label}</span>
                                                    </div>
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
                                            disabled={processing || isReadOnly}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                                isReadOnly 
                                                    ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                                            }`}
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
                                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-4">
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
                                                         className={`flex flex-col items-center space-y-1 sm:space-y-2 cursor-pointer p-2 sm:p-4 rounded-lg sm:rounded-xl border-2 transition-all duration-200 ${
                                                        editData.schedule_days.includes(day.value)
                                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}>
                                                        <span className={`text-lg sm:text-2xl font-bold transition-colors ${
                                                            editData.schedule_days.includes(day.value)
                                                                ? 'text-indigo-700 dark:text-indigo-300'
                                                                : 'text-gray-900 dark:text-gray-100'
                                                        }`}>{day.abbr}</span>
                                                        <span className={`text-xs sm:text-sm transition-colors ${
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
                                            disabled={editProcessing || isReadOnly}
                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                                                isReadOnly 
                                                    ? 'bg-gray-400 cursor-not-allowed text-gray-600' 
                                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50'
                                            }`}
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
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Subject
                                                </th>
                                                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Teacher
                                                </th>
                                                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Room
                                                </th>
                                                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Schedule
                                                </th>
                                                <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Time
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                            {section.section_subjects.map((sectionSubject) => (
                                                <tr key={sectionSubject.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <td className="px-4 sm:px-6 py-4">
                                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100" title={sectionSubject.subject.subject_name}>
                                                                    {sectionSubject.subject.subject_code}
                                                                </div>
                                                                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                                                                    {sectionSubject.subject.units}h/week
                                                                </div>
                                                                {/* Mobile-only additional info */}
                                                                <div className="sm:hidden mt-2 space-y-1">
                                                                    {sectionSubject.teacher && (
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            <span className="font-medium">Teacher:</span> {sectionSubject.teacher.user.name}
                                                                        </div>
                                                                    )}
                                                                    {sectionSubject.room && (
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            <span className="font-medium">Room:</span> {sectionSubject.room}
                                                                        </div>
                                                                    )}
                                                                    {sectionSubject.schedule_days && sectionSubject.schedule_days.length > 0 && (
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            <span className="font-medium">Schedule:</span> {formatScheduleDays(sectionSubject.schedule_days)}
                                                                        </div>
                                                                    )}
                                                                    {sectionSubject.start_time && (
                                                                        <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                            <span className="font-medium">Time:</span> {formatTime(sectionSubject.start_time)}
                                                                            {sectionSubject.end_time && ` - ${formatTime(sectionSubject.end_time)}`}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {sectionSubject.teacher ? sectionSubject.teacher.user.name : (
                                                            <span className="text-gray-400 italic">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        {sectionSubject.room || (
                                                            <span className="text-gray-400 italic">Not assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                                                                {formatScheduleDays(sectionSubject.schedule_days)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                                            sectionSubject.status === 'active'
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                                                        }`}>
                                                            {sectionSubject.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium relative">
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
                                                                        disabled={isReadOnly}
                                                                        className={`flex-1 px-4 py-2 text-sm transition-colors border-r border-gray-200 dark:border-gray-600 ${
                                                                            isReadOnly 
                                                                                ? 'text-gray-400 cursor-not-allowed' 
                                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                                        }`}
                                                                    >
                                                                        Edit
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            handleDetachSubject(sectionSubject.subject.id);
                                                                            setOpenDropdown(null);
                                                                        }}
                                                                        disabled={isReadOnly}
                                                                        className={`flex-1 px-4 py-2 text-sm transition-colors ${
                                                                            isReadOnly 
                                                                                ? 'text-gray-400 cursor-not-allowed' 
                                                                                : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                                                                        }`}
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

            {/* Teacher Schedule Modal */}
            <TeacherScheduleModal
                show={showScheduleModal}
                onClose={() => setShowScheduleModal(false)}
                schedule={teacherSchedule}
                proposedSchedule={proposedSchedule}
                teacherName={selectedTeacherName}
            />

            {/* Time Error Modal */}
            <Modal show={showTimeErrorModal} onClose={() => setShowTimeErrorModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Incomplete Schedule Time
                            </h3>
                            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                Both start time and end time must be filled, or leave both empty.
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowTimeErrorModal(false)}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Units Error Modal */}
            <Modal show={showUnitsErrorModal} onClose={() => setShowUnitsErrorModal(false)} maxWidth="md">
                <div className="p-8">
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <svg className="h-8 w-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Schedule Hours Mismatch
                            </h3>
                            <p className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
                                {unitsErrorMessage.replace(/\s*\([^)]*\)\./, '.')}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 flex justify-end space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowUnitsErrorModal(false)}
                            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
};

export default Subjects;