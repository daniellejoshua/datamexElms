import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'

export default function ShowPayment({ payment, student }) {
    const [showRecordForm, setShowRecordForm] = useState(false)
    
    const { data, setData, post, processing, errors } = useForm({
        amount: '',
        payment_method: 'cash',
        reference_number: '',
        payment_period: 'prelim',
    })

    const submitPayment = (e) => {
        e.preventDefault()
        post(`/registrar/payments/${payment.id}/record`, {
            onSuccess: () => {
                setShowRecordForm(false)
                setData({
                    amount: '',
                    payment_method: 'cash',
                    reference_number: '',
                    payment_period: 'prelim',
                })
            }
        })
    }

    const getPaymentStatus = () => {
        if (payment.balance <= 0) return 'Fully Paid'
        if (payment.total_paid > 0) return 'Partially Paid'
        return 'Pending'
    }

    const getStatusColor = () => {
        if (payment.balance <= 0) return 'text-green-600'
        if (payment.total_paid > 0) return 'text-orange-600'
        return 'text-red-600'
    }

    const isSHS = student?.education_level === 'shs'

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Payment Details - {student?.first_name} {student?.last_name}
                    </h2>
                    <div className="flex gap-2">
                        <SecondaryButton>
                            <Link href={`/registrar/students/${student?.id}/payments`} className="text-gray-700">
                                Back to Payments
                            </Link>
                        </SecondaryButton>
                        {payment.balance > 0 && (
                            <PrimaryButton onClick={() => setShowRecordForm(true)}>
                                Record Payment
                            </PrimaryButton>
                        )}
                    </div>
                </div>
            }
        >
            <Head title={`Payment Details - ${student?.first_name} ${student?.last_name}`} />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8 space-y-6">
                    {/* Student Info */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Student Information</h3>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p><strong>Name:</strong> {student?.first_name} {student?.middle_name} {student?.last_name}</p>
                                    <p><strong>Student Number:</strong> {student?.student_number}</p>
                                    <p><strong>Email:</strong> {student?.user?.email}</p>
                                </div>
                                <div>
                                    <p><strong>Program:</strong> {student?.program?.program_name}</p>
                                    <p><strong>Year Level:</strong> {student?.current_year_level}</p>
                                    <p><strong>Student Type:</strong> 
                                        <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                                            student?.student_type === 'irregular' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                                        }`}>
                                            {student?.student_type}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Payment Summary</h3>
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                                    <h4 className="font-medium text-blue-900 dark:text-blue-100">Total Fee</h4>
                                    <p className="text-2xl font-bold text-blue-600">
                                        ₱{Number(payment.total_semester_fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900 p-4 rounded-lg">
                                    <h4 className="font-medium text-green-900 dark:text-green-100">Total Paid</h4>
                                    <p className="text-2xl font-bold text-green-600">
                                        ₱{Number(payment.total_paid).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900 p-4 rounded-lg">
                                    <h4 className="font-medium text-red-900 dark:text-red-100">Balance</h4>
                                    <p className="text-2xl font-bold text-red-600">
                                        ₱{Number(payment.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 text-center">
                                <p className="text-lg">
                                    Status: <span className={`font-semibold ${getStatusColor()}`}>{getPaymentStatus()}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Payment Breakdown */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">
                                {isSHS ? 'Quarterly' : 'Period'} Payment Breakdown
                            </h3>
                            <div className="space-y-4">
                                {isSHS ? (
                                    // SHS Quarterly breakdown
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className={`p-4 rounded-lg ${payment.first_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">1st Quarter</span>
                                                <span className={payment.first_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.first_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.first_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.first_quarter_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.first_quarter_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.second_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">2nd Quarter</span>
                                                <span className={payment.second_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.second_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.second_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.second_quarter_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.second_quarter_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.third_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">3rd Quarter</span>
                                                <span className={payment.third_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.third_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.third_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.third_quarter_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.third_quarter_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.fourth_quarter_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">4th Quarter</span>
                                                <span className={payment.fourth_quarter_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.fourth_quarter_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.fourth_quarter_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.fourth_quarter_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.fourth_quarter_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    // College Period breakdown
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className={`p-4 rounded-lg ${payment.prelim_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Prelim Period</span>
                                                <span className={payment.prelim_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.prelim_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.prelim_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.prelim_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.prelim_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.midterm_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Midterm Period</span>
                                                <span className={payment.midterm_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.midterm_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.midterm_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.midterm_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.midterm_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.prefinal_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Pre-Final Period</span>
                                                <span className={payment.prefinal_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.prefinal_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.prefinal_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.prefinal_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.prefinal_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>

                                        <div className={`p-4 rounded-lg ${payment.final_paid ? 'bg-green-50' : 'bg-gray-50'}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Final Period</span>
                                                <span className={payment.final_paid ? 'text-green-600' : 'text-gray-600'}>
                                                    {payment.final_paid ? '✅ Paid' : '⏳ Pending'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                ₱{Number(payment.final_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </p>
                                            {payment.final_payment_date && (
                                                <p className="text-xs text-gray-500">
                                                    Paid: {new Date(payment.final_payment_date).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Recording Form */}
                    {showRecordForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-medium mb-4">
                                    Record Payment for {student?.first_name} {student?.last_name}
                                </h3>
                                
                                <form onSubmit={submitPayment} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="payment_period" value="Payment Period" />
                                        <select
                                            id="payment_period"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.payment_period}
                                            onChange={(e) => setData('payment_period', e.target.value)}
                                            required
                                        >
                                            {isSHS ? (
                                                <>
                                                    <option value="first_quarter">1st Quarter</option>
                                                    <option value="second_quarter">2nd Quarter</option>
                                                    <option value="third_quarter">3rd Quarter</option>
                                                    <option value="fourth_quarter">4th Quarter</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="prelim">Prelim Period</option>
                                                    <option value="midterm">Midterm Period</option>
                                                    <option value="prefinal">Pre-Final Period</option>
                                                    <option value="final">Final Period</option>
                                                </>
                                            )}
                                        </select>
                                        <InputError message={errors.payment_period} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="amount" value="Amount" />
                                        <TextInput
                                            id="amount"
                                            type="number"
                                            step="0.01"
                                            className="mt-1 block w-full"
                                            value={data.amount}
                                            onChange={(e) => setData('amount', e.target.value)}
                                            placeholder="0.00"
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
                                            <option value="bank_transfer">Bank Transfer</option>
                                            <option value="gcash">GCash</option>
                                            <option value="credit_card">Credit Card</option>
                                            <option value="installment">Installment</option>
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
                                            placeholder="Transaction reference"
                                        />
                                        <InputError message={errors.reference_number} className="mt-2" />
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <PrimaryButton type="submit" disabled={processing}>
                                            {processing ? 'Recording...' : 'Record Payment'}
                                        </PrimaryButton>
                                        <SecondaryButton 
                                            type="button" 
                                            onClick={() => setShowRecordForm(false)}
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