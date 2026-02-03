import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    GraduationCap, 
    TrendingUp, 
    Calendar,
    User,
    BookOpen
} from 'lucide-react';

export default function GradesModal({ isOpen, onClose, subject, paymentStatus }) {
    if (!subject) return null;

    // Determine if this is SHS or College based on year level
    const isSHS = subject.year_level >= 11 && subject.year_level <= 12;

    const getGradeColor = (grade) => {
        if (!grade || grade === 'N/A') return 'text-gray-500';
        const numGrade = parseFloat(grade);
        if (numGrade >= 90) return 'text-green-600';
        if (numGrade >= 85) return 'text-blue-600';
        if (numGrade >= 80) return 'text-yellow-600';
        if (numGrade >= 75) return 'text-orange-600';
        return 'text-red-600';
    };

    const getGradeBg = (grade) => {
        if (!grade || grade === 'N/A') return 'bg-gray-100';
        const numGrade = parseFloat(grade);
        if (numGrade >= 90) return 'bg-green-100';
        if (numGrade >= 85) return 'bg-blue-100';
        if (numGrade >= 80) return 'bg-yellow-100';
        if (numGrade >= 75) return 'bg-orange-100';
        return 'bg-red-100';
    };

    const getLetterGrade = (grade) => {
        if (!grade || grade === 'N/A') return 'N/A';
        const numGrade = parseFloat(grade);
        if (numGrade >= 90) return 'A';
        if (numGrade >= 85) return 'B+';
        if (numGrade >= 80) return 'B';
        if (numGrade >= 75) return 'C';
        return 'F';
    };

    // Helper function to determine which grades to show based on payment status (College only)
    const getVisibleGrades = (paymentStatus) => {
        if (!paymentStatus) {
            return { prelim: false, midterm: false, prefinal: false, final: false, semester: false };
        }

        // If balance is 0, show all grades including semester grade
        if (paymentStatus.balance === 0) {
            return { prelim: true, midterm: true, prefinal: true, final: true, semester: true };
        }

        // Payment-based logic
        const prelimPaid = paymentStatus.prelim_paid === true;
        const midtermPaid = paymentStatus.midterm_paid === true;
        const prefinalPaid = paymentStatus.prefinal_paid === true;
        const finalPaid = paymentStatus.final_paid === true;

        // If finals are paid: show all grades
        if (finalPaid) {
            return { prelim: true, midterm: true, prefinal: true, final: true, semester: true };
        }

        // If prefinals are paid but not prelim: show prelim, midterm, and prefinals
        if (prefinalPaid && !prelimPaid) {
            return { prelim: true, midterm: true, prefinal: true, final: false, semester: true };
        }

        // If prelim is paid: show only prelim
        if (prelimPaid) {
            return { prelim: true, midterm: false, prefinal: false, final: false, semester: false };
        }

        // Default: no grades visible
        return { prelim: false, midterm: false, prefinal: false, final: false, semester: false };
    };

    // Define grade items based on student type
    const visibleGrades = isSHS ? null : getVisibleGrades(paymentStatus);
    const gradeItems = isSHS ? [
        { label: 'Q1', value: subject.grades?.q1_grade, weight: '50%' },
        { label: 'Q2', value: subject.grades?.q2_grade, weight: '50%' },
    ] : [
        { label: 'Prelim', value: subject.grades?.prelim_grade, weight: '25%', show: !visibleGrades || visibleGrades.prelim },
        { label: 'Midterm', value: subject.grades?.midterm_grade, weight: '25%', show: !visibleGrades || visibleGrades.midterm },
        { label: 'Prefinal', value: subject.grades?.prefinal_grade, weight: '25%', show: !visibleGrades || visibleGrades.prefinal },
        { label: 'Final', value: subject.grades?.final_grade, weight: '25%', show: !visibleGrades || visibleGrades.final },
    ].filter(item => item.show !== false);

// Add this function inside your GradesModal component
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

    // Calculate semester grade
    const calculateSemesterGrade = () => {
        if (isSHS) {
            // For SHS, calculate average of Q1 and Q2
            const q1 = subject.grades?.q1_grade ? parseFloat(subject.grades.q1_grade) : null;
            const q2 = subject.grades?.q2_grade ? parseFloat(subject.grades.q2_grade) : null;
            
            if (q1 !== null && q2 !== null) {
                return ((q1 + q2) / 2).toFixed(2);
            } else if (q1 !== null) {
                return q1.toString();
            } else if (q2 !== null) {
                return q2.toString();
            }
            return null;
        } else {
            // For College, use semester grade
            return subject.grades?.semester_grade;
        }
    };

    const semesterGrade = calculateSemesterGrade();

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                            <GraduationCap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <span className="text-xl font-bold">Grade Report</span>
                            <p className="text-sm text-gray-600 font-normal mt-1">
                                {subject.subject_code} - {subject.subject_name}
                            </p>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        View detailed grade breakdown for this subject
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Subject Info */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                Subject Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-600">Subject:</span>
                                    <p className="font-medium">{subject.subject_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Code:</span>
                                    <p className="font-medium">{subject.subject_code}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Instructor:</span>
                                    <p className="font-medium flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {subject.teacher_name}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Section:</span>
                                    <p className="font-medium">{subject.program_code}-{subject.year_level}{subject.section_name}</p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Academic Year:</span>
                                    <p className="font-medium flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {subject.academic_year}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-gray-600">Semester:</span>
                                    <p className="font-medium">{subject.semester} Semester</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Grades */}
                    {subject.grades ? (
                        <>
                            {/* Individual Grades */}
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-green-600" />
                                        Grade Breakdown
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {gradeItems.map((item, index) => (
                                            <div key={index} className="bg-gray-50 rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {item.weight}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-2xl font-bold ${getGradeColor(item.value)}`}>
                                                        {getGradePointEquivalence(item.value) || 'N/A'}
                                                    </span>
                                                    
                                                    <Badge 
                                                        variant="secondary" 
                                                        className={`${getGradeBg(item.value)} ${getGradeColor(item.value)} border-0`}
                                                    >
                                                        {item.value}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Final Semester Grade */}
                            {isSHS || (!visibleGrades || visibleGrades.semester) ? (
                                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5 text-blue-600" />
                                            Final Semester Grade
                                        </CardTitle>
                                    </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-gray-600 mb-1">Overall Performance</p>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-4xl font-bold ${getGradeColor(semesterGrade)}`}>
                                                            {getGradePointEquivalence(semesterGrade)|| 'N/A'}
                                                        </span>
                                                        <Badge 
                                                            variant="secondary" 
                                                            className={`text-lg px-3 py-1 ${getGradeBg(semesterGrade)} ${getGradeColor(semesterGrade)} border-0`}
                                                        >
                                                            {semesterGrade}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-gray-600 mb-1">Status</p>
                                                    <Badge 
                                                        variant={subject.grades?.status === 'passed' || subject.grades?.status === 'completed' ? 'default' : 'secondary'}
                                                        className={
                                                            subject.grades?.status === 'passed' || subject.grades?.status === 'completed'
                                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                                : 'bg-gray-100 text-gray-800'
                                                        }
                                                    >
                                                        {subject.grades?.status || 'Pending'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                            ) : (
                                <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                                    <CardContent className="p-8 text-center">
                                        <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Semester Grade Locked</h3>
                                        <p className="text-gray-600">
                                            Complete all period payments (Prelim, Midterm, Prefinal, Final) to view your semester grade.
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Grades Available</h3>
                                <p className="text-gray-600">
                                    Grades for this subject have not been submitted yet. Please check back later.
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}