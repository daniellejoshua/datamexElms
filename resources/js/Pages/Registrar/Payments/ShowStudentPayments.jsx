import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'

export default function PaymentShow({ student, payments = [] }) {
    const getStatusBadge = (status) => {
        const variants = {
            pending: 'bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm',
            partial: 'bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm',
            paid: 'bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm',
        }
        return variants[status] || 'bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm'
    }

    const getPaymentIcon = (status) => {
        if (status === 'paid') return '✅'
        if (status === 'partial') return '🕐'
        return '💰'
    }

    const isIrregularStudent = student?.student_type === 'irregular' || 
                              student?.student_type === 'transferee' || 
                              student?.student_type === 'returnee'

    const isSHS = student?.education_level === 'shs'

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Payment Records - {student?.first_name} {student?.last_name}
                    </h2>
                    <div className="flex gap-2">
                        <SecondaryButton>
                            <Link href="/registrar/payments" className="text-gray-700">
                                Back to Payments
                            </Link>
                        </SecondaryButton>
                    </div>
                </div>
            }
        >
            <Head title={`Payments - ${student?.first_name} ${student?.last_name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-6xl sm:px-6 lg:px-8 space-y-6">
                    {/* Student Info */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Student Information</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <p><strong>Name:</strong> {student?.first_name} {student?.middle_name} {student?.last_name}</p>
                                    <p><strong>Student Number:</strong> {student?.student_number}</p>
                                </div>
                                <div>
                                    <p><strong>Program:</strong> {student?.program?.program_name}</p>
                                    <p><strong>Year Level:</strong> {student?.current_year_level}</p>
                                </div>
                                <div>
                                    <p><strong>Student Type:</strong> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                            isIrregularStudent ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {student?.student_type}
                                        </span>
                                    </p>
                                    <p><strong>Education Level:</strong> {isSHS ? 'Senior High School' : 'College'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Records */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-medium">Payment Records</h3>
                                <div className="text-sm text-gray-500">
                                    Total Records: {payments.length}
                                </div>
                            </div>

                            {payments.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-gray-400 text-lg mb-2">💰</div>
                                    <p className="text-gray-500">No payment records found for this student.</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Payment records will appear here once enrollment is processed.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {payments.map((payment, index) => (
                                        <div key={payment.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-lg">
                                                        Academic Year {payment.academic_year} - Semester {payment.semester}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {isSHS ? 'SHS' : 'College'} Payment Record
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className={getStatusBadge(payment.payment_status)}>
                                                        {getPaymentIcon(payment.payment_status)} {payment.payment_status}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3 mb-4">
                                                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                                                    <h5 className="font-medium text-blue-900 dark:text-blue-100">Total Fee</h5>
                                                    <p className="text-xl font-bold text-blue-600">
                                                        ₱{Number(payment.total_semester_fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                                                    <h5 className="font-medium text-green-900 dark:text-green-100">Total Paid</h5>
                                                    <p className="text-xl font-bold text-green-600">
                                                        ₱{Number(payment.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                                                    <h5 className="font-medium text-red-900 dark:text-red-100">Balance</h5>
                                                    <p className="text-xl font-bold text-red-600">
                                                        ₱{Number(payment.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Period/Quarter Breakdown */}
                                            <div className="border-t pt-4">
                                                <h5 className="font-medium mb-3">
                                                    {isSHS ? 'Quarterly Payment Status' : 'Period Payment Status'}
                                                </h5>
                                                <div className="grid gap-3 md:grid-cols-2">
                                                    {isSHS ? (
                                                        // SHS Quarters
                                                        <>
                                                            <div className={`p-3 rounded-lg ${payment.first_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">1st Quarter</span>
                                                                    <span className={payment.first_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.first_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.first_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.second_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">2nd Quarter</span>
                                                                    <span className={payment.second_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.second_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.second_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.third_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">3rd Quarter</span>
                                                                    <span className={payment.third_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.third_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.third_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.fourth_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">4th Quarter</span>
                                                                    <span className={payment.fourth_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.fourth_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.fourth_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </>
                                                    ) : (
                                                        // College Periods
                                                        <>
                                                            <div className={`p-3 rounded-lg ${payment.prelim_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Prelim Period</span>
                                                                    <span className={payment.prelim_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.prelim_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.prelim_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.midterm_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Midterm Period</span>
                                                                    <span className={payment.midterm_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.midterm_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.midterm_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.prefinal_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Pre-Final Period</span>
                                                                    <span className={payment.prefinal_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.prefinal_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.prefinal_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>

                                                            <div className={`p-3 rounded-lg ${payment.final_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Final Period</span>
                                                                    <span className={payment.final_paid ? 'text-green-600' : 'text-gray-600'}>
                                                                        {payment.final_paid ? '✅ Paid' : '⏳ Pending'}
                                                                    </span>
                                                                </div>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    ₱{Number(payment.final_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>

                                            {payment.balance > 0 && (
                                                <div className="mt-4 flex justify-end">
                                                    <Link 
                                                        href={`/registrar/payments/${payment.id}/details`}
                                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        Manage Payment
                                                    </Link>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}