import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Users, CheckCircle, Edit2, Save, X, AlertCircle, Search, Archive, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const SubjectGrades = ({ archivedSection, subject, enrollments }) => {
    const [editingGrades, setEditingGrades] = useState({});
    const [gradeValues, setGradeValues] = useState({});
    const [remarksMap, setRemarksMap] = useState(() => {
        const m = {};
        (enrollments || []).forEach(e => { m[e.id] = e.teacher_remarks || ''; });
        return m;
    });
    const [searchTerm, setSearchTerm] = useState('');
    const { auth } = usePage().props;
    const teacherId = auth.user.teacher?.id;

    // Filter enrollments based on search term
    const filteredEnrollments = useMemo(() => {
        if (!searchTerm.trim()) {
            return enrollments;
        }

        const term = searchTerm.toLowerCase();
        return enrollments.filter(enrollment => {
            const studentName = enrollment.student_data?.name?.toLowerCase() || '';
            const studentNumber = enrollment.student_data?.student_number?.toLowerCase() || '';

            return studentName.includes(term) || studentNumber.includes(term);
        });
    }, [enrollments, searchTerm]);

    const getSemesterDisplay = (semester) => {
        const semesters = {
            'first': '1st Semester',
            'second': '2nd Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const formatGradeDisplay = (grade) => {
        if (grade === null || grade === undefined || grade === '') return '-';
        const num = Number(grade);
        if (isNaN(num)) return grade;
        // If it's a whole number, don't show decimals
        return num % 1 === 0 ? num.toString() : num.toString();
    };

    const isShsLevel = () => {
        if (!archivedSection?.program) return false;
        const programName = archivedSection.program.program_name?.toLowerCase() || '';
        const shsIndicators = ['senior high', 'shs', 'grade 11', 'grade 12', '11', '12'];
        return shsIndicators.some(indicator => programName.includes(indicator));
    };

    const updateGrade = (enrollmentId, gradeType, value) => {
        // For numeric grade fields, clamp to 0-100 and allow empty string
        let newVal = value;
        if (gradeType !== 'teacher_remarks') {
            // Allow empty input
            if (newVal === '' || newVal === null) {
                newVal = '';
            } else {
                // Parse as float and clamp
                const n = Number(newVal);
                if (!isNaN(n)) {
                    newVal = Math.max(0, Math.min(100, n));
                } else {
                    // keep raw value to allow validation to catch it
                    newVal = value;
                }
            }
        }

        setGradeValues(prev => ({
            ...prev,
            [enrollmentId]: {
                ...prev[enrollmentId],
                [gradeType]: newVal
            }
        }));
    };

    const startEditing = (enrollmentId, currentGrades) => {
        setEditingGrades(prev => ({ ...prev, [enrollmentId]: true }));
        
        // Find the enrollment to get current remarks
        const enrollment = enrollments.find(e => e.id === enrollmentId);
        
        setGradeValues(prev => ({
            ...prev,
            [enrollmentId]: { 
                ...currentGrades,
                teacher_remarks: enrollment?.teacher_remarks || ''
            }
        }));
    };

    const cancelEditing = (enrollmentId) => {
        setEditingGrades(prev => ({ ...prev, [enrollmentId]: false }));
        setGradeValues(prev => {
            const newValues = { ...prev };
            delete newValues[enrollmentId];
            return newValues;
        });
    };

    const saveGrades = (enrollmentId, studentName) => {
        const grades = gradeValues[enrollmentId];

        // Validate numeric grades only (exclude teacher_remarks)
        for (const [key, value] of Object.entries(grades || {})) {
            if (key === 'teacher_remarks') continue;

            if (value !== '' && value !== null && (isNaN(value) || value < 0 || value > 100)) {
                toast.error(`Invalid ${key} grade. Must be between 0-100.`);
                return;
            }
        }

        // Prepare payload: coerce numeric fields to numbers or null
        const payloadGrades = {};
        for (const [key, value] of Object.entries(grades || {})) {
            if (key === 'teacher_remarks') {
                payloadGrades[key] = value ?? null;
            } else {
                if (value === '' || value === null || value === undefined) {
                    payloadGrades[key] = null;
                } else {
                    const n = Number(value);
                    payloadGrades[key] = isNaN(n) ? null : n;
                }
            }
        }

        router.post(`/teacher/archived-sections/${archivedSection.id}/grades`, {
            enrollment_id: enrollmentId,
            section_subject_id: subject.section_subject_id || null,
            subject_id: subject.subject_id || subject.id || null,
            subject_code: subject.subject_code || null,
            grades: payloadGrades
        }, {
            onSuccess: () => {
                toast.success('Grades updated successfully');
                // Update remarks map with the saved value
                setRemarksMap(prev => ({
                    ...prev,
                    [enrollmentId]: payloadGrades.teacher_remarks
                }));
                cancelEditing(enrollmentId);
                // Reload the page to ensure all data is fresh
                router.reload();
            },
            onError: (errors) => {
                toast.error('Failed to update grades');
                console.error('Save failed:', errors);
                console.error('Payload:', {
                    enrollment_id: enrollmentId,
                    section_subject_id: subject.section_subject_id || null,
                    subject_id: subject.subject_id || subject.id || null,
                    subject_code: subject.subject_code || null,
                    grades: payloadGrades,
                });
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link
                            href={`/teacher/archived-sections/${archivedSection.id}`}
                            className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Archive className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{subject.subject_name || subject.subject_code}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{archivedSection.program?.program_code || 'N/A'} - {archivedSection.section_name} • {archivedSection.academic_year} • {getSemesterDisplay(archivedSection.semester)}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Grades - ${subject.subject_name || subject.subject_code}`} />

            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                    {/* Search Filter */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search by student name or number..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Showing {filteredEnrollments.length} of {enrollments.length} students
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Student Grades Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Grades</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Student
                                            </th>
                                            {isShsLevel() ? (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Q1
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Q2
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Q3
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Q4
                                                    </th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Prelim
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Midterm
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Prefinals
                                                    </th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                        Finals
                                                    </th>
                                                </>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Semester Grade
                                            </th>
                                            <th style={{width: '35%'}} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Remarks
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {filteredEnrollments.map((enrollment) => {
                                            const isEditing = editingGrades[enrollment.id];
                                            const grades = enrollment.final_grades || {};
                                            const editValues = gradeValues[enrollment.id] || {};

                                            return (
                                                <tr key={enrollment.id} className={isEditing ? 'bg-blue-50 dark:bg-blue-900/10' : ''}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex flex-col">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {enrollment.student_data.name}
                                                            </div>
                                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.student_data.student_number}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {isShsLevel() ? (
                                                        ['first_quarter', 'second_quarter', 'third_quarter', 'fourth_quarter'].map((gradeType) => (
                                                            <td key={gradeType} className="px-6 py-4 whitespace-nowrap">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        value={editValues[gradeType] || ''}
                                                                        onChange={(e) => updateGrade(enrollment.id, gradeType, e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                                e.preventDefault();
                                                                            }
                                                                        }}
                                                                        className="w-20"
                                                                        placeholder="0-100"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                        {formatGradeDisplay(grades[gradeType])}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))
                                                    ) : (
                                                        ['prelim', 'midterm', 'prefinals', 'finals'].map((gradeType) => (
                                                            <td key={gradeType} className="px-6 py-4 whitespace-nowrap">
                                                                {isEditing ? (
                                                                    <Input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        value={editValues[gradeType] || ''}
                                                                        onChange={(e) => updateGrade(enrollment.id, gradeType, e.target.value)}
                                                                        onKeyDown={(e) => {
                                                                            if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                                e.preventDefault();
                                                                            }
                                                                        }}
                                                                        className="w-20"
                                                                        placeholder="0-100"
                                                                    />
                                                                ) : (
                                                                    <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                        {formatGradeDisplay(grades[gradeType])}
                                                                    </span>
                                                                )}
                                                            </td>
                                                        ))
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatGradeDisplay(enrollment.final_semester_grade)}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4" style={{width: '35%'}}>
                                                        {isEditing ? (
                                                            <Textarea
                                                                value={editValues.teacher_remarks || ''}
                                                                onChange={(e) => updateGrade(enrollment.id, 'teacher_remarks', e.target.value)}
                                                                className="w-full min-w-0 resize-none text-sm"
                                                                rows={1}
                                                                placeholder="Enter remarks..."
                                                            />
                                                        ) : (
                                                            <span className="text-sm text-gray-900 dark:text-gray-100">
                                                                {(remarksMap[enrollment.id] ?? enrollment.teacher_remarks) || '-'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    {/* Status column removed - remarks now shown instead */}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                        {isEditing ? (
                                                            <div className="flex items-center gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    onClick={() => saveGrades(enrollment.id, enrollment.student_data.name)}
                                                                    className="bg-green-600 hover:bg-green-700"
                                                                >
                                                                    <Save className="h-4 w-4 mr-1" />
                                                                    Save
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => cancelEditing(enrollment.id)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => startEditing(enrollment.id, grades)}
                                                            >
                                                                <Edit2 className="h-4 w-4 mr-1" />
                                                                Edit
                                                            </Button>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default SubjectGrades;