import React, { useState } from 'react';
import { Head, router, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Users, UserPlus, GraduationCap, ArrowLeft, Mail, Phone, MapPin, Calendar, BookOpen, User, Trash2, Settings } from 'lucide-react';

export default function Students({ section, enrolledStudents, availableStudents }) {
    const { flash } = usePage().props;
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isEnrolling, setIsEnrolling] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
    const [studentToRemove, setStudentToRemove] = useState(null);

    // Debug logging
    console.log('Component props:', { section, enrolledStudents, availableStudents });
    console.log('Enrolled students count:', enrolledStudents?.length);
    console.log('Available students count:', availableStudents?.length);

    const handleEnrollStudents = async () => {
        if (selectedStudents.length === 0) {
            alert('Please select at least one student');
            return;
        }

        setIsEnrolling(true);
        console.log('Starting enrollment for students:', selectedStudents);
        
        try {
            // Try multiple ways to get CSRF token
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                // Try to get it from a form if meta tag doesn't exist
                const csrfInput = document.querySelector('input[name="_token"]');
                csrfToken = csrfInput?.value;
            }
            
            if (!csrfToken) {
                // Get it from Laravel's global window object if available
                csrfToken = window.Laravel?.csrfToken;
            }
            
            console.log('CSRF token found:', csrfToken ? 'Yes' : 'No');
            console.log('CSRF token value:', csrfToken);
            
            if (!csrfToken) {
                alert('CSRF token not found. Please refresh the page and try again.');
                setIsEnrolling(false);
                return;
            }
            
            const response = await fetch(`/admin/sections/${section.id}/enroll`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    student_ids: selectedStudents
                })
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                alert('Students enrolled successfully!');
                window.location.reload();
            } else {
                const responseText = await response.text();
                console.log('Error response:', responseText);
                alert(`Failed to enroll students. Status: ${response.status}`);
                setIsEnrolling(false);
            }
        } catch (error) {
            console.error('Enrollment error:', error);
            alert('Network error occurred. Please check console for details.');
            setIsEnrolling(false);
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev => 
            prev.includes(studentId) 
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const openStudentModal = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeStudentModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(false);
    };

    const handleRemoveStudent = (studentId, studentName) => {
        setStudentToRemove({ id: studentId, name: studentName });
        setIsRemoveModalOpen(true);
    };

    const confirmRemoveStudent = async () => {
        if (!studentToRemove) return;

        try {
            let csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            
            if (!csrfToken) {
                alert('CSRF token not found. Please refresh the page and try again.');
                return;
            }

            const response = await fetch(`/admin/sections/${section.id}/remove-student`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    student_id: studentToRemove.id
                })
            });

            if (response.ok) {
                alert('Student removed successfully!');
                window.location.reload();
            } else {
                const responseText = await response.text();
                console.log('Error response:', responseText);
                alert(`Failed to remove student. Status: ${response.status}`);
            }
        } catch (error) {
            console.error('Remove student error:', error);
            alert('Network error occurred. Please check console for details.');
        } finally {
            setIsRemoveModalOpen(false);
            setStudentToRemove(null);
        }
    };

    const handleManageSubjects = (studentId) => {
        router.get(route('admin.sections.subject-enrollment', {
            section: section.id,
            student: studentId
        }));
    };

    // Format section name for better readability
    const formatSectionName = (section) => {
        console.log('Section object for formatting:', section);
        
        if (section.program?.program_code && section.year_level) {
            const identifier = section.section_name;
            return `${section.program.program_code}-${section.year_level}${identifier}`;
        }
        return section.section_name || `Section ${section.id}`;
    };

    // Determine the correct back route based on program type
    const getBackRoute = (section) => {
        if (section.program?.type === 'shs') {
            return route('admin.shs.sections.index');
        } else if (section.program?.type === 'college') {
            return route('admin.college.sections.index');
        }
        // Fallback to general sections index
        return route('admin.sections.index');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => window.location.href = getBackRoute(section)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sections
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Section Students</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Manage enrollment for {formatSectionName(section)}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Students - ${formatSectionName(section)}`} />
            
            <div className="bg-gray-50 min-h-screen">
                <div className="max-w-6xl mx-auto p-4">
                    {/* Flash Messages */}
                    {flash?.success && (
                        <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-3 rounded mb-4 flex items-center gap-2">
                            <Check className="h-4 w-4" />
                            <span>{flash.success}</span>
                        </div>
                    )}
                    
                    {flash?.error && (
                        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded mb-4 flex items-center gap-2">
                            <X className="h-4 w-4" />
                            <span>{flash.error}</span>
                        </div>
                    )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Enrolled Students */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-600" />
                                <h2 className="font-medium text-gray-900">
                                    Enrolled Students ({enrolledStudents.length})
                                </h2>
                            </div>
                        </div>
                        <div className="p-4">
                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {enrolledStudents.length === 0 ? (
                                    <div className="text-center py-6">
                                        <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No students enrolled</p>
                                    </div>
                                ) : (
                                    enrolledStudents.map((enrollment) => (
                                        <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border group">
                                            <div className="min-w-0 flex-1">
                                                <p 
                                                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-block"
                                                    style={{ width: 'fit-content' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openStudentModal(enrollment.student);
                                                    }}
                                                >
                                                    {enrollment.student.user.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-sm text-gray-600">{enrollment.student.student_number}</p>
                                                    {enrollment.student.student_type === 'irregular' && (
                                                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                                                            Irregular
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-3">
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">Enrolled</span>
                                                {enrollment.student.student_type === 'irregular' && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleManageSubjects(enrollment.student.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                                                        title="Manage subjects"
                                                    >
                                                        <Settings className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveStudent(enrollment.student.id, enrollment.student.user.name);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                                    title="Remove from section"
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

                    {/* Available Students */}
                    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                        <div className="bg-gray-100 px-4 py-3 border-b">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <UserPlus className="h-4 w-4 text-gray-600" />
                                    <h2 className="font-medium text-gray-900">
                                        Available Students ({availableStudents.length})
                                    </h2>
                                </div>
                                {selectedStudents.length > 0 && (
                                    <button
                                        onClick={handleEnrollStudents}
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
                                                Enroll ({selectedStudents.length})
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </div>
                        
                        <div className="p-4">

                            <div className="space-y-2 max-h-80 overflow-y-auto">
                                {availableStudents.length === 0 ? (
                                    <div className="text-center py-6">
                                        <UserPlus className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-500 text-sm">No available students</p>
                                    </div>
                                ) : (
                                    availableStudents.map((student) => (
                                        <div 
                                            key={student.id} 
                                            className={`flex items-center p-3 border rounded cursor-pointer hover:bg-gray-50 transition-colors ${
                                                selectedStudents.includes(student.id) 
                                                    ? 'border-blue-300 bg-blue-50' 
                                                    : 'border-gray-200'
                                            }`}
                                            onClick={() => toggleStudent(student.id)}
                                        >
                                            <div className="flex items-center mr-3">
                                                <div className={`w-4 h-4 border-2 rounded flex items-center justify-center transition-colors ${
                                                    selectedStudents.includes(student.id)
                                                        ? 'bg-blue-600 border-blue-600'
                                                        : 'bg-white border-gray-300'
                                                }`}>
                                                    {selectedStudents.includes(student.id) && (
                                                        <Check className="h-3 w-3 text-white" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p 
                                                    className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer inline-block"
                                                    style={{ width: 'fit-content' }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openStudentModal(student);
                                                    }}
                                                >
                                                    {student.user.name}
                                                </p>
                                                <div className="flex items-center gap-3 text-sm text-gray-600">
                                                    <span>{student.student_number}</span>
                                                    {student.program?.program_code && (
                                                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                                                            {student.program.program_code}
                                                        </span>
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
            </div>
        </div>

        {/* Student Details Modal */}
        <Dialog open={isModalOpen} onOpenChange={closeStudentModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <User className="w-5 h-5 text-blue-600" />
                        Student Information
                    </DialogTitle>
                    <DialogDescription>
                        Detailed information about the selected student
                    </DialogDescription>
                </DialogHeader>
                
                {selectedStudent && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <User className="w-4 h-4 text-blue-600" />
                                    Personal Information
                                </h3>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                                        <p className="text-base font-medium text-gray-900">{selectedStudent.user.name}</p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-600">Student Number</label>
                                        <p className="text-base text-gray-900 font-mono">{selectedStudent.student_number}</p>
                                    </div>
                                    {selectedStudent.user.email && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                                <Mail className="w-3 h-3" />
                                                Email Address
                                            </label>
                                            <p className="text-base text-gray-900">{selectedStudent.user.email}</p>
                                        </div>
                                    )}
                                    {selectedStudent.phone_number && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                Phone Number
                                            </label>
                                            <p className="text-base text-gray-900">{selectedStudent.phone_number}</p>
                                        </div>
                                    )}
                                    {selectedStudent.date_of_birth && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Date of Birth
                                            </label>
                                            <p className="text-base text-gray-900">
                                                {new Date(selectedStudent.date_of_birth).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {selectedStudent.gender && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Gender</label>
                                            <p className="text-base text-gray-900 capitalize">{selectedStudent.gender}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Address Information */}
                            {(selectedStudent.address || selectedStudent.city || selectedStudent.province || selectedStudent.postal_code) && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                        Address Information
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedStudent.address && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Street Address</label>
                                                <p className="text-base text-gray-900">{selectedStudent.address}</p>
                                            </div>
                                        )}
                                        <div className="grid grid-cols-2 gap-3">
                                            {selectedStudent.city && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">City</label>
                                                    <p className="text-base text-gray-900">{selectedStudent.city}</p>
                                                </div>
                                            )}
                                            {selectedStudent.province && (
                                                <div>
                                                    <label className="text-sm font-medium text-gray-600">Province</label>
                                                    <p className="text-base text-gray-900">{selectedStudent.province}</p>
                                                </div>
                                            )}
                                        </div>
                                        {selectedStudent.postal_code && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Postal Code</label>
                                                <p className="text-base text-gray-900">{selectedStudent.postal_code}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Academic Information */}
                        <div className="space-y-6">
                            <div className="border rounded-lg p-4">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                    Academic Information
                                </h3>
                                <div className="space-y-3">
                                    {selectedStudent.program && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Program</label>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="secondary" className="font-mono">
                                                    {selectedStudent.program.program_code}
                                                </Badge>
                                                <span className="text-base text-gray-900">{selectedStudent.program.program_name}</span>
                                            </div>
                                        </div>
                                    )}
                                    {selectedStudent.year_level && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Year Level</label>
                                            <p className="text-base text-gray-900">
                                                {selectedStudent.program?.type === 'shs' ? `Grade ${selectedStudent.year_level}` : `Year ${selectedStudent.year_level}`}
                                            </p>
                                        </div>
                                    )}
                                    {selectedStudent.student_type && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Student Type</label>
                                            <p className="text-base text-gray-900 capitalize">{selectedStudent.student_type.replace('_', ' ')}</p>
                                        </div>
                                    )}
                                    {selectedStudent.enrollment_date && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Enrollment Date</label>
                                            <p className="text-base text-gray-900">
                                                {new Date(selectedStudent.enrollment_date).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                    {selectedStudent.status && (
                                        <div>
                                            <label className="text-sm font-medium text-gray-600">Status</label>
                                            <Badge 
                                                variant={selectedStudent.status === 'active' ? 'default' : 'secondary'}
                                                className="mt-1"
                                            >
                                                {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Emergency Contact Information */}
                            {(selectedStudent.emergency_contact_name || selectedStudent.emergency_contact_phone || selectedStudent.emergency_contact_relationship) && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-red-600" />
                                        Emergency Contact
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedStudent.emergency_contact_name && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Contact Name</label>
                                                <p className="text-base text-gray-900">{selectedStudent.emergency_contact_name}</p>
                                            </div>
                                        )}
                                        {selectedStudent.emergency_contact_phone && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Phone Number</label>
                                                <p className="text-base text-gray-900">{selectedStudent.emergency_contact_phone}</p>
                                            </div>
                                        )}
                                        {selectedStudent.emergency_contact_relationship && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Relationship</label>
                                                <p className="text-base text-gray-900 capitalize">{selectedStudent.emergency_contact_relationship}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Additional Information */}
                            {(selectedStudent.guardian_name || selectedStudent.guardian_phone || selectedStudent.previous_school) && (
                                <div className="border rounded-lg p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <GraduationCap className="w-4 h-4 text-green-600" />
                                        Additional Information
                                    </h3>
                                    <div className="space-y-3">
                                        {selectedStudent.guardian_name && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Guardian Name</label>
                                                <p className="text-base text-gray-900">{selectedStudent.guardian_name}</p>
                                            </div>
                                        )}
                                        {selectedStudent.guardian_phone && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Guardian Phone</label>
                                                <p className="text-base text-gray-900">{selectedStudent.guardian_phone}</p>
                                            </div>
                                        )}
                                        {selectedStudent.previous_school && (
                                            <div>
                                                <label className="text-sm font-medium text-gray-600">Previous School</label>
                                                <p className="text-base text-gray-900">{selectedStudent.previous_school}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex justify-end mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={closeStudentModal}>
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        {/* Remove Student Confirmation Modal */}
        <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                        <Trash2 className="w-5 h-5 text-red-600" />
                        Confirm Removal
                    </DialogTitle>
                    <DialogDescription>
                        Are you sure you want to remove this student from the section?
                    </DialogDescription>
                </DialogHeader>
                
                {studentToRemove && (
                    <div className="py-4">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-800">
                                <strong>Student:</strong> {studentToRemove.name}
                            </p>
                            <p className="text-xs text-red-600 mt-1">
                                This action will remove the student from this section but will not delete their account.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <Button 
                        variant="outline" 
                        onClick={() => {
                            setIsRemoveModalOpen(false);
                            setStudentToRemove(null);
                        }}
                    >
                        Cancel
                    </Button>
                    <Button 
                        variant="destructive" 
                        onClick={confirmRemoveStudent}
                        className="bg-red-600 hover:bg-red-700"
                    >
                        Remove Student
                    </Button>
                </div>
            </DialogContent>
        </Dialog>

        </AuthenticatedLayout>
    );
}