import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Calendar, FileText, DollarSign, CreditCard } from 'lucide-react'

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'N/A';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'N/A';
};

export default function CollegePaymentShow({ student, payments, auth }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount)
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

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

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <Button
                        asChild
                        variant="ghost"
                        size="sm"
                        className="text-gray-600 hover:text-gray-900"
                    >
                        <Link href={route('registrar.payments.college.index')}>
                            <ArrowLeft className="w-4 h-4 mr-1" />
                            Back to Payments
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="bg-blue-100 p-2 rounded-lg">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Student Payment Details</h2>
                        <p className="text-sm text-blue-600">
                            {student.user.name} • {student.student_number}
                        </p>
                    </div>
                </div>
            }
        >
            <Head title={`Payment Details - ${student.user.name}`} />

            <div className="space-y-6">
                {/* Student Information Card */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500 rounded-lg">
                                <GraduationCap className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Student Information</CardTitle>
                                <CardDescription>Complete student profile and enrollment details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <User className="w-5 h-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Full Name</p>
                                    <p className="font-semibold text-gray-900 mt-1">{student.user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Number</p>
                                    <p className="font-mono font-semibold text-gray-900 mt-1">{student.student_number}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <GraduationCap className="w-5 h-5 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Program</p>
                                    <p className="font-semibold text-gray-900 mt-1">
                                        {student.program?.program_name || student.program?.name || 'N/A'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {student.program?.program_code || ''}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Mail className="w-5 h-5 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                                    <p className="font-medium text-gray-900 mt-1 break-all">{student.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-pink-100 rounded-lg">
                                    <Phone className="w-5 h-5 text-pink-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                                    <p className="font-medium text-gray-900 mt-1">{student.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Calendar className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year Level</p>
                                    <p className="font-semibold text-gray-900 mt-1">{student.year_level || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Records */}
                {payments.map(payment => (
                    <Card key={payment.id} className="shadow-md hover:shadow-lg transition-shadow">
                        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-500 rounded-lg">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-xl">
                                            {payment.academic_year} - {payment.semester} Semester
                                        </CardTitle>
                                        <CardDescription>
                                            Complete payment breakdown and transaction history
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className={`${getStatusColor(payment.status)} text-sm px-4 py-1.5`}>
                                    {payment.status?.toUpperCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            {/* Payment Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                <div>
                                    <p className="text-sm text-gray-500">Total Fee</p>
                                    <p className="text-lg font-bold">{formatCurrency(payment.total_semester_fee)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Paid</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(payment.total_paid)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Balance</p>
                                    <p className="text-lg font-bold text-orange-600">{formatCurrency(payment.balance)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Payment Plan</p>
                                    <p className="text-lg font-medium capitalize">{payment.payment_plan}</p>
                                </div>
                            </div>

                            {/* Payment Breakdown */}
                            <div className="mb-8">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-indigo-100 rounded">
                                        <FileText className="w-4 h-4 text-indigo-600" />
                                    </div>
                                    <h4 className="font-semibold text-lg text-gray-900">Payment Breakdown by Term</h4>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Enrollment Fee', amount: payment.enrollment_fee, paid: payment.enrollment_paid, date: payment.enrollment_payment_date },
                                        { label: 'Prelim', amount: payment.prelim_amount, paid: payment.prelim_paid, date: payment.prelim_payment_date },
                                        { label: 'Midterm', amount: payment.midterm_amount, paid: payment.midterm_paid, date: payment.midterm_payment_date },
                                        { label: 'Pre-final', amount: payment.prefinal_amount, paid: payment.prefinal_paid, date: payment.prefinal_payment_date },
                                        { label: 'Final', amount: payment.final_amount, paid: payment.final_paid, date: payment.final_payment_date },
                                    ].filter(term => term.amount > 0).map(term => (
                                        <div key={term.label} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white border-2 rounded-lg hover:shadow-md transition-all">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w-3 h-3 rounded-full ${term.paid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                                    <p className="font-semibold text-gray-900">{term.label}</p>
                                                </div>
                                                {term.date && (
                                                    <p className="text-sm text-gray-500 ml-5">
                                                        <Calendar className="w-3 h-3 inline mr-1" />
                                                        Paid on: {formatDate(term.date)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-3 md:mt-0">
                                                <span className="text-lg font-bold text-gray-900">{formatCurrency(term.amount)}</span>
                                                <Badge className={`${term.paid ? getStatusColor('paid') : getStatusColor('pending')} px-3 py-1`}>
                                                    {term.paid ? '✓ Paid' : 'Pending'}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Transaction History */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-1.5 bg-blue-100 rounded">
                                        <CreditCard className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h4 className="font-semibold text-lg text-gray-900">Transaction History</h4>
                                    {payment.payment_transactions && payment.payment_transactions.length > 0 && (
                                        <Badge variant="secondary" className="ml-auto">
                                            {payment.payment_transactions.length} {payment.payment_transactions.length === 1 ? 'Transaction' : 'Transactions'}
                                        </Badge>
                                    )}
                                </div>
                                {payment.payment_transactions && payment.payment_transactions.length > 0 ? (
                                    <div className="overflow-x-auto border rounded-lg">
                                        <table className="w-full">
                                            <thead className="bg-gray-50">
                                                <tr className="border-b">
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">OR Number</th>
                                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Description</th>
                                                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Amount</th>
                                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payment.payment_transactions.map(transaction => (
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
                                ) : (
                                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                                        <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No transactions recorded yet</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {payments.length === 0 && (
                    <Card>
                        <CardContent className="text-center py-12">
                            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment Records</h3>
                            <p className="text-gray-500">This student has no payment records yet.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    )
}
