import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, Calendar, Users, BookOpen, Eye } from 'lucide-react';

const Index = ({ archivedSections }) => {
    const { auth } = usePage().props;
    const teacherId = auth.user.teacher?.id;
    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const getEducationLevelBadge = (program) => {
        if (!program) return null;
        
        const isCollege = program.education_level === 'college';
        return (
            <Badge variant={isCollege ? "default" : "secondary"} className="ml-2">
                {isCollege ? 'College' : 'SHS'}
            </Badge>
        );
    };

    const getTeacherSubjects = (section) => {
        const courseData = section.course_data || [];
        return courseData.filter(course => course.teacher_id === teacherId);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Archived Sections</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View past semester grades and student performance</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Archived Sections" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {archivedSections.data.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Archived Sections
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Archived sections will appear here when semesters are completed.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {archivedSections.data.map((section) => (
                                <Card key={section.id} className="hover:shadow-lg transition-shadow duration-200">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl flex items-center gap-2">
                                                    {section.program?.program_code || 'N/A'} {section.year_level}-{section.section_name}
                                                    {getEducationLevelBadge(section.program)}
                                                </CardTitle>
                                                <div className="mt-2 space-y-1">
                                                    <CardDescription className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {section.academic_year} • {getSemesterDisplay(section.semester)}
                                                    </CardDescription>
                                                    {getTeacherSubjects(section).length > 0 && (
                                                        <div className="flex items-start gap-2">
                                                            <BookOpen className="h-4 w-4 mt-0.5 text-gray-500" />
                                                            <div className="flex flex-wrap gap-1">
                                                                {getTeacherSubjects(section).map((subject, index) => (
                                                                    <Badge key={index} variant="outline" className="text-xs">
                                                                        {subject.course_code}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Total Students
                                                </span>
                                                <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                    {section.total_enrolled_students}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Completed
                                                </span>
                                                <span className="font-semibold text-green-600 dark:text-green-400">
                                                    {section.completed_students}
                                                </span>
                                            </div>

                                            {section.section_average_grade && (
                                                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                                                    <span className="text-gray-600 dark:text-gray-400">
                                                        Average Grade
                                                    </span>
                                                    <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                        {section.section_average_grade}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <Link
                                            href={`/teacher/archived-sections/${section.id}`}
                                            className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Student Grades
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {archivedSections.links && archivedSections.links.length > 3 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {archivedSections.links.map((link, index) => (
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="px-4 py-2 text-sm font-medium text-gray-400 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;