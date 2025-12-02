import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Download, Upload, Save, Search, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function Show({ section, sectionSubject, enrollments, isCollegeLevel, teacher }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGrades, setEditingGrades] = useState({});
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        grades: []
    });

    // Filter students based on search term
    const filteredEnrollments = useMemo(() => {
        if (!searchTerm) return enrollments;
        
        return enrollments.filter(enrollment => 
            enrollment.student.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            enrollment.student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [enrollments, searchTerm]);

    // Initialize grades data
    React.useEffect(() => {
        const initialGrades = filteredEnrollments.map(enrollment => {
            const existingGrade = isCollegeLevel 
                ? enrollment.student_grades[0] 
                : enrollment.shs_student_grades[0];

            return {
                enrollment_id: enrollment.id,
                student_id: enrollment.student.student_id,
                student_name: enrollment.student.user.name,
                prelim_grade: existingGrade?.prelim_grade || '',
                midterm_grade: existingGrade?.midterm_grade || '',
                prefinal_grade: existingGrade?.prefinal_grade || '',
                final_grade: existingGrade?.final_grade || '',
                first_quarter_grade: existingGrade?.first_quarter_grade || '',
                second_quarter_grade: existingGrade?.second_quarter_grade || '',
                third_quarter_grade: existingGrade?.third_quarter_grade || '',
                fourth_quarter_grade: existingGrade?.fourth_quarter_grade || '',
                teacher_remarks: existingGrade?.teacher_remarks || '',
                semester_grade: existingGrade?.semester_grade || '',
                final_computed_grade: existingGrade?.final_grade || ''
            };
        });

        setData('grades', initialGrades);
    }, [filteredEnrollments, isCollegeLevel]);

    // Calculate semester grade based on grading periods
    const calculateSemesterGrade = (gradeData) => {
        if (isCollegeLevel) {
            const prelim = parseFloat(gradeData.prelim_grade) || 0;
            const midterm = parseFloat(gradeData.midterm_grade) || 0;
            const prefinal = parseFloat(gradeData.prefinal_grade) || 0;
            const final = parseFloat(gradeData.final_grade) || 0;
            
            if (prelim && midterm && prefinal && final) {
                return ((prelim + midterm + prefinal + final) / 4).toFixed(2);
            }
        } else {
            const q1 = parseFloat(gradeData.first_quarter_grade) || 0;
            const q2 = parseFloat(gradeData.second_quarter_grade) || 0;
            const q3 = parseFloat(gradeData.third_quarter_grade) || 0;
            const q4 = parseFloat(gradeData.fourth_quarter_grade) || 0;
            
            if (q1 && q2 && q3 && q4) {
                return ((q1 + q2 + q3 + q4) / 4).toFixed(2);
            }
        }
        return '';
    };

    // Handle grade input change
    const handleGradeChange = (enrollmentId, field, value) => {
        const updatedGrades = data.grades.map(grade => {
            if (grade.enrollment_id === enrollmentId) {
                const updatedGrade = { ...grade, [field]: value };
                updatedGrade.semester_grade = calculateSemesterGrade(updatedGrade);
                return updatedGrade;
            }
            return grade;
        });

        setData('grades', updatedGrades);
        setEditingGrades(prev => ({ ...prev, [`${enrollmentId}_${field}`]: true }));
    };

    // Get grade status (color coding)
    const getGradeStatus = (grade) => {
        const numGrade = parseFloat(grade);
        if (!grade || isNaN(numGrade)) return 'incomplete';
        
        if (isCollegeLevel) {
            if (numGrade >= 1.0 && numGrade <= 1.25) return 'excellent';
            if (numGrade >= 1.26 && numGrade <= 2.75) return 'passed';
            if (numGrade >= 2.76) return 'failed';
        } else {
            if (numGrade >= 90) return 'excellent';
            if (numGrade >= 75) return 'passed';
            if (numGrade < 75) return 'failed';
        }
        return 'incomplete';
    };

    const getGradeStatusColor = (status) => {
        switch (status) {
            case 'excellent': return 'text-green-600 bg-green-50';
            case 'passed': return 'text-blue-600 bg-blue-50';
            case 'failed': return 'text-red-600 bg-red-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    // Save grades
    const handleSaveGrades = () => {
        post(route('teacher.grades.store', section.id), {
            onSuccess: () => {
                setEditingGrades({});
                alert('Grades saved successfully!');
            },
            onError: () => {
                alert('Error saving grades. Please try again.');
            }
        });
    };

    // Download template
    const downloadTemplate = () => {
        window.location.href = route('teacher.grades.download-template', section.id);
    };

    // Upload Excel file
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append('grades_file', file);
            
            router.post(route('teacher.grades.import', section.id), formData, {
                onSuccess: () => {
                    setShowUploadDialog(false);
                    alert('Grades imported successfully!');
                },
                onError: () => {
                    alert('Error importing grades. Please check the file format.');
                }
            });
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Grade Management</h2>
                        <p className="text-sm text-blue-600 font-medium">
                            {section.section_name} - {sectionSubject.subject?.subject_name}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            {section.semester} Semester • {section.academic_year} • {section.program?.name}
                        </p>
                    </div>
                    <div className="flex items-center space-x-3">
                        <Button 
                            variant="outline" 
                            onClick={downloadTemplate}
                            className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Download Template
                        </Button>
                        
                        <Button 
                            onClick={() => setShowUploadDialog(true)}
                            className="bg-gradient-to-r from-red-500 to-blue-600 hover:from-red-600 hover:to-blue-700 text-white"
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Import Grades
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title={`Grades - ${section.section_name}`} />

            <div className="p-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        {/* Search and Controls */}
                        <div className="mb-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleSaveGrades}
                                        disabled={processing}
                                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Saving...' : 'Save All Grades'}
                                    </Button>
                                </div>
                            </div>

                            {/* Grade Legend */}
                            <div className="flex flex-wrap gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                        Excellent: {isCollegeLevel ? '1.0-1.25' : '90-100'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-blue-600" />
                                    <span className="text-blue-600 font-medium">
                                        Passed: {isCollegeLevel ? '1.26-2.75' : '75-89'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-red-600 font-medium">
                                        Failed: {isCollegeLevel ? '2.76+' : 'Below 75'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-gray-600" />
                                    <span className="text-gray-600 font-medium">Incomplete</span>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow className="bg-gray-50 border-b border-gray-200">
                                        <TableHead className="text-left font-bold text-gray-900">Student ID</TableHead>
                                        <TableHead className="text-left font-bold text-gray-900">Name</TableHead>
                                        {isCollegeLevel ? (
                                            <>
                                                <TableHead className="text-center font-bold text-gray-900">Prelim</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Midterm</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Pre-Final</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Final</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead className="text-center font-bold text-gray-900">Q1</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Q2</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Q3</TableHead>
                                                <TableHead className="text-center font-bold text-gray-900">Q4</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-center font-bold text-red-600">Semester Grade</TableHead>
                                        <TableHead className="text-center font-bold text-gray-900">Remarks</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.grades.map((gradeData, index) => (
                                        <TableRow key={gradeData.enrollment_id} className="border-b hover:bg-gray-50">
                                            <TableCell className="font-medium text-blue-600">
                                                {gradeData.student_id}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {gradeData.student_name}
                                            </TableCell>
                                            {isCollegeLevel ? (
                                                <>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="1.0"
                                                            max="5.0"
                                                            value={gradeData.prelim_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'prelim_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_prelim_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.prelim_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="1.0"
                                                            max="5.0"
                                                            value={gradeData.midterm_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'midterm_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_midterm_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.midterm_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="1.0"
                                                            max="5.0"
                                                            value={gradeData.prefinal_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'prefinal_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_prefinal_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.prefinal_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="1.0"
                                                            max="5.0"
                                                            value={gradeData.final_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'final_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_final_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.final_grade))}`}
                                                        />
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.first_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'first_quarter_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_first_quarter_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.first_quarter_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.second_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'second_quarter_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_second_quarter_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.second_quarter_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.third_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'third_quarter_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_third_quarter_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.third_quarter_grade))}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.fourth_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'fourth_quarter_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-red-500 focus:border-red-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_fourth_quarter_grade`] ? 'ring-2 ring-red-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.fourth_quarter_grade))}`}
                                                        />
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-center">
                                                <span className={`inline-block px-3 py-1 rounded-full font-bold ${
                                                    getGradeStatusColor(getGradeStatus(gradeData.semester_grade))
                                                }`}>
                                                    {gradeData.semester_grade || 'N/A'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Input
                                                    type="text"
                                                    value={gradeData.teacher_remarks}
                                                    onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'teacher_remarks', e.target.value)}
                                                    placeholder="Remarks..."
                                                    className="w-32 text-center border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Dialog */}
            {showUploadDialog && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowUploadDialog(false)}></div>
                        
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-lg leading-6 font-bold text-gray-900">
                                            Import Grades from Excel
                                        </h3>
                                        <div className="mt-4">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Upload an Excel file with student grades. Make sure to download the template first.
                                            </p>
                                            <input
                                                type="file"
                                                accept=".xlsx,.xls"
                                                onChange={handleFileUpload}
                                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-red-50 file:text-red-700 hover:file:bg-red-100"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <Button
                                    onClick={() => setShowUploadDialog(false)}
                                    className="bg-gray-300 hover:bg-gray-400 text-gray-800"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}