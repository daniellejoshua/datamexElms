import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table'
import { Badge } from '@/Components/ui/badge'

export default function PaymentIndex({ students, filters }) {
    const [search, setSearch] = useState(filters?.search || '')
    const [paymentStatus, setPaymentStatus] = useState(filters?.payment_status || '')

    const { get } = useForm()

    const handleSearch = () => {
        get('/registrar/payments', {
            search,
            payment_status: paymentStatus,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setPaymentStatus('')
        get('/registrar/payments')
    }

    const getStatusVariant = (status) => {
        const variants = {
            pending: 'destructive',
            partial: 'secondary', 
            paid: 'default',
        }
        return variants[status] || 'outline'
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount || 0)
    }

    const calculateProgress = (paid, total) => {
        if (!total || total === 0) return 0
        return Math.round((paid / total) * 100)
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Payment Management
                    </h2>
                    <div className="flex gap-2">
                        <Link href="/registrar/students/bulk">
                            <SecondaryButton>Bulk Import</SecondaryButton>
                        </Link>
                        <Link href="/registrar/students/create">
                            <PrimaryButton>Add Student</PrimaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Payment Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <InputLabel htmlFor="search" value="Search Students" />
                                    <TextInput
                                        id="search"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by name, student ID, or email..."
                                    />
                                </div>
                                
                                <div className="md:w-48">
                                    <InputLabel htmlFor="payment_status" value="Payment Status" />
                                    <select
                                        id="payment_status"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={paymentStatus}
                                        onChange={(e) => setPaymentStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="pending">Pending</option>
                                        <option value="partial">Partially Paid</option>
                                        <option value="paid">Fully Paid</option>
                                    </select>
                                </div>

                                <div className="flex gap-2 items-end">
                                    <PrimaryButton onClick={handleSearch}>
                                        Search
                                    </PrimaryButton>
                                    <SecondaryButton onClick={clearFilters}>
                                        Clear
                                    </SecondaryButton>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm">👥</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {students.length}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                            <span className="text-green-600 text-sm">✅</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Fully Paid</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {students.filter(s => s.payment_status === 'paid').length}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                                            <span className="text-orange-600 text-sm">🕐</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Partial</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {students.filter(s => s.payment_status === 'partial').length}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                                            <span className="text-red-600 text-sm">💰</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {students.filter(s => s.payment_status === 'pending').length}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Students Payment Table */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Student Payment Overview ({students.length} students)
                            </h3>
                            
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Year Level</TableHead>
                                            <TableHead>Payment Status</TableHead>
                                            <TableHead>Amount Paid</TableHead>
                                            <TableHead>Total Fee</TableHead>
                                            <TableHead>Progress</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {students.length > 0 ? (
                                            students.map((student) => (
                                                <TableRow key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {student.first_name} {student.last_name}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                ID: {student.student_id}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {student.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            {student.program?.name || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            Year {student.year_level}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(student.payment_status)}>
                                                            {student.payment_status?.charAt(0).toUpperCase() + student.payment_status?.slice(1) || 'Pending'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold text-green-600">
                                                            {formatCurrency(student.total_paid)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-semibold">
                                                            {formatCurrency(student.total_fee)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 bg-gray-200 rounded-full h-2">
                                                                <div 
                                                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                                                    style={{ 
                                                                        width: `${calculateProgress(student.total_paid, student.total_fee)}%` 
                                                                    }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-sm text-gray-500">
                                                                {calculateProgress(student.total_paid, student.total_fee)}%
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={`/registrar/students/${student.id}`}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                href={`/registrar/payments/${student.id}/create`}
                                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                            >
                                                                Payment
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center py-8">
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                                            <span className="text-gray-400 text-xl">👥</span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                                            No students found
                                                        </h3>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            {search || paymentStatus 
                                                                ? 'Try adjusting your search filters' 
                                                                : 'Start by adding students to the system'
                                                            }
                                                        </p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}