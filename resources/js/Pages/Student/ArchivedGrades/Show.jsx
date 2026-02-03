import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Calendar, Users, BookOpen, Eye, GraduationCap, Building, ArrowLeft, BarChart3 } from 'lucide-react';

const Show = ({ sections, academic_year, semester }) => {
    const { auth } = usePage().props;

    // Process sections data from controller
    const sectionsData = React.useMemo(() => {
        if (!sections) return [];

        const data = Array.isArray(sections) ? sections : Object.values(sections) || [];
        if (!Array.isArray(data)) return [];

        return data.map(sectionData => ({
            section: sectionData.section,
            enrollments: sectionData.enrollments || [],
            total_subjects: sectionData.total_subjects || sectionData.enrollments?.length || 0,
            completed_count: sectionData.completed_count || 0,
            best_grade: sectionData.best_grade || 0,
            average_grade: sectionData.average_grade || 0
        })).sort((a, b) => a.section?.section_name?.localeCompare(b.section?.section_name));
    }, [sections]);

    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const getGradeColor = (grade) => {
        if (!grade || grade === 0) return 'text-gray-500';
        if (grade >= 90) return 'text-green-600';
        if (grade >= 80) return 'text-blue-600';
        if (grade >= 75) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getEducationLevelBadge = (educationLevel) => {
        const levels = {
            'college': { label: 'College', variant: 'default' },
            'senior_high': { label: 'SHS', variant: 'secondary' },
            'associate': { label: 'Associate', variant: 'outline' }
        };

        const level = levels[educationLevel] || { label: educationLevel, variant: 'outline' };
        return (
            <Badge variant={level.variant} className="text-xs">
                {level.label}
            </Badge>
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="mr-2">
                            <Link href={route('student.archived-grades')}>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {academic_year} - {getSemesterDisplay(semester)}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">View sections and grades for this academic period</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${academic_year} - ${getSemesterDisplay(semester)} Grades`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {sectionsData.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Sections Found
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No archived sections found for this academic period.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {sectionsData.map((sectionData) => (
                                <Card key={sectionData.section?.id || sectionData.section?.section_name}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                        <Building className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {sectionData.section?.program?.program_code || 'N/A'} - {sectionData.section?.year_level}{sectionData.section?.section_name || 'Unknown'}
                                                        </div>
                                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                            {sectionData.section?.program?.program_name || 'Unknown Program'}
                                                        </div>
                                                    </div>
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Education Level */}
                                        <div className="flex items-center gap-2">
                                            {getEducationLevelBadge(sectionData.section?.program?.education_level)}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Subjects</span>
                                                </div>
                                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                                    {sectionData.enrollments.length}
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <GraduationCap className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Completed</span>
                                                </div>
                                                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                    {sectionData.completed_count}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Average Grade */}
                                        {sectionData.average_grade > 0 && (
                                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Average Grade</span>
                                                    </div>
                                                    <div className={`text-lg font-bold ${getGradeColor(sectionData.average_grade)}`}>
                                                        {sectionData.average_grade.toFixed(1)}%
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Action Button */}
                                        <Link
                                            href={route('student.archived-grades.section', {
                                                section: sectionData.section?.id,
                                                academic_year: academic_year,
                                                semester: semester
                                            })}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <Eye className="h-4 w-4" />
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

export default Show;