import React, { useState, useMemo } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
    ArrowLeft,
    Edit,
    Users,
    GraduationCap,
    Calendar,
    Building2,
    User,
    Clock,
    MapPin,
    BookOpen,
    UserCheck,
    UserX,
    Search
} from 'lucide-react';

const Show = ({ section, sectionSubjects, availableStudents }) => {
    const [studentSearch, setStudentSearch] = useState('');
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

    const filteredStudents = useMemo(() => {
        if (!studentSearch) return section.student_enrollments || [];
        return (section.student_enrollments || []).filter(enrollment => {
            const student = enrollment.student;
            const fullName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.toLowerCase();
            const studentNumber = student.student_number?.toLowerCase() || '';
            const email = student.user?.email?.toLowerCase() || '';
            const searchTerm = studentSearch.toLowerCase();
            return fullName.includes(searchTerm) || studentNumber.includes(searchTerm) || email.includes(searchTerm);
        });
    }, [section.student_enrollments, studentSearch]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={route('admin.sections.index')} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Sections
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Users className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Section Details</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View comprehensive section information and enrolled students</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${formatSectionName(section)} - Section Details`} />

            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
                {/* Section Profile Header */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-start gap-6">
                            <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-bold text-2xl">
                                    {section.year_level || ''}
                                    {section.section_name?.charAt(0) || 'S'}
                                </span>
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            {formatSectionName(section)}
                                        </h1>
                                        <p className="text-lg text-gray-600 mt-1">
                                            {section.program?.program_name || 'Program Not Found'}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {getStatusBadge(section.status)}
                                            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                                AY {section.academic_year}
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                {section.semester} Semester
                                            </Badge>
                                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                                Year {section.year_level}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Subject Assignments */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="subject-assignments">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center">
                                <GraduationCap className="w-5 h-5 mr-2" />
                                <span className="text-lg font-semibold">Subject Assignments ({sectionSubjects?.length || 0})</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Subjects assigned to this section with teacher information
                            </p>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                        {sectionSubjects && sectionSubjects.length > 0 ? (
                            <Accordion type="multiple" className="w-full">
                                {/* Check for data integrity issues - only warn about missing subjects */}
                                {sectionSubjects.some(sectionSubject => !sectionSubject.subject) && (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <p className="text-sm text-yellow-800">
                                                    Some subject data may be missing. Please contact an administrator to resolve data integrity issues.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {sectionSubjects.map((sectionSubject) => (
                                    <AccordionItem key={sectionSubject.id} value={`subject-${sectionSubject.id}`} className="border border-gray-200 rounded-lg mb-3 px-6 bg-white">
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center gap-4 text-left">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                                    sectionSubject.subject ? 'bg-blue-500' : 'bg-red-500'
                                                }`}>
                                                    <BookOpen className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-gray-900 text-base truncate">
                                                        {sectionSubject.subject?.subject_name || sectionSubject.subject?.name || 'Subject Not Found'}
                                                        {sectionSubject.subject?.subject_code && (
                                                            <span className="text-sm text-gray-500 ml-2 font-normal">
                                                                ({sectionSubject.subject.subject_code})
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <p className="text-sm text-gray-600 truncate">
                                                        {sectionSubject.teacher ? (sectionSubject.teacher.user?.name || 'Teacher Name Not Available') : 'No Teacher Assigned'}
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
                                                            {sectionSubject.start_time && sectionSubject.end_time ? (
                                                                <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                                                                    <Clock className="w-4 h-4 mr-2 text-blue-500" />
                                                                    <span className="font-medium">{formatTimeWithAmPm(sectionSubject.start_time)} - {formatTimeWithAmPm(sectionSubject.end_time)}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">No schedule set</div>
                                                            )}
                                                            {sectionSubject.schedule_days && sectionSubject.schedule_days.length > 0 ? (
                                                                <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                                                                    <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                                                    <span>{sectionSubject.schedule_days.map(day => 
                                                                        day.charAt(0).toUpperCase() + day.slice(1)
                                                                    ).join(', ')}</span>
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-md">No days specified</div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Teacher Details */}
                                                    <div className="space-y-3">
                                                        <h5 className="text-sm font-medium text-gray-700 uppercase tracking-wide flex items-center">
                                                            <User className="w-4 h-4 mr-2" />
                                                            Teacher Details
                                                        </h5>
                                                        <div className="space-y-2 relative">
                                                            {sectionSubject.teacher ? (
                                                                <>
                                                                    <div className="flex items-center text-sm text-gray-700 bg-gray-50 px-3 py-2 rounded-md">
                                                                        <User className="w-4 h-4 mr-2 text-blue-500" />
                                                                        <span className="font-medium">
                                                                            {sectionSubject.teacher.user?.name || 'Teacher Name Not Available'}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    {sectionSubject.room && (
                                                                        <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-md flex items-center">
                                                                            <MapPin className="w-4 h-4 mr-2 text-orange-500" />
                                                                            <span className="font-medium">Room {sectionSubject.room}</span>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
                                                                    Teacher data unavailable
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* View Teacher Button */}
                                                <div className="mt-6 pt-4 border-t border-gray-200">
                                                    <Button
                                                        asChild
                                                        variant="outline"
                                                        size="sm"
                                                        className="w-full"
                                                    >
                                                        <Link href={sectionSubject.teacher?.id ? route('admin.teachers.show', sectionSubject.teacher.id) : '#'}>
                                                            <User className="w-4 h-4 mr-2" />
                                                            View Teacher Details
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
                                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Subjects Assigned</h3>
                                <p className="text-gray-500 text-sm">
                                    This section has no subjects assigned yet.
                                </p>
                            </div>
                        )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                {/* Enrolled Students */}
                <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="enrolled-students">
                        <AccordionTrigger className="px-6 py-4 hover:no-underline">
                            <div className="flex items-center">
                                <Users className="w-5 h-5 mr-2" />
                                <span className="text-lg font-semibold">Enrolled Students ({section.student_enrollments?.length || 0})</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                                Students enrolled in this section
                            </p>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 pb-4">
                        {section.student_enrollments && section.student_enrollments.length > 0 ? (
                            <div className="space-y-4">
                                {/* Search Input */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search students by name, student number, or email..."
                                        value={studentSearch}
                                        onChange={(e) => setStudentSearch(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((enrollment) => (
                                            <div key={enrollment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200 bg-white">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-white font-bold text-sm">
                                                            {enrollment.student?.user?.name?.charAt(0) || 'S'}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="font-medium text-gray-900 truncate">
                                                            {enrollment.student?.user?.name || 'Student Name Not Available'}
                                                        </h4>
                                                        <p className="text-sm text-gray-500">
                                                            Student #{enrollment.student?.student_number || 'N/A'}
                                                        </p>
                                                        <div className="flex gap-1 mt-2 flex-wrap">
                                                            <Badge variant="outline" className="text-xs">
                                                                Year {section.year_level}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full text-center py-8">
                                            <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                                            <p className="text-gray-500 text-sm">
                                                {studentSearch ? 'No students match your search criteria.' : 'No students are currently enrolled in this section.'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Enrolled</h3>
                                <p className="text-gray-500 text-sm">
                                    This section has no enrolled students yet.
                                </p>
                            </div>
                        )}
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;