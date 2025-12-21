import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Award,
    BookOpen,
    ArrowRight,
    GraduationCap,
    Target,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    Star,
    BarChart3,
    Archive
} from 'lucide-react';

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'N/A';
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

// Helper function to display grade safely
const displayGrade = (grade) => {
    return (grade !== null && grade !== undefined && !isNaN(grade) && grade > 0) ? grade : '—';
};

// Helper function to check if grade is valid for color indicators
const isValidGrade = (grade) => {
    return grade !== null && grade !== undefined && !isNaN(grade) && grade > 0;
};

// Helper function to get grade status
const getGradeStatus = (grade) => {
    if (!grade || isNaN(grade)) return 'No grade';
    if (grade >= 90) return 'Excellent'
    if (grade >= 80) return 'Very Good'
    if (grade >= 75) return 'Good'
    return 'Needs Improvement'
}

// Helper function to get semester display
const getSemesterDisplay = (semester) => {
    const semesters = {
        'first': 'First Semester',
        'second': 'Second Semester',
        'summer': 'Summer'
    };
    return semesters[semester] || semester;
};

// Helper function to get status color
const getStatusColor = (status) => {
    switch (status) {
        case 'completed': return 'bg-green-100 text-green-800 border-green-200';
        case 'dropped': return 'bg-red-100 text-red-800 border-red-200';
        case 'failed': return 'bg-red-100 text-red-800 border-red-200';
        case 'incomplete': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const Index = ({ archivedEnrollments }) => {
    // Calculate statistics
    const totalEnrollments = archivedEnrollments?.data?.length || 0;
    const completedEnrollments = archivedEnrollments?.data?.filter(e => e.final_status === 'completed') || [];
    const averageGrade = completedEnrollments.length > 0
        ? completedEnrollments.reduce((sum, e) => sum + (e.final_semester_grade || 0), 0) / completedEnrollments.length
        : 0;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">My Archived Grades</h2>
                        <p className="text-sm text-blue-600 font-medium mt-1">
                            View your completed academic records
                        </p>
                    </div>
                    <div className="flex items-center gap-3 mt-4 sm:mt-0">
                        <Button asChild variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                            <Link href={route('student.grades')}>
                                <BarChart3 className="w-4 h-4 mr-2" />
                                Current Grades
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                            <Link href={route('student.subjects')}>
                                <BookOpen className="w-4 h-4 mr-2" />
                                My Subjects
                            </Link>
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="Archived Grades" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Enrollments</p>
                                        <p className="text-3xl font-bold text-blue-600">{totalEnrollments}</p>
                                        <p className="text-xs text-gray-500 mt-1">Archived records</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <Archive className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Average Grade</p>
                                        <p className={`text-3xl font-bold ${getGradeColor(averageGrade)}`}>
                                            {averageGrade ? `${averageGrade.toFixed(1)}%` : 'N/A'}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {getGradeStatus(averageGrade)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <Award className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Completed</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {completedEnrollments.length}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Successfully finished</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <CheckCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Academic Years</p>
                                        <p className="text-3xl font-bold text-orange-600">
                                            {new Set(archivedEnrollments?.data?.map(e => e.academic_year)).size || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Years of study</p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <Calendar className="w-6 h-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Archived Grades Section */}
                    <Card className="shadow-sm">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Archive className="w-5 h-5 text-blue-600" />
                                        Archived Academic Records
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Complete history of your academic performance across all semesters
                                    </CardDescription>
                                </div>
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                    {totalEnrollments} Records
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {archivedEnrollments && archivedEnrollments.data && archivedEnrollments.data.length > 0 ? (
                                <div className="space-y-6">
                                    {/* Group by academic year */}
                                    {(() => {
                                        const groupedByYear = {};
                                        archivedEnrollments.data.forEach(enrollment => {
                                            if (!groupedByYear[enrollment.academic_year]) {
                                                groupedByYear[enrollment.academic_year] = [];
                                            }
                                            groupedByYear[enrollment.academic_year].push(enrollment);
                                        });

                                        return Object.keys(groupedByYear).sort().reverse().map(year => (
                                            <div key={year} className="space-y-4">
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-semibold text-gray-900">Academic Year {year}</h3>
                                                    <Badge variant="outline" className="bg-gray-50">
                                                        {groupedByYear[year].length} Enrollments
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {groupedByYear[year].map((enrollment, index) => {
                                                        const finalGrade = enrollment.final_semester_grade ? parseFloat(enrollment.final_semester_grade) : null;
                                                        const grades = enrollment.final_grades || {};

                                                        return (
                                                            <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                                                                <CardHeader className="pb-3">
                                                                    <div className="flex items-start justify-between">
                                                                        <div className="flex-1">
                                                                            <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                                                                                {formatSectionName(enrollment.archived_section)}
                                                                            </CardTitle>
                                                                            <CardDescription className="text-sm text-gray-600 mt-1">
                                                                                {getSemesterDisplay(enrollment.semester)} • {enrollment.academic_year}
                                                                            </CardDescription>
                                                                        </div>
                                                                        <div className={`p-2 rounded-full ${
                                                                            finalGrade >= 90 ? 'bg-green-100' :
                                                                            finalGrade >= 80 ? 'bg-blue-100' :
                                                                            finalGrade >= 75 ? 'bg-yellow-100' :
                                                                            finalGrade ? 'bg-red-100' : 'bg-gray-100'
                                                                        }`}>
                                                                            <span className={`text-sm font-bold ${
                                                                                finalGrade >= 90 ? 'text-green-600' :
                                                                                finalGrade >= 80 ? 'text-blue-600' :
                                                                                finalGrade >= 75 ? 'text-yellow-600' :
                                                                                finalGrade ? 'text-red-600' : 'text-gray-400'
                                                                            }`}>
                                                                                {finalGrade ? finalGrade.toFixed(1) : '—'}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </CardHeader>
                                                                <CardContent className="pt-0">
                                                                    <div className="space-y-3">
                                                                        {/* Status Badge */}
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm font-medium text-gray-700">Status</span>
                                                                            <Badge className={getStatusColor(enrollment.final_status)}>
                                                                                {enrollment.final_status?.charAt(0).toUpperCase() + enrollment.final_status?.slice(1)}
                                                                            </Badge>
                                                                        </div>

                                                                        {/* Grade Breakdown */}
                                                                        {grades && Object.keys(grades).length > 0 && (
                                                                            <div className="space-y-2">
                                                                                <h4 className="text-sm font-medium text-gray-700">Grade Breakdown</h4>
                                                                                {Object.entries(grades).map(([period, grade]) => {
                                                                                    const gradeValue = parseFloat(grade);
                                                                                    return (
                                                                                        <div key={period} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <div className={`w-2 h-2 rounded-full ${
                                                                                                    period.toLowerCase().includes('prelim') ? 'bg-blue-500' :
                                                                                                    period.toLowerCase().includes('midterm') ? 'bg-purple-500' :
                                                                                                    period.toLowerCase().includes('prefinal') ? 'bg-orange-500' :
                                                                                                    period.toLowerCase().includes('final') ? 'bg-red-500' : 'bg-gray-500'
                                                                                                }`}></div>
                                                                                                <span className="text-sm font-medium text-gray-700 capitalize">
                                                                                                    {period.replace('_', ' ')}
                                                                                                </span>
                                                                                            </div>
                                                                                            <span className={`text-sm font-bold ${getGradeColor(gradeValue)}`}>
                                                                                                {displayGrade(gradeValue)}
                                                                                            </span>
                                                                                        </div>
                                                                                    );
                                                                                })}
                                                                            </div>
                                                                        )}

                                                                        {/* Letter Grade */}
                                                                        {enrollment.letter_grade && (
                                                                            <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                                                                                <span className="text-sm font-medium text-blue-700">Letter Grade</span>
                                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                                                    {enrollment.letter_grade}
                                                                                </Badge>
                                                                            </div>
                                                                        )}

                                                                        {/* Dates */}
                                                                        <div className="text-xs text-gray-500 space-y-1">
                                                                            <div>Enrolled: {new Date(enrollment.enrolled_date).toLocaleDateString()}</div>
                                                                            {enrollment.completion_date && (
                                                                                <div>Completed: {new Date(enrollment.completion_date).toLocaleDateString()}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </CardContent>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ));
                                    })()}

                                    {/* Pagination */}
                                    {archivedEnrollments.links && archivedEnrollments.links.length > 3 && (
                                        <div className="mt-6 flex justify-center">
                                            <div className="flex space-x-1">
                                                {archivedEnrollments.links.map((link, index) => (
                                                    link.url ? (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                                                                link.active
                                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-300'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            key={index}
                                                            className="px-4 py-2 text-sm border rounded-lg bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                        <Archive className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Archived Grades</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                        You don't have any archived academic records yet.
                                        Completed enrollments will appear here once they are archived.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Button asChild variant="outline">
                                            <Link href={route('student.grades')}>
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                View Current Grades
                                            </Link>
                                        </Button>
                                        <Button asChild className="bg-blue-600 hover:bg-blue-700">
                                            <Link href={route('student.dashboard')}>
                                                <ArrowRight className="w-4 h-4 mr-2" />
                                                Back to Dashboard
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;