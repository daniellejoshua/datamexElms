import React from 'react';
import { Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    CreditCard,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    Calendar,
    DollarSign,
    Receipt,
    Clock,
    ArrowLeft
} from 'lucide-react';

const Index = ({ currentPayment, paymentHistory, transactions, stats, currentAcademicInfo }) => {
    const getPaymentStatusColor = (balance) => {
        if (balance === 0) return 'text-green-600';
        if (balance > 0) return 'text-red-600';
        return 'text-gray-600';
    };

    const getPaymentStatusText = (balance) => {
        if (balance === 0) return 'Fully Paid';
        if (balance > 0) return 'Outstanding Balance';
        return 'Overpaid';
    };

    const getPaymentStatusBadge = (balance) => {
        if (balance === 0) return 'bg-green-100 text-green-800';
        if (balance > 0) return 'bg-red-100 text-red-800';
        return 'bg-blue-100 text-blue-800';
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
            case 'tuition': return 'bg-blue-100 text-blue-800';
            case 'miscellaneous': return 'bg-purple-100 text-purple-800';
            case 'laboratory': return 'bg-orange-100 text-orange-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => router.visit(route('student.dashboard'))}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Dashboard
                        </button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">My Payments</h2>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title="My Payments" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-8">
                    {/* Welcome Section */}
                    <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="bg-green-100 p-3 rounded-full">
                                    <CreditCard className="w-8 h-8 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Payment Dashboard
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Track your payment history and manage your account balance
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className={`text-2xl font-bold ${getPaymentStatusColor(stats.balance)}`}>
                                        ₱{stats.balance?.toLocaleString() || '0'}
                                    </div>
                                    <div className="text-sm text-gray-500">Current Balance</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Current Balance</p>
                                        <p className={`text-3xl font-bold ${getPaymentStatusColor(stats.balance)}`}>
                                            ₱{stats.balance?.toLocaleString() || '0'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {getPaymentStatusText(stats.balance)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-100 rounded-full">
                                        <DollarSign className="w-6 h-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Total Paid</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            ₱{stats.totalPaid?.toLocaleString() || '0'}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            This semester
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-100 rounded-full">
                                        <CheckCircle className="w-6 h-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-600">Transactions</p>
                                        <p className="text-3xl font-bold text-purple-600">
                                            {stats.totalTransactions}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Total payments made
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-100 rounded-full">
                                        <Receipt className="w-6 h-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Current Semester Payment Details */}
                    {currentPayment && (
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-blue-600" />
                                    Current Semester Payment
                                </CardTitle>
                                <CardDescription>
                                    Payment details for {getSemesterDisplay(currentAcademicInfo?.semester)} {currentAcademicInfo?.year}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
                                        <p className="text-sm font-medium text-gray-600 mb-2">Total Amount</p>
                                        <p className="text-3xl font-bold text-gray-900">
                                            ₱{currentPayment.total_amount?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                                        <p className="text-sm font-medium text-green-600 mb-2">Amount Paid</p>
                                        <p className="text-3xl font-bold text-green-600">
                                            ₱{currentPayment.total_paid?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                    <div className={`p-6 rounded-xl border ${stats.balance > 0 ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-200' : 'bg-gradient-to-br from-green-50 to-green-100 border-green-200'}`}>
                                        <p className={`text-sm font-medium mb-2 ${stats.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                            Balance
                                        </p>
                                        <p className={`text-3xl font-bold ${getPaymentStatusColor(stats.balance)}`}>
                                            ₱{stats.balance?.toLocaleString() || '0'}
                                        </p>
                                    </div>
                                </div>

                            {stats.balance > 0 && (
                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                                        <div>
                                            <p className="font-medium text-yellow-800">Outstanding Balance</p>
                                            <p className="text-sm text-yellow-700">
                                                You have an outstanding balance of ₱{stats.balance?.toLocaleString()}.
                                                Please contact the registrar to settle your payments.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {stats.balance === 0 && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                        <div>
                                            <p className="font-medium text-green-800">All Payments Up to Date</p>
                                            <p className="text-sm text-green-700">
                                                Great job! Your payments for this semester are fully settled.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                    {/* Payment History */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                Payment History
                            </CardTitle>
                            <CardDescription>
                                Your payment records across all semesters
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {paymentHistory && paymentHistory.length > 0 ? (
                                <div className="space-y-6">
                                    {paymentHistory.map((payment) => (
                                        <div key={payment.id} className="p-6 border border-gray-200 rounded-xl hover:shadow-sm transition-shadow bg-gradient-to-r from-gray-50 to-white">
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        {getSemesterDisplay(payment.semester)} {payment.academic_year}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        Total: ₱{payment.total_amount?.toLocaleString() || '0'} • 
                                                        Paid: ₱{payment.total_paid?.toLocaleString() || '0'}
                                                    </p>
                                                </div>
                                                <Badge className={getPaymentStatusBadge(payment.balance)}>
                                                    {getPaymentStatusText(payment.balance)}
                                                </Badge>
                                            </div>

                                            {payment.balance > 0 && (
                                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-sm text-red-700">
                                                        Outstanding: ₱{payment.balance?.toLocaleString()}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                        <CreditCard className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment History</h3>
                                    <p className="text-gray-500">Your payment records will appear here once payments are processed.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Receipt className="w-5 h-5 text-purple-600" />
                                Recent Transactions
                            </CardTitle>
                            <CardDescription>
                                Your latest payment transactions and receipts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {transactions && transactions.data && transactions.data.length > 0 ? (
                                <div className="space-y-6">
                                    {transactions.data.map((transaction) => (
                                        <div key={transaction.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl hover:shadow-sm transition-shadow">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-blue-100 rounded-xl">
                                                    <Receipt className="w-6 h-6 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">
                                                        ₱{transaction.amount?.toLocaleString() || '0'}
                                                    </h4>
                                                    <p className="text-sm text-gray-600">
                                                        {transaction.description || 'Payment'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(transaction.created_at).toLocaleDateString()} at {new Date(transaction.created_at).toLocaleTimeString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge className={getTransactionTypeColor(transaction.payment_type || 'miscellaneous')}>
                                                    {transaction.payment_type || 'Payment'}
                                                </Badge>
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Ref: {transaction.reference_number || transaction.id}
                                                </p>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Pagination */}
                                    {transactions.links && transactions.links.length > 3 && (
                                        <div className="flex justify-center mt-8">
                                            <div className="flex space-x-2">
                                                {transactions.links.map((link, index) => (
                                                    link.url ? (
                                                        <Link
                                                            key={index}
                                                            href={link.url}
                                                            className={`px-4 py-2 text-sm border rounded-lg transition-colors ${
                                                                link.active
                                                                    ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                                                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                                                            }`}
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    ) : (
                                                        <span
                                                            key={index}
                                                            className="px-4 py-2 text-sm border rounded-lg bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                                        />
                                                    )
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-16">
                                    <div className="p-6 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                        <Receipt className="w-10 h-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">No Transactions</h3>
                                    <p className="text-gray-500 max-w-md mx-auto">Your payment transactions will appear here once payments are processed.</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
};

export default Index;