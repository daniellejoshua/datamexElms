import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, Eye, Edit, Filter, UserPlus } from 'lucide-react'
import { useState } from 'react'

// Helper function to format section name
const formatSectionName = (section) => {
    if (!section) return 'Not Enrolled';
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'N/A';
};

export default function StudentsIndex({ students, programs, filters, auth, on_hold_count }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [educationLevel, setEducationLevel] = useState(filters?.education_level || 'all')
    const [status, setStatus] = useState(filters?.status || 'all')
    const [yearLevel, setYearLevel] = useState(filters?.year_level || 'all')
    const [studentType, setStudentType] = useState(filters?.student_type || 'all')

    const handleFilterChange = () => {
        router.get(route('registrar.students'), {
            education_level: educationLevel,
            status: status,
            year_level: yearLevel,
            student_type: studentType,
        }, {
            preserveState: true,
            preserveScroll: true,
        })
    }

    const handleResetFilters = () => {
        setEducationLevel('all')
        setStatus('all')
        setYearLevel('all')
        setStudentType('all')
        router.get(route('registrar.students'))
    }

    const filteredStudents = students.data.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (isActive) => {
        return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }

    const handleViewStudent = (studentId) => {
        router.visit(`/registrar/students/${studentId}`)
    }

    const handleEditStudent = (studentId) => {
        router.visit(`/registrar/students/${studentId}/edit`)
    }

    const clearHold = (studentId) => {
        if (!confirm('Clear hold for this student? Ensure payment is reconciled.')) return;

        router.post(route('registrar.students.clear_hold', studentId), {}, {
            onSuccess: () => {
                // reload current page to refresh counts
                router.reload();
            }
        });
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-2 rounded-lg">
                        <Users className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Manage student records, enrollment, and academic information
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Student Management" />

            <div className="space-y-6">
                {/* On-hold summary */}
                {/* If controller provided on_hold_count prop, show it */}
                {typeof on_hold_count !== 'undefined' && (
                    <Card>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-semibold">Students on Hold</h3>
                                    <p className="text-xs text-gray-500">Students prevented from enrolling due to unpaid balances</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-bold text-yellow-700">{on_hold_count}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-purple-600" />
                                <CardTitle className="text-lg">Search & Filter Students</CardTitle>
                            </div>
                            <Link href={route('registrar.students.create')}>
                                <Button className="gap-2">
                                    <UserPlus className="w-4 h-4" />
                                    Add Student
                                </Button>
                            </Link>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name, student number, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Education Level</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={educationLevel}
                                        onChange={(e) => setEducationLevel(e.target.value)}
                                    >
                                        <option value="all">All Levels</option>
                                        <option value="college">College</option>
                                        <option value="shs">Senior High School</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Status</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Student Type</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={studentType}
                                        onChange={(e) => setStudentType(e.target.value)}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="regular">Regular</option>
                                        <option value="irregular">Irregular</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">Year Level</label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={yearLevel}
                                        onChange={(e) => setYearLevel(e.target.value)}
                                    >
                                        <option value="all">All Years</option>
                                        <option value="1">1st Year / Grade 11</option>
                                        <option value="2">2nd Year / Grade 12</option>
                                        <option value="3">3rd Year</option>
                                        <option value="4">4th Year</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleFilterChange} className="flex-1 sm:flex-initial">
                                    Apply Filters
                                </Button>
                                {(educationLevel !== 'all' || status !== 'all' || yearLevel !== 'all' || studentType !== 'all') && (
                                    <Button variant="outline" onClick={handleResetFilters}>
                                        Reset Filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Students List */}
                <Card>
                    <CardHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="flex items-center">
                                    <Users className="w-5 h-5 mr-2" />
                                    Students ({filteredStudents.length})
                                </CardTitle>
                                <CardDescription>
                                    Manage student records and enrollment status
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Student Info</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Student Number</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Program</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Current Section</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Year Level</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Type</th>
                                        <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                                        <th className="text-right py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900">
                                                        {student.first_name} {student.middle_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.user?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                                                    {student.student_number}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {student.program?.program_name || student.program?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {student.program?.program_code || ''}
                                                        {student.track && ` - ${student.track}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium text-blue-600">
                                                    {formatSectionName(student.current_section)}
                                                </div>
                                                {student.current_section && (
                                                    <div className="text-xs text-gray-500">
                                                        {student.current_section.academic_year} - {student.current_section.semester}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline" className="font-medium">
                                                    {student.education_level === 'college' 
                                                        ? `${student.current_year_level || student.year_level} Year`
                                                        : `Grade ${student.year_level}`
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                {student.student_type && (
                                                    <Badge 
                                                        variant="secondary"
                                                        className={student.student_type === 'regular' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                        }
                                                    >
                                                        {student.student_type}
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    <Badge 
                                                        variant="secondary"
                                                        className={getStatusColor(student.user?.is_active)}
                                                    >
                                                        {student.user?.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                    {student.is_on_hold && (
                                                        <Badge className="bg-yellow-100 text-yellow-800">
                                                            On Hold • ₱{Number(student.hold_balance || 0).toFixed(2)}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('registrar.payments.show', student.id)}>
                                                        <Button size="sm" variant="outline" className="hover:bg-blue-50 hover:border-blue-300">
                                                            Payments
                                                        </Button>
                                                    </Link>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewStudent(student.id)}
                                                        className="hover:bg-blue-50 hover:border-blue-300"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditStudent(student.id)}
                                                        className="hover:bg-green-50 hover:border-green-300"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>

                                                    {student.is_on_hold && (
                                                        <Button size="sm" onClick={() => clearHold(student.id)} className="border-yellow-400 text-yellow-700 hover:bg-yellow-50">
                                                            Clear Hold
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {filteredStudents.length === 0 && (
                                <div className="text-center py-8">
                                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new student.'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pagination */}
                        {students.links && students.links.length > 3 && (
                            <div className="mt-6 flex justify-between items-center">
                                <p className="text-sm text-gray-700">
                                    Showing {students.from} to {students.to} of {students.total} results
                                </p>
                                <div className="flex gap-1">
                                    {students.links.map((link, index) => (
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
        </AuthenticatedLayout>
    )
}