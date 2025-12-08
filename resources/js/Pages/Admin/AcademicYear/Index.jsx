
import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

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
                <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                    Academic Year Management
                </h2>
            }
        >
            <Head title="Academic Year Management" />
            <div className="py-12">
                <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow rounded-lg p-8">
                    <div className="mb-6">
                        <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
                            Current Academic Year: <span className="font-mono">{currentAcademicYear}</span>
                        </div>
                        <div className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
                            Current Semester: <span className="font-mono">{getSemesterDisplay(currentSemester)}</span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                            After archiving, the system will automatically advance to: <span className="font-mono font-semibold">{nextPeriod.year} - {getSemesterDisplay(nextPeriod.semester)}</span>
                        </div>
                    </div>
                    <div className="mb-8">
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md text-lg font-semibold shadow disabled:opacity-50"
                            onClick={handleArchive}
                            disabled={processing}
                        >
                            Archive {data.academic_year} {getSemesterDisplay(currentSemester)} & Advance to {nextPeriod.year} {getSemesterDisplay(nextPeriod.semester)}
                        </button>
                    </div>
                    {unpaid_count > 0 && (
                        <div className="max-w-2xl mx-auto mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                            <div className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                                There are <span className="font-semibold">{unpaid_count}</span> students with outstanding balances for {data.academic_year} {getSemesterDisplay(currentSemester)}. These students will be flagged as "On Hold" and cannot be auto-enrolled until balances are cleared.
                            </div>
                            <details className="mt-2">
                                <summary className="cursor-pointer text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:underline">
                                    View Unpaid Students & Payment History
                                </summary>
                                <div className="mt-3 space-y-3">
                                    {unpaid_students.map((student) => (
                                        <div key={student.id} className="bg-white dark:bg-gray-800 p-3 rounded border border-yellow-300 dark:border-yellow-600">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-gray-100">{student.name}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">Student #: {student.student_number}</div>
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">{student.academic_year} - {student.semester} Semester</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-bold text-red-600 dark:text-red-400">₱{student.balance}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">Outstanding</div>
                                                </div>
                                            </div>
                                            {student.payments.length > 0 && (
                                                <div className="mt-2">
                                                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment History:</div>
                                                    <div className="space-y-1 max-h-32 overflow-y-auto">
                                                        {student.payments.map((payment) => (
                                                            <div key={payment.id} className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded flex justify-between">
                                                                <div>
                                                                    <span className="font-medium">₱{payment.amount}</span>
                                                                    {payment.reference_number && <span className="ml-2 text-gray-500">Ref: {payment.reference_number}</span>}
                                                                </div>
                                                                <div className="text-gray-500">
                                                                    {new Date(payment.payment_date).toLocaleDateString()}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </details>
                        </div>
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