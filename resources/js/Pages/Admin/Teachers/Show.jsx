import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    ArrowLeft,
    Edit,
    Mail,
    Phone,
    Calendar,
    Building2,
    GraduationCap,
    User,
    UserCheck,
    UserX,
    MapPin,
    Clock
} from 'lucide-react';

const Show = ({ teacher }) => {
    const getStatusBadge = (status) => {
        return status === 'active' ? (
            <Badge className="bg-green-100 text-green-800 border-green-200">
                <UserCheck className="w-3 h-3 mr-1" />
                Active
            </Badge>
        ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
            </Badge>
        );
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Not set';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatSectionName = (section) => {
        if (!section) return 'Section Not Found';
        
        const programCode = section.program?.program_code || 'UNK';
        const yearLevel = section.year_level || 'N/A';
        const sectionName = section.section_name || '';
        
        return `${programCode}-${yearLevel}${sectionName}`;
    };

    const formatTimeWithAmPm = (timeString) => {
        if (!timeString) return 'N/A';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('admin.teachers.index')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Teachers
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-1.5 rounded-md">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Teacher Details</h2>
                                <p className="text-xs text-gray-500 mt-0.5">View comprehensive teacher information and assignments</p>
                            </div>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${teacher.first_name} ${teacher.last_name} - Teacher Details`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Teacher Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-6">
                            {teacher.profile_picture ? (
                                <img
                                    src={teacher.profile_picture}
                                    alt={`${teacher.first_name} ${teacher.last_name}`}
                                    className="w-20 h-20 rounded-full object-cover border-4 border-gray-100 flex-shrink-0"
                                />
                            ) : (
                                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-white font-bold text-2xl">
                                        {teacher.first_name.charAt(0)}{teacher.last_name.charAt(0)}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {teacher.first_name} {teacher.middle_name ? teacher.middle_name + ' ' : ''}{teacher.last_name}
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">
                                            Employee #{teacher.employee_number || teacher.user?.formatted_employee_number || 'N/A'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(teacher.status)}
                                            {teacher.department && (
                                                <Badge variant="outline">
                                                    <Building2 className="w-3 h-3 mr-1" />
                                                    {teacher.department}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <Button asChild variant="outline" size="sm">
                                        <Link href={route('admin.teachers.edit', teacher.id)}>
                                            <Edit className="w-4 h-4 mr-2" />
                                            Edit Teacher
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subject Assignments */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <GraduationCap className="w-5 h-5 mr-2" />
                            Subject Assignments ({teacher.section_subjects?.length || 0})
                        </CardTitle>
                        <CardDescription>
                            Current subjects assigned to this teacher with schedule and section information
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {teacher.section_subjects && teacher.section_subjects.length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {/* Check for data integrity issues */}
                                {teacher.section_subjects.some(assignment => !assignment.subject || !assignment.section) && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-800">
                                                    Some subject or section data may be missing. Please contact an administrator to resolve data integrity issues.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {teacher.section_subjects.map((assignment) => (
                                    <AccordionItem key={assignment.id} value={`subject-${assignment.id}`} className="border border-gray-200 rounded-lg mb-3 px-6 bg-white">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    assignment.subject ? 'bg-blue-500' : 'bg-red-500'
                                                }`}>
                                                    <GraduationCap className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-base truncate">
                                                        {assignment.subject?.subject_name || assignment.subject?.name || 'Subject Not Found'}
                                                        {assignment.subject?.subject_code && (
                                                            <span className="text-sm text-gray-500 ml-2 font-normal">
                                                                ({assignment.subject.subject_code})
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {assignment.section ? formatSectionName(assignment.section) : 'Section Not Found'}
                                                    </p>
                                                </div>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="pt-4">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Schedule Information */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                                                            <Clock className="w-4 h-4 mr-2" />
                                                            Schedule
                                                        </h5>
                                                        <div className="space-y-2">
                                                            {assignment.start_time && assignment.end_time ? (
                                                                <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                                                                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                                    <span className="font-medium">{formatTimeWithAmPm(assignment.start_time)} - {formatTimeWithAmPm(assignment.end_time)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">No schedule set</div>
                                                            )}
                                                            {assignment.schedule_days && assignment.schedule_days.length > 0 ? (
                                                                <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                                                                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                                                    <span>{assignment.schedule_days.map(day => 
                                                                        day.charAt(0).toUpperCase() + day.slice(1)
                                                                    ).join(', ')}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">No days specified</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Section Details */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                                                            <Building2 className="w-4 h-4 mr-2" />
                                                            Section Details
                                                        </h5>
                                                        <div className="space-y-2 relative">
                                                            {assignment.section ? (
                                                                <>
                                                                    <div className="flex items-center gap-2 flex-wrap">
                                                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                            {formatSectionName(assignment.section)}
                                                                        </Badge>
                                                                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                                            {assignment.section.semester || 'N/A'} Semester
                                                                        </Badge>
                                                                        {assignment.section?.academic_year && (
                                                                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                                                AY {assignment.section.academic_year}
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    
                                                                    {assignment.room && (
                                                                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                                                                            <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                                                                            <span className="font-medium">Room {assignment.room}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                                                                    Section data unavailable
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* View Section Button */}
                                                <div className="mt-6 pt-4 border-t border-gray-200">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        <Link href={assignment.section?.id ? route('admin.sections.show', assignment.section.id) : '#'}>
                                                            <MapPin className="w-4 h-4 mr-2" />
                                                            View Full Section Details
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <div className="text-center py-8">
                                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Subject Assignments</h3>
                                <p className="text-gray-500 text-sm">
                                    This teacher is not currently assigned to any subjects.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;