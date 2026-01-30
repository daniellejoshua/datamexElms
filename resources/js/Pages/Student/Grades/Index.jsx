import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
    TrendingUp,
    BookOpen,
    Award,
    ArrowRight,
    ArrowLeft,
    GraduationCap,
    Target,
    Calendar,
    CheckCircle,
    AlertCircle,
    Clock,
    Star,
    BarChart3
} from 'lucide-react';

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

// Helper function to display grade safely
const displayGrade = (grade) => {
    return (grade !== null && grade !== undefined && !isNaN(grade) && grade > 0) ? grade : '—';
};

// Helper function to check if grade is valid for color indicators
const isValidGrade = (grade) => {
    return grade !== null && grade !== undefined && !isNaN(grade) && grade > 0;
};

// Helper function to get grade point equivalence
const getGradePointEquivalence = (grade) => {
    if (!grade || grade === '—' || isNaN(grade)) return '—';
    const num = parseFloat(grade);
    if (num >= 96) return '1.00';
    if (num >= 94) return '1.25';
    if (num >= 91) return '1.50';
    if (num >= 88) return '1.75';
    if (num >= 85) return '2.00';
    if (num >= 83) return '2.25';
    if (num >= 80) return '2.50';
    if (num >= 78) return '2.75';
    if (num >= 75) return '3.00';
    if (num < 75) return '5.00';
    return '—';
};

// Helper function to get grade status
const getGradeStatus = (grade) => {
    if (!grade || isNaN(grade)) return 'No grade';
    if (grade >= 90) return 'Excellent'
    if (grade >= 80) return 'Very Good'
    if (grade >= 75) return 'Good'
    return 'Needs Improvement'
}

