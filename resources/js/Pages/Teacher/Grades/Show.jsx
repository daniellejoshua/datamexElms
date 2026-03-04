import React, { useState, useMemo, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Download, Upload, Save, Search, FileSpreadsheet, CheckCircle, XCircle, AlertTriangle, ArrowLeft, BookOpen, FileText, Menu } from 'lucide-react';

export default function Show({ section, sectionSubject, enrollments, isCollegeLevel, isShsLevel, teacher }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [editingGrades, setEditingGrades] = useState({});
    const [originalGrades, setOriginalGrades] = useState({}); // Track original values
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadErrors, setUploadErrors] = useState([]);
    const fileInputRef = useRef(null);

    const [showImportModal, setShowImportModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState(0);
    const [importResult, setImportResult] = useState(null); // { success: boolean, message: string, warnings?: array, successes?: array, stats?: object }
    // UI state for import warnings and success panels
    const [showImportWarnings, setShowImportWarnings] = useState(false);
    const [showImportSuccesses, setShowImportSuccesses] = useState(false);
    // Export modal states
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportOptions, setExportOptions] = useState({
        separateByGender: false, // true = separate by gender, false = alphabetical only
        gradeFormat: 'numeric' // 'numeric' or 'gpa'
    });
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
            await router.post(route('teacher.grades.update', sectionSubject.id), {
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

    // Filter and sort students based on search term
    const filteredEnrollments = useMemo(() => {
        if (!enrollments) return [];
        
        let filtered = enrollments.filter(enrollment => {
            if (!enrollment.student || !enrollment.student.user) return false;
            
            const studentName = enrollment.student.user.name?.toLowerCase() || '';
            const studentNumber = (enrollment.student.student_number || enrollment.student.student_id || '').toLowerCase();
            const searchLower = searchTerm.toLowerCase();
            
            return studentName.includes(searchLower) || studentNumber.includes(searchLower);
        });

        // Sort by last name first, then first name
        filtered.sort((a, b) => {
            const nameA = a.student?.user?.name || '';
            const nameB = b.student?.user?.name || '';
            
            // Split names and get last name (assuming format: "First Last" or "First Middle Last")
            const partsA = nameA.split(' ');
            const partsB = nameB.split(' ');
            
            const lastNameA = partsA.length > 1 ? partsA[partsA.length - 1] : nameA;
            const lastNameB = partsB.length > 1 ? partsB[partsB.length - 1] : nameB;
            
            return lastNameA.localeCompare(lastNameB);
        });

        return filtered;
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
            const studentName = user.name ? user.name.toUpperCase() : 'Unknown Student';
            
            // Skip students with invalid names
            if (!user.name || user.name.trim() === '' || user.name.includes('Unknown')) {
                return null;
            }

            return {
                enrollment_id: String(enrollment.id),
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
                semester_grade: isCollegeLevel 
                    ? (existingGrade?.semester_grade || '') 
                    : (existingGrade?.final_grade || ''), // For SHS, semester grade is stored in final_grade
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
                return Math.round((prelim + midterm + prefinal + final) / 4);
            }
        } else if (isShsLevel) {
            // SHS only uses Q1 and Q2
            const q1 = parseFloat(gradeData.first_quarter_grade);
            const q2 = parseFloat(gradeData.second_quarter_grade);
            
            if (!isNaN(q1) && !isNaN(q2) && gradeData.first_quarter_grade !== null && gradeData.second_quarter_grade !== null) {
                return Math.round((q1 + q2) / 2);
            }
        } else {
            // Other non-college, non-SHS levels use Q1-Q4
            const q1 = parseFloat(gradeData.first_quarter_grade) || 0;
            const q2 = parseFloat(gradeData.second_quarter_grade) || 0;
            const q3 = parseFloat(gradeData.third_quarter_grade) || 0;
            const q4 = parseFloat(gradeData.fourth_quarter_grade) || 0;
            
            if (q1 && q2 && q3 && q4) {
                return Math.round((q1 + q2 + q3 + q4) / 4);
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

    // Handle teacher remarks change
    const handleRemarksChange = (enrollmentId, value) => {
        const updatedGrades = data.grades.map(grade => {
            if (grade.enrollment_id === enrollmentId) {
                return { ...grade, teacher_remarks: value };
            }
            return grade;
        });

        setData('grades', updatedGrades);
        setEditingGrades(prev => ({ ...prev, [`${enrollmentId}_teacher_remarks`]: true }));
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
            case 'excellent': return 'text-green-600';
            case 'passed': return 'text-black';
            case 'failed': return 'text-red-600';
            default: return 'text-black';
        }
    };

    // Text color helper as requested: >90 green, >=75 black, <75 red
    const getGradeTextColor = (grade) => {
        const num = parseFloat(grade);
        if (grade === '' || grade === null || isNaN(num)) return 'text-black';
        if (num > 90) return 'text-green-600';
        if (num >= 75) return 'text-black';
        return 'text-red-600';
    };

    // Format student name as "LastName, FirstName MiddleInitial."
    const formatStudentName = (fullName) => {
        if (!fullName || fullName.trim() === '') return 'Unknown Student';

        const nameParts = fullName.trim().split(' ');
        if (nameParts.length === 1) {
            return fullName.toUpperCase();
        }

        // Last name is the last part
        const lastName = nameParts[nameParts.length - 1].toUpperCase();

        // First name is the first part
        const firstName = nameParts[0].toUpperCase();

        // Middle name/initial is everything in between
        let middleInitial = '';
        if (nameParts.length > 2) {
            const middleParts = nameParts.slice(1, -1);
            middleInitial = middleParts.map(part => part.charAt(0).toUpperCase()).join('') + '.';
        }

        return `${lastName}, ${firstName} ${middleInitial}`.trim();
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
        if (!studentGrade) {
            console.error('Student grade not found for enrollment ID:', enrollmentId);
            return;
        }

        console.log('Saving individual grade for student:', studentGrade.student_name, studentGrade);

        // Create payload with just this student's data
        const individualPayload = {
            grades: [studentGrade]
        };

        router.post(route('teacher.grades.update', sectionSubject.id), {
            data: individualPayload
        }, {
            preserveScroll: true,
            onSuccess: (response) => {
                // Reload the page to get updated data from server
                window.location.reload();
            },
            onError: (errors) => {
                console.error('Individual grade save failed:', errors);
            }
        });
    };

    // Save grades
    const handleSaveGrades = () => {
        router.post(route('teacher.grades.update', sectionSubject.id), {
            data: data
        }, {
            preserveScroll: true,
            onSuccess: (response) => {
                // Grades saved successfully - no page reload needed
                console.log('Grades saved successfully');
            },
            onError: () => {
                console.error('Error saving grades');
            }
        });
    };

    // Download template
    const downloadTemplate = async () => {
        setIsDownloadingTemplate(true);
        try {
            const response = await fetch(route('teacher.grades.template', sectionSubject.id));
            if (!response.ok) {
                throw new Error('Failed to download template');
            }

            const blob = await response.blob();

            // Try to get filename from Content-Disposition header if present
            const contentDisposition = response.headers.get('content-disposition') || '';
            const matches = /filename\*?=(?:UTF-8'')?"?([^;"\n]+)"?/i.exec(contentDisposition);
            let fileName = matches && matches[1] ? decodeURIComponent(matches[1]) : null;

            // Fallback to structured filename matching server format
            if (!fileName) {
                const sanitize = (str) => (str || '').replace(/[^A-Za-z0-9\- _]/g, '').trim().replace(/\s+/g, '_') || 'section';
                const sectionName = sanitize(section.section_name || section.section_code || 'section');
                const subjectName = sanitize(sectionSubject.subject?.subject_name || sectionSubject.subject?.subject_code || 'subject');
                const academicYear = sanitize(section.academic_year || 'year');
                const semester = sanitize(`Sem${section.semester}`);
                fileName = `grades_${sectionName}_${academicYear}_${semester}_${subjectName}.xlsx`;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error downloading template:', error);
            // You could add a toast notification here
            alert('Failed to download template. Please try again.');
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    // Export PDF
    const exportPdf = async () => {
        setIsExporting(true);
        try {
            const formData = new FormData();
            formData.append('separate_by_gender', exportOptions.separateByGender ? '1' : '0');
            formData.append('grade_format', exportOptions.gradeFormat);
            
            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (csrfToken) {
                formData.append('_token', csrfToken);
            }

            const response = await fetch(route('teacher.grades.export', sectionSubject.id), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to export PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `grades_${getSimplifiedSectionName()}_${section.academic_year}_Sem${section.semester}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            setShowExportModal(false);
        } catch (error) {
            console.error('Error exporting PDF:', error);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    // Upload Excel file
    const handleFileUpload = async (file) => {
        if (!file) return;

        // Validate file type
        const allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel', 'text/csv'];
        if (!allowedTypes.includes(file.type)) {
            setUploadErrors(['Please select a valid Excel file (.xlsx, .xls, or .csv)']);
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            setUploadErrors(['File size must be less than 5MB']);
            return;
        }

        setSelectedFile(file);
        setUploadErrors([]);
        setShowUploadDialog(false); // Close upload dialog
        setShowImportModal(true); // Show import modal
        setIsImporting(true);
        setImportProgress(0);
        setImportResult(null);

        try {
            const formData = new FormData();
            formData.append('grades_file', file);

            // Get CSRF token
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            if (!csrfToken) {
                throw new Error('CSRF token not found. Please refresh the page and try again.');
            }
            formData.append('_token', csrfToken);

            console.log('CSRF Token found:', csrfToken ? 'Yes' : 'No');

            // Simulate progress
            const progressInterval = setInterval(() => {
                setImportProgress(prev => Math.min(prev + 5, 90));
            }, 300);

            const response = await fetch(route('teacher.grades.import', sectionSubject.id), {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json',
                },
            });

            clearInterval(progressInterval);
            setImportProgress(100);

            const result = await response.json();

            if (response.ok) {
                setImportResult({
                    success: true,
                    message: result.message || 'Grades imported successfully!',
                    warnings: result.warnings || [],
                    successes: result.successes || [],
                    stats: result.stats || {}
                });
                // Ensure both panels are collapsed by default when a new result arrives
                setShowImportWarnings(false);
                setShowImportSuccesses(false);
                // Reload the page after a delay to show updated grades (allow user to read results)
                setTimeout(() => {
                    router.reload();
                }, 3000);
            } else {
                console.error('Import failed:', result);
                setImportResult({
                    success: false,
                    message: result.error || 'An error occurred during import',
                    errors: result.errors || []
                });
                setShowImportWarnings(false);
                setShowImportSuccesses(false);
            }
        } catch (error) {
            console.error('Import error:', error);
            setImportResult({
                success: false,
                message: error.message || 'An unexpected error occurred during import. Please try again.'
            });
            setShowImportWarnings(false);
            setShowImportSuccesses(false);
        } finally {
            setIsImporting(false);
        }
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            setUploadErrors([]); // Clear any previous errors
        }
    };

    // Drag and drop handlers
    const handleDragOver = (e) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragActive(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileUpload(files[0]);
        }
    };

    // Reset upload state when dialog closes
    const closeUploadDialog = () => {
        setShowUploadDialog(false);
        setSelectedFile(null);
        setUploadErrors([]);
        setUploadProgress(0);
        setIsUploading(false);
        setDragActive(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {/* back button on left */}
                        <button
                            onClick={() => router.visit(route('teacher.sections.college'), {
                                method: 'get',
                                preserveState: false,
                                preserveScroll: false
                            })}
                            className="inline-flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 mr-2"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Back to Sections</span>
                        </button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <BookOpen className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{sectionSubject?.subject?.subject_name || 'Grade Management'}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{getSimplifiedSectionName()} • {section.academic_year} - Semester {section.semester}</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`Grades - ${getSimplifiedSectionName()}`} />

            <div className="p-6">
                {/* Floating toast for template download */}
                {isDownloadingTemplate && (
                    <div className="fixed top-6 right-6 z-50 bg-white shadow px-4 py-2 rounded flex items-center gap-2 border border-gray-200">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <div className="text-sm text-gray-700">Preparing template...</div>
                    </div>
                )}

                {/* Section Header with Actions */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div></div>
                        <div className="flex items-center gap-3">
                            {/* Desktop buttons - hidden on small screens */}
                            <div className="hidden sm:flex items-center gap-3">
                                <Button 
                                    variant="outline" 
                                    onClick={downloadTemplate}
                                    disabled={isDownloadingTemplate}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50 disabled:opacity-50"
                                >
                                    {isDownloadingTemplate ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Downloading...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Download Template
                                        </>
                                    )}
                                </Button>
                                
                                <Button 
                                    variant="outline"
                                    onClick={() => setShowExportModal(true)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export PDF
                                </Button>
                                
                                <Button 
                                    onClick={() => setShowUploadDialog(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <Upload className="w-4 h-4 mr-2" />
                                    Import Grades
                                </Button>
                            </div>

                            {/* Mobile hamburger menu - shown only on small screens */}
                            <div className="sm:hidden">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <Menu className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-48">
                                        <DropdownMenuItem onClick={downloadTemplate} disabled={isDownloadingTemplate}>
                                            {isDownloadingTemplate ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Downloading...
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Template
                                                </>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowExportModal(true)}>
                                            <FileText className="w-4 h-4 mr-2" />
                                            Export PDF
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setShowUploadDialog(true)}>
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import Grades
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
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
                                        ) : isShsLevel ? (
                                            <>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 1</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 2</TableHead>
                                            </>
                                        ) : (
                                            <>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 1</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 2</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 3</TableHead>
                                                <TableHead className="text-center font-semibold text-gray-900 py-3">Quarter 4</TableHead>
                                            </>
                                        )}
                                        <TableHead className="text-center font-semibold text-blue-600 py-3">Semester Grade</TableHead>
                                        <TableHead className="text-center font-semibold text-gray-900 py-3">Remarks</TableHead>
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
                                                {formatStudentName(gradeData.student_name)}
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
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_prelim_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.prelim_grade)}`}
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
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_midterm_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.midterm_grade)}`}
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
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_prefinal_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.prefinal_grade)}`}
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
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_final_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.final_grade)}`}
                                                        />
                                                    </TableCell>
                                                </>
                                            ) : isShsLevel ? (
                                                <>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.first_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'first_quarter_grade', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_first_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.first_quarter_grade)}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.second_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'second_quarter_grade', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_second_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.second_quarter_grade)}`}
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
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_first_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.first_quarter_grade)}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.second_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'second_quarter_grade', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_second_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.second_quarter_grade)}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.third_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'third_quarter_grade', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_third_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.third_quarter_grade)}`}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-center py-3">
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={gradeData.fourth_quarter_grade}
                                                            onChange={(e) => handleGradeChange(gradeData.enrollment_id, 'fourth_quarter_grade', e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (['-', '+', 'e', 'E'].includes(e.key)) {
                                                                    e.preventDefault();
                                                                }
                                                            }}
                                                            className={`w-20 text-center border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                                editingGrades[`${gradeData.enrollment_id}_fourth_quarter_grade`] ? 'ring-2 ring-purple-300' : ''
                                                            } ${getGradeTextColor(gradeData.fourth_quarter_grade)}`}
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
                                                <Input
                                                    type="text"
                                                    placeholder="Add remarks..."
                                                    value={gradeData.teacher_remarks || ''}
                                                    onChange={(e) => handleRemarksChange(gradeData.enrollment_id, e.target.value)}
                                                    className={`w-48 text-sm border-gray-300 focus:ring-purple-500 focus:border-purple-500 ${
                                                        editingGrades[`${gradeData.enrollment_id}_teacher_remarks`] ? 'ring-2 ring-purple-300' : ''
                                                    }`}
                                                />
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
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={closeUploadDialog}></div>
                        
                        <div className="inline-block align-bottom bg-white rounded-xl shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-6 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg leading-6 font-bold text-gray-900 flex items-center">
                                                <FileSpreadsheet className="w-5 h-5 mr-2 text-green-600" />
                                                Import Grades from Excel
                                            </h3>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={closeUploadDialog}
                                                className="text-gray-400 hover:text-gray-600 h-8 w-8 p-0"
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-600 mb-4">
                                                Upload an Excel file with student grades. Download the template first to ensure correct formatting.
                                            </p>
                                            
                                            {/* File Upload Area */}
                                            <div 
                                                className={`border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
                                                    dragActive 
                                                        ? 'border-blue-500 bg-blue-50' 
                                                        : selectedFile
                                                            ? 'border-green-300 bg-green-50'
                                                            : 'border-gray-300 hover:border-blue-400'
                                                } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                            >
                                                <div className="text-center">
                                                    {selectedFile ? (
                                                        <div className="space-y-3">
                                                            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                                                <CheckCircle className="w-6 h-6 text-green-600" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                                </p>
                                                            </div>
                                                            
                                                            {isUploading && (
                                                                <div className="space-y-2">
                                                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                                                        <div 
                                                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                            style={{ width: `${uploadProgress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                    <p className="text-xs text-gray-600">Uploading... {uploadProgress}%</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center ${
                                                                dragActive ? 'bg-blue-100' : 'bg-gray-100'
                                                            }`}>
                                                                <Upload className={`w-6 h-6 ${
                                                                    dragActive ? 'text-blue-600' : 'text-gray-400'
                                                                }`} />
                                                            </div>
                                                            <div>
                                                                <p className={`text-sm font-medium ${
                                                                    dragActive ? 'text-blue-700' : 'text-gray-700'
                                                                }`}>
                                                                    {dragActive ? 'Drop your Excel file here' : 'Drag & drop your Excel file here, or click to browse'}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Supports .xlsx, .xls, .csv files (max 5MB)
                                                                </p>
                                                            </div>
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept=".xlsx,.xls,.csv"
                                                                onChange={handleFileSelect}
                                                                className="hidden"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                className="border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                                                            >
                                                                Choose File
                                                            </Button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Error Messages */}
                                            {uploadErrors.length > 0 && (
                                                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                                    <div className="flex items-start">
                                                        <XCircle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-red-800">Upload Failed</p>
                                                            <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                                                                {uploadErrors.map((error, index) => (
                                                                    <li key={index}>{error}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Success Message */}
                                            {uploadProgress === 100 && !uploadErrors.length && (
                                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
                                                    <div className="flex items-start">
                                                        <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-green-800">Upload Successful!</p>
                                                            <p className="text-sm text-green-700">Grades have been imported successfully.</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="bg-gray-50 px-6 py-4 rounded-b-xl">
                                <div className="flex items-center justify-between">
                                    <div className="text-xs text-gray-500">
                                        Need help? Download the template first to see the required format.
                                    </div>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={closeUploadDialog}
                                            disabled={isUploading}
                                            className="px-4 py-2 text-gray-700 border-gray-300 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </Button>
                                        
                                        <Button
                                            onClick={() => selectedFile && handleFileUpload(selectedFile)}
                                            disabled={!selectedFile || isUploading}
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md"
                                        >
                                            <Upload className="w-4 h-4 mr-2" />
                                            Import Grades
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Import Progress Modal */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                        
                        <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
                            <div className="p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                        {isImporting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                                                Importing Grades...
                                            </>
                                        ) : importResult?.success ? (
                                            <>
                                                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                                <span className="text-blue-600">Import Complete</span>
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4 mr-2 text-gray-500" />
                                                <span className="text-gray-700">Import Failed</span>
                                            </>
                                        )}
                                    </h3>
                                </div> 
                                
                                <div className="mb-4">
                                    {isImporting ? (
                                        <div>
                                            <p className="text-sm text-gray-600 mb-3">
                                                Processing your Excel file...
                                            </p>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full bg-gray-200 rounded-full h-2 mb-1">
                                                <div 
                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                    style={{ width: `${importProgress}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-500 text-center">
                                                {importProgress}%
                                            </p>
                                        </div>
                                    ) : importResult ? (
                                        <div>
                                            <p className={`text-sm mb-3 ${importResult.success ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {importResult.message}
                                            </p>

                                            {/* Statistics Summary */}
                                            {importResult.stats && (
                                                <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                                                    <div className="flex items-center gap-4 text-xs text-blue-800">
                                                        <span>Total Rows: <strong>{importResult.stats.total_rows_processed || 0}</strong></span>
                                                        <span className="text-green-700">✓ Success: <strong>{importResult.stats.successful_imports || 0}</strong></span>
                                                        {(importResult.stats.warnings_count || 0) > 0 && (
                                                            <span className="text-yellow-700">⚠ Warnings: <strong>{importResult.stats.warnings_count}</strong></span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            
                                            {/* Successful Imports Panel */}
                                            {importResult.successes && importResult.successes.length > 0 && (
                                                <div className="p-2 bg-green-50 border border-green-200 rounded mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-start gap-2">
                                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-medium text-green-800 mb-0">Successfully Imported: <span className="font-semibold">{importResult.successes.length}</span></p>
                                                                <p className="text-xs text-green-700">Click to view details</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowImportSuccesses(prev => !prev)}
                                                            className="text-xs text-green-800 underline ml-4"
                                                            aria-expanded={showImportSuccesses}
                                                        >
                                                            {showImportSuccesses ? 'Hide' : 'Show'}
                                                        </button>
                                                    </div>

                                                    {showImportSuccesses && (
                                                        <div className="mt-2 max-h-48 overflow-auto bg-green-50 p-2 rounded border border-green-100">
                                                            <ul className="text-xs text-green-700 space-y-0.5">
                                                                {importResult.successes.map((success, index) => (
                                                                    <li key={index} className="flex items-start">
                                                                        <span className="mr-1">•</span>
                                                                        <span>{success}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {/* Warnings Panel */}
                                            {importResult.warnings && importResult.warnings.length > 0 && (
                                                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded mb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-start gap-2">
                                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                                            <div>
                                                                <p className="text-xs font-medium text-yellow-800 mb-0">Rows Skipped with Warnings: <span className="font-semibold">{importResult.warnings.length}</span></p>
                                                                <p className="text-xs text-yellow-700">Click to view reasons why these rows were skipped</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowImportWarnings(prev => !prev)}
                                                            className="text-xs text-yellow-800 underline ml-4"
                                                            aria-expanded={showImportWarnings}
                                                        >
                                                            {showImportWarnings ? 'Hide' : 'Show'}
                                                        </button>
                                                    </div>

                                                    {showImportWarnings && (
                                                        <div className="mt-2 max-h-48 overflow-auto bg-yellow-50 p-2 rounded border border-yellow-100">
                                                            <ul className="text-xs text-yellow-700 space-y-1">
                                                                {importResult.warnings.map((warning, index) => (
                                                                    <li key={index} className="flex items-start">
                                                                        <span className="mr-1 flex-shrink-0">•</span>
                                                                        <span className="break-words">{warning}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Errors Panel (for failed imports) */}
                                            {importResult.errors && importResult.errors.length > 0 && (
                                                <div className="p-2 bg-red-50 border border-red-200 rounded">
                                                    <div className="flex items-start gap-2">
                                                        <XCircle className="w-4 h-4 text-red-600 mt-0.5" />
                                                        <div>
                                                            <p className="text-xs font-medium text-red-800 mb-1">Errors:</p>
                                                            <ul className="text-xs text-red-700 space-y-0.5">
                                                                {importResult.errors.map((error, index) => (
                                                                    <li key={index} className="flex items-start">
                                                                        <span className="mr-1">•</span>
                                                                        <span>{error}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : null}
                                </div>
                                
                                <div className="flex justify-end">
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setShowImportModal(false);
                                            setImportResult(null);
                                            setImportProgress(0);
                                            setSelectedFile(null);
                                            setShowImportWarnings(false);
                                            setShowImportSuccesses(false);
                                        }}
                                        className="px-3 py-1.5 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded"
                                        disabled={isImporting}
                                    >
                                        {isImporting ? 'Processing...' : 'Close'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Export PDF Modal */}
            <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-green-600" />
                            Export Grades to PDF
                        </DialogTitle>
                        <DialogDescription>
                            Configure your PDF export options below.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Export Options:</label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="separate-gender"
                                        name="export-option"
                                        checked={exportOptions.separateByGender}
                                        onChange={() => setExportOptions(prev => ({ ...prev, separateByGender: true }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="separate-gender" className="text-sm">
                                        Separate by gender (Male and Female sections)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="alphabetical-only"
                                        name="export-option"
                                        checked={!exportOptions.separateByGender}
                                        onChange={() => setExportOptions(prev => ({ ...prev, separateByGender: false }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="alphabetical-only" className="text-sm">
                                        Alphabetical order only
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm font-medium">Grade Format:</label>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="grade-format-numeric"
                                        name="grade-format"
                                        checked={exportOptions.gradeFormat === 'numeric'}
                                        onChange={() => setExportOptions(prev => ({ ...prev, gradeFormat: 'numeric' }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="grade-format-numeric" className="text-sm">
                                        Numeric (85, 90, 95, etc.)
                                    </label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        id="grade-format-gpa"
                                        name="grade-format"
                                        checked={exportOptions.gradeFormat === 'gpa'}
                                        onChange={() => setExportOptions(prev => ({ ...prev, gradeFormat: 'gpa' }))}
                                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                    />
                                    <label htmlFor="grade-format-gpa" className="text-sm">
                                        GPA (1.00, 1.25, 1.50, etc.)
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setShowExportModal(false)}
                            disabled={isExporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={exportPdf}
                            disabled={isExporting}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {isExporting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Export PDF
                                </>
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
}