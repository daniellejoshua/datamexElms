import React, { useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Users, Calendar, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';

const CarryForward = ({ archivedSections, currentAcademicPeriod, previousSemester }) => {
    const [selectedSection, setSelectedSection] = useState(null);
    const [selectedStudents, setSelectedStudents] = useState([]);

    const { data, setData, post, processing, errors } = useForm({
        archived_section_id: '',
        section_name: '',
        academic_year: currentAcademicPeriod?.academic_year || '',
        semester: currentAcademicPeriod?.semester || '',
        student_ids: []
    });

    const handleSelectSection = (section) => {
        setSelectedSection(section);
        setData({
            ...data,
            archived_section_id: section.id,
            section_name: section.section_name
        });

        // Auto-select all active students
        const activeStudents = section.archived_enrollments
            ?.filter(enrollment => enrollment.student && enrollment.student.status === 'active')
            .map(enrollment => enrollment.student_id) || [];
        
        setSelectedStudents(activeStudents);
        setData(prev => ({ ...prev, student_ids: activeStudents }));
    };

    const handleToggleStudent = (studentId) => {
        const newSelectedStudents = selectedStudents.includes(studentId)
            ? selectedStudents.filter(id => id !== studentId)
            : [...selectedStudents, studentId];
        
        setSelectedStudents(newSelectedStudents);
        setData('student_ids', newSelectedStudents);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.college.sections.carry-forward'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/admin/college/sections" className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Sections
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Carry Forward Section</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">Create new section from previous semester</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Carry Forward Section" />
            
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto">
                    {/* Info Alert */}
                    <Alert className="mb-6 bg-blue-50 border-blue-200">
                        <RefreshCcw className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            Carry forward allows you to create a new section for <strong>{currentAcademicPeriod?.semester} Semester {currentAcademicPeriod?.academic_year}</strong> by copying 
                            section details and students from <strong>{previousSemester} Semester {currentAcademicPeriod?.academic_year}</strong>.
                        </AlertDescription>
                    </Alert>

                    {!selectedSection ? (
                        /* Step 1: Select Section */
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Select Section to Carry Forward
                                </CardTitle>
                                <CardDescription>
                                    Choose a section from {previousSemester} Semester to carry forward to {currentAcademicPeriod?.semester} Semester
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                {archivedSections && archivedSections.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {archivedSections.map((section) => (
                                            <Card 
                                                key={section.id} 
                                                className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-500"
                                                onClick={() => handleSelectSection(section)}
                                            >
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="font-bold text-lg text-gray-900">{section.section_name}</h3>
                                                        <Badge variant="outline" className="text-xs">
                                                            {previousSemester} Sem
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-2 text-sm">
                                                        <div className="flex items-center gap-2 text-gray-600">
                                                            <Users className="w-4 h-4" />
                                                            <span>{section.total_enrolled_students || 0} students</span>
                                                        </div>
                                                        {section.section_average_grade && (
                                                            <div className="text-gray-600">
                                                                Avg Grade: <span className="font-medium">{section.section_average_grade}%</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <Button className="w-full mt-4" size="sm">
                                                        Select Section
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <Alert>
                                        <AlertCircle className="h-4 w-4" />
                                        <AlertDescription>
                                            No archived sections found from {previousSemester} Semester {currentAcademicPeriod?.academic_year}.
                                            Please ensure sections were archived properly.
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        /* Step 2: Review and Confirm */
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Section Details */}
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                Carry Forward: {selectedSection.section_name}
                                            </CardTitle>
                                            <Button 
                                                type="button" 
                                                variant="outline" 
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedSection(null);
                                                    setSelectedStudents([]);
                                                }}
                                            >
                                                Change Section
                                            </Button>
                                        </div>
                                        <CardDescription>
                                            Review and select students to enroll in the new section
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                                            <div>
                                                <span className="text-sm text-gray-600">From:</span>
                                                <p className="font-medium">{previousSemester} Semester {selectedSection.academic_year}</p>
                                            </div>
                                            <div>
                                                <span className="text-sm text-gray-600">To:</span>
                                                <p className="font-medium">{currentAcademicPeriod?.semester} Semester {currentAcademicPeriod?.academic_year}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Student Selection */}
                                <Card className="shadow-lg">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="w-5 h-5 text-blue-600" />
                                            Select Students ({selectedStudents.length} selected)
                                        </CardTitle>
                                        <CardDescription>
                                            Choose which students to enroll in the new section
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        {selectedSection.archived_enrollments && selectedSection.archived_enrollments.length > 0 ? (
                                            <div className="space-y-2">
                                                {selectedSection.archived_enrollments.map((enrollment) => {
                                                    const student = enrollment.student;
                                                    const isActive = student?.status === 'active';
                                                    const isSelected = selectedStudents.includes(enrollment.student_id);

                                                    return (
                                                        <div 
                                                            key={enrollment.id}
                                                            className={`flex items-center gap-3 p-3 rounded-lg border ${
                                                                isActive ? 'bg-white hover:bg-gray-50' : 'bg-gray-100'
                                                            }`}
                                                        >
                                                            <Checkbox
                                                                checked={isSelected}
                                                                disabled={!isActive}
                                                                onCheckedChange={() => handleToggleStudent(enrollment.student_id)}
                                                            />
                                                            <div className="flex-1">
                                                                <p className="font-medium text-gray-900">
                                                                    {student?.user?.name || enrollment.student_data?.name || 'Unknown Student'}
                                                                </p>
                                                                <p className="text-sm text-gray-600">
                                                                    {student?.student_number || enrollment.student_data?.student_number}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {enrollment.final_semester_grade && (
                                                                    <Badge variant="outline">
                                                                        Grade: {enrollment.final_semester_grade}%
                                                                    </Badge>
                                                                )}
                                                                {!isActive && (
                                                                    <Badge variant="destructive" className="text-xs">
                                                                        Inactive
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <Alert>
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>
                                                    No students found in this archived section.
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {errors.student_ids && (
                                            <Alert variant="destructive" className="mt-4">
                                                <AlertCircle className="h-4 w-4" />
                                                <AlertDescription>{errors.student_ids}</AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Submit Buttons */}
                                <div className="flex items-center justify-between">
                                    <Button 
                                        type="button" 
                                        variant="outline"
                                        onClick={() => {
                                            setSelectedSection(null);
                                            setSelectedStudents([]);
                                        }}
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={processing || selectedStudents.length === 0}
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        {processing ? 'Creating...' : `Carry Forward with ${selectedStudents.length} Students`}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default CarryForward;
