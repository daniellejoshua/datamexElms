import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Calendar,
    Archive,
    AlertTriangle,
    Users,
    DollarSign,
    Clock,
    ChevronRight,
    Shield,
    TrendingUp,
    CheckCircle2,
    XCircle,
    Loader2,
    FileText,
    GraduationCap,
    BarChart3,
    AlertCircle,
    CheckCircle,
    ArrowRight,
    ArrowLeft,
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';

const Index = ({ currentAcademicYear, currentSemester, unpaid_count = 0, unpaid_students = [] }) => {
    const { props } = usePage();
    const archiveResults = props.archive_results || null;

    // Archiving flow steps
    const [currentStep, setCurrentStep] = useState('initial'); // initial, validation, confirm, processing, results
    const [validationData, setValidationData] = useState(null);
    const [isValidating, setIsValidating] = useState(false);
    const [archiveFormData, setArchiveFormData] = useState({
        academic_year: currentAcademicYear,
        semester: currentSemester,
        archive_notes: '',
        password: '',
        force: false,
    });
    const [processingArchive, setProcessingArchive] = useState(false);
    const [errors, setErrors] = useState({});

    const getSemesterDisplay = (semester) => {
        const semesters = {
            '1st': 'First Semester',
            '2nd': 'Second Semester',
            'first': 'First Semester',
            'second': 'Second Semester',
            'summer': 'Summer',
        };
        return semesters[semester] || semester;
    };

    const getNextPeriod = () => {
        if (currentSemester === '1st') {
            return { year: currentAcademicYear, semester: '2nd' };
        }
        const [startYear] = currentAcademicYear.split('-');
        const nextYear = `${parseInt(startYear) + 1}-${parseInt(startYear) + 2}`;
        return { year: nextYear, semester: '1st' };
    };

    const nextPeriod = getNextPeriod();

    // Check if there are archive results from the backend
    useEffect(() => {
        if (archiveResults) {
            setCurrentStep('results');
        }
    }, [archiveResults]);

    // Step 1: Validate Archive - Check what will happen
    const handleValidateArchive = async () => {
        setIsValidating(true);
        setErrors({});

        try {
            const response = await axios.post(route('admin.academic-years.validate-archive'), {
                academic_year: archiveFormData.academic_year,
                semester: archiveFormData.semester,
            });

            setValidationData(response.data);
            setCurrentStep('validation');
        } catch (error) {
            setErrors({ validation: 'Failed to validate archive. Please try again.' });
        } finally {
            setIsValidating(false);
        }
    };

    // Step 2: Proceed to confirmation
    const handleProceedToConfirm = () => {
        if (!validationData?.is_valid && validationData?.errors?.length > 0) {
            return;
        }
        setCurrentStep('confirm');
    };

    // Step 3: Submit archive
    const handleSubmitArchive = (e) => {
        e.preventDefault();
        setProcessingArchive(true);
        setErrors({});

        router.post(route('admin.academic-years.archive'), archiveFormData, {
            onSuccess: () => {
                toast.success('Academic year and semester archived successfully!');
            },
            onError: (errors) => {
                setErrors(errors);
                setProcessingArchive(false);
            },
            onFinish: () => {
                setProcessingArchive(false);
            },
        });
    };

    // Reset flow
    const handleResetFlow = () => {
        setCurrentStep('initial');
        setValidationData(null);
        setArchiveFormData({
            academic_year: currentAcademicYear,
            semester: currentSemester,
            archive_notes: '',
            password: '',
            force: false,
        });
        setErrors({});
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1.5 rounded-md">
                            <Calendar className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Academic Year Management</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic years and archiving</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Academic Year Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* Success Message */}
                    {props.flash?.success && currentStep === 'initial' && (
                        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <AlertDescription className="text-green-800 dark:text-green-200">
                                {props.flash.success}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Error Messages */}
                    {errors.error && (
                        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <AlertDescription className="text-red-800 dark:text-red-200">
                                {errors.error}
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* STEP: Initial - Current Period Display */}
                    {currentStep === 'initial' && (
                        <>
                            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-3 text-xl">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                                            <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        </div>
                                        <span>Current Academic Period</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    Academic Year
                                                </span>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                                                {currentAcademicYear}
                                            </div>
                                        </div>

                                        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                    Current Semester
                                                </span>
                                            </div>
                                            <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                {getSemesterDisplay(currentSemester)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="flex items-center space-x-3 mb-3">
                                            <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                                Next Period
                                            </span>
                                        </div>
                                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                                            <span className="font-mono">{nextPeriod.year}</span> - {getSemesterDisplay(nextPeriod.semester)}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                            System will automatically advance after archiving
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Archive Action Card */}
                            <Card className="border-0 shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-3 text-xl">
                                        <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                                            <Archive className="h-5 w-5 text-red-600 dark:text-red-400" />
                                        </div>
                                        <span>Archive Current Period</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <p className="text-gray-600 dark:text-gray-400">
                                            Archive the current academic period to finalize all grades and advance to the next semester.
                                            This will validate all sections, check for incomplete grades, and ensure all data is properly archived.
                                        </p>

                                        <div className="flex items-center space-x-4">
                                            <Button
                                                onClick={handleValidateArchive}
                                                disabled={isValidating}
                                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 h-auto"
                                                size="lg"
                                            >
                                                {isValidating ? (
                                                    <>
                                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                                        Validating...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Archive className="h-5 w-5 mr-2" />
                                                        Start Archive Process
                                                    </>
                                                )}
                                            </Button>

                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                <div className="flex items-center space-x-2">
                                                    <Shield className="h-4 w-4" />
                                                    <span>Secure multi-step process</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Unpaid Students Warning */}
                            {unpaid_count > 0 && (
                                <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-amber-800 dark:text-amber-200">
                                                    {unpaid_count} Students with Outstanding Balances
                                                </span>
                                                <Badge variant="outline" className="border-amber-300 text-amber-700">
                                                    Attention Required
                                                </Badge>
                                            </div>
                                            <p className="text-amber-700 dark:text-amber-300 text-sm">
                                                These students will be placed on hold during archiving. They cannot re-enroll until balances are cleared.
                                            </p>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}

                    {/* STEP: Validation Summary */}
                    {currentStep === 'validation' && validationData && (
                        <ValidationSummary
                            data={validationData}
                            currentAcademicYear={currentAcademicYear}
                            currentSemester={currentSemester}
                            getSemesterDisplay={getSemesterDisplay}
                            onProceed={handleProceedToConfirm}
                            onCancel={handleResetFlow}
                        />
                    )}

                    {/* STEP: Confirmation */}
                    {currentStep === 'confirm' && (
                        <ConfirmationStep
                            archiveFormData={archiveFormData}
                            setArchiveFormData={setArchiveFormData}
                            currentAcademicYear={currentAcademicYear}
                            currentSemester={currentSemester}
                            getSemesterDisplay={getSemesterDisplay}
                            validationData={validationData}
                            onSubmit={handleSubmitArchive}
                            onCancel={handleResetFlow}
                            processing={processingArchive}
                            errors={errors}
                        />
                    )}

                    {/* STEP: Results */}
                    {currentStep === 'results' && archiveResults && (
                        <ResultsDashboard
                            results={archiveResults}
                            currentAcademicYear={currentAcademicYear}
                            currentSemester={currentSemester}
                            getSemesterDisplay={getSemesterDisplay}
                            onClose={handleResetFlow}
                        />
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

// Validation Summary Component
const ValidationSummary = ({ data, currentAcademicYear, currentSemester, getSemesterDisplay, onProceed, onCancel }) => {
    return (
        <div className="space-y-6">
            <Card className="border-0 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-3 text-xl">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span>Pre-Archive Validation</span>
                        <Badge variant={data.is_valid ? 'success' : 'destructive'}>
                            {data.is_valid ? 'Ready to Archive' : 'Issues Found'}
                        </Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Archiving: {currentAcademicYear} {getSemesterDisplay(currentSemester)}
                        </h3>

                        {/* Statistics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Archive className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Sections</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.total_sections}</div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Users className="h-4 w-4 text-green-600" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Students</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.total_students}</div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <AlertCircle className="h-4 w-4 text-amber-600" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Incomplete Grades</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.incomplete_grades_count}</div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-2 mb-2">
                                    <DollarSign className="h-4 w-4 text-red-600" />
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Payment Issues</span>
                                </div>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.payment_issues_count}</div>
                            </div>
                        </div>
                    </div>

                    {/* Errors */}
                    {data.errors && data.errors.length > 0 && (
                        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                            <XCircle className="h-5 w-5 text-red-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-semibold text-red-800 dark:text-red-200">Cannot proceed with archiving:</p>
                                    <ul className="list-disc list-inside space-y-1 text-red-700 dark:text-red-300">
                                        {data.errors.map((error, index) => (
                                            <li key={index}>{error}</li>
                                        ))}
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Warnings */}
                    {data.warnings && data.warnings.length > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="font-semibold text-amber-800 dark:text-amber-200">Important notices:</p>
                                    <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                                        {data.warnings.map((warning, index) => (
                                            <li key={index}>{warning}</li>
                                        ))}
                                    </ul>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Section Details */}
                    {data.section_statistics && data.section_statistics.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                                <BarChart3 className="h-5 w-5" />
                                <span>Section Statistics</span>
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                                {data.section_statistics.map((section, index) => (
                                    <Card key={index} className="border border-gray-200 dark:border-gray-700">
                                        <CardContent className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h5 className="font-semibold text-gray-900 dark:text-white">{section.name}</h5>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">Year {section.year_level}</p>
                                                </div>
                                                {section.average_grade > 0 && (
                                                    <Badge variant="outline" className="font-mono">
                                                        Avg: {section.average_grade}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Students:</span>
                                                <span className="font-medium text-gray-900 dark:text-white">{section.total_students}</span>
                                            </div>
                                            {section.incomplete_grades > 0 && (
                                                <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 flex items-center space-x-1">
                                                    <AlertCircle className="h-3 w-3" />
                                                    <span>{section.incomplete_grades} incomplete grades</span>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            onClick={onCancel}
                            variant="outline"
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={onProceed}
                            disabled={!data.is_valid}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                        >
                            Proceed to Confirmation
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

// Confirmation Step Component
const ConfirmationStep = ({
    archiveFormData,
    setArchiveFormData,
    currentAcademicYear,
    currentSemester,
    getSemesterDisplay,
    validationData,
    onSubmit,
    onCancel,
    processing,
    errors,
}) => {
    return (
        <Card className="border-0 shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center space-x-3 text-xl">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                        <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                    </div>
                    <span>Confirm Archive</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                    <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/20">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-800 dark:text-red-200">
                            <p className="font-semibold mb-2">You are about to archive:</p>
                            <p className="text-lg font-bold">{currentAcademicYear} {getSemesterDisplay(currentSemester)}</p>
                            <p className="mt-2 text-sm">
                                This will archive <strong>{validationData.total_sections} sections</strong> and affect <strong>{validationData.total_students} students</strong>.
                                This action creates permanent archive records.
                            </p>
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="archive_notes">Archive Notes (Optional)</Label>
                            <Textarea
                                id="archive_notes"
                                value={archiveFormData.archive_notes}
                                onChange={(e) =>
                                    setArchiveFormData({ ...archiveFormData, archive_notes: e.target.value })
                                }
                                rows={3}
                                placeholder="Add any notes about this archive..."
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label htmlFor="password">Confirm Password *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={archiveFormData.password}
                                onChange={(e) =>
                                    setArchiveFormData({ ...archiveFormData, password: e.target.value })
                                }
                                required
                                className="mt-1"
                            />
                            {errors.password && (
                                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                            )}
                        </div>

                        {validationData.payment_issues_count > 0 && (
                            <div className="flex items-start space-x-2">
                                <Checkbox
                                    id="force"
                                    checked={archiveFormData.force}
                                    onCheckedChange={(checked) =>
                                        setArchiveFormData({ ...archiveFormData, force: checked })
                                    }
                                />
                                <div className="grid gap-1.5 leading-none">
                                    <Label
                                        htmlFor="force"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Force archive (override payment blocks)
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Students with unpaid balances will be placed on hold but archiving will proceed.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            onClick={onCancel}
                            variant="outline"
                            disabled={processing}
                            className="px-6"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-red-600 hover:bg-red-700 text-white px-8"
                        >
                            {processing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Archiving...
                                </>
                            ) : (
                                <>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Confirm & Archive
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

// Results Dashboard Component
const ResultsDashboard = ({ results, currentAcademicYear, currentSemester, getSemesterDisplay, onClose }) => {
    return (
        <div className="space-y-6">
            {/* Success Header */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <CardContent className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/50 mb-4">
                        <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Archive Complete!</h2>
                    <p className="text-lg text-gray-600 dark:text-gray-400">
                        Successfully archived {currentAcademicYear} {getSemesterDisplay(currentSemester)}
                    </p>
                </CardContent>
            </Card>

            {/* Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <Archive className="h-6 w-6 text-blue-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Sections Archived</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{results.sections_archived}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <Users className="h-6 w-6 text-green-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Students Affected</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{results.students_affected}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <GraduationCap className="h-6 w-6 text-purple-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Promoted to Regular</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{results.regularity_promotions}</div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3 mb-2">
                            <TrendingUp className="h-6 w-6 text-amber-600" />
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Grade</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">{results.average_section_grade || 'N/A'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Completion Stats */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span>Student Completion</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Completed</span>
                            <Badge variant="success" className="font-mono">{results.students_completed}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Dropped</span>
                            <Badge variant="secondary" className="font-mono">{results.students_dropped}</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Incomplete Grades</span>
                            <Badge variant="warning" className="font-mono">{results.incomplete_grades}</Badge>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Holds */}
                {results.payment_holds_applied > 0 && (
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <DollarSign className="h-5 w-5 text-red-600" />
                                <span>Payment Holds</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <p className="text-gray-600 dark:text-gray-400">
                                    {results.payment_holds_applied} students placed on hold due to outstanding balances.
                                </p>
                                {results.held_students && results.held_students.length > 0 && (
                                    <details className="mt-3">
                                        <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300">
                                            View held students
                                        </summary>
                                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                                            {results.held_students.map((student) => (
                                                <div key={student.id} className="text-sm bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                                    <div className="flex justify-between">
                                                        <span>{student.name} ({student.student_number})</span>
                                                        <span className="text-red-600 font-mono">₱{student.balance.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </details>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Promoted Students */}
            {results.regularity_promotions > 0 && results.promoted_students && results.promoted_students.length > 0 && (
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <GraduationCap className="h-5 w-5 text-purple-600" />
                            <span>Students Promoted to Regular Status</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                            {results.promoted_students.map((student) => (
                                <div key={student.id} className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                                    <div className="font-semibold text-gray-900 dark:text-white">{student.name}</div>
                                    <div className="text-sm text-gray-600 dark:text-gray-400">{student.student_number}</div>
                                    <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                        Now Regular - Year {student.year_level}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Close Button */}
            <div className="flex justify-center">
                <Button
                    onClick={onClose}
                    size="lg"
                    className="px-8"
                >
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Done
                </Button>
            </div>
        </div>
    );
};

export default Index;
