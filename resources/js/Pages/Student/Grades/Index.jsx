import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    BarChart3,
    Download
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
    if (grade === null || grade === undefined || isNaN(grade)) return 'text-gray-500';
    if (grade >= 90) return 'text-green-600'
    if (grade >= 80) return 'text-blue-600'
    if (grade >= 75) return 'text-yellow-600'
    return 'text-red-600'
}

// Helper function to display grade safely
const displayGrade = (grade) => {
    return (grade !== null && grade !== undefined && !isNaN(grade)) ? grade : '—';
};

// Helper function to check if grade is valid for color indicators
const isValidGrade = (grade) => {
    return grade !== null && grade !== undefined && !isNaN(grade);
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
    if (grade === null || grade === undefined || isNaN(grade)) return 'No grade';
    if (grade >= 90) return 'Excellent'
    if (grade >= 80) return 'Very Good'
    if (grade >= 75) return 'Good'
    return 'Needs Improvement'
}

// Helper function to determine which grades to show based on payment status (College only)
const getVisibleGrades = (paymentStatus) => {
    if (!paymentStatus) {
        return { prelim: false, midterm: false, prefinal: false, final: false, semester: false };
    }

    // If balance is 0, show all grades including semester grade
    if (paymentStatus.balance === 0) {
        return { prelim: true, midterm: true, prefinal: true, final: true, semester: true };
    }

    const prelimPaid = Boolean(paymentStatus.prelim_paid);
    const midtermPaid = Boolean(paymentStatus.midterm_paid);
    const prefinalPaid = Boolean(paymentStatus.prefinal_paid);
    const finalPaid = Boolean(paymentStatus.final_paid);

    // Precedence: final > prefinal > midterm > prelim
    if (finalPaid) {
        return { prelim: true, midterm: true, prefinal: true, final: true, semester: false };
    }

    if (prefinalPaid) {
        return { prelim: true, midterm: true, prefinal: true, final: false, semester: false };
    }

    if (midtermPaid) {
        return { prelim: true, midterm: true, prefinal: false, final: false, semester: false };
    }

    if (prelimPaid) {
        return { prelim: true, midterm: false, prefinal: false, final: false, semester: false };
    }

    return { prelim: false, midterm: false, prefinal: false, final: false, semester: false };
};

