import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye, Plus, FileText, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';

export default function PaymentsIndex({ payments, filters, stats }) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [academicYear, setAcademicYear] = useState(filters.academic_year || '');
    const [semester, setSemester] = useState(filters.semester || '');

    const handleFilter = () => {
        router.get(route('registrar.payments.index'), {
            search,
            status,
            academic_year: academicYear,
            semester,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'partial':
                return <Clock className="w-4 h-4 text-yellow-600" />;
            case 'overdue':
                return <AlertCircle className="w-4 h-4 text-red-600" />;
            default:
                return <Clock className="w-4 h-4 text-gray-600" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'partial':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'overdue':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
        }).format(amount);
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-800">Student Payments Management</h2>
                    <Link href={route('registrar.payments.report')}>
                        <Button variant="outline" className="flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Payment Report
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Payments Management" />

            <div className="space-y-6">
                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-gray-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_pending}</p>
                                    <p className="text-xs text-gray-600">Pending</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-yellow-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_partial}</p>
                                    <p className="text-xs text-gray-600">Partial</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_completed}</p>
                                    <p className="text-xs text-gray-600">Completed</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <div>
                                    <p className="text-2xl font-bold">{stats.total_overdue}</p>
                                    <p className="text-xs text-gray-600">Overdue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-green-600" />
                                <div>
                                    <p className="text-lg font-bold">{formatCurrency(stats.total_revenue)}</p>
                                    <p className="text-xs text-gray-600">Total Revenue</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-orange-600" />
                                <div>
                                    <p className="text-lg font-bold">{formatCurrency(stats.pending_balance)}</p>
                                    <p className="text-xs text-gray-600">Pending Balance</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Filter Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <Input
                                    placeholder="Search students..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Status</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="partial">Partial</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={academicYear} onValueChange={setAcademicYear}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Academic Year" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Years</SelectItem>
                                    <SelectItem value="2024-2025">2024-2025</SelectItem>
                                    <SelectItem value="2023-2024">2023-2024</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={semester} onValueChange={setSemester}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Semester" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">All Semesters</SelectItem>
                                    <SelectItem value="first">First Semester</SelectItem>
                                    <SelectItem value="second">Second Semester</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleFilter} className="w-full">
                                Apply Filters
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Student Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Student</th>
                                        <th className="text-left py-3 px-4">Academic Period</th>
                                        <th className="text-left py-3 px-4">Total Fee</th>
                                        <th className="text-left py-3 px-4">Paid</th>
                                        <th className="text-left py-3 px-4">Balance</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-left py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.data.map((payment) => (
                                        <tr key={payment.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {payment.student.user.name}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        {payment.student.student_id}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {payment.academic_year}
                                                    </p>
                                                    <p className="text-sm text-gray-600 capitalize">
                                                        {payment.semester} Semester
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 font-medium">
                                                {formatCurrency(payment.total_semester_fee)}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-green-600">
                                                {formatCurrency(payment.total_paid)}
                                            </td>
                                            <td className="py-3 px-4 font-medium text-orange-600">
                                                {formatCurrency(payment.balance)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge
                                                    className={`flex items-center gap-1 w-fit ${getStatusColor(payment.status)}`}
                                                >
                                                    {getStatusIcon(payment.status)}
                                                    <span className="capitalize">{payment.status}</span>
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Link
                                                    href={route('registrar.payments.show', {
                                                        student: payment.student.id,
                                                        academic_year: payment.academic_year,
                                                        semester: payment.semester,
                                                    })}
                                                >
                                                    <Button size="sm" variant="outline">
                                                        <Eye className="w-4 h-4 mr-1" />
                                                        View
                                                    </Button>
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {payments.data.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-gray-600">No payment records found.</p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {payments.links && (
                            <div className="mt-6 flex justify-between items-center">
                                <p className="text-sm text-gray-600">
                                    Showing {payments.from} to {payments.to} of {payments.total} results
                                </p>
                                <div className="flex gap-2">
                                    {payments.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3 py-1 text-sm border rounded ${
                                                link.active
                                                    ? 'bg-blue-600 text-white border-blue-600'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                            } ${!link.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={!link.url}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}