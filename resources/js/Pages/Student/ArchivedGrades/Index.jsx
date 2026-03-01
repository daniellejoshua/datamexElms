import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Archive, Calendar, BookOpen, Eye, GraduationCap, Building, Award, Target, TrendingUp, Users, ArrowRight } from 'lucide-react';

const Index = ({ archivedEnrollments }) => {
    const { auth } = usePage().props;

    // Group enrollments by academic year and semester
    const academicPeriods = React.useMemo(() => {
        if (!archivedEnrollments) return [];

        const data = archivedEnrollments.data || archivedEnrollments;
        if (!Array.isArray(data)) return [];

        // Group by academic year + semester
        const grouped = {};
        data.forEach(enrollment => {
            const key = `${enrollment.academic_year}-${enrollment.semester}`;
            if (!grouped[key]) {
                grouped[key] = {
                    academic_year: enrollment.academic_year,
                    semester: enrollment.semester,
                    sections: new Set(),
                    total_subjects: 0,
                    completed_subjects: 0,
                    best_grade: 0,
                    enrollments: []
                };
            }

            grouped[key].sections.add(enrollment.archived_section_id);
            // Use the total subjects offered in all sections for this period
            if (grouped[key].total_subjects === 0) {
                grouped[key].total_subjects = enrollment.period_total_subjects || 0;
            }
            grouped[key].enrollments.push(enrollment);

            if (enrollment.final_status === 'completed') {
                grouped[key].completed_subjects++;
            }

            if (enrollment.final_semester_grade && parseFloat(enrollment.final_semester_grade) > grouped[key].best_grade) {
                grouped[key].best_grade = parseFloat(enrollment.final_semester_grade);
            }
        });

        // Convert to array and sort
        return Object.values(grouped).map(period => ({
            ...period,
            section_count: period.sections.size
        })).sort((a, b) => {
            // Sort by academic year desc, then semester desc
            if (a.academic_year !== b.academic_year) {
                return b.academic_year.localeCompare(a.academic_year);
            }
            const semesterOrder = { 'second': 3, 'first': 2, 'summer': 1 };
            return (semesterOrder[b.semester] || 0) - (semesterOrder[a.semester] || 0);
        });
    }, [archivedEnrollments]);

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

    const getGradeStatus = (grade) => {
        if (!grade || isNaN(grade)) return 'No grade';
        if (grade >= 90) return 'Excellent';
        if (grade >= 80) return 'Very Good';
        if (grade >= 75) return 'Good';
        return 'Needs Improvement';
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-2">
                    <div className="bg-blue-100 p-1.5 rounded-md">
                        <Archive className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">My Archived Grades</h2>
                        <p className="text-xs text-gray-500 mt-0.5">View all your past semester grades and academic performance</p>
                    </div>
                </div>
            }
        >
            <Head title="Archived Grades" />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {academicPeriods.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Archived Grades
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    Your archived grades will appear here when semesters are completed.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-6">
                            <div className="text-center mb-8">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                                    Academic Periods
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Click on any period to view detailed grades by section
                                </p>
                            </div>

                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {academicPeriods.map((period) => (
                                    <Card key={`${period.academic_year}-${period.semester}`} className="hover:shadow-lg transition-shadow duration-200">
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-xl flex items-center gap-3 mb-2">
                                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                                {period.academic_year}
                                                            </div>
                                                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                                                                {getSemesterDisplay(period.semester)}
                                                            </div>
                                                        </div>
                                                    </CardTitle>
                                                </div>
                                                {period.best_grade > 0 && (
                                                    <div className="text-right">
                                                        <div className="text-sm text-gray-500 mb-1">Best Grade</div>
                                                        <div className={`text-xl font-bold ${getGradeColor(period.best_grade)}`}>
                                                            {period.best_grade}%
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {/* Stats Grid */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                        <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Sections</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                                                        {period.section_count}
                                                    </div>
                                                </div>

                                                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-3 rounded-lg">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <BookOpen className="h-4 w-4 text-green-600 dark:text-green-400" />
                                                        <span className="text-xs font-medium text-green-700 dark:text-green-300">Subjects</span>
                                                    </div>
                                                    <div className="text-lg font-bold text-green-900 dark:text-green-100">
                                                        {period.total_subjects}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Completion Rate */}
                                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Completed</span>
                                                    </div>
                                                    <div className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                                                        {period.completed_subjects}/{period.total_subjects}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Button */}
                                            <Link
                                                href={route('student.archived-grades.period', {
                                                    academic_year: period.academic_year,
                                                    semester: period.semester
                                                })}
                                                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                            >
                                                <Eye className="h-4 w-4" />
                                                View Sections
                                                <ArrowRight className="h-4 w-4" />
                                            </Link>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;