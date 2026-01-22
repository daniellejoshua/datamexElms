import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Users, UserPlus, GraduationCap, ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, User, Trash2, Settings, Clock, UserCheck } from 'lucide-react';

export default function SubjectEnrollment({ section, student, availableSubjects, currentEnrollments, creditedSubjects = [], enrolledInOtherSections = [] }) {
    const { flash } = usePage().props;
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [subjectToRemove, setSubjectToRemove] = useState(null);

    console.log('SubjectEnrollment props:', { section, student, availableSubjects, currentEnrollments });

    // Safe function to parse schedule days (handles both JSON strings and plain strings)
    const parseScheduleDays = (scheduleDays) => {
        if (!scheduleDays) return [];
        
        // If it's already an array, return it
        if (Array.isArray(scheduleDays)) {
            return scheduleDays;
        }
        
        // If it's not a string, convert to string first
        if (typeof scheduleDays !== 'string') {
            scheduleDays = String(scheduleDays);
        }
        
        try {
            // Try to parse as JSON first
            const parsed = JSON.parse(scheduleDays);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            // If JSON parsing fails, treat as comma-separated string
            return scheduleDays.split(',').map(day => day.trim()).filter(day => day.length > 0);
        }
    };

    const toggleSubject = (subjectId) => {
        setSelectedSubjects(prev => 
            prev.includes(subjectId) 
                ? prev.filter(id => id !== subjectId)
                : [...prev, subjectId]
        );
    };

    const handleEnrollSubjects = async () => {
        if (selectedSubjects.length === 0) {
            alert('Please select at least one subject');
            return;
        }

        setIsEnrolling(true);
        
        try {
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                alert('CSRF token not found. Please refresh the page and try again.');
                return;
            }

            router.post(route('admin.sections.enroll-subjects', {
                section: section.id,
                student: student.id
            }), {
                subject_ids: selectedSubjects
            }, {
                onSuccess: (page) => {
                    setSelectedSubjects([]);
                    setIsEnrolling(false);
                },
                onError: (errors) => {
                    console.error('Enrollment errors:', errors);
                    setIsEnrolling(false);
                }
            });
            
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Network error occurred. Please try again.');
            setIsEnrolling(false);
        }
    };

    const handleRemoveFromSubject = (enrollment) => {
        setSubjectToRemove(enrollment);
        setIsRemoveModalOpen(true);
    };

    const confirmRemoveFromSubject = async () => {
        if (!subjectToRemove) return;

        try {
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                alert('CSRF token not found. Please refresh the page and try again.');
                return;
            }

            const response = await fetch(`/admin/sections/${section.id}/students/${student.id}/subjects`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    section_subject_id: subjectToRemove.section_subject_id
                })
            });

            if (response.ok) {
                alert('Student removed from subject successfully!');
                window.location.reload();
            } else {
                const responseText = await response.text();
                console.log('Error response:', responseText);
                alert(`Failed to remove student from subject. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Remove from subject error:', error);
            alert('Network error occurred. Please check console for details.');
        } finally {
            setIsRemoveModalOpen(false);
            setSubjectToRemove(null);
        }
    };

    const formatSectionName = (section) => {
        if (section.program?.program_code && section.year_level) {
            const identifier = section.section_name;
            return `${section.program.program_code}-${section.year_level}${identifier}`;
        }
        return section.section_name || `Section ${section.id}`;
    };

    const getBackUrl = () => {
        return route('admin.sections.students', section.id);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(getBackUrl())}
                            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Student Section
                        </button>
                        <div className="hidden sm:block h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center px-2 py-1">
                            <div className="flex items-center gap-2">
                                <div className="bg-green-100 p-1.5 rounded-md">
                                    <BookOpen className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">Subject Enrollment</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {student.user.name} • {student.student_number} • {formatSectionName(section)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Subject Enrollment - ${student.user.name} - ${formatSectionName(section)}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded mb-4 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    
                    {flash?.warning && (
                        <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            <span>{flash.warning}</span>
                        </div>
                    )}
                    
                    {flash?.error && (
                        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-4 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Current Enrollments */}
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-gray-600" />
                                    <h2 className="font-medium text-gray-900">
                                        Enrolled Subjects ({currentEnrollments.length})
                                    </h2>
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {currentEnrollments.length === 0 ? (
                                        <div className="text-center py-6">
                                            <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No subjects enrolled</p>
                                        </div>
                                    ) : (
                                        currentEnrollments.map((enrollment) => (
                                            <div key={enrollment.id} className="flex items-center justify-between p-3 bg-green-50 rounded border group">
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {enrollment.section_subject.subject.subject_code}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        {enrollment.section_subject.subject.subject_name}
                                                    </p>
                                                    {enrollment.section_subject.teacher && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Teacher: {enrollment.section_subject.teacher.user.name}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-200">
                                                            Enrolled
                                                        </Badge>
                                                        {enrollment.section_subject.schedule_days && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {parseScheduleDays(enrollment.section_subject.schedule_days).join(', ')}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 ml-3">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRemoveFromSubject(enrollment);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                        title="Remove from subject"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Available Subjects */}
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                            <div className="bg-gray-100 px-4 py-3 border-b">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 text-gray-600" />
                                        <h2 className="font-medium text-gray-900">
                                            Available Subjects ({availableSubjects.length})
                                        </h2>
                                    </div>
                                    {selectedSubjects.length > 0 && (
                                        <button
                                            onClick={handleEnrollSubjects}
                                            disabled={isEnrolling}
                                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm font-medium flex items-center gap-1"
                                        >
                                            {isEnrolling ? (
                                                <>
                                                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                                                    Enrolling...
                                                </>
                                            ) : (
                                                <>
                                                    <UserPlus className="h-3 w-3" />
                                                    Enroll ({selectedSubjects.length})
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div className="p-4">
                                <div className="space-y-2 max-h-80 overflow-y-auto">
                                    {availableSubjects.length === 0 ? (
                                        <div className="text-center py-6">
                                            <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                            <p className="text-gray-500 text-sm">No available subjects</p>
                                        </div>
                                    ) : (
                                        availableSubjects.map((sectionSubject) => (
                                            <div 
                                                key={sectionSubject.id} 
                                                className={`flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                                    selectedSubjects.includes(sectionSubject.id) 
                                                        ? 'border-blue-300 bg-blue-50' 
                                                        : 'border-gray-200'
                                                }`}
                                                onClick={() => toggleSubject(sectionSubject.id)}
                                            >
                                                <div className="flex items-center mr-3">
                                                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                                                        selectedSubjects.includes(sectionSubject.id)
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'bg-white border-gray-300'
                                                    }`}>
                                                        {selectedSubjects.includes(sectionSubject.id) && (
                                                            <Check className="h-3 w-3 text-white" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-medium text-gray-900">
                                                        {sectionSubject.subject.subject_code}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-0.5">
                                                        {sectionSubject.subject.subject_name}
                                                    </p>
                                                    {sectionSubject.teacher && (
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Teacher: {sectionSubject.teacher.user.name}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-2 mt-2">
                                                        {sectionSubject.schedule_days && (
                                                            <Badge variant="outline" className="text-xs">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {parseScheduleDays(sectionSubject.schedule_days).join(', ')}
                                                            </Badge>
                                                        )}
                                                        {sectionSubject.room && (
                                                            <Badge variant="outline" className="text-xs">
                                                                Room: {sectionSubject.room}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Subjects Already Credited */}
                    {creditedSubjects && creditedSubjects.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
                            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
                                <div className="flex items-center gap-2">
                                    <Check className="h-4 w-4 text-blue-600" />
                                    <h2 className="font-medium text-gray-900">
                                        Subjects Already Credited ({creditedSubjects.length})
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    These subjects have already been credited to the student and are excluded from enrollment.
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {creditedSubjects.map((sectionSubject) => (
                                        <div 
                                            key={sectionSubject.id} 
                                            className="flex items-start p-3 bg-blue-50 border border-blue-200 rounded"
                                        >
                                            <div className="flex-shrink-0 mr-3 mt-0.5">
                                                <Check className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900">
                                                    {sectionSubject.subject.subject_code}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    {sectionSubject.subject.subject_name}
                                                </p>
                                                {sectionSubject.teacher && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Teacher: {sectionSubject.teacher.user.name}
                                                    </p>
                                                )}
                                                <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200 mt-2">
                                                    Already Credited
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Subjects Already Enrolled in Other Sections */}
                    {enrolledInOtherSections && enrolledInOtherSections.length > 0 && (
                        <div className="bg-white rounded-lg shadow-sm border overflow-hidden mt-6">
                            <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
                                <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-orange-600" />
                                    <h2 className="font-medium text-gray-900">
                                        Subjects Already Enrolled in Other Sections ({enrolledInOtherSections.length})
                                    </h2>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                    These subjects are already enrolled in other sections and are excluded from this section's enrollment.
                                </p>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {enrolledInOtherSections.map((enrollment) => (
                                        <div 
                                            key={enrollment.id} 
                                            className="flex items-start p-3 bg-orange-50 border border-orange-200 rounded"
                                        >
                                            <div className="flex-shrink-0 mr-3 mt-0.5">
                                                <UserCheck className="h-4 w-4 text-orange-600" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900">
                                                    {enrollment.subject?.subject_code || 'Unknown Subject'}
                                                </p>
                                                <p className="text-sm text-gray-600 mt-0.5">
                                                    {enrollment.subject?.subject_name || 'Unknown Subject Name'}
                                                </p>
                                                {enrollment.teacher && (
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Teacher: {enrollment.teacher.user?.name || 'Unknown Teacher'}
                                                    </p>
                                                )}
                                                <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-200 mt-2">
                                                    Enrolled in {enrollment.section?.formatted_name || enrollment.section?.section_name || 'Unknown Section'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Remove Confirmation Modal */}
            <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove from Subject</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove <strong>{student.user.name}</strong> from{' '}
                            <strong>{subjectToRemove?.section_subject?.subject?.subject_code}</strong>?
                            This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button 
                            variant="outline" 
                            onClick={() => setIsRemoveModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={confirmRemoveFromSubject}
                        >
                            Remove
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}