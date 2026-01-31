import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Archive, BookOpen } from 'lucide-react';

const Show = ({ archivedSection }) => {
    const { auth } = usePage().props;
    const teacherId = auth.user.teacher?.id;

    const getTeacherSubjects = (section) => {
        const courseData = section.course_data || [];
        return courseData.filter(course => course.teacher_id === teacherId);
    };

    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link
                            href="/teacher/archived-sections"
                            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{archivedSection.program?.program_code || 'N/A'} - {archivedSection.year_level}{archivedSection.section_name} </h2>
                            <p className="text-xs text-gray-500 mt-0.5">{archivedSection.academic_year} • {getSemesterDisplay(archivedSection.semester)}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Archived Grades - ${archivedSection.section_name}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">

                    {/* Assigned Subjects */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Assigned Subjects</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {getTeacherSubjects(archivedSection).map((subject, index) => (
                                    <Card
                                        key={subject.id || index}
                                        className="hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={() => {
                                            router.visit(route('teacher.archived-sections.subject-grades', {
                                                archivedSection: archivedSection.id,
                                                subjectId: subject.id || subject.subject_code
                                            }));
                                        }}
                                    >
                                        <CardContent className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                                        {subject.subject_name || subject.subject_code}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {subject.subject_code} • {subject.units} units
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {archivedSection.academic_year}
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            •
                                                        </span>
                                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                                            {getSemesterDisplay(archivedSection.semester)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;