const Index = ({ auth, student, currentGrades, paymentStatus, visibleGradePeriods, stats, academicYear, semester }) => {
    // ensure safe defaults
    const grades = Array.isArray(currentGrades) ? currentGrades : [];
    const isShsView = grades.length > 0 && grades.every((grade) => grade.type === 'shs');
    // academic period values may be undefined when no grades exist
    academicYear = academicYear || '';
    semester = semester || '';
    // use backend‑computed visibility based on payment status
    const visible = visibleGradePeriods || { prelim: true, midterm: true, prefinal: true, final: true, semester: true };

    // user can toggle how grades are displayed
    const [gradeType, setGradeType] = React.useState('gpa');

    return (
        <AuthenticatedLayout
            auth={auth}
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('student.dashboard')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Dashboard</span>
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-blue-600" />
                                My Grades
                            </h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Review your grades for the current academic term
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My Grades" />

            {grades.length > 0 ? (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    {/* grade display toggle and export */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <label className="flex items-center gap-2 text-sm">
                                <span>View As:</span>
                                <Select value={gradeType} onValueChange={setGradeType}>
                                    <SelectTrigger className="w-32 h-8">
                                        <SelectValue placeholder="Numeric" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="numeric">Numeric</SelectItem>
                                        <SelectItem value="gpa">GPA</SelectItem>
                                    </SelectContent>
                                </Select>
                            </label>
                        </div>
                        <a
                            href={route('student.grades.export')}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Export PDF
                        </a>
                    </div>

                    {/* academic period and quick stats */}
                    <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center mb-4 space-y-2 md:space-y-0">
                        <div className="text-sm text-gray-600">
                            Academic Year: <span className="font-semibold">{academicYear}</span> &nbsp;|&nbsp; Semester: <span className="font-semibold">{semester}</span>
                        </div>
                        {stats && (
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    {stats.totalSubjects} subject{stats.totalSubjects !== 1 ? 's' : ''}
                                </Badge>
                                
                            </div>
                        )}
                    </div>

                    <Card>
                        <CardContent className="p-0 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">

                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Subject</th>
                                {isShsView ? (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quarter 1</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quarter 2</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Semester Grade</th>
                                    </>
                                ) : (
                                    <>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prelim</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Midterm</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Prefinal</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Final</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Semester</th>
                                    </>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Remarks</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {grades.map((grade, idx) => {
                                const subject = grade.sectionSubject?.subject;
                                const section = grade.studentEnrollment?.section;
                                const prelim = grade.prelim_grade ?? null;
                                const midterm = grade.midterm_grade ?? null;
                                const prefinal = grade.prefinal_grade ?? null;
                                const finalg = grade.final_grade ?? null;
                                const q1 = grade.q1_grade ?? null;
                                const q2 = grade.q2_grade ?? null;
                                const semester = grade.semester_grade ?? null;
                                const status = grade.overall_status || grade.completion_status || (semester ? 'Completed' : '');

                                return (
                                    <tr key={grade.id ?? idx} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-help">{subject?.subject_code || 'N/A'}</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>{subject?.subject_name || 'N/A'}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </td>
                                        {isShsView ? (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isValidGrade(q1) ? (gradeType === 'gpa' ? getGradePointEquivalence(q1) : displayGrade(q1)) : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isValidGrade(q2) ? (gradeType === 'gpa' ? getGradePointEquivalence(q2) : displayGrade(q2)) : '—'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {isValidGrade(semester) ? (gradeType === 'gpa' ? getGradePointEquivalence(semester) : displayGrade(semester)) : '—'}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {visible.prelim ? (
                                                        isValidGrade(prelim)
                                                            ? (gradeType === 'gpa' ? getGradePointEquivalence(prelim) : displayGrade(prelim))
                                                            : (!paymentStatus?.prelim_paid && paymentStatus?.balance > 0)
                                                                ? <Link href={route('student.payments')} className="text-red-600 underline">Pay Prelim</Link>
                                                                : '—'
                                                    ) : (
                                                        isValidGrade(prelim) ? <span className="text-gray-400">Grade hidden</span> : '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {visible.midterm ? (
                                                        isValidGrade(midterm)
                                                            ? (gradeType === 'gpa' ? getGradePointEquivalence(midterm) : displayGrade(midterm))
                                                            : (!paymentStatus?.midterm_paid && paymentStatus?.balance > 0)
                                                                ? <Link href={route('student.payments')} className="text-red-600 underline">Pay Midterm</Link>
                                                                : '—'
                                                    ) : (
                                                        isValidGrade(midterm) ? <span className="text-gray-400">Grade hidden</span> : '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {visible.prefinal ? (
                                                        isValidGrade(prefinal)
                                                            ? (gradeType === 'gpa' ? getGradePointEquivalence(prefinal) : displayGrade(prefinal))
                                                            : (!paymentStatus?.prefinal_paid && paymentStatus?.balance > 0)
                                                                ? <Link href={route('student.payments')} className="text-red-600 underline">Pay Pre-final</Link>
                                                                : '—'
                                                    ) : (
                                                        isValidGrade(prefinal) ? <span className="text-gray-400">Grade hidden</span> : '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {visible.final ? (
                                                        isValidGrade(finalg)
                                                            ? (gradeType === 'gpa' ? getGradePointEquivalence(finalg) : displayGrade(finalg))
                                                            : (!paymentStatus?.final_paid && paymentStatus?.balance > 0)
                                                                ? <Link href={route('student.payments')} className="text-red-600 underline">Pay Final</Link>
                                                                : '—'
                                                    ) : (
                                                        isValidGrade(finalg) ? <span className="text-gray-400">Grade hidden</span> : '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {visible.semester ? (
                                                        isValidGrade(semester)
                                                            ? (gradeType === 'gpa' ? getGradePointEquivalence(semester) : displayGrade(semester))
                                                            : (paymentStatus?.balance <= 0)
                                                                ? <span className="text-orange-600">Missing term grades</span>
                                                                : (!paymentStatus?.semester_paid && paymentStatus?.balance == 0)
                                                                    ? <Link href={route('student.payments')} className="text-red-600 underline">Pay Semester</Link>
                                                                    : '—'
                                                    ) : (
                                                        isValidGrade(semester) ? <span className="text-gray-400">Grade hidden</span> : '—'
                                                    )}
                                                </td>
                                            </>
                                        )}
                                        <td className="px-6 py-4 text-sm text-gray-900">{grade.teacher_remarks || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{status}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                        </CardContent>
                    </Card>
                    {/* pagination placeholder - kept for future use
                    {currentGrades.links && currentGrades.links.length > 3 && (
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
                                <span className="hidden sm:inline">Back to Dashboard</span>
                            </Link>
                        </Button>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
};

export default Index;
