import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DollarSign, Users, AlertTriangle, Clock, Search, Plus, Eye, GraduationCap, CreditCard } from 'lucide-react'
import { useState } from 'react'

export default function ShsPaymentsIndex({ payments, stats, auth }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [selectedPayment, setSelectedPayment] = useState(null)
    const [paymentForm, setPaymentForm] = useState({
        amount_paid: '',
        payment_date: new Date().toISOString().split('T')[0],
        quarter: '1',
        notes: ''
    })

    const getLastPaymentQuarter = (payment) => {
        if (payment.q4_payment_date) return '4th Quarter'
        if (payment.q3_payment_date) return '3rd Quarter'
        if (payment.q2_payment_date) return '2nd Quarter'
        if (payment.q1_payment_date) return '1st Quarter'
        return 'None'
    }

    const getAvailableQuarters = (payment) => {
        const quarters = []
        if (!payment.q1_payment_date) quarters.push({value: '1', label: '1st Quarter'})
        if (!payment.q2_payment_date) quarters.push({value: '2', label: '2nd Quarter'})
        if (!payment.q3_payment_date) quarters.push({value: '3', label: '3rd Quarter'})
        if (!payment.q4_payment_date) quarters.push({value: '4', label: '4th Quarter'})
        return quarters
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
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">SHS Payments</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage Senior High School student payments and billing
                        </p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex gap-2">
                        <Button variant="outline">
                            Fee Structure
                        </Button>
                        <Button variant="outline">
                            Export Report
                        </Button>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Payment
                        </Button>
                    </div>
                </div>
            }
        >
            <Head title="SHS Payments" />

            <div className="space-y-6">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total SHS Payments</CardTitle>
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_payments}</div>
                            <p className="text-xs text-muted-foreground">
                                SHS payment records
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Pending</CardTitle>
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

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-blue-50 border-blue-200">
                        <CardHeader>
                            <CardTitle className="text-blue-800">Grade 11 Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-blue-700 mb-3">
                                Manage Grade 11 student payments and track collection status
                            </p>
                            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                View Grade 11
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-50 border-green-200">
                        <CardHeader>
                            <CardTitle className="text-green-800">Grade 12 Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-green-700 mb-3">
                                Handle Grade 12 payments including graduation requirements
                            </p>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                View Grade 12
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-purple-50 border-purple-200">
                        <CardHeader>
                            <CardTitle className="text-purple-800">Fee Templates</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-purple-700 mb-3">
                                Use predefined SHS fee structures and templates
                            </p>
                            <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                                Load Template
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Search SHS Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by student name, number, or payment type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Grade Levels</option>
                                <option value="11">Grade 11</option>
                                <option value="12">Grade 12</option>
                            </select>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Tracks</option>
                                <option value="STEM">STEM</option>
                                <option value="HUMSS">HUMSS</option>
                                <option value="ABM">ABM</option>
                                <option value="TVL">TVL</option>
                            </select>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="partial">Partial</option>
                                <option value="paid">Paid</option>
                                <option value="overdue">Overdue</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center">
                                    <GraduationCap className="w-5 h-5 mr-2" />
                                    SHS Payments ({filteredPayments.length})
                                </CardTitle>
                                <CardDescription>
                                    Senior High School payment management
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
                                        <th className="text-left py-3 px-4">Grade & Track</th>
                                        <th className="text-left py-3 px-4">Academic Period</th>
                                        <th className="text-left py-3 px-4">Last Payment Quarter</th>
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
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium">
                                                        Grade {payment.student?.year_level}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.student?.track} - {payment.student?.strand}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium">
                                                        {payment.academic_year}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {payment.semester}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-center">
                                                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                                                        getLastPaymentQuarter(payment) === 'None' 
                                                            ? 'bg-gray-100 text-gray-600' 
                                                            : 'bg-green-100 text-green-700'
                                                    }`}>
                                                        {getLastPaymentQuarter(payment)}
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
                                                        disabled={getAvailableQuarters(payment).length === 0}
                                                    >
                                                        <CreditCard className="w-3 h-3 mr-1" />
                                                        {getAvailableQuarters(payment).length === 0 ? 'Fully Paid' : 'Record Payment'}
                                                    </Button>
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
                                    Payment Quarter
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
                                        All quarters have been paid.
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