import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, Users, AlertTriangle, Clock, Search, Plus, Eye, CreditCard, X } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

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

    // Auto-apply filters when they change
    useEffect(() => {
        handleFilterChange()
    }, [academicYear, semester, studentType])

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
        // Return all terms - user can choose any term to pay
        return [
            {value: 'prelim', label: 'Prelim'},
            {value: 'midterm', label: 'Midterm'},
            {value: 'prefinal', label: 'Pre-final'},
            {value: 'final', label: 'Final'}
        ]
    }

    const handleRecordPayment = (payment) => {
        // Prevent opening modal if balance is 0
        if (payment.balance <= 0) {
            toast.error('Payment Not Allowed', {
                description: 'This student has already fully paid. No additional payment can be recorded.',
            })
            return
        }
        
        setSelectedPayment(payment)
        setShowPaymentModal(true)
        setPaymentForm({
            amount_paid: '',
            payment_date: new Date().toISOString().split('T')[0],
            term: 'prelim', // Default to prelim
            or_number: '',
            notes: ''
        })
    }

    const submitPayment = () => {
        router.post(route('registrar.payments.college.record', selectedPayment.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false)
                setSelectedPayment(null)
            },
            onError: (errors) => {
                toast.error('Failed to record payment', {
                    description: 'Please check your input and try again.',
                })
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-4 md:mx-6 lg:mx-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total College Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                College students
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Not Enrolled in Section</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{stats.students_not_enrolled || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Students without section
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Students with Balance</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">{stats.students_with_balance || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                Outstanding balances
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-600">
                                {formatCurrency(stats.total_outstanding_balance || 0)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Amount owed
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card className="mx-4 md:mx-6 lg:mx-8">
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
                <Card className="mx-4 md:mx-6 lg:mx-8">
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
                                                    >
                                                        <CreditCard className="w-3 h-3 mr-1" />
                                                        Record Payment
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        {/* Gradient Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                                        <CreditCard className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Record Payment</h3>
                                        <p className="text-blue-100 text-sm">Process student payment transaction</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="text-white hover:text-blue-100 transition-colors"
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">
                            {/* Student Info */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Users className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{selectedPayment?.student?.user?.name}</p>
                                        <p className="text-sm text-gray-600">Student Number: {selectedPayment?.student?.student_number}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Term Selection */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-4">
                                    Select Payment Term
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedPayment && getAvailableTerms(selectedPayment).map(term => (
                                        <label key={term.value} className="flex items-center gap-3 p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-all duration-200 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="paymentTerm"
                                                value={term.value}
                                                checked={paymentForm.term === term.value}
                                                onChange={(e) => setPaymentForm({...paymentForm, term: e.target.value})}
                                                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                            />
                                            <span className="text-sm font-medium text-gray-900">{term.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Amount and Date Row */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Amount Paid *
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <span className="text-gray-500 sm:text-sm">₱</span>
                                        </div>
                                        <Input
                                            type="text"
                                            value={paymentForm.amount_paid ? Number(paymentForm.amount_paid).toLocaleString('en-US', {minimumFractionDigits: 0, maximumFractionDigits: 2}) : ''}
                                            onChange={(e) => {
                                                // Remove commas and parse as number
                                                const value = e.target.value.replace(/,/g, '')
                                                if (value === '' || !isNaN(value)) {
                                                    setPaymentForm({...paymentForm, amount_paid: value})
                                                }
                                            }}
                                            placeholder="0.00"
                                            className="pl-8"
                                            required
                                        />
                                    </div>
                                    {selectedPayment && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Balance: {formatCurrency(selectedPayment.balance)}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                                        Payment Date *
                                    </label>
                                    <Input
                                        type="date"
                                        value={paymentForm.payment_date}
                                        onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                                        required
                                    />
                                </div>
                            </div>

                            {/* OR Number */}
                            <div className="mb-4">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Official Receipt Number *
                                </label>
                                <Input
                                    value={paymentForm.or_number}
                                    onChange={(e) => setPaymentForm({...paymentForm, or_number: e.target.value})}
                                    placeholder="Enter OR number"
                                    required
                                />
                            </div>

                            {/* Notes */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-900 mb-2">
                                    Notes <span className="text-gray-500 font-normal">(Optional)</span>
                                </label>
                                <Input
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                    placeholder="Add payment notes..."
                                />
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-4 border-t">
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
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Record Payment
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    )
}