const Index = ({ auth, student, currentGrades, stats }) => {
    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.visit(route('student.dashboard'))}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">My Grades</h2>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My Grades" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Welcome Section with Student Info */}
                    {student && (
                        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className="bg-blue-100 p-3 rounded-full">
                                        <GraduationCap className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            Welcome back, {student.user?.first_name || student.user?.name}!
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Student ID: {student.student_number || 'N/A'} • {student.program?.program_name || 'Program N/A'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-blue-600">
                                            {stats.averageGrade ? `${stats.averageGrade.toFixed(1)}%` : 'No grades yet'}
                                        </div>
                                        <div className="text-sm text-gray-500">Current Average</div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Grade Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-6">
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow mx-2 md:mx-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                                        <p className="text-3xl font-bold text-blue-600">{stats.totalSubjects || 0}</p>
                                        <p className="text-xs text-gray-500 mt-1">Enrolled this semester</p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <BookOpen className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow mx-2 md:mx-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Average Grade</p>
                                        {stats.averageGrade ? (
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`text-4xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                                                        {getGradePointEquivalence(stats.averageGrade)}
                                                    </div>
                                                    <div className="flex flex-col items-center">
                                                        <div className={`text-lg font-semibold ${getGradeColor(stats.averageGrade)}`}>
                                                            {stats.averageGrade.toFixed(1)}%
                                                        </div>
                                                        <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full transition-all duration-500 ${
                                                                    stats.averageGrade >= 90 ? 'bg-green-500' :
                                                                    stats.averageGrade >= 80 ? 'bg-blue-500' :
                                                                    stats.averageGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                }`}
                                                                style={{ width: `${Math.min(stats.averageGrade, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className={`${
                                                        stats.averageGrade >= 90 ? 'bg-green-100 text-green-800 border-green-300' :
                                                        stats.averageGrade >= 80 ? 'bg-blue-100 text-blue-800 border-blue-300' :
                                                        stats.averageGrade >= 75 ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                                        'bg-red-100 text-red-800 border-red-300'
                                                    } font-medium px-3 py-1`}>
                                                        {getGradeStatus(stats.averageGrade)}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-start gap-2">
                                                <div className="text-4xl font-bold text-gray-400">—</div>
                                                <Badge variant="secondary" className="bg-gray-100 text-gray-600 border-gray-300 font-medium px-3 py-1">
                                                    No grades yet
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <TrendingUp className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow mx-2 md:mx-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Graded Subjects</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {stats.gradedSubjects || 0}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">With posted grades</p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <CheckCircle className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow mx-2 md:mx-0">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Grade Status</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className={`w-3 h-3 rounded-full ${
                                                stats.averageGrade >= 90 ? 'bg-green-500' :
                                                stats.averageGrade >= 80 ? 'bg-blue-500' :
                                                stats.averageGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}></div>
                                            <span className="text-sm font-medium text-gray-900">
                                                {getGradeStatus(stats.averageGrade)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Overall performance
                                        </p>
                                    </div>
                                    <div className="p-3 bg-orange-100 rounded-full">
                                        <Target className="w-6 h-6 text-orange-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* All Current Grades Section */}
                    <Card className="shadow-sm mx-2 md:mx-0">
                        <CardHeader className="pb-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <BookOpen className="w-5 h-5 text-green-600" />
                                        All Current Grades
                                    </CardTitle>
                                    <CardDescription className="mt-1">
                                        Complete overview of your current semester performance
                                    </CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        {stats.totalSubjects || 0} Subjects
                                    </Badge>
                                    {stats.averageGrade && (
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                                            Avg: {stats.averageGrade.toFixed(1)}%
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {currentGrades && currentGrades.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Summary Cards for Mobile */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:hidden">
                                        <Card className="bg-blue-50 border-blue-200">
                                            <CardContent className="p-4 text-center">
                                                <div className="text-2xl font-bold text-blue-600">{stats.totalSubjects || 0}</div>
                                                <div className="text-sm text-blue-700">Total Subjects</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-green-50 border-green-200">
                                            <CardContent className="p-4 text-center">
                                                <div className={`text-2xl font-bold ${getGradeColor(stats.averageGrade)}`}>
                                                    {stats.averageGrade ? `${stats.averageGrade.toFixed(1)}%` : 'N/A'}
                                                </div>
                                                <div className="text-sm text-green-700">Average Grade</div>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-purple-50 border-purple-200">
                                            <CardContent className="p-4 text-center">
                                                <div className="text-2xl font-bold text-purple-600">{stats.gradedSubjects || 0}</div>
                                                <div className="text-sm text-purple-700">Graded</div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Grades Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(() => {
                                            // Group grades by subject
                                            const gradesBySubject = {};
                                            currentGrades.forEach(grade => {
                                                const subjectId = grade.sectionSubject?.subject?.id;
                                                if (subjectId && !gradesBySubject[subjectId]) {
                                                    gradesBySubject[subjectId] = {
                                                        subject: grade.sectionSubject?.subject,
                                                        section: grade.studentEnrollment?.section,
                                                        grades: []
                                                    };
                                                }
                                                if (subjectId) {
                                                    gradesBySubject[subjectId].grades.push(grade);
                                                }
                                            });

                                            return Object.values(gradesBySubject).map((subjectData, index) => {
                                                const { subject, section, grades } = subjectData;

                                                // Find grades for each period - each subject has one grade record with all periods
                                                const grade = grades[0]; // There should be one grade record per subject
                                                const isSHS = section?.year_level >= 11 && section?.year_level <= 12;
                                                
                                                let prelimGrade = null, midtermGrade = null, prefinalGrade = null, finalGrade = null, semesterGrade = null;
                                                let q1Grade = null, q2Grade = null, shsFinalGrade = null;
                                                
                                                if (isSHS) {
                                                    q1Grade = grade?.q1_grade ? parseFloat(grade.q1_grade) : null;
                                                    q2Grade = grade?.q2_grade ? parseFloat(grade.q2_grade) : null;
                                                    // Calculate SHS final grade as average of Q1 and Q2
                                                    shsFinalGrade = (q1Grade !== null && q2Grade !== null) ? ((q1Grade + q2Grade) / 2) : 
                                                                   (q1Grade !== null ? q1Grade : (q2Grade !== null ? q2Grade : null));
                                                } else {
                                                    prelimGrade = grade?.prelim_grade ? parseFloat(grade.prelim_grade) : null;
                                                    midtermGrade = grade?.midterm_grade ? parseFloat(grade.midterm_grade) : null;
                                                    prefinalGrade = grade?.prefinal_grade ? parseFloat(grade.prefinal_grade) : null;
                                                    finalGrade = grade?.final_grade ? parseFloat(grade.final_grade) : null;
                                                    semesterGrade = grade?.semester_grade ? parseFloat(grade.semester_grade) : null;
                                                }

                                                // Filter out invalid grades (NaN, null, undefined)
                                                const validGrades = isSHS 
                                                    ? [q1Grade, q2Grade, shsFinalGrade].filter(g => g !== null && g !== undefined && !isNaN(g) && g > 0)
                                                    : [prelimGrade, midtermGrade, prefinalGrade, finalGrade, semesterGrade].filter(g => g !== null && g !== undefined && !isNaN(g) && g > 0);

                                                // Calculate average grade for card color
                                                const averageGrade = validGrades.length > 0 ? validGrades.reduce((a, b) => a + b, 0) / validGrades.length : null;

                                                return (
                                                    <Card key={index} className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
                                                        <CardHeader className="pb-3">
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <CardTitle className="text-lg font-bold text-gray-900 leading-tight">
                                                                        {subject?.subject_name || 'Subject Name'}
                                                                    </CardTitle>
                                                                    <CardDescription className="text-sm text-gray-600 mt-1">
                                                                        {subject?.subject_code || 'N/A'} • {formatSectionName(section)}
                                                                    </CardDescription>
                                                                </div>
                                                                <div className={`p-2 rounded-full ${
                                                                    averageGrade >= 90 ? 'bg-green-100' :
                                                                    averageGrade >= 80 ? 'bg-blue-100' :
                                                                    averageGrade >= 75 ? 'bg-yellow-100' :
                                                                    averageGrade ? 'bg-red-100' : 'bg-gray-100'
                                                                }`}>
                                                                    <span className={`text-sm font-bold ${
                                                                        averageGrade >= 90 ? 'text-green-600' :
                                                                        averageGrade >= 80 ? 'text-blue-600' :
                                                                        averageGrade >= 75 ? 'text-yellow-600' :
                                                                        averageGrade ? 'text-red-600' : 'text-gray-400'
                                                                    }`}>
                                                                        {averageGrade ? getGradePointEquivalence(averageGrade) : '—'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            <div className="space-y-3">
                                                                {isSHS ? (
                                                                    <>
                                                                        {/* Q1 Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-blue-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-blue-900">1st Quarter</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(q1Grade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(q1Grade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(q1Grade)}`}>
                                                                                                    {displayGrade(q1Grade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-blue-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        q1Grade >= 90 ? 'bg-green-500' :
                                                                                                        q1Grade >= 80 ? 'bg-blue-500' :
                                                                                                        q1Grade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(q1Grade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Q2 Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-purple-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-purple-900">2nd Quarter</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(q2Grade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(q2Grade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(q2Grade)}`}>
                                                                                                    {displayGrade(q2Grade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-purple-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        q2Grade >= 90 ? 'bg-green-500' :
                                                                                                        q2Grade >= 80 ? 'bg-blue-500' :
                                                                                                        q2Grade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(q2Grade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        {/* Prelim Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-emerald-900">Prelim</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(prelimGrade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-emerald-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(prelimGrade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(prelimGrade)}`}>
                                                                                                    {displayGrade(prelimGrade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-emerald-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        prelimGrade >= 90 ? 'bg-green-500' :
                                                                                                        prelimGrade >= 80 ? 'bg-blue-500' :
                                                                                                        prelimGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(prelimGrade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Midterm Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-amber-100 rounded-xl border border-amber-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-amber-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-amber-900">Midterm</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(midtermGrade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(midtermGrade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(midtermGrade)}`}>
                                                                                                    {displayGrade(midtermGrade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-amber-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        midtermGrade >= 90 ? 'bg-green-500' :
                                                                                                        midtermGrade >= 80 ? 'bg-blue-500' :
                                                                                                        midtermGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(midtermGrade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Pre-finals Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-orange-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-orange-900">Pre-finals</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(prefinalGrade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(prefinalGrade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(prefinalGrade)}`}>
                                                                                                    {displayGrade(prefinalGrade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-orange-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        prefinalGrade >= 90 ? 'bg-green-500' :
                                                                                                        prefinalGrade >= 80 ? 'bg-blue-500' :
                                                                                                        prefinalGrade >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(prefinalGrade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Finals Grade */}
                                                                        <div className="relative">
                                                                            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl border border-red-200">
                                                                                <div className="flex items-center gap-3">
                                                                                    <div className="w-3 h-3 bg-red-500 rounded-full shadow-sm"></div>
                                                                                    <div>
                                                                                        <span className="text-sm font-semibold text-red-900">Finals</span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="text-right">
                                                                                    {isValidGrade(finalGrade || semesterGrade) ? (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <div className="flex items-center gap-2">
                                                                                                <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 font-bold px-2 py-1">
                                                                                                    {getGradePointEquivalence(finalGrade || semesterGrade)}
                                                                                                </Badge>
                                                                                                <span className={`text-xl font-bold ${getGradeColor(finalGrade || semesterGrade)}`}>
                                                                                                    {displayGrade(finalGrade || semesterGrade)}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="w-16 h-1.5 bg-red-200 rounded-full overflow-hidden">
                                                                                                <div
                                                                                                    className={`h-full rounded-full transition-all duration-500 ${
                                                                                                        (finalGrade || semesterGrade) >= 90 ? 'bg-green-500' :
                                                                                                        (finalGrade || semesterGrade) >= 80 ? 'bg-blue-500' :
                                                                                                        (finalGrade || semesterGrade) >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                                                                                                    }`}
                                                                                                    style={{ width: `${Math.min(finalGrade || semesterGrade, 100)}%` }}
                                                                                                ></div>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="flex flex-col items-end gap-1">
                                                                                            <span className="text-xl font-bold text-gray-400">—</span>
                                                                                            <div className="w-16 h-1.5 bg-gray-200 rounded-full"></div>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>

                                                        </CardContent>
                                                    </Card>
                                                );
                                            });
                                        })()}
                                    </div>

                                    {/* Pagination - Removed for now */}
                                    {/* {currentGrades.links && currentGrades.links.length > 3 && (
                                        <div className="mt-6 flex justify-center">
                                            <div className="flex space-x-1">
                                                {currentGrades.links.map((link, index) => (
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
                                    )} */}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="p-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                                        <BookOpen className="w-12 h-12 text-gray-400" />
                                    </div>
                                    <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Current Grades</h3>
                                    <p className="text-gray-500 mb-8 max-w-md mx-auto leading-relaxed">
                                        You don't have any grades posted for your current subjects yet.
                                        Grades will appear here once your instructors post them.
                                    </p>
                                    <div className="flex gap-4 justify-center">
                                        <Button asChild variant="outline">
                                            <Link href={route('student.subjects')}>
                                                <BookOpen className="w-4 h-4 mr-2" />
                                                View My Subjects
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