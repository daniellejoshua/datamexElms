import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Archive, Calendar, Users, BookOpen, Eye, GraduationCap, Building } from 'lucide-react';

const Index = ({ archivedSectionGroups }) => {
    const { auth } = usePage().props;
    const teacherId = auth.user.teacher?.id;

    // Ensure archivedSectionGroups exists and has the expected structure
    const safeArchivedSectionGroups = archivedSectionGroups || {};
    const groups = safeArchivedSectionGroups.data || [];
    const links = safeArchivedSectionGroups.links || [];

    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
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
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Archived Sections</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View past semester grades and student performance by academic period</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Archived Sections" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {groups.length === 0 ? (
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
                            {groups.map((group) => (
                                <Card key={`${group.academic_year}-${group.semester}`} className="border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-xl flex items-center gap-3">
                                                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                        <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {group.academic_year}
                                                        </div>
                                                        <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                            {getSemesterDisplay(group.semester)}
                                                        </div>
                                                    </div>
                                                </CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Education Levels */}
                                        <div className="flex flex-wrap gap-2">
                                            {Object.entries(group.education_levels).map(([level, count]) => (
                                                <div key={level} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-full">
                                                    {getEducationLevelBadge(level)}
                                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                                        {count} sections
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Stats Grid */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Sections</span>
                                                </div>
                                                <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                                    {group.total_sections}
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                    <span className="text-xs font-medium text-green-700 dark:text-green-300">Students</span>
                                                </div>
                                                <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                    {group.total_students}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Completion Status */}
                                        <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-lg">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                    <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</span>
                                                </div>
                                                <div className="text-lg font-bold text-emerald-900 dark:text-emerald-100">
                                                    {group.total_completed}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Button */}
                                        <Link
                                            href={`/teacher/archived-sections/period?academic_year=${group.academic_year}&semester=${group.semester}`}
                                            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                        >
                                            <Eye className="h-4 w-4" />
                                            View Sections
                                        </Link>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Pagination */}
                    {links && links.length > 3 && (
                        <div className="mt-6 flex items-center justify-center gap-2">
                            {links.map((link, index) => (
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