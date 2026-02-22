import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { DollarSign, Eye, Search, Users, AlertTriangle, CreditCard, User, FileText, GraduationCap, Mail, Phone, Calendar, Receipt } from 'lucide-react'

export default function ShsPaymentsIndex({ payments, stats, filters, currentAcademicYear, currentSemester, academicYears, auth }) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '')
    const [academicYear, setAcademicYear] = useState(filters?.academic_year || currentAcademicYear)
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
            student_type: studentType,
            search: searchTerm,
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
            student_type: studentType,
            search: searchTerm,
        }, {
            preserveScroll: true,
        });
    }

    // Auto-apply filters when they change
    useEffect(() => {
        handleFilterChange()
    }, [academicYear, studentType])

    // Debounced search effect
    useEffect(() => {
        const timer = setTimeout(() => {
            handleFilterChange()
        }, 500) // 500ms delay

        return () => clearTimeout(timer)
    }, [searchTerm])

    // Listen for real‑time events.  we dispatch a custom `payment-recorded`
    // event when the socket.io client receives a message from the LAN server.
    // Echo is left installed for compatibility but is not required.
    useEffect(() => {
        const update = () => handleFilterChange();

        window.addEventListener('payment-recorded', update);

        if (window.Echo) {
            const channel = window.Echo.channel('payments');
            channel.listen('PaymentRecorded', update);

            return () => {
                channel.stopListening('PaymentRecorded');
                window.removeEventListener('payment-recorded', update);
            };
        }

        return () => {
            window.removeEventListener('payment-recorded', update);
        };
    }, []);

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

    const paymentsData = Array.isArray(payments?.data) ? payments.data : []

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

    const getPaymentStatusColor = (balance, student) => {
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

    // Detect voucher payments either from student flags or from transaction entries
    const isVoucherPayment = (payment) => {
        const student = payment?.student;
        if (student && student.has_voucher && student.voucher_status === 'active') return true;
        if (payment?.payment_transactions && Array.isArray(payment.payment_transactions)) {
            return payment.payment_transactions.some(t => {
                const typeCheck = (t.type === 'voucher' || t.payment_type === 'voucher');
                const descCheck = t.description && t.description.toLowerCase().includes('voucher');
                return typeCheck || descCheck;
            });
        }
        return false;
    }

    const getPaymentStatusText = (balance, student) => {
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

    const getPaymentStatusBadge = (balance, student) => {
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

    const formatSectionName = (section) => {
        // Return a simplified formatted section name like: PROGRAMCODE-YearLevelIdentifier (e.g., "BSIT-3D", "ABM-12A")
        if (!section) return 'No Section'

        const programCode = section.program?.program_code || '';
        const yearLevel = section.year_level || '';
        const identifierMatch = (section.section_name || '').match(/([A-Za-z]+)$/);
        const identifier = identifierMatch ? identifierMatch[1].toUpperCase() : '';

        if (programCode && yearLevel && identifier) {
            return `${programCode}-${yearLevel}${identifier}`;
        } else if (programCode && identifier) {
            return `${programCode}-${identifier}`;
        } else if (identifier) {
            return `${yearLevel}${identifier}`.trim();
        }

        return section.section_name || 'No Section'
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
                            {(academicYear !== currentAcademicYear || studentType !== 'all') && (
                                <div className="flex items-center gap-2 text-sm text-blue-600">
                                    <span>Showing filtered results</span>
                                    <Button 
                                        variant="ghost" 
                                        size="sm"
                                        onClick={() => {
                                            setAcademicYear(currentAcademicYear)
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

                {/* Payment Records */}
                <Card className="mx-4 md:mx-6 lg:mx-8">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="w-5 h-5" />
                            SHS Payment Records ({payments.total || 0})
                        </CardTitle>
                        <CardDescription>
                            View payment details organized by student
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Student</th>
                                        <th className="text-left py-3 px-4">Section</th>
                                        <th className="text-left py-3 px-4">Amount Due</th>
                                        <th className="text-left py-3 px-4">Total Paid</th>
                                        <th className="text-left py-3 px-4">Balance</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paymentsData.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{payment.student?.user?.name}</div>
                                                    <div className="text-sm text-gray-500">{payment.student?.student_number}</div>
                                                    <div className="text-sm text-gray-500">{payment.student?.program?.name}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    {payment.student?.student_type === 'irregular' ? (
                                                        <div className="text-center">
                                                            <span className="inline-block px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-700">Irregular</span>
                                                        </div>
                                                    ) : (
                                                        <div className="text-sm text-gray-500">{payment.student?.enrollments && payment.student.enrollments.length > 0 ? formatSectionName(payment.student.enrollments[0].section) : 'No Section'}</div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">{formatCurrency(isVoucherPayment(payment) ? 0 : payment.total_semester_fee)}</td>
                                            <td className="py-3 px-4 text-green-600">{formatCurrency(isVoucherPayment(payment) ? 0 : (payment.total_paid || 0))}</td>
                                            <td className="py-3 px-4 text-orange-600">{formatCurrency(isVoucherPayment(payment) ? 0 : (payment.balance || 0))}</td>
                                            <td className="py-3 px-4">
                                                {isVoucherPayment(payment) ? (
                                                    <Badge className={`bg-blue-100 text-blue-800 text-sm px-3 py-1`}>Voucher</Badge>
                                                ) : (
                                                    <Badge className={`${getPaymentStatusBadge(payment.balance, payment.student)} text-sm px-3 py-1`}>
                                                        {getPaymentStatusText(payment.balance, payment.student)}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {!isVoucherPayment(payment) && (
                                                        <Button onClick={() => handleRecordPayment(payment)} className="bg-green-600 hover:bg-green-700" disabled={getAvailableQuarters(payment).length === 0}>
                                                            <CreditCard className="w-4 h-4 mr-2" />
                                                            {getAvailableQuarters(payment).length === 0 ? 'Fully Paid' : 'Record Payment'}
                                                        </Button>
                                                    )}

                                                    <Link href={route('registrar.payments.shs.show', payment.student.id)}>
                                                        <Button variant="outline" className="p-2">
                                                            <Eye className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {paymentsData.length === 0 && (
                            <div className="text-center py-12">
                                <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No SHS payments found</h3>
                                <p className="text-gray-500">
                                    {searchTerm ? 'Try adjusting your search criteria.' : 'No SHS payment records available.'}
                                </p>
                            </div>
                        )}

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
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                        <h3 className="text-lg font-semibold mb-4">Record SHS Payment</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Student:</label>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{selectedPayment?.student?.user?.name}</p>
                                        <p className="text-sm text-gray-500">Grade {selectedPayment?.student?.year_level} - {selectedPayment?.student?.track}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-500">Remaining Balance</p>
                                        <p className="font-semibold">{formatCurrency(selectedPayment?.balance || 0)}</p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
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
                                    <p className="text-sm text-red-500 mt-1">Payment is fully paid.</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={paymentForm.amount_paid}
                                    onChange={(e) => setPaymentForm({...paymentForm, amount_paid: e.target.value})}
                                    placeholder="Enter amount"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                <Input
                                    type="date"
                                    value={paymentForm.payment_date}
                                    onChange={(e) => setPaymentForm({...paymentForm, payment_date: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">OR Number (Optional)</label>
                                <Input
                                    value={paymentForm.or_number}
                                    onChange={(e) => setPaymentForm({...paymentForm, or_number: e.target.value})}
                                    placeholder="Enter OR number..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <Input
                                    value={paymentForm.notes}
                                    onChange={(e) => setPaymentForm({...paymentForm, notes: e.target.value})}
                                    placeholder="Payment notes..."
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-6">
                            <Button variant="outline" onClick={() => setShowPaymentModal(false)} className="flex-1">Cancel</Button>
                            <Button onClick={submitPayment} disabled={!paymentForm.amount_paid || !paymentForm.or_number} className="flex-1 bg-green-600 hover:bg-green-700">Record Payment</Button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    )
}