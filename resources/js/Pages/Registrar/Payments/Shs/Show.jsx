import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { ArrowLeft, User, Mail, Phone, MapPin, GraduationCap, Calendar, FileText, DollarSign, CreditCard } from 'lucide-react'

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'No Section';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'No Section';
};

export default function ShsPaymentShow({ student, payments, auth }) {
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
                    <Button asChild variant="ghost" size="sm">
                        <Link href={route('registrar.payments.shs.index')} className="flex items-center gap-2">
                            <ArrowLeft className="w-4 h-4" />
                            Back to SHS Payments
                        </Link>
                    </Button>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">SHS Student Payment Details</h2>
                            <p className="text-xs text-gray-500 mt-0.5">View comprehensive payment records and transaction history</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`SHS Payment Details - ${student.user.name}`} />

            <div className="space-y-6">
                {/* Student Information Card */}
                <Card>
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 py-4">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-blue-500 rounded-lg">
                                <GraduationCap className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Student Information</CardTitle>
                                <CardDescription>Complete student profile and enrollment details</CardDescription>
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
                                    <p className="font-semibold text-gray-900 mt-0.5">{student.user.name}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-purple-100 rounded-lg">
                                    <FileText className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Student Number</p>
                                    <p className="font-mono font-semibold text-gray-900 mt-0.5">{student.student_number}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-green-100 rounded-lg">
                                    <GraduationCap className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Track & Strand</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">
                                        {student.program?.program_name || 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-orange-100 rounded-lg">
                                    <Mail className="w-4 h-4 text-orange-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                                    <p className="font-medium text-gray-900 mt-0.5 break-all">{student.user.email}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-pink-100 rounded-lg">
                                    <Phone className="w-4 h-4 text-pink-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Phone</p>
                                    <p className="font-medium text-gray-900 mt-0.5">{student.phone || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-1.5 bg-indigo-100 rounded-lg">
                                    <Calendar className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year Level</p>
                                    <p className="font-semibold text-gray-900 mt-0.5">{student.year_level || 'N/A'}</p>
                                </div>
                            </div>

                            {student.has_voucher && (
                                <div className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="p-1.5 bg-blue-100 rounded-lg">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Voucher ID</p>
                                        <p className="font-mono font-semibold text-gray-900 mt-0.5">{student.voucher_id}</p>
                                        {student.voucher_status !== 'active' && (
                                            <p className="text-xs text-red-600 mt-1">
                                                Status: {student.voucher_status}
                                                {student.voucher_invalidated_at && (
                                                    <span> ({formatDate(student.voucher_invalidated_at)})</span>
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Records */}
                <Card>
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
                            {payments.map(payment => (
                                <AccordionItem key={payment.id} value={`payment-${payment.id}`}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center justify-between w-full mr-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-green-100 rounded-lg">
                                                    <CreditCard className="w-4 h-4 text-green-600" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="font-semibold text-gray-900">
                                                        {payment.academic_year} - {payment.semester} Semester
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        Total: {formatCurrency(payment.total_semester_fee)} • Paid: {formatCurrency(payment.total_paid)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge className={`${getStatusColor(payment.status)} text-sm px-3 py-1`}>
                                                {payment.status?.toUpperCase()}
                                            </Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-4">
                                        <div className="space-y-6">
                                            {/* Payment Summary */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Total Yearly Fee</p>
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
                                                    <p className="text-sm text-gray-500">Payment Type</p>
                                                    <p className="text-lg font-medium capitalize">
                                                        {student.has_voucher && student.voucher_status === 'active' ? 'Voucher' : 'Yearly'}
                                                    </p>
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
                                                                            <Badge 
                                                                                variant="secondary"
                                                                                className={
                                                                                    transaction.status === 'completed' 
                                                                                        ? 'bg-green-100 text-green-800' 
                                                                                        : transaction.status === 'pending'
                                                                                        ? 'bg-yellow-100 text-yellow-800'
                                                                                        : 'bg-gray-100 text-gray-800'
                                                                                }
                                                                            >
                                                                                {transaction.status}
                                                                            </Badge>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-gray-500">
                                                        <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                                                        <p className="text-sm">No payment transactions recorded yet.</p>
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
            </div>
        </AuthenticatedLayout>
    )
}