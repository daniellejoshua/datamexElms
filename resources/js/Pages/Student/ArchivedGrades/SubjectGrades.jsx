import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Archive, Calendar, Users, BookOpen, Eye, GraduationCap, Building, ArrowLeft, BarChart3, Award, Target, TrendingUp } from 'lucide-react';

const SubjectGrades = ({ archivedEnrollments, section, academic_year, semester }) => {
    const { auth } = usePage().props;

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

    // Process archivedEnrollments data
    const subjectsData = React.useMemo(() => {
        if (!archivedEnrollments) return [];
        
        const data = Array.isArray(archivedEnrollments) ? archivedEnrollments : [];
        if (!Array.isArray(data)) return [];

        return data.map((subject, index) => ({
            id: subject.id || `subject-${index}`,
            subject_code: subject.subject_code || 'N/A',
            subject_name: subject.subject_name || 'Unknown Subject',
            credits: subject.credits || 0,
            teacher_name: subject.teacher_name || 'N/A',
            final_grades: subject.final_grades || [],
            final_semester_grade: subject.final_semester_grade !== null && subject.final_semester_grade !== undefined ? Number(subject.final_semester_grade) : null,
            final_status: subject.final_status || 'unknown',
            letter_grade: subject.letter_grade || null
        }));
    }, [archivedEnrollments]);

    const displayGrade = (grade) => {
        const numGrade = Number(grade);
        return (!isNaN(numGrade) && numGrade > 0) ? numGrade.toFixed(1) : '—';
    };

    const getGradePointEquivalence = (grade) => {
        if (!grade || grade === 'N/A') return 'N/A';
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
        return 'N/A';
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
                            <Link href={route('student.archived-grades.period', { academic_year, semester })}>
                                <ArrowLeft className="w-4 h-4" />
                            </Link>
                        </Button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                {section?.program?.program_code || 'N/A'} - {section?.year_level}{section?.section_name || 'Unknown Section'}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {academic_year} - {getSemesterDisplay(semester)} • Subject Grades
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${section?.section_name || 'Section'} Grades`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {subjectsData && subjectsData.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {subjectsData.map((enrollment) => (
                                <Card key={enrollment.id}>
                                    <CardHeader className="pb-3">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                                        <BookOpen className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                            {enrollment.subject_name || 'Unknown Subject'}
                                                        </div>
                                                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                                            {enrollment.subject_code || 'N/A'}
                                                        </div>
                                                    </div>
                                                </CardTitle>
                                            </div>
                                            <div className={`p-2 rounded-full ${
                                                enrollment.final_semester_grade >= 90 ? 'bg-green-100' :
                                                enrollment.final_semester_grade >= 80 ? 'bg-blue-100' :
                                                enrollment.final_semester_grade >= 75 ? 'bg-yellow-100' :
                                                enrollment.final_semester_grade ? 'bg-red-100' : 'bg-gray-100'
                                            }`}>
                                                <span className={`text-sm font-bold ${
                                                    enrollment.final_semester_grade >= 90 ? 'text-green-600' :
                                                    enrollment.final_semester_grade >= 80 ? 'text-blue-600' :
                                                    enrollment.final_semester_grade >= 75 ? 'text-yellow-600' :
                                                    enrollment.final_semester_grade ? 'text-red-600' : 'text-gray-400'
                                                }`}>
                                                    {displayGrade(enrollment.final_semester_grade)}
                                                </span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Status and Grade Info */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Status</span>
                                                </div>
                                                <div className="text-sm font-bold text-blue-900 dark:text-blue-100 capitalize">
                                                    {enrollment.final_status === 'no_data' ? 'Data Unavailable' : 
                                                     enrollment.final_status === 'archived' ? 'Archived' : 
                                                     enrollment.final_status || 'Unknown'}
                                                </div>
                                            </div>

                                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-3 rounded-lg">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Award className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                                    <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Letter Grade</span>
                                                </div>
                                                <div className="text-sm font-bold text-purple-900 dark:text-purple-100">
                                                    {enrollment.letter_grade || '—'}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Grade Status */}
                                        {enrollment.final_semester_grade && (
                                            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-3 rounded-lg">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                        <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Performance</span>
                                                    </div>
                                                    <div className={`text-sm font-bold ${getGradeColor(enrollment.final_semester_grade)}`}>
                                                        {getGradeStatus(enrollment.final_semester_grade)}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* View Detailed Grades Button */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Detailed Grades
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                                <DialogHeader>
                                                    <DialogTitle className="flex items-center gap-2 text-xl">
                                                        <BookOpen className="w-5 h-5 text-blue-600" />
                                                        {enrollment.subject_name}
                                                    </DialogTitle>
                                                    <DialogDescription className="text-base">
                                                        {enrollment.subject_code} • {enrollment.credits} credits • {enrollment.teacher_name}
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="space-y-6">
                                                    {/* Final Grade Summary */}
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">Final Semester Grade</h3>
                                                                <p className="text-sm text-gray-600 dark:text-gray-400">Overall performance in this subject</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className={`text-3xl font-bold ${getGradeColor(enrollment.final_semester_grade)}`}>
                                                                    {displayGrade(enrollment.final_semester_grade)}
                                                                </div>
                                                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                    Grade Point: {getGradePointEquivalence(enrollment.final_semester_grade)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Grade Breakdown */}
                                                    {enrollment.final_grades && (
                                                        Array.isArray(enrollment.final_grades) && enrollment.final_grades.length > 0 ||
                                                        (!Array.isArray(enrollment.final_grades) && Object.keys(enrollment.final_grades).length > 0)
                                                    ) ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center gap-2">
                                                                <BarChart3 className="w-5 h-5 text-green-600" />
                                                                <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Grade Breakdown</h4>
                                                            </div>

                                                            <div className="grid gap-4 md:grid-cols-2">
                                                                {Array.isArray(enrollment.final_grades) ?
                                                                    enrollment.final_grades.map((grade, index) => {
                                                                        const gradeValue = parseFloat(grade);
                                                                        // Reorder so Finals appears at the bottom
                                                                        const periodOrder = ['Prelim', 'Midterm', 'Prefinals', 'Finals'];
                                                                        const periodName = periodOrder[index] || `Period ${index + 1}`;
                                                                        const periodColors = [
                                                                            'from-blue-500 to-blue-600',
                                                                            'from-purple-500 to-purple-600',
                                                                            'from-orange-500 to-orange-600',
                                                                            'from-red-500 to-red-600'
                                                                        ];
                                                                        const bgColors = [
                                                                            'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                                                                            'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
                                                                            'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
                                                                            'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                                        ];

                                                                        return (
                                                                            <div key={index} className={`p-5 rounded-xl border ${bgColors[index] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${periodColors[index] || 'from-gray-500 to-gray-600'}`}></div>
                                                                                        <div>
                                                                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">{periodName}</h5>
                                                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Period {index + 1} Assessment</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <div className={`text-2xl font-bold ${getGradeColor(gradeValue)}`}>
                                                                                            {displayGrade(gradeValue)}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                                            Grade Point: {getGradePointEquivalence(gradeValue)}
                                                                                        </div>
                                                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                                                            {getGradeStatus(gradeValue)}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    }) :
                                                                    Object.entries(enrollment.final_grades)
                                                                        .sort(([a], [b]) => {
                                                                            // Sort so Finals appears at the bottom
                                                                            const order = ['prelim', 'midterm', 'prefinal', 'final'];
                                                                            const aIndex = order.findIndex(term => a.toLowerCase().includes(term));
                                                                            const bIndex = order.findIndex(term => b.toLowerCase().includes(term));
                                                                            return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
                                                                        })
                                                                        .map(([period, grade]) => {
                                                                        const gradeValue = parseFloat(grade);
                                                                        const periodName = period.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                                                                        const periodColors = {
                                                                            'prelim': 'from-blue-500 to-blue-600',
                                                                            'midterm': 'from-purple-500 to-purple-600',
                                                                            'prefinal': 'from-orange-500 to-orange-600',
                                                                            'final': 'from-red-500 to-red-600'
                                                                        };
                                                                        const bgColors = {
                                                                            'prelim': 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800',
                                                                            'midterm': 'bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800',
                                                                            'prefinal': 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800',
                                                                            'final': 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                                                        };

                                                                        const colorKey = period.toLowerCase().includes('prelim') ? 'prelim' :
                                                                                       period.toLowerCase().includes('midterm') ? 'midterm' :
                                                                                       period.toLowerCase().includes('prefinal') ? 'prefinal' :
                                                                                       period.toLowerCase().includes('final') ? 'final' : 'default';

                                                                        return (
                                                                            <div key={period} className={`p-5 rounded-xl border ${bgColors[colorKey] || 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700'}`}>
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-4">
                                                                                        <div className={`w-4 h-4 rounded-full bg-gradient-to-r ${periodColors[colorKey] || 'from-gray-500 to-gray-600'}`}></div>
                                                                                        <div>
                                                                                            <h5 className="font-semibold text-gray-900 dark:text-gray-100">{periodName}</h5>
                                                                                            <p className="text-sm text-gray-600 dark:text-gray-400">Assessment Period</p>
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="text-right">
                                                                                        <div className={`text-2xl font-bold ${getGradeColor(gradeValue)}`}>
                                                                                            {displayGrade(gradeValue)}
                                                                                        </div>
                                                                                        <div className="text-sm text-gray-600 dark:text-gray-400">
                                                                                            Grade Point: {getGradePointEquivalence(gradeValue)}
                                                                                        </div>
                                                                                        <Badge variant="outline" className="mt-2 text-xs">
                                                                                            {getGradeStatus(gradeValue)}
                                                                                        </Badge>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })
                                                                }
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                                            <Target className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                                                            <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Detailed Grades Available</h4>
                                                            <p className="text-gray-600 dark:text-gray-400">Grade breakdown data was not archived for this subject</p>
                                                        </div>
                                                    )}

                                                    {/* Status Information */}
                                                    <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <Award className="w-5 h-5 text-gray-600" />
                                                                <span className="font-medium text-gray-900 dark:text-gray-100">Enrollment Status</span>
                                                            </div>
                                                            <Badge variant={enrollment.final_status === 'archived' ? 'default' : 'secondary'} className="capitalize">
                                                                {enrollment.final_status === 'no_data' ? 'Data Unavailable' :
                                                                 enrollment.final_status === 'archived' ? 'Archived' :
                                                                 enrollment.final_status || 'Unknown'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <Archive className="h-16 w-16 text-gray-400 mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                                    No Subjects Found
                                </h3>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                    No archived subjects found for this section.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default SubjectGrades;