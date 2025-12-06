import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, UserPlus, Eye, Edit, Trash2, Download } from 'lucide-react'
import { useState } from 'react'

export default function StudentsIndex({ students, auth }) {
    const [searchTerm, setSearchTerm] = useState('')

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
                {/* Search and Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Search Students</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search by name, student number, or email..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Programs</option>
                                <option value="college">College</option>
                                <option value="shs">Senior High School</option>
                            </select>
                            <select className="border border-gray-300 rounded-md px-3 py-2">
                                <option value="">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
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
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4">Student Info</th>
                                        <th className="text-left py-3 px-4">Student Number</th>
                                        <th className="text-left py-3 px-4">Program</th>
                                        <th className="text-left py-3 px-4">Year Level</th>
                                        <th className="text-left py-3 px-4">Status</th>
                                        <th className="text-left py-3 px-4">Enrolled Date</th>
                                        <th className="text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student.id} className="border-b hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {student.first_name} {student.middle_name} {student.last_name}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.user?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="font-mono text-sm">
                                                    {student.student_number}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <div className="font-medium">
                                                        {student.program?.name || 'N/A'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {student.track && `${student.track} - ${student.strand}`}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge variant="outline">
                                                    {student.education_level === 'college' 
                                                        ? `${student.current_year_level || student.year_level} Year`
                                                        : `Grade ${student.year_level}`
                                                    }
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4">
                                                <Badge 
                                                    variant="secondary"
                                                    className={getStatusColor(student.user?.is_active)}
                                                >
                                                    {student.user?.is_active ? 'Active' : 'Inactive'}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                                {student.enrolled_date 
                                                    ? new Date(student.enrolled_date).toLocaleDateString()
                                                    : 'N/A'
                                                }
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleViewStudent(student.id)}
                                                    >
                                                        <Eye className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleEditStudent(student.id)}
                                                    >
                                                        <Edit className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:text-red-700"
                                                    >
                                                        <Trash2 className="w-3 h-3" />
                                                    </Button>
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