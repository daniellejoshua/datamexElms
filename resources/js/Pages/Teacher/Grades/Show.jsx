import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Download, Upload, Save, Search, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react';

export default function Show({ section, sectionSubject, enrollments, isCollegeLevel, teacher }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGrades, setEditingGrades] = useState({});
    const [originalGrades, setOriginalGrades] = useState({}); // Track original values
    const [showUploadDialog, setShowUploadDialog] = useState(false);

    // // Debug: Log the section details to help identify the issue
    // console.log('Section Details:', {
    //     section_name: section.section_name,
    //     program: section.program,
    //     isCollegeLevel: isCollegeLevel,
    //     type: typeof isCollegeLevel
    // });

    const { data, setData, post, processing, errors, reset } = useForm({
        grades: []
    });

    // Create simplified section name format
    const getSimplifiedSectionName = () => {
        // Format: ProgramCode-YearLevel+SectionIdentifier (e.g., "BSIT-3D", "ABM-12A")
        const programCode = section.program?.program_code || 'N/A';
        const yearLevel = section.year_level || '';
        
        // Get identifier (usually the letter part like A, B, C, D)
        const identifierMatch = section.section_name.match(/([A-Za-z]+)$/);
        const identifier = identifierMatch ? identifierMatch[1].toUpperCase() : '';
        
        if (yearLevel && identifier) {
            return `${programCode}-${yearLevel}${identifier}`;
        } else if (identifier) {
            return `${programCode}-${identifier}`;
        }
        
        // Fallback to original section name if parsing fails
        return section.section_name;
    };

    // Handle saving individual student grades
    const handleSaveIndividualGrade = async (enrollmentId) => {
        const studentGrade = data.grades.find(grade => grade.enrollment_id === enrollmentId);
        if (!studentGrade) return;

        try {
            await router.post(route('teacher.grades.update', section.id), {
                grades: [studentGrade]
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    // Remove editing state for this student
                    const newEditingGrades = { ...editingGrades };
                    Object.keys(newEditingGrades).forEach(key => {
                        if (key.startsWith(`${enrollmentId}_`)) {
                            delete newEditingGrades[key];
                        }
                    });
                    setEditingGrades(newEditingGrades);
                }
            });
        } catch (error) {
            console.error('Error saving individual grade:', error);
        }
    };

    // Filter students based on search term
    const filteredEnrollments = useMemo(() => {
        if (!searchTerm) return enrollments;
        
        return enrollments.filter(enrollment => {
            if (!enrollment.student || !enrollment.student.user) return false;
            
            const studentName = enrollment.student.user.name?.toLowerCase() || '';
            const studentNumber = (enrollment.student.student_number || enrollment.student.student_id || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            return studentName.includes(searchLower) || studentNumber.includes(searchLower);
        });
    }, [enrollments, searchTerm]);

    // Initialize grades data
    React.useEffect(() => {
        const initialGrades = filteredEnrollments.map(enrollment => {
            // Safely access grades arrays - check both camelCase (Laravel) and snake_case (frontend) naming
            const studentGrades = enrollment.studentGrades || enrollment.student_grades || [];
            const shsStudentGrades = enrollment.shsStudentGrades || enrollment.shs_student_grades || [];
            
            const existingGrade = isCollegeLevel 
                ? (studentGrades.length > 0 ? studentGrades[0] : null)
                : (shsStudentGrades.length > 0 ? shsStudentGrades[0] : null);

            // Defensive access to student data
            const student = enrollment.student || {};
            const user = student.user || {};
            const studentNumber = student.student_number || student.student_id || 'N/A';
            const studentName = user.name || 'Unknown Student';
            
            // Skip students with invalid names
            if (!user.name || user.name.trim() === '' || user.name.includes('Unknown')) {
                return null;
            }

            return {
                enrollment_id: enrollment.id,
                student_id: studentNumber,
                student_name: studentName,
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
        }).filter(Boolean); // Remove null entries

        setData('grades', initialGrades);
        
        // Store original grades for comparison
        const originalData = {};
        initialGrades.forEach(grade => {
            originalData[grade.enrollment_id] = {
                prelim_grade: grade.prelim_grade,
                midterm_grade: grade.midterm_grade,
                prefinal_grade: grade.prefinal_grade,
                final_grade: grade.final_grade,
                first_quarter_grade: grade.first_quarter_grade,
                second_quarter_grade: grade.second_quarter_grade,
                third_quarter_grade: grade.third_quarter_grade,
                fourth_quarter_grade: grade.fourth_quarter_grade,
                teacher_remarks: grade.teacher_remarks
            };
        });
        setOriginalGrades(originalData);
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
        // Validate input: only allow numbers 0-100 with up to 2 decimal places
        const numValue = parseFloat(value);
        if (value !== '' && (isNaN(numValue) || numValue < 0 || numValue > 100)) {
            return; // Don't update if invalid
        }
        
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

    // Check if a specific student has unsaved changes
    const hasStudentChanges = (enrollmentId) => {
        const currentGrade = data.grades.find(g => g.enrollment_id === enrollmentId);
        const originalGrade = originalGrades[enrollmentId];
        
        if (!currentGrade || !originalGrade) return false;
        
        // Compare current values with original values
        const fieldsToCheck = [
            'prelim_grade', 'midterm_grade', 'prefinal_grade', 'final_grade',
            'first_quarter_grade', 'second_quarter_grade', 'third_quarter_grade', 'fourth_quarter_grade',
            'teacher_remarks'
        ];
        
        return fieldsToCheck.some(field => {
            const current = (currentGrade[field] || '').toString();
            const original = (originalGrade[field] || '').toString();
            return current !== original;
        });
    };

    // Save grades for a specific student only
    const saveIndividualGrade = (enrollmentId) => {
        const studentGrade = data.grades.find(grade => grade.enrollment_id === enrollmentId);
        if (!studentGrade) return;

        // Create payload with just this student's data
        const individualPayload = {
            grades: [studentGrade]
        };

        post(route('teacher.grades.update', section.id), {
            data: individualPayload,
            onSuccess: () => {
                // Update original grades to current values
                setOriginalGrades(prev => ({
                    ...prev,
                    [enrollmentId]: {
                        prelim_grade: studentGrade.prelim_grade,
                        midterm_grade: studentGrade.midterm_grade,
                        prefinal_grade: studentGrade.prefinal_grade,
                        final_grade: studentGrade.final_grade,
                        first_quarter_grade: studentGrade.first_quarter_grade,
                        second_quarter_grade: studentGrade.second_quarter_grade,
                        third_quarter_grade: studentGrade.third_quarter_grade,
                        fourth_quarter_grade: studentGrade.fourth_quarter_grade,
                        teacher_remarks: studentGrade.teacher_remarks
                    }
                }));
                
                // Clear editing state for this student only
                const newEditingGrades = { ...editingGrades };
                Object.keys(newEditingGrades).forEach(key => {
                    if (key.startsWith(`${enrollmentId}_`)) {
                        delete newEditingGrades[key];
                    }
                });
                setEditingGrades(newEditingGrades);
                alert('Grade saved successfully!');
            },
            onError: () => {
                alert('Error saving grade. Please try again.');
            }
        });
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
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.visit(route('teacher.sections.college'))}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Subjects
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">
                                {sectionSubject?.subject?.subject_name || 'Grade Management'}
                            </h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                               {getSimplifiedSectionName()} • {section.academic_year} - Semester {section.semester}
                            </p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Grades - ${getSimplifiedSectionName()}`} />

            <div className="p-6">
                {/* Section Header with Actions */}
                <div className="mb-6">
                    <div className="flex items-center justify-end mb-4">
                        <div className="flex items-center gap-3">
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
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Import Grades
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                    <div className="p-6">
                        {/* Search and Controls */}
                        <div className="mb-6">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div className="relative max-w-xs">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button 
                                        onClick={handleSaveGrades}
                                        disabled={processing}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        <Save className="w-4 h-4 mr-2" />
                                        {processing ? 'Saving...' : 'Save All Grades'}
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Grades Table */}
                        <div className="overflow-x-auto">
                            <Table className="min-w-full">
                                <TableHeader>
                                    <TableRow className="bg-blue-50 border-b">
                                        <TableHead className="text-left font-semibold text-gray-900 py-3">Student ID</TableHead>
                                        <TableHead className="text-left font-semibold text-gray-900 py-3">Name</TableHead>
                                        {isCollegeLevel ? (
                                            <>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Prelim</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Midterm</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Prefinals</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Finals</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Q1</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Q2</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Q3</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Q4</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-center font-semibold text-blue-600 py-3">Semester Grade</TableHead>
                                        <TableHead className="text-center font-semibold text-gray-900 py-3">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {data.grades.map((gradeData, index) => (
                                        <TableRow key={gradeData.enrollment_id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium text-blue-600 py-3">
                                                {gradeData.student_id || 'N/A'}
                                            </TableCell>
                                            <TableCell className="font-medium py-3">
                                                {gradeData.student_name}
                                            </TableCell>
                                            {isCollegeLevel ? (
                                                <>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.prelim_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'prelim_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.midterm_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'midterm_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.prefinal_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'prefinal_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.final_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'final_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                </>
                                            ) : (
                                                <>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.first_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'first_quarter_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.second_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'second_quarter_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.third_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'third_quarter_grade', e.target.value)}
                                                            className="w-20 text-center text-sm"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.fourth_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'fourth_quarter_grade', e.target.value)}
                                                            className={`w-20 text-center border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_fourth_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeStatusColor(getGradeStatus(gradeData.fourth_quarter_grade))}`}
                                                        />
                                                    </TableCell>
                                                </>
                                            )}
                                            <TableCell className="text-center py-3">
                                                <div className="font-semibold text-blue-600">
                                                    {gradeData.semester_grade || '--'}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center py-3">
                                                {hasStudentChanges(gradeData.enrollment_id) ? (
                                                    <Button 
                                                        onClick={() => saveIndividualGrade(gradeData.enrollment_id)}
                                                        size="sm" 
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        disabled={processing}
                                                    >
                                                        {processing ? 'Saving...' : 'Save'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-gray-400 text-sm"></span>
                                                )}
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