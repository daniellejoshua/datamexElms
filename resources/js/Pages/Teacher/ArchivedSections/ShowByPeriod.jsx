import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, ArrowLeft } from 'lucide-react';

const ShowByPeriod = ({ archivedSections, academicYear, semester }) => {
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
                <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm" className="p-0 h-auto">
                        <Link href="/teacher/archived-sections" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                            <ArrowLeft className="h-4 w-4" />
                            <span className="text-lg font-semibold">Archived Sections - {academicYear} {getSemesterDisplay(semester)}</span>
                        </Link>
                    </Button>
                </div>
            }
        >
            <Head title={`Archived Sections - ${academicYear} ${getSemesterDisplay(semester)}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {archivedSections.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Archived Sections
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No sections found for this academic period.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {archivedSections.map((section) => (
                                <Card key={section.id} className="hover:shadow-xl transition-all duration-300 border-0 shadow-md bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 group">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                                                    {section.program?.program_code || 'N/A'} {section.year_level}-{section.section_name}
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        {/* Subject Count */}
                                        <div className="mb-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">
                                                    Assigned Subjects
                                                </span>
                                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                                    {getTeacherSubjects(section).length}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Stats */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                                    {section.total_enrolled_students}
                                                </div>
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                                    Students
                                                </div>
                                            </div>
                                            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
                                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                                    {section.completed_students}
                                                </div>
                                                <div className="text-xs text-green-600 dark:text-green-400 font-medium">
                                                    Completed
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link
                                            href={`/teacher/archived-sections/${section.id}`}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-sm font-semibold text-white hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                                        >
                                            View Grades
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default ShowByPeriod;