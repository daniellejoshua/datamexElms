import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import { route } from 'ziggy-js';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    CreditCard,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Calendar,
    DollarSign,
    Receipt,
    Clock,
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    GraduationCap,
    FileText,
    Calculator,
    Loader2
} from 'lucide-react';

const Index = ({ currentPayment, paymentHistory, stats, currentAcademicInfo, student }) => {
    // Modal states for balance calculation
    const [showCalculationModal, setShowCalculationModal] = useState(false);
    const [calculationData, setCalculationData] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const formatCurrency = (amount) => {
        const numAmount = Number(amount);
        if (isNaN(numAmount)) {
            return '₱0.00';
        }
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(numAmount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const getPaymentStatusColor = (balance) => {
        const isShs = student?.education_level === 'senior_high';
        const hasVoucher = student?.has_voucher;
        const numericBalance = Number(balance);

        if (numericBalance === 0) {
            if (isShs && hasVoucher) return 'text-blue-600'; // Voucher status
            return 'text-green-600'; // Paid/Fully Paid
        }
        if (numericBalance > 0) return 'text-red-600';
        // For negative balance
        if (isShs && hasVoucher) return 'text-blue-600'; // Voucher status
        return 'text-gray-600';
    };

    const getPaymentStatusText = (balance) => {
        const isShs = student?.education_level === 'senior_high';
        const hasVoucher = student?.has_voucher;
        const numericBalance = Number(balance);

        if (numericBalance === 0) {
            if (isShs && hasVoucher) return 'Voucher';
            if (isShs) return 'Paid';
            return 'Fully Paid';
        }
        if (numericBalance > 0) return 'Outstanding Balance';
        // For negative balance (overpaid), show Paid for SHS with voucher, Overpaid otherwise
        if (isShs && hasVoucher) return 'Voucher';
        return 'Overpaid';
    };

    const getPaymentStatusBadge = (balance) => {
        const isShs = student?.education_level === 'senior_high';
        const hasVoucher = student?.has_voucher;
        const numericBalance = Number(balance);

        if (numericBalance === 0) {
            if (isShs && hasVoucher) return 'bg-blue-100 text-blue-800 border-blue-200'; // Voucher badge
            return 'bg-green-100 text-green-800 border-green-200'; // Paid/Fully Paid badge
        }
        if (numericBalance > 0) return 'bg-red-100 text-red-800 border-red-200';
        // For negative balance
        if (isShs && hasVoucher) return 'bg-blue-100 text-blue-800 border-blue-200'; // Voucher badge
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getSemesterDisplay = (semester) => {
        const semesters = {
            '1st': 'First Semester',
            '2nd': 'Second Semester',
            'summer': 'Summer'
        };
        return semesters[semester] || semester;
    };

    const getTransactionTypeColor = (type) => {
        switch (type) {
            case 'tuition': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'miscellaneous': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'laboratory': return 'bg-orange-100 text-orange-800 border-orange-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'partial': 'bg-blue-100 text-blue-800 border-blue-200',
            'paid': 'bg-green-100 text-green-800 border-green-200',
            'completed': 'bg-green-100 text-green-800 border-green-200',
            'overdue': 'bg-red-100 text-red-800 border-red-200'
        }
        return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const handleShowCalculation = async (payment) => {
        setSelectedPayment(payment);
        setIsCalculating(true);
        setShowCalculationModal(true);

        try {
            const response = await axios.get(route('student.payments.calculate-irregular', payment.id));
            if (response.data.success) {
                setCalculationData(response.data);
            } else {
                toast.error('Failed to load calculation details');
            }
        } catch (error) {
            console.error('Error loading calculation:', error);
            toast.error('Error loading calculation details');
        } finally {
            setIsCalculating(false);
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => router.visit(route('student.dashboard'))}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Dashboard
                    </button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">My Payment Details</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View comprehensive payment records and transaction history</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My Payments" />

            <div className="space-y-6">
                {/* Student Information Card */}
                <Card className="mt-6 mx-6">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                                <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">My Information</CardTitle>
                                <CardDescription>Personal and enrollment details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <User className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{student?.user?.name || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Number</p>
                                    <p className="font-mono font-semibold text-gray-900 mt-0.5">{student?.student_number || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <GraduationCap className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">
                                        {student?.program?.program_name || student?.program?.name || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {student?.program?.program_code || ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                    <Mail className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                                    <p className="font-medium text-gray-900 mt-0.5 break-all">{student?.user?.email || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-pink-100 rounded-lg">
                                    <Phone className="w-4 h-4 text-pink-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                                    <p className="font-medium text-gray-900 mt-0.5">{student?.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year Level</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{student?.year_level || 'N/A'}</p>
                                </div>
                            </div>

                            {student?.education_level === 'senior_high' && (
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-1.5 bg-teal-100 rounded-lg">
                                        <Receipt className="w-4 h-4 text-teal-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Voucher</p>
                                        <p className="font-semibold text-gray-900 mt-0.5">
                                            {student?.has_voucher ? (
                                                <span className="text-green-600">Active</span>
                                            ) : (
                                                <span className="text-gray-500">Not Available</span>
                                            )}
                                        </p>
                                        {student?.voucher_id && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                ID: {student.voucher_id}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Records */}
                <Card className="mt-6 mx-6">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            Payment Records by Semester
                        </CardTitle>
                        <CardDescription>
                            View payment details organized by academic year and semester
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="multiple" className="w-full">
                            {paymentHistory && paymentHistory.map((payment) => (
                                <AccordionItem key={payment.id} value={`payment-${payment.id}`}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full mr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <CreditCard className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900">
                                                        {payment.academic_year} - {getSemesterDisplay(payment.semester)}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Total: {formatCurrency(payment.calculated_total_amount ?? payment.total_semester_fee)} • Paid: {formatCurrency(payment.total_paid)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={`${getPaymentStatusBadge(payment.balance)} text-sm px-3 py-1`}>
                                                {getPaymentStatusText(payment.balance).toUpperCase()}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="space-y-6">
                                            {/* Payment Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Fee</p>
                                                    <p className="text-lg font-bold">{formatCurrency(payment.calculated_total_amount ?? (student.student_type === 'regular' ? payment.total_semester_fee : (payment.total_amount || 0)))}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Paid</p>
                                                    <p className="text-lg font-bold text-green-600">{formatCurrency(payment.total_paid || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Balance</p>
                                                    <p className="text-lg font-bold text-orange-600">{formatCurrency(payment.balance || 0)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-500">Status</p>
                                                    <Badge className={getPaymentStatusBadge(payment.balance)}>
                                                        {getPaymentStatusText(payment.balance)}
                                                    </Badge>
                                                </div>
                                            </div>
                                            {/* Balance Calculation Button - show for irregular students OR transferees with credit transfers/previous_school */}
                                            {(student.student_type !== 'regular' || student.previous_school || (student.creditTransfers && student.creditTransfers.length > 0)) && (
                                                <div className="flex justify-center">
                                                    <Button
                                                        onClick={() => handleShowCalculation(payment)}
                                                        variant="outline"
                                                        className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100"
                                                    >
                                                        <Calculator className="w-4 h-4 mr-2" />
                                                        View Balance Calculation
                                                    </Button>
                                                </div>
                                            )}
                                            <div>
                                                <div className="flex items-center gap-2 mb-4">
                                                    <div className="p-1.5 bg-blue-100 rounded">
                                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <h4 className="font-semibold text-lg text-gray-900">Transaction History</h4>
                                                </div>
                                                {payment.payment_transactions && payment.payment_transactions.length > 0 ? (
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50">
                                                                <tr className="border-b">
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reference</th>
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                                                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                                                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {payment.payment_transactions.map((transaction) => (
                                                                    <tr key={transaction.id} className="border-b hover:bg-gray-50">
                                                                        <td className="py-3 px-4 text-sm">
                                                                            {formatDate(transaction.payment_date)}
                                                                        </td>
                                                                        <td className="py-3 px-4">
                                                                            <span className="font-mono text-sm">{transaction.reference_number}</span>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-sm">
                                                                            <div>
                                                                                <p className="font-medium">{transaction.description}</p>
                                                                                {transaction.notes && (
                                                                                    <p className="text-xs text-gray-500">{transaction.notes}</p>
                                                                                )}
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-right font-medium text-green-600">
                                                                            {formatCurrency(transaction.amount)}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center">
                                                                            <Badge className={getStatusColor(transaction.status)}>
                                                                                {transaction.status}
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : student?.education_level === 'senior_high' && student?.has_voucher ? (
                                                    <div className="overflow-x-auto border rounded-lg">
                                                        <table className="w-full">
                                                            <thead className="bg-gray-50">
                                                                <tr className="border-b">
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Reference</th>
                                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                                                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                                                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr className="border-b hover:bg-gray-50">
                                                                    <td className="py-3 px-4 text-sm">
                                                                        {formatDate(student?.enrolled_date || new Date())}
                                                                    </td>
                                                                    <td className="py-3 px-4">
                                                                        <span className="font-mono text-sm">{student?.voucher_id || 'VOUCHER'}</span>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-sm">
                                                                        <div>
                                                                            <p className="font-medium">Voucher Enrollment</p>
                                                                            <p className="text-xs text-gray-500">Fees covered by active voucher</p>
                                                                        </div>
                                                                    </td>
                                                                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                                                                        {formatCurrency(payment.calculated_total_amount ?? (student.student_type === 'regular' ? payment.total_semester_fee : (payment.total_amount || 0)))}
                                                                    </td>
                                                                    <td className="py-3 px-4 text-center">
                                                                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                                                                            Voucher
                                                                        </Badge>
                                                                    </td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                        <p>No transactions recorded for this semester</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </CardContent>
                </Card>
                {(!paymentHistory || paymentHistory.length === 0) && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Records</h3>
                            <p className="text-gray-500">This student has no payment records yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Balance Calculation Modal */}
            <Dialog open={showCalculationModal} onOpenChange={setShowCalculationModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Calculator className="w-5 h-5 text-orange-600" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">Balance Calculation Breakdown</p>
                                <p className="text-sm text-gray-500">
                                    {selectedPayment && `${selectedPayment.academic_year} - ${getSemesterDisplay(selectedPayment.semester)}`}
                                </p>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        {isCalculating ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-orange-600" />
                                    <p className="text-gray-600">Calculating balance breakdown...</p>
                                </div>
                            </div>
                        ) : calculationData ? (
                            <div className="space-y-6">
                                {/* Student Info */}
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <User className="w-4 h-4 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{student.user.name}</p>
                                            <p className="text-sm text-gray-600">Student Number: {student.student_number}</p>
                                            <p className="text-sm text-gray-600">Current Year Level: {calculationData.details?.current_year_level || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Calculation Components */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Past Year Subjects */}
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-red-100 rounded">
                                                <FileText className="w-4 h-4 text-red-600" />
                                            </div>
                                            <h3 className="font-semibold text-red-800">Past Year Subjects</h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-red-700">
                                                <span className="font-medium">{calculationData.details?.past_year_subjects_count || 0}</span> subjects × ₱300
                                            </p>
                                            <p className="text-lg font-bold text-red-800">
                                                +{formatCurrency(calculationData.details?.past_year_subjects_fee || 0)}
                                            </p>
                                            {calculationData.details?.past_year_subjects?.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {calculationData.details.past_year_subjects.map((subject, idx) => (
                                                        <div key={idx} className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                                                            {subject.code}: {subject.name} (Year {subject.year_level})
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Base Fee */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-blue-100 rounded">
                                                <DollarSign className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-blue-800">
                                                {student.education_level === 'senior_high' ? 'Base Year Level Fee' : 'Base Semester Fee'}
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-blue-700">
                                                {student.education_level === 'senior_high' ? 'Regular year level tuition' : 'Regular semester tuition'}
                                            </p>
                                            <p className="text-lg font-bold text-blue-800">
                                                +{formatCurrency(calculationData.details?.base_fee || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Credited Subjects */}
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="p-1.5 bg-green-100 rounded">
                                                <GraduationCap className="w-4 h-4 text-green-600" />
                                            </div>
                                            <h3 className="font-semibold text-green-800">
                                                Already Credited Subjects on This {student.education_level === 'senior_high' ? 'Year Level' : 'Semester'}
                                            </h3>
                                        </div>
                                        <div className="space-y-2">
                                            <p className="text-sm text-green-700">
                                                <span className="font-medium">{calculationData.details?.credited_subjects_count || 0}</span> credits × ₱300
                                            </p>
                                            <p className="text-lg font-bold text-green-800">
                                                -{formatCurrency(calculationData.details?.credited_subjects_deduction || 0)}
                                            </p>
                                            {calculationData.details?.credited_subjects?.length > 0 && (
                                                <div className="mt-3 space-y-1">
                                                    {calculationData.details.credited_subjects.map((subject, idx) => (
                                                        <div key={idx} className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded">
                                                            {subject.code}: {subject.name} ({subject.units} units)
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Final Calculation */}
                                <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
                                    <div className="text-center">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">Final Balance Calculation</h3>
                                        <div className="bg-white rounded-lg p-4 border-2 border-dashed border-purple-300">
                                            <p className="text-lg text-gray-700 mb-2">{calculationData.breakdown || 'N/A'}</p>
                                            <p className="text-3xl font-bold text-purple-800">
                                                = {formatCurrency(calculationData.calculated_balance || 0)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500">
                                <Calculator className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <p>Failed to load calculation details</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            onClick={() => setShowCalculationModal(false)}
                            variant="outline"
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    );
};

export default Index;