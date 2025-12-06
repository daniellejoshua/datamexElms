import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, Users, AlertTriangle, Clock, Search, Plus, Eye, CreditCard } from 'lucide-react'
import { useState } from 'react'

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'No Section';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'No Section';
};

export default function CollegePaymentsIndex({ payments, stats, filters, currentAcademicYear, currentSemester, academicYears, auth }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [academicYear, setAcademicYear] = useState(filters?.academic_year || currentAcademicYear)
    const [semester, setSemester] = useState(filters?.semester || currentSemester)
    const [studentType, setStudentType] = useState(filters?.student_type || 'all')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        term: 'prelim',
        or_number: '',
        notes: ''
    })

    const handleFilterChange = () => {
        router.get(route('registrar.payments.college.index'), {
            academic_year: academicYear,
            semester: semester,
            student_type: studentType,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const getLastPaymentTerm = (payment) => {
        // Check for the most recent payment term (either fully paid or has payment date)
        if (payment.final_paid || payment.final_payment_date) return 'Final'
        if (payment.prefinal_paid || payment.prefinal_payment_date) return 'Pre-final'
        if (payment.midterm_paid || payment.midterm_payment_date) return 'Midterm'
        if (payment.prelim_paid || payment.prelim_payment_date) return 'Prelim'
        if (payment.enrollment_paid || payment.enrollment_payment_date) return 'Enrollment'
        return 'None'
    }

    const getAvailableTerms = (payment) => {
        const terms = []
        
        // Can pay next unpaid term in sequence
        if (!payment.enrollment_paid) {
            terms.push({value: 'enrollment', label: 'Enrollment'})
        } else if (!payment.prelim_paid) {
            terms.push({value: 'prelim', label: 'Prelim'})
        } else if (!payment.midterm_paid) {
            terms.push({value: 'midterm', label: 'Midterm'})
        } else if (!payment.prefinal_paid) {
            terms.push({value: 'prefinal', label: 'Pre-final'})
        } else if (!payment.final_paid) {
            terms.push({value: 'final', label: 'Final'})
        }
        
        return terms
    }

    const handleRecordPayment = (payment) => {
        const availableTerms = getAvailableTerms(payment)
        if (availableTerms.length === 0) {
            alert('All terms have been paid for this student.')
            return
        }
        
        setSelectedPayment(payment)
        setShowPaymentModal(true)
        setPaymentForm({
            amount_paid: '',
            payment_date: new Date().toISOString().split('T')[0],
            term: availableTerms[0].value, // Default to first available term
            or_number: '',
            notes: ''
        })
    }

    const submitPayment = () => {
        router.post(route('registrar.payments.college.record', selectedPayment.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false)
                setSelectedPayment(null)
            }
        })
    }

    const filteredPayments = payments.data.filter(payment =>
        payment.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.student?.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.payment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-yellow-100 text-yellow-800',
            'partial': 'bg-blue-100 text-blue-800',
            'paid': 'bg-green-100 text-green-800',
            'overdue': 'bg-red-100 text-red-800'
        }
        return colors[status] || 'bg-gray-100 text-gray-800'
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(amount)
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-lg">
                        <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">College Payments</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage college student payments, fees, and billing
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="College Payments" />

            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_payments}</div>
                            <p className="text-xs text-muted-foreground">
                                College payment records
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">{stats.pending_payments}</div>
                            <p className="text-xs text-muted-foreground">
                                Awaiting payment
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.overdue_payments}</div>
                            <p className="text-xs text-muted-foreground">
                                Past due date
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {formatCurrency(stats.total_collectible)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Amount to collect
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Search Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by student name, number, or payment type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Academic Year</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={academicYear}
                                        onChange={(e) => setAcademicYear(e.target.value)}
                                    >
                                        {academicYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Semester</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={semester}
                                        onChange={(e) => setSemester(e.target.value)}
                                    >
                                        <option value="1st">1st Semester</option>
                                        <option value="2nd">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Student Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={studentType}
                                        onChange={(e) => setStudentType(e.target.value)}
                                    >
                                        <option value="all">All Students</option>
                                        <option value="regular">Regular</option>
                                        <option value="irregular">Irregular</option>
                                    </select>
                                </div>
                                <div className="flex items-end">
                                    <Button 
                                        onClick={handleFilterChange}
                                        className="w-full sm:w-auto"
                                    >
                                        Apply Filters
                                    </Button>
                                </div>
                            </div>
                            {(academicYear !== currentAcademicYear || semester !== currentSemester || studentType !== 'all') && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <span>Showing filtered results</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setAcademicYear(currentAcademicYear)
                                            setSemester(currentSemester)
                                            setStudentType('all')
                                            router.get(route('registrar.payments.college.index'))
                                        }}
                                    >
                                        Reset to Current
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center">
                                    <DollarSign className="w-5 h-5 mr-2" />
                                    College Payments ({filteredPayments.length})
                                </CardTitle>
                                <CardDescription>
                                    Manage college student payment records
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Student</th>
                                        <th className="text-left py-3 px-4">Section</th>
                                        <th className="text-left py-3 px-4">Last Payment Term</th>
                                        <th className="text-left py-3 px-4">Amount Due</th>
                                        <th className="text-left py-3 px-4">Balance</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {payment.student?.user?.name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.student?.student_number}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.student?.program?.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    {payment.student?.student_type === 'irregular' ? (
                                                        <div className="text-center">
                                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">
                                                                Irregular
                                                            </span>
                                                            <div className="text-sm text-gray-500 mt-1">
                                                                {payment.academic_year} - {payment.semester}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="font-medium">
                                                                {formatSectionName(payment.section)}
                                                            </div>
                                                            <div className="text-sm text-gray-500">
                                                                {payment.academic_year} - {payment.semester}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-center">
                                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                        getLastPaymentTerm(payment) === 'None' 
                                                            ? 'bg-gray-100 text-gray-600' 
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {getLastPaymentTerm(payment)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                {formatCurrency(payment.total_semester_fee)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`font-medium ${
                                                    payment.balance > 0 ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                    {formatCurrency(payment.balance)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge 
                                                    variant="secondary"
                                                    className={getStatusColor(payment.status)}
                                                >
                                                    {payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleRecordPayment(payment)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                        disabled={getAvailableTerms(payment).length === 0}
                                                    >
                                                        <CreditCard className="w-3 h-3 mr-1" />
                                                        {getAvailableTerms(payment).length === 0 ? 'Fully Paid' : 'Record Payment'}
                                                    </Button>
                                                    <Link
                                                        href={route('registrar.payments.college.show', payment.student.id)}
                                                    >
                                                        <Button size="sm" variant="outline">
                                                            <Eye className="w-3 h-3 mr-1" />
                                                            View
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredPayments.length === 0 && (
                                <div className="text-center py-8">
                                    <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm ? 'Try adjusting your search criteria.' : 'No payment records available.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {payments.links && payments.links.length > 3 && (
                            <div className="mt-6 flex justify-between items-center">
                                <p className="text-sm text-gray-700">
                                    Showing {payments.from} to {payments.to} of {payments.total} results
                                </p>
                                <div className="flex gap-1">
                                    {payments.links.map((link, index) => (
                                        link.url ? (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`px-3 py-1 text-sm border rounded ${
                                                    link.active 
                                                        ? 'bg-blue-500 text-white border-blue-500' 
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ) : (
                                            <span
                                                key={index}
                                                className="px-3 py-1 text-sm text-gray-400 border border-gray-300 rounded"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        )
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Payment Recording Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student: {selectedPayment?.student?.user?.name}
                                </label>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Term
                                </label>
                                <select
                                    value={paymentForm.term}
                                    onChange={(e) => setPaymentForm({...paymentForm, term: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    {selectedPayment && getAvailableTerms(selectedPayment).map(term => (
                                        <option key={term.value} value={term.value}>{term.label}</option>
                                    ))}
                                </select>
                                {selectedPayment && getAvailableTerms(selectedPayment).length === 0 && (
                                    <p className="text-sm text-red-500 mt-1">
                                        All terms have been paid.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Amount Paid
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.amount_paid}
                                    onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})}
                                    placeholder="Enter amount"
                                />
                                {selectedPayment && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Remaining Balance: {formatCurrency(selectedPayment.balance)}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Date
                                </label>
                                <Input
                                    type="date"
                                    value={paymentForm.payment_date}
                                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    OR Number *
                                </label>
                                <Input
                                    value={paymentForm.or_number}
                                    onChange={(e) => setPaymentForm({...paymentForm, or_number: e.target.value})}
                                    placeholder="Official Receipt Number"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <Input
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                    placeholder="Payment notes..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button
                                variant="outline"
                                onClick={() => setShowPaymentModal(false)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={submitPayment}
                                disabled={!paymentForm.amount_paid || !paymentForm.or_number}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                Record Payment
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    )
}