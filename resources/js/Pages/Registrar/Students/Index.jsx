import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table'
import { Badge } from '@/Components/ui/badge'

export default function StudentsIndex({ students, programs, filters }) {
    const [search, setSearch] = useState(filters?.search || '')
    const [program, setProgram] = useState(filters?.program || '')
    const [yearLevel, setYearLevel] = useState(filters?.year_level || '')
    const [status, setStatus] = useState(filters?.status || '')

    const { get } = useForm()

    const handleSearch = () => {
        get('/registrar/students', {
            search,
            program,
            year_level: yearLevel,
            status,
        })
    }

    const clearFilters = () => {
        setSearch('')
        setProgram('')
        setYearLevel('')
        setStatus('')
        get('/registrar/students')
    }

    const getStatusVariant = (status) => {
        const variants = {
            active: 'default',
            inactive: 'secondary',
            graduated: 'outline',
            dropped: 'destructive'
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
            total: students.length,
            active: students.filter(s => s.status === 'active').length,
            inactive: students.filter(s => s.status === 'inactive').length,
            graduated: students.filter(s => s.status === 'graduated').length,
            dropped: students.filter(s => s.status === 'dropped').length
        }
    }

    const statusCounts = getStatusCounts()

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        Student Management
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
            <Head title="Student Management" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Search and Filters */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <div className="flex flex-col lg:flex-row gap-4">
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

                                <div className="lg:w-32">
                                    <InputLabel htmlFor="year_level" value="Year Level" />
                                    <select
                                        id="year_level"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={yearLevel}
                                        onChange={(e) => setYearLevel(e.target.value)}
                                    >
                                        <option value="">All Years</option>
                                        <option value="1">Year 1</option>
                                        <option value="2">Year 2</option>
                                        <option value="3">Year 3</option>
                                        <option value="4">Year 4</option>
                                        <option value="5">Year 5</option>
                                    </select>
                                </div>
                                
                                <div className="lg:w-32">
                                    <InputLabel htmlFor="status" value="Status" />
                                    <select
                                        id="status"
                                        className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="graduated">Graduated</option>
                                        <option value="dropped">Dropped</option>
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

                    {/* Student Statistics */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span className="text-blue-600 text-sm">👥</span>
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
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.active}
                                        </dd>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                                            <span className="text-gray-600 text-sm">⏸️</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive</dt>
                                        <dd className="text-2xl font-semibold text-gray-900 dark:text-white">
                                            {statusCounts.inactive}
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
                    </div>

                    {/* Students Table */}
                    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Student Records ({students.length} students)
                            </h3>
                            
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Student</TableHead>
                                            <TableHead>Student ID</TableHead>
                                            <TableHead>Program</TableHead>
                                            <TableHead>Year Level</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Contact</TableHead>
                                            <TableHead>Enrollment Date</TableHead>
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
                                                                {student.first_name} {student.middle_name} {student.last_name}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {student.email}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-mono text-sm bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                            {student.student_id}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-sm">
                                                                {student.program?.name || 'N/A'}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                {student.program?.code}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm font-medium">
                                                            Year {student.year_level || 'N/A'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={getStatusVariant(student.status)}>
                                                            {student.status?.charAt(0).toUpperCase() + student.status?.slice(1) || 'Unknown'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="text-sm">
                                                                📱 {student.phone || 'N/A'}
                                                            </span>
                                                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                                                📍 {student.address || 'N/A'}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-sm">
                                                            {student.enrollment_date ? formatDate(student.enrollment_date) : 'N/A'}
                                                        </span>
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
                                                                href={`/registrar/students/${student.id}/edit`}
                                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                                            >
                                                                Edit
                                                            </Link>
                                                            <Link
                                                                href={`/registrar/payments/${student.id}/create`}
                                                                className="text-purple-600 hover:text-purple-800 text-sm font-medium"
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
                                                            {search || status || program || yearLevel 
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