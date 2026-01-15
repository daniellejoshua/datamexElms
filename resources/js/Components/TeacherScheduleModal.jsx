import React from 'react';
import Modal from './Modal';
import { X, AlertTriangle, Calendar } from 'lucide-react';

export default function TeacherScheduleModal({ show, onClose, schedule, proposedSchedule, teacherName }) {
    const dayOptions = [
        { value: 'monday', label: 'Monday', abbr: 'Mon' },
        { value: 'tuesday', label: 'Tuesday', abbr: 'Tue' },
        { value: 'wednesday', label: 'Wednesday', abbr: 'Wed' },
        { value: 'thursday', label: 'Thursday', abbr: 'Thu' },
        { value: 'friday', label: 'Friday', abbr: 'Fri' },
        { value: 'saturday', label: 'Saturday', abbr: 'Sat' },
    ];

    const formatTime = (time) => {
        if (!time) return 'Not set';
        
        try {
            // Handle different time formats: "14:00", "14:00:00", "2024-01-15 14:00:00"
            let timeStr = String(time).trim();
            
            // Extract time part from datetime if present
            if (timeStr.includes(' ')) {
                timeStr = timeStr.split(' ')[1];
            }
            
            // Extract time part from any other format that might have extra characters
            if (timeStr.includes('T')) {
                timeStr = timeStr.split('T')[1];
            }
            
            // Get just the HH:MM part
            if (timeStr.includes(':')) {
                const parts = timeStr.split(':');
                const hours = parseInt(parts[0]);
                const minutes = parts[1] || '00';
                
                // Validate hours (should be 0-23)
                if (isNaN(hours) || hours < 0 || hours > 23) {
                    return timeStr; // Return original if invalid
                }
                
                const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                const ampm = hours >= 12 ? 'PM' : 'AM';
                
                return `${hour12}:${minutes} ${ampm}`;
            }
            
            return timeStr;
        } catch (error) {
            console.error('Error formatting time:', time, error);
            return String(time);
        }
    };

    const formatScheduleDays = (days) => {
        if (!days || !Array.isArray(days)) return 'Not scheduled';
        
        return days.map(day => {
            const dayOption = dayOptions.find(d => d.value === day);
            return dayOption ? dayOption.abbr : day.charAt(0).toUpperCase();
        }).join(', ');
    };

    const hasConflict = schedule.some(s => s.has_conflict);

    return (
        <Modal show={show} onClose={onClose} maxWidth="5xl">
            <div className="p-6 mx-4">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            {hasConflict && <AlertTriangle className="w-6 h-6 text-red-600" />}
                            Schedule Conflict Detected
                        </h3>
                        {teacherName && teacherName !== 'undefined undefined' && (
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                Teacher: {teacherName}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Schedule Being Added */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                Schedule Being Added
                            </h4>
                        </div>
                        {proposedSchedule && proposedSchedule.days && proposedSchedule.days.length > 0 ? (
                            <div className="space-y-3">
                                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Days:</span>
                                            <p className="text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                                {formatScheduleDays(proposedSchedule.days)}
                                            </p>
                                        </div>
                                        <div>
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">Time:</span>
                                            <p className="text-gray-900 dark:text-gray-100 font-semibold mt-1">
                                                {formatTime(proposedSchedule.start_time)} - {formatTime(proposedSchedule.end_time)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {hasConflict && (
                                    <div className="flex items-start gap-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 p-3 rounded-lg">
                                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                        <span>This schedule conflicts with the teacher's existing schedule shown on the right.</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-gray-400">No schedule information</p>
                        )}
                    </div>

                    {/* Teacher's Current Schedule */}
                    <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-300 dark:border-gray-600 rounded-lg p-5">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                            Teacher's Current Schedule
                        </h4>
                        {schedule.length > 0 ? (
                            <div className="overflow-x-auto max-h-96 overflow-y-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Subject
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Section
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Days
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Time
                                            </th>
                                            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                                Room
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {schedule.map((item) => (
                                            <tr 
                                                key={item.id}
                                                className={item.has_conflict 
                                                    ? 'bg-red-100 dark:bg-red-900/30 border-l-4 border-red-500' 
                                                    : 'bg-white dark:bg-gray-800'}
                                            >
                                                <td className="px-3 py-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        {item.has_conflict && (
                                                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                                        )}
                                                        <div>
                                                            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                                {item.subject_code}
                                                            </div>
                                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                                {item.subject_name}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {item.section}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {formatScheduleDays(item.schedule_days)}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                                                    {formatTime(item.start_time)} - {formatTime(item.end_time)}
                                                </td>
                                                <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                                    {item.room || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                                No existing schedule for this teacher in the current semester.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-6 flex justify-between items-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {hasConflict 
                            ? 'Please adjust the schedule to resolve conflicts before saving.' 
                            : 'No conflicts detected. You can proceed with this schedule.'}
                    </p>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
