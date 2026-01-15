
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
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
import { Calendar, Archive, AlertTriangle, Users, DollarSign, Clock, ChevronRight, Shield, TrendingUp } from 'lucide-react';

const Index = ({ archivedSections, academicYears, currentAcademicYear, currentSemester, unpaid_count = 0, unpaid_students = [] }) => {
    // Assume current semester is always available (e.g. from config or backend prop)
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        academic_year: currentAcademicYear,
        semester: currentSemester,
        archive_notes: '',
        password: '',
        force: false,
    });

    const getSemesterDisplay = (semester) => {
        const semesters = {
            '1st': 'First Semester',
            '2nd': 'Second Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const getNextPeriod = (academicYear, semester) => {
        let nextYear = academicYear;
        let nextSem = '';

        switch (semester) {
            case '1st':
                nextSem = '2nd';
                break;
            case '2nd':
                // Skip summer, move to next academic year
                const [startYear, endYear] = academicYear.split('-');
                nextYear = `${endYear}-${parseInt(endYear) + 1}`;
                nextSem = '1st';
                break;
        }

        return { year: nextYear, semester: nextSem };
    };

    const nextPeriod = getNextPeriod(data.academic_year, currentSemester);

    const handleArchive = () => {
        setShowModal(true);
    };

    const confirmArchive = (e) => {
        e.preventDefault();
        post('/admin/academic-years/archive', {
            onSuccess: () => {
                reset();
                setShowModal(false);
                window.location.reload(); // Refresh to show new academic period
            },
            onError: () => {
                // Keep modal open to show errors
            }
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <Calendar className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Academic Year Management</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Manage academic periods and archive completed semesters</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="Academic Year Management" />

            <div className="py-6 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6 lg:space-y-8">

                    {/* Current Academic Period Card */}
                    <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
                        <CardHeader className="pb-4">
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
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Academic Year</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
                                        {currentAcademicYear}
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <Clock className="h-5 w-5 text-green-600 dark:text-green-400" />
                                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Semester</span>
                                    </div>
                                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {getSemesterDisplay(currentSemester)}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                <div className="flex items-center space-x-3 mb-3">
                                    <ChevronRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Period</span>
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
                                    This action will move all current sections and student data to the archive.
                                </p>

                                <div className="flex items-center space-x-4">
                                    <Button
                                        onClick={handleArchive}
                                        disabled={processing}
                                        className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 h-auto"
                                        size="lg"
                                    >
                                        <Archive className="h-5 w-5 mr-2" />
                                        Archive & Advance Period
                                    </Button>

                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                        <div className="flex items-center space-x-2">
                                            <Shield className="h-4 w-4" />
                                            <span>Requires password confirmation</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Unpaid Students Alert */}
                    {unpaid_count > 0 && (
                        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/20">
                            <AlertTriangle className="h-5 w-5 text-amber-600" />
                            <AlertDescription className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Users className="h-5 w-5 text-amber-600" />
                                        <span className="font-semibold text-amber-800 dark:text-amber-200">
                                            {unpaid_count} Students with Outstanding Balances
                                        </span>
                                    </div>
                                    <Badge variant="outline" className="border-amber-300 text-amber-700">
                                        Action Required
                                    </Badge>
                                </div>

                                <p className="text-amber-700 dark:text-amber-300">
                                    These students have unpaid balances for {data.academic_year} {getSemesterDisplay(currentSemester)}.
                                    They will be flagged as "On Hold" and cannot be auto-enrolled until balances are cleared.
                                </p>

                                <details className="group">
                                    <summary className="cursor-pointer text-sm font-medium text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100 flex items-center space-x-2">
                                        <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
                                        <span>View Unpaid Students & Payment History</span>
                                    </summary>

                                    <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                                        {unpaid_students.map((student) => (
                                            <Card key={student.id} className="border-amber-200 bg-white dark:bg-gray-800 dark:border-amber-800">
                                                <CardContent className="p-4">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div className="space-y-1">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white">
                                                                {student.name}
                                                            </h4>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                Student #: {student.student_number}
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                {student.academic_year} - {student.semester} Semester
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-red-600 dark:text-red-400">
                                                                ₱{student.balance.toLocaleString()}
                                                            </div>
                                                            <Badge variant="destructive" className="text-xs">
                                                                Outstanding
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {student.payments.length > 0 && (
                                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
                                                            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center space-x-2">
                                                                <DollarSign className="h-4 w-4" />
                                                                <span>Payment History</span>
                                                            </h5>
                                                            <div className="space-y-2 max-h-32 overflow-y-auto">
                                                                {student.payments.map((payment) => (
                                                                    <div key={payment.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-2 rounded text-xs">
                                                                        <div className="space-y-1">
                                                                            <div className="font-medium text-green-600 dark:text-green-400">
                                                                                +₱{payment.amount.toLocaleString()}
                                                                            </div>
                                                                            {payment.reference_number && (
                                                                                <div className="text-gray-500">
                                                                                    Ref: {payment.reference_number}
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div className="text-gray-500 text-right">
                                                                            {new Date(payment.payment_date).toLocaleDateString()}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                </details>
                            </AlertDescription>
                        </Alert>
                    )}
                    {errors.error && (
                        <div className="mb-4 text-center text-red-600 font-semibold">{errors.error}</div>
                    )}
                </div>

                {/* Modal for confirmation and password */}
                {showModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md">
                            <h2 className="text-lg font-bold mb-4 text-red-700 dark:text-red-400">Confirm Archive</h2>
                            <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to mark <span className="font-semibold">{data.academic_year} {getSemesterDisplay(currentSemester)}</span> as finished? This will archive all sections and grades for this period. <span className="font-semibold text-red-600">This action is irreversible.</span></p>
                            <form onSubmit={confirmArchive} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Archive Notes (Optional)
                                    </label>
                                    <textarea
                                        value={data.archive_notes}
                                        onChange={(e) => setData('archive_notes', e.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        placeholder="Add any notes about this archival..."
                                    />
                                    {errors.archive_notes && (
                                        <p className="mt-1 text-sm text-red-600">{errors.archive_notes}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full rounded-md border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                                        required
                                    />
                                    {errors.password && (
                                        <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                    )}
                                </div>
                                <div className="flex items-center justify-between gap-4 pt-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={data.force}
                                            onChange={(e) => setData('force', e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-sm">Force archive (override unpaid-student block)</span>
                                    </label>
                                    <div className="flex items-center gap-4">
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-700 text-sm font-medium"
                                        onClick={() => setShowModal(false)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
                                        disabled={processing}
                                    >
                                        {processing ? 'Archiving...' : 'Yes, Mark as Finished & Archive'}
                                    </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;