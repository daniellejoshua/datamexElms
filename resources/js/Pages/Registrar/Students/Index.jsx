import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Search, Eye, Edit, Filter, UserPlus, Mail, Phone, MapPin, Calendar, GraduationCap, User, CreditCard } from 'lucide-react'
import { useState } from 'react'

// Helper function to format section name
const formatSectionName = (section, isCurrentlyEnrolled) => {
    if (!section) {
        return isCurrentlyEnrolled ? 'Enrolled (No Section)' : 'Not Enrolled';
    }
    if (section.program?.program_code && section.year_level) {
        const identifier = section.section_name;
        return `${section.program.program_code}-${section.year_level}${identifier}`;
    }
    return section.section_name || 'N/A';
};

export default function StudentsIndex({ students, programs, filters, auth, on_hold_count, current_academic_period }) {
    const [searchTerm, setSearchTerm] = useState('')
    const [educationLevel, setEducationLevel] = useState(filters?.education_level || 'all')
    const [status, setStatus] = useState(filters?.status || 'all')
    const [yearLevel, setYearLevel] = useState(filters?.year_level || 'all')
    const [studentType, setStudentType] = useState(filters?.student_type || 'all')
    const [enrollmentStatus, setEnrollmentStatus] = useState(filters?.enrollment_status || 'enrolled')
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [isViewModalOpen, setIsViewModalOpen] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editFormData, setEditFormData] = useState({})

    const handleFilterChange = () => {
        router.get(route('registrar.students'), {
            education_level: educationLevel,
            status: status,
            year_level: yearLevel,
            student_type: studentType,
            enrollment_status: enrollmentStatus,
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
        setEnrollmentStatus('enrolled')
        router.get(route('registrar.students'))
    }

    const filteredStudents = students.data.filter(student =>
        student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.student_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'graduated':
                return 'bg-blue-100 text-blue-800';
            case 'dropped':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    const getStatusText = (status) => {
        switch (status) {
            case 'active':
                return 'Active';
            case 'inactive':
                return 'Inactive';
            case 'graduated':
                return 'Graduated';
            case 'dropped':
                return 'Dropped';
            default:
                return status || 'Unknown';
        }
    }

    const handleViewStudent = (studentId) => {
        const student = filteredStudents.find(s => s.id === studentId)
        if (student) {
            setSelectedStudent(student)
            setEditFormData({
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                middle_name: student.middle_name || '',
                birth_date: student.birth_date || '',
                address: student.address || '',
                street: student.street || '',
                barangay: student.barangay || '',
                city: student.city || '',
                province: student.province || '',
                zip_code: student.zip_code || '',
                phone: student.phone || '',
                email: student.user?.email || '',
                parent_contact: student.parent_contact || '',
                status: student.status || 'active',
            })
            setIsViewModalOpen(true)
            setIsEditMode(false)
        }
    }

    const handleEditStudent = (studentId) => {
        const student = filteredStudents.find(s => s.id === studentId)
        if (student) {
            setSelectedStudent(student)
            setEditFormData({
                first_name: student.first_name || '',
                last_name: student.last_name || '',
                middle_name: student.middle_name || '',
                birth_date: student.birth_date ? new Date(student.birth_date).toISOString().split('T')[0] : '',
                address: student.address || '',
                street: student.street || '',
                barangay: student.barangay || '',
                city: student.city || '',
                province: student.province || '',
                zip_code: student.zip_code || '',
                phone: student.phone || '',
                email: student.user?.email || '',
                parent_contact: student.parent_contact || '',
                program_id: student.program_id || '',
                year_level: student.year_level || '',
                student_type: student.student_type || 'regular',
                education_level: student.education_level || '',
                track: student.track || '',
                strand: student.strand || '',
                status: student.status || 'active',
            })
            setIsViewModalOpen(true)
            setIsEditMode(true)
        }
    }

    const handleSaveStudent = () => {
        router.put(route('registrar.students.update', selectedStudent.id), editFormData, {
            onSuccess: () => {
                setIsEditMode(false)
                setIsViewModalOpen(false)
                router.reload()
            },
            onError: (errors) => {
                console.error('Update failed:', errors)
            }
        })
    }

    const handleCancelEdit = () => {
        setIsEditMode(false)
        setEditFormData({
            first_name: selectedStudent.first_name || '',
            last_name: selectedStudent.last_name || '',
            middle_name: selectedStudent.middle_name || '',
            birth_date: selectedStudent.birth_date ? new Date(selectedStudent.birth_date).toISOString().split('T')[0] : '',
            address: selectedStudent.address || '',
            street: selectedStudent.street || '',
            barangay: selectedStudent.barangay || '',
            city: selectedStudent.city || '',
            province: selectedStudent.province || '',
            zip_code: selectedStudent.zip_code || '',
            phone: selectedStudent.phone || '',
            email: selectedStudent.user?.email || '',
            parent_contact: selectedStudent.parent_contact || '',
            status: selectedStudent.status || 'active',
        })
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
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
                                        <option value="graduated">Graduated</option>
                                        <option value="dropped">Dropped</option>
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
                                <div>
                                    <label className="text-xs font-medium text-gray-700 mb-1 block">
                                        Enrollment Status
                                        {current_academic_period && (
                                            <span className="text-xs text-gray-500 block">
                                                {current_academic_period.academic_year} {current_academic_period.semester}
                                            </span>
                                        )}
                                    </label>
                                    <select 
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
                                        value={enrollmentStatus}
                                        onChange={(e) => setEnrollmentStatus(e.target.value)}
                                    >
                                        <option value="enrolled">Currently Enrolled</option>
                                        <option value="not_enrolled">Not Enrolled</option>
                                        <option value="all">All Students</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={handleFilterChange} className="flex-1 sm:flex-initial">
                                    Apply Filters
                                </Button>
                                {(educationLevel !== 'all' || status !== 'all' || yearLevel !== 'all' || studentType !== 'all' || enrollmentStatus !== 'enrolled') && (
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
                                                <div className="font-medium text-blue-600">
                                                    {formatSectionName(student.current_section, student.is_currently_enrolled)}
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
                                                        className={getStatusColor(student.status)}
                                                    >
                                                        {getStatusText(student.status)}
                                                    </Badge>
                                                   
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex justify-end gap-2">
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

            {/* Student View/Edit Modal */}
            <Dialog open={isViewModalOpen} onOpenChange={(open) => {
                setIsViewModalOpen(open)
                if (!open) {
                    setIsEditMode(false)
                }
            }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <div className="flex justify-between items-center">
                            <div>
                                <DialogTitle className="flex items-center gap-3">
                                    <User className="w-6 h-6 text-purple-600" />
                                    {isEditMode ? 'Edit Student' : 'Student Details'}
                                </DialogTitle>
                                <DialogDescription>
                                    {isEditMode ? 'Update student information and settings' : 'View complete student information and enrollment details'}
                                </DialogDescription>
                            </div>
                            {!isEditMode && (
                                <Button
                                    onClick={() => setIsEditMode(true)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-6">
                            {/* Basic Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <User className="w-5 h-5" />
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {isEditMode ? (
                                            <div className="grid grid-cols-1 gap-3">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">First Name</label>
                                                        <Input
                                                            value={editFormData.first_name}
                                                            onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Last Name</label>
                                                        <Input
                                                            value={editFormData.last_name}
                                                            onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Middle Name</label>
                                                    <Input
                                                        value={editFormData.middle_name}
                                                        onChange={(e) => setEditFormData({...editFormData, middle_name: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={editFormData.email}
                                                        onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Birth Date</label>
                                                    <Input
                                                        type="date"
                                                        value={editFormData.birth_date}
                                                        onChange={(e) => setEditFormData({...editFormData, birth_date: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Phone</label>
                                                    <Input
                                                        value={editFormData.phone}
                                                        onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700">Parent Contact</label>
                                                    <Input
                                                        value={editFormData.parent_contact}
                                                        onChange={(e) => setEditFormData({...editFormData, parent_contact: e.target.value})}
                                                    />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Street</label>
                                                        <Input
                                                            value={editFormData.street}
                                                            onChange={(e) => setEditFormData({...editFormData, street: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Barangay</label>
                                                        <Input
                                                            value={editFormData.barangay}
                                                            onChange={(e) => setEditFormData({...editFormData, barangay: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">City</label>
                                                        <Input
                                                            value={editFormData.city}
                                                            onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Province</label>
                                                        <Input
                                                            value={editFormData.province}
                                                            onChange={(e) => setEditFormData({...editFormData, province: e.target.value})}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700">Zip Code</label>
                                                        <Input
                                                            value={editFormData.zip_code}
                                                            onChange={(e) => setEditFormData({...editFormData, zip_code: e.target.value})}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Full Name:</span>
                                                    <span className="font-semibold">
                                                        {selectedStudent.first_name} {selectedStudent.middle_name} {selectedStudent.last_name}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Student Number:</span>
                                                    <Badge variant="outline" className="font-mono">
                                                        {selectedStudent.student_number}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Email:</span>
                                                    <div className="flex items-center gap-1">
                                                        <Mail className="w-4 h-4 text-gray-400" />
                                                        <span>{selectedStudent.user?.email}</span>
                                                    </div>
                                                </div>
                                                {selectedStudent.birth_date && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Birth Date:</span>
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span>{new Date(selectedStudent.birth_date).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.phone && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Phone:</span>
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-4 h-4 text-gray-400" />
                                                            <span>{selectedStudent.phone}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.address && (
                                                    <div className="flex justify-between items-start">
                                                        <span className="font-medium text-gray-600">Address:</span>
                                                        <div className="flex items-start gap-1 max-w-xs">
                                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                                            <span className="text-right">{selectedStudent.address}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {selectedStudent.parent_contact && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Parent Contact:</span>
                                                        <span>{selectedStudent.parent_contact}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5" />
                                            Academic Information
                                        </CardTitle>
                                        {isEditMode && (
                                            <p className="text-sm text-gray-500 mt-2">
                                                Academic information cannot be edited for security reasons.
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {isEditMode ? (
                                            <>
                                                {selectedStudent.program?.program_code && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Program Code:</span>
                                                        <Badge variant="outline">{selectedStudent.program.program_code}</Badge>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Education Level:</span>
                                                    <Badge variant="secondary" className="capitalize">
                                                        {selectedStudent.education_level}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Year Level:</span>
                                                    <Badge variant="outline">
                                                        {selectedStudent.education_level === 'college' 
                                                            ? `${selectedStudent.current_year_level || selectedStudent.year_level} Year`
                                                            : `Grade ${selectedStudent.year_level}`
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Student Type:</span>
                                                    <Badge 
                                                        variant="secondary"
                                                        className={selectedStudent.student_type === 'regular' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                        }
                                                    >
                                                        {selectedStudent.student_type}
                                                    </Badge>
                                                </div>
                                                {selectedStudent.track && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Track:</span>
                                                        <span>{selectedStudent.track}</span>
                                                    </div>
                                                )}
                                                {selectedStudent.strand && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Strand:</span>
                                                        <span>{selectedStudent.strand}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Status:</span>
                                                    <Select
                                                        value={editFormData.status}
                                                        onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                                                    >
                                                        <SelectTrigger className="w-32">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="active">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                                    Active
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="inactive">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                                    Inactive
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="graduated">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                                    Graduated
                                                                </div>
                                                            </SelectItem>
                                                            <SelectItem value="dropped">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                                                    Dropped
                                                                </div>
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                {selectedStudent.enrolled_date && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Enrolled Date:</span>
                                                        <span>{new Date(selectedStudent.enrolled_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                {selectedStudent.program?.program_code && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Program Code:</span>
                                                        <Badge variant="outline">{selectedStudent.program.program_code}</Badge>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Education Level:</span>
                                                    <Badge variant="secondary" className="capitalize">
                                                        {selectedStudent.education_level}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Year Level:</span>
                                                    <Badge variant="outline">
                                                        {selectedStudent.education_level === 'college' 
                                                            ? `${selectedStudent.current_year_level || selectedStudent.year_level} Year`
                                                            : `Grade ${selectedStudent.year_level}`
                                                        }
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Student Type:</span>
                                                    <Badge 
                                                        variant="secondary"
                                                        className={selectedStudent.student_type === 'regular' 
                                                            ? 'bg-blue-100 text-blue-800' 
                                                            : 'bg-orange-100 text-orange-800'
                                                        }
                                                    >
                                                        {selectedStudent.student_type}
                                                    </Badge>
                                                </div>
                                                {selectedStudent.track && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Track:</span>
                                                        <span>{selectedStudent.track}</span>
                                                    </div>
                                                )}
                                                {selectedStudent.strand && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Strand:</span>
                                                        <span>{selectedStudent.strand}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between items-center">
                                                    <span className="font-medium text-gray-600">Status:</span>
                                                    <Badge className={getStatusColor(selectedStudent.status)}>
                                                        {getStatusText(selectedStudent.status)}
                                                    </Badge>
                                                </div>
                                                {selectedStudent.enrolled_date && (
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-medium text-gray-600">Enrolled Date:</span>
                                                        <span>{new Date(selectedStudent.enrolled_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Enrollment Information */}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Current Enrollment</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <span className="font-medium text-gray-600">Current Section:</span>
                                            <div className="mt-1">
                                                <span className="font-semibold text-blue-600">
                                                    {formatSectionName(selectedStudent.current_section, selectedStudent.is_currently_enrolled)}
                                                </span>
                                                {selectedStudent.current_section && (
                                                    <div className="text-sm text-gray-500 mt-1">
                                                        {selectedStudent.current_section.academic_year} - {selectedStudent.current_section.semester}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-600">Enrollment Status:</span>
                                            <div className="mt-1">
                                                <Badge 
                                                    variant={selectedStudent.is_currently_enrolled ? "default" : "secondary"}
                                                    className={selectedStudent.is_currently_enrolled ? "bg-green-100 text-green-800" : ""}
                                                >
                                                    {selectedStudent.is_currently_enrolled ? "Currently Enrolled" : "Not Enrolled"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {isEditMode && (
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button variant="outline" onClick={handleCancelEdit}>
                                Cancel
                            </Button>
                            <Button onClick={handleSaveStudent} className="bg-green-600 hover:bg-green-700">
                                Save Changes
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}