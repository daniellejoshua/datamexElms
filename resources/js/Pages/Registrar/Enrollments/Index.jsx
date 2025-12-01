import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table'
import { Badge } from '@/Components/ui/badge'

export default function EnrollmentIndex({ enrollments, programs, filters }) {
    const [search, setSearch] = useState(filters?.search || '')
    const [status, setStatus] = useState(filters?.status || '')
    const [program, setProgram] = useState(filters?.program || '')

    const { get } = useForm()

    const handleSearch = () => {
        get('/registrar/enrollments', {
            search,
            status,
            program,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setStatus('')
        setProgram('')
        get('/registrar/enrollments')
    }

    const getStatusVariant = (status) => {
        const variants = {
            enrolled: 'default',
            pending: 'secondary',
            dropped: 'destructive',
            graduated: 'outline'
        }
        return variants[status] || 'secondary'
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-PH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    const getStatusCounts = () => {
        return {
            total: enrollments.length,
            enrolled: enrollments.filter(e => e.status === 'enrolled').length,
            pending: enrollments.filter(e => e.status === 'pending').length,
            dropped: enrollments.filter(e => e.status === 'dropped').length,
            graduated: enrollments.filter(e => e.status === 'graduated').length
        }
    }

    const statusCounts = getStatusCounts()

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Student Enrollments
                    </h2>
                    <div className="flex gap-2">
                        <Link href="/registrar/students/bulk">
                            <SecondaryButton>Bulk Import</SecondaryButton>
                        </Link>
                        <Link href="/registrar/enrollments/create">
                            <PrimaryButton>New Enrollment</PrimaryButton>
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title="Student Enrollments" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1">
                                    <InputLabel htmlFor="search" value="Search Enrollments" />
                                    <TextInput
                                        id="search"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Search by student name, ID, or email..."
                                    />
                                </div>

                                <div className="lg:w-48">
                                    <InputLabel htmlFor="program" value="Program" />
                                    <select
                                        id="program"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={program}
                                        onChange={(e) => setProgram(e.target.value)}
                                    >
                                        <option value="">All Programs</option>
                                        {programs.map((prog) => (
                                            <option key={prog.id} value={prog.id}>
                                                {prog.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="lg:w-48">
                                    <InputLabel htmlFor="status" value="Enrollment Status" />
                                    <select
                                        id="status"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="enrolled">Enrolled</option>
                                        <option value="pending">Pending</option>
                                        <option value="dropped">Dropped</option>
                                        <option value="graduated">Graduated</option>
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

                    {/* Enrollment Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm">📋</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.total}
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
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Enrolled</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.enrolled}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                                            <span className="text-yellow-600 text-sm">⏳</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.pending}
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
                                            <span className="text-red-600 text-sm">❌</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Dropped</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.dropped}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                            <span className="text-purple-600 text-sm">🎓</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Graduated</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.graduated}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Enrollments Table */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Student Enrollment Records ({enrollments.length} enrollments)
                            </h3>
                            
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Academic Year</TableHead>
                                            <TableHead>Semester</TableHead>
                                            <TableHead>Year Level</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Enrollment Date</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {enrollments.length > 0 ? (
                                            enrollments.map((enrollment) => (
                                                <TableRow key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-gray-900 dark:text-white">
                                                                {enrollment.student?.first_name} {enrollment.student?.last_name}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                ID: {enrollment.student?.student_id}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.student?.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {enrollment.program?.name || 'N/A'}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {enrollment.program?.code}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            {enrollment.academic_year || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {enrollment.semester || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            Year {enrollment.year_level || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(enrollment.status)}>
                                                            {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1) || 'Unknown'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {enrollment.enrollment_date ? formatDate(enrollment.enrollment_date) : 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Link
                                                                href={`/registrar/enrollments/${enrollment.id}`}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                View
                                                            </Link>
                                                            <Link
                                                                href={`/registrar/enrollments/${enrollment.id}/edit`}
                                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Link
                                                                href={`/registrar/students/${enrollment.student?.id}`}
                                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                                                            >
                                                                Student
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
                                                            <span className="text-gray-400 text-xl">📋</span>
                                                        </div>
                                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                                                            No enrollments found
                                                        </h3>
                                                        <p className="text-gray-500 dark:text-gray-400">
                                                            {search || status || program 
                                                                ? 'Try adjusting your search filters' 
                                                                : 'Start by enrolling students in programs'
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