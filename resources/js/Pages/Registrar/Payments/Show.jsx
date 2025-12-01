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
                <div className="flex items-center gap-4">
                    <SecondaryButton>
                        <Link href="/registrar/payments" className="text-gray-700">
                            Back to Payments
                        </Link>
                    </SecondaryButton>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Payment Details
                    </h2>
                </div>
            }
        >
            <Head title="Payment Details" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* Payment Summary */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">
                                            {getPaymentIcon(payment.status)}
                                        </span>
                                        <h3 className="text-2xl font-bold">
                                            {payment.student?.first_name} {payment.student?.last_name}
                                        </h3>
                                        <span className={getStatusBadge(payment.status)}>
                                            {payment.status}
                                        </span>
                                    </div>
                                    
                                    {isIrregularStudent && (
                                        <div className="flex items-center gap-2">
                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                                {payment.student?.student_type} Student
                                            </span>
                                            <span className="text-sm text-gray-600">
                                                Special payment considerations may apply
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {payment.balance > 0 && (
                                    <PrimaryButton onClick={() => setShowRecordDialog(true)}>
                                        Record Payment
                                    </PrimaryButton>
                                )}
                            </div>

                            <div className="grid gap-6 md:grid-cols-2">
                                {/* Student Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Student Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Student Number:</strong> {payment.student?.student_number}</p>
                                        <p><strong>Email:</strong> {payment.student?.user?.email}</p>
                                        <p><strong>Program:</strong> {payment.student?.program?.program_code} - {payment.student?.program?.program_name}</p>
                                        <p><strong>Year Level:</strong> {payment.year_level}</p>
                                        <p><strong>Student Type:</strong> {payment.student?.student_type || 'Regular'}</p>
                                    </div>
                                </div>

                                {/* Payment Information */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300">Payment Information</h4>
                                    <div className="space-y-2 text-sm">
                                        <p><strong>Academic Year:</strong> {payment.academic_year}</p>
                                        <p><strong>Semester:</strong> {payment.semester}</p>
                                        <p><strong>Due Date:</strong> {new Date(payment.due_date).toLocaleDateString()}</p>
                                        <p><strong>Payment Type:</strong> {payment.payment_type}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Payment Breakdown</h4>
                            
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount</p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            ₱{Number(payment.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            ₱{Number(payment.amount_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    
                                    <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding Balance</p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                            ₱{Number(payment.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>

                                {payment.status === 'overdue' && (
                                    <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                                        <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">⚠️ Payment Overdue</h5>
                                        <p className="text-sm text-red-700 dark:text-red-200">
                                            This payment is past the due date. Please collect payment immediately or contact the student 
                                            to arrange a payment plan. Late fees may apply according to school policy.
                                        </p>
                                    </div>
                                )}

                                {isIrregularStudent && payment.balance > 0 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded-lg">
                                        <h5 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Irregular Student Payment Notes</h5>
                                        <p className="text-sm text-yellow-700 dark:text-yellow-200">
                                            This student has special circumstances that may affect their payment schedule. 
                                            Review individual payment arrangements, installment plans, or adjusted fee structures.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    {payment.payment_records && payment.payment_records.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="p-6">
                                <h4 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4">Payment History</h4>
                                
                                <div className="space-y-3">
                                    {payment.payment_records.map((record, index) => (
                                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div>
                                                <p className="font-medium">
                                                    ₱{Number(record.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {record.payment_method} • {new Date(record.payment_date).toLocaleDateString()}
                                                </p>
                                                {record.reference_number && (
                                                    <p className="text-xs text-gray-500">Ref: {record.reference_number}</p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                                                    Recorded
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Record Payment Dialog */}
                    {showRecordDialog && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-medium mb-4">
                                    Record Payment for {payment.student?.first_name} {payment.student?.last_name}
                                </h3>
                                
                                <form onSubmit={recordPayment} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="amount" value="Payment Amount" />
                                        <TextInput
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            max={payment.balance}
                                            className="mt-1 block w-full"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder={`Max: ₱${Number(payment.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                                            required
                                        />
                                        <InputError message={errors.amount} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="payment_method" value="Payment Method" />
                                        <select
                                            id="payment_method"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.payment_method}
                                            onChange={(e) => setData('payment_method', e.target.value)}
                                            required
                                        >
                                            <option value="cash">Cash</option>
                                            <option value="check">Check</option>
                                            <option value="credit_card">Credit Card</option>
                                            <option value="debit_card">Debit Card</option>
                                            <option value="online_banking">Online Banking</option>
                                            <option value="bank_transfer">Bank Transfer</option>
                                        </select>
                                        <InputError message={errors.payment_method} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="reference_number" value="Reference Number (Optional)" />
                                        <TextInput
                                            id="reference_number"
                                            className="mt-1 block w-full"
                                            value={data.reference_number}
                                            onChange={(e) => setData('reference_number', e.target.value)}
                                            placeholder="Transaction ID, Check No., etc."
                                        />
                                        <InputError message={errors.reference_number} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="notes" value="Notes (Optional)" />
                                        <textarea
                                            id="notes"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            rows="3"
                                            value={data.notes}
                                            onChange={(e) => setData('notes', e.target.value)}
                                            placeholder="Additional notes about this payment..."
                                        />
                                        <InputError message={errors.notes} className="mt-2" />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <PrimaryButton type="submit" disabled={processing}>
                                            {processing ? 'Recording...' : 'Record Payment'}
                                        </PrimaryButton>
                                        <SecondaryButton 
                                            type="button" 
                                            onClick={() => {
                                                setShowRecordDialog(false)
                                                reset()
                                            }}
                                        >
                                            Cancel
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}