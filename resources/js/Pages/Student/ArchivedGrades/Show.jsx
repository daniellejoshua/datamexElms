import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Archive, ArrowLeft } from 'lucide-react';

const Show = ({ subjects, academic_year, semester }) => {
    const { auth } = usePage().props;

    const allEnrollments = React.useMemo(() => {
        return Array.isArray(subjects) ? subjects : [];
    }, [subjects]);

    const getSemesterDisplay = (s) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer',
        };
        return semesters[s] || s;
    };

    const displayGrade = (grade) => {
        const num = Number(grade);
        return (!isNaN(num) && num > 0) ? num.toFixed(1) : '—';
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
                            <p className="text-xs text-gray-500 mt-0.5">
                                View grades for this academic period
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${academic_year} - ${getSemesterDisplay(semester)} Grades`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {allEnrollments.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Grades Found
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No archived grades found for this academic period.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject Code</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prelim</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Midterm</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prefinal</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Final</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Semester</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {allEnrollments.map((enr, idx) => (
                                    <tr key={enr.id || idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-900">{enr.subject_code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{enr.subject_name}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{enr.section?.section_name || ''}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.prelim)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.midterm)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.prefinals)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_grades?.finals)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{displayGrade(enr.final_semester_grade)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Show;
