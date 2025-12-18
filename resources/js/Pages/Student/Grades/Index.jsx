import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, BookOpen, Award, ArrowRight } from 'lucide-react';

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'N/A';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'N/A';
};

// Helper function to get grade color
const getGradeColor = (grade) => {
    if (!grade) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 75) return 'text-yellow-600'
    return 'text-red-600'
}

// Helper function to get grade status
const getGradeStatus = (grade) => {
    if (!grade) return 'No grade yet';
    if (grade >= 90) return 'Excellent'
    if (grade >= 80) return 'Very Good'
    if (grade >= 75) return 'Good'
    return 'Needs Improvement'
}

const Index = ({ currentGrades, recentGrades, stats }) => {
    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-lg">
                            <TrendingUp className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">My Grades</h2>
                            <p className="text-gray-600 mt-1">View your current academic performance</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            <Link href={route('student.subjects')}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                My Subjects
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                            <Link href={route('student.archived-grades')}>
                                <Award className="w-4 h-4 mr-2" />
                                Past Grades
                            </Link>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="My Grades" />

            <div className="space-y-8">
                {/* Grade Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                                    <p className="text-2xl font-bold text-blue-600">{stats.totalSubjects}</p>
                                </div>
                                <div className="p-3 bg-blue-100 rounded-full">
                                    <BookOpen className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Average Grade</p>
                                    <p className={`text-2xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                                        {stats.averageGrade ? `${stats.averageGrade.toFixed(1)}%` : 'No grades yet'}
                                    </p>
                                </div>
                                <div className="p-3 bg-green-100 rounded-full">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">Grade Status</p>
                                    <p className="text-lg font-bold text-purple-600">
                                        {getGradeStatus(stats.averageGrade)}
                                    </p>
                                </div>
                                <div className="p-3 bg-purple-100 rounded-full">
                                    <Award className="w-6 h-6 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Grades */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            Recent Grades
                        </CardTitle>
                        <CardDescription>
                            Your latest grade entries and performance
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {recentGrades && recentGrades.length > 0 ? (
                            <div className="grid gap-4">
                                {recentGrades.map((grade, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2 rounded-lg ${
                                                getGradeColor(grade.semester_grade || grade.prelim_grade).includes('green') ? 'bg-green-100' :
                                                getGradeColor(grade.semester_grade || grade.prelim_grade).includes('blue') ? 'bg-blue-100' :
                                                getGradeColor(grade.semester_grade || grade.prelim_grade).includes('yellow') ? 'bg-yellow-100' : 'bg-red-100'
                                            }`}>
                                                <Award className={`w-5 h-5 ${
                                                    getGradeColor(grade.semester_grade || grade.prelim_grade).includes('green') ? 'text-green-600' :
                                                    getGradeColor(grade.semester_grade || grade.prelim_grade).includes('blue') ? 'text-blue-600' :
                                                    getGradeColor(grade.semester_grade || grade.prelim_grade).includes('yellow') ? 'text-yellow-600' : 'text-red-600'
                                                }`} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-gray-900">
                                                    {formatSectionName(grade.student_enrollment?.section)}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    {grade.grading_period} - {grade.semester_grade ? 'Final Grade' : 'Partial Grade'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`text-2xl font-bold ${getGradeColor(grade.semester_grade || grade.prelim_grade)}`}>
                                                {grade.semester_grade || grade.prelim_grade || 'N/A'}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {getGradeStatus(grade.semester_grade || grade.prelim_grade)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <TrendingUp className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Available</h3>
                                <p className="text-gray-500 mb-4">Your grades will appear here once they are posted by your instructors.</p>
                                <Button asChild>
                                    <Link href={route('student.subjects')}>
                                        View My Subjects
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* All Current Grades */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                            All Current Grades
                        </CardTitle>
                        <CardDescription>
                            Complete list of your current semester grades
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {currentGrades && currentGrades.data && currentGrades.data.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Subject
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Grading Period
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Date Posted
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {currentGrades.data.map((grade) => (
                                            <tr key={grade.id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatSectionName(grade.student_enrollment?.section)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {grade.grading_period}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <span className={`font-semibold ${getGradeColor(grade.semester_grade || grade.prelim_grade)}`}>
                                                        {grade.semester_grade || grade.prelim_grade || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    <Badge variant={
                                                        grade.semester_grade ? 'default' :
                                                        grade.prelim_grade ? 'secondary' : 'outline'
                                                    }>
                                                        {grade.semester_grade ? 'Final' : grade.prelim_grade ? 'Partial' : 'Pending'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                                    {new Date(grade.created_at).toLocaleDateString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {currentGrades.links && currentGrades.links.length > 3 && (
                                    <div className="mt-4 flex justify-center">
                                        <div className="flex space-x-1">
                                            {currentGrades.links.map((link, index) => (
                                                link.url ? (
                                                    <Link
                                                        key={index}
                                                        href={link.url}
                                                        className={`px-3 py-2 text-sm border rounded ${
                                                            link.active
                                                                ? 'bg-blue-500 text-white border-blue-500'
                                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                ) : (
                                                    <span
                                                        key={index}
                                                        className="px-3 py-2 text-sm border rounded bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    <BookOpen className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Current Grades</h3>
                                <p className="text-gray-500">You don't have any grades posted for your current subjects yet.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;