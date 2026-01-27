import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, Search, Eye, GraduationCap, CreditCard, Users, AlertTriangle } from 'lucide-react'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export default function ShsPaymentsIndex({ payments, stats, filters, currentAcademicYear, currentSemester, academicYears, auth }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [academicYear, setAcademicYear] = useState(filters?.academic_year || currentAcademicYear)
    const [semester, setSemester] = useState(filters?.semester || currentSemester)
    const [studentType, setStudentType] = useState(filters?.student_type || 'all')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        or_number: '',
        quarter: '1',
        notes: ''
    })

    const handleFilterChange = () => {
        // Get current page from URL if it exists
        const urlParams = new URLSearchParams(window.location.search);
        const currentPage = urlParams.get('page');

        router.get(route('registrar.payments.shs.index'), {
            academic_year: academicYear,
            semester: semester,
            student_type: studentType,
            ...(currentPage && { page: currentPage }),
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handlePageChange = (url) => {
        const urlObj = new URL(url);
        const page = urlObj.searchParams.get('page');
        
        router.get(route('registrar.payments.shs.index'), {
            page: page,
            academic_year: academicYear,
            semester: semester,
            student_type: studentType,
        }, {
            preserveScroll: true,
        });
    }

    // Auto-apply filters when they change
    useEffect(() => {
        handleFilterChange()
    }, [academicYear, semester, studentType])

    const getAvailableQuarters = (payment) => {
        // For yearly payments, check if payment is fully paid
        if (payment.balance <= 0) {
            return [] // No payment options if fully paid
        }
        // Return a single yearly payment option
        return [{value: 'yearly', label: 'Yearly Payment'}]
    }

    const handleRecordPayment = (payment) => {
        const availableQuarters = getAvailableQuarters(payment)
        if (availableQuarters.length === 0) {
            alert('All quarters have been paid for this student.')
            return
        }
        
        setSelectedPayment(payment)
        setShowPaymentModal(true)
        setPaymentForm({
            amount_paid: '',
            payment_date: new Date().toISOString().split('T')[0],
            or_number: '',
            quarter: availableQuarters[0].value, // Default to first available quarter
            notes: ''
        })
    }

    const submitPayment = () => {
        router.post(route('registrar.payments.shs.record', selectedPayment.id), paymentForm, {
            onSuccess: () => {
                setShowPaymentModal(false)
                setSelectedPayment(null)
            }
        })
    }

    const filteredPayments = Array.isArray(payments?.data) ? payments.data.filter(payment =>
        !searchTerm ||
        payment?.student?.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment?.student?.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment?.payment_type?.toLowerCase().includes(searchTerm.toLowerCase())
    ) : []

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
                        <h2 className="text-2xl font-bold text-gray-900">SHS Payments</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage Senior High School student payments, fees, and billing
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="SHS Payments" />

            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mx-4 md:mx-6 lg:mx-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total SHS Students</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_students || 0}</div>
                            <p className="text-xs text-muted-foreground">
                                SHS students
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
                        <CardTitle className="text-lg">Search SHS Payments</CardTitle>
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
                                            router.get(route('registrar.payments.shs.index'))
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
                                    SHS Payments ({filteredPayments.length})
                                </CardTitle>
                                <CardDescription>
                                    Manage Senior High School student payment records
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
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {payment.student?.enrollments && payment.student.enrollments.length > 0
                                                    ? formatSectionName(payment.student.enrollments[0].section)
                                                    : 'No Section'
                                                }
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                {formatCurrency(payment.total_semester_fee)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`font-medium ${
                                                    payment.student?.has_voucher && payment.student?.voucher_status === 'active'
                                                        ? 'text-blue-600'
                                                        : payment.balance > 0 ? 'text-red-600' : 'text-green-600'
                                                }`}>
                                                    {payment.student?.has_voucher && payment.student?.voucher_status === 'active'
                                                        ? '₱0.00' // Show 0 for voucher students
                                                        : formatCurrency(payment.balance)
                                                    }
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge 
                                                    variant="secondary"
                                                    className={
                                                        payment.student?.has_voucher && payment.student?.voucher_status === 'active'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : getStatusColor(payment.status)
                                                    }
                                                >
                                                    {payment.student?.has_voucher && payment.student?.voucher_status === 'active'
                                                        ? 'Voucher Active'
                                                        : payment.status?.charAt(0).toUpperCase() + payment.status?.slice(1)
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    {!(payment.student?.has_voucher && payment.student?.voucher_status === 'active') && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleRecordPayment(payment)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                            disabled={getAvailableQuarters(payment).length === 0}
                                                        >
                                                            <CreditCard className="w-3 h-3 mr-1" />
                                                            {getAvailableQuarters(payment).length === 0 ? 'Fully Paid' : 'Record Payment'}
                                                        </Button>
                                                    )}
                                                    <Link
                                                        href={route('registrar.payments.shs.show', payment.student.id)}
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
                                    <GraduationCap className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No SHS payments found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm ? 'Try adjusting your search criteria.' : 'No SHS payment records available.'}
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
                                            <button
                                                key={index}
                                                onClick={() => handlePageChange(link.url)}
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

            {/* SHS Payment Recording Modal */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Record SHS Payment</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Student: {selectedPayment?.student?.user?.name}
                                </label>
                                <p className="text-sm text-gray-500">
                                    Grade {selectedPayment?.student?.year_level} - {selectedPayment?.student?.track}
                                </p>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Type
                                </label>
                                <select
                                    value={paymentForm.quarter}
                                    onChange={(e) => setPaymentForm({...paymentForm, quarter: e.target.value})}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    {selectedPayment && getAvailableQuarters(selectedPayment).map(quarter => (
                                        <option key={quarter.value} value={quarter.value}>{quarter.label}</option>
                                    ))}
                                </select>
                                {selectedPayment && getAvailableQuarters(selectedPayment).length === 0 && (
                                    <p className="text-sm text-red-500 mt-1">
                                        Payment is fully paid.
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
                                    OR Number (Optional)
                                </label>
                                <Input
                                    value={paymentForm.or_number}
                                    onChange={(e) => setPaymentForm({...paymentForm, or_number: e.target.value})}
                                    placeholder="Enter OR number..."
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
                                disabled={!paymentForm.amount_paid}
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