import { Head, Link, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import { Users, Search, Eye, Edit, Filter, UserPlus, Mail, Phone, MapPin, Calendar, GraduationCap, User, CreditCard } from 'lucide-react'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

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

// Helper function to format student full name with suffix
const formatStudentName = (student) => {
    const parts = [student.first_name, student.middle_name, student.last_name];
    if (student.suffix) {
        parts.push(student.suffix);
    }
    return parts.filter(Boolean).join(' ');
};

// Helper function to truncate text with ellipsis
const truncateText = (text, maxLength = 25) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
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
    const [isFiltersExpanded, setIsFiltersExpanded] = useState(false)
    const [suffixType, setSuffixType] = useState('none') // 'none', 'selected', 'other'
    const [customSuffix, setCustomSuffix] = useState('')

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

    // Handle suffix changes
    useEffect(() => {
        if (suffixType === 'none') {
            setEditFormData(prev => ({ ...prev, suffix: '' }))
        } else if (suffixType === 'other') {
            setEditFormData(prev => ({ ...prev, suffix: customSuffix }))
        } else {
            // Handle predefined suffixes like 'Jr.', 'Sr.', etc.
            setEditFormData(prev => ({ ...prev, suffix: suffixType }))
        }
    }, [suffixType, customSuffix])

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
                suffix: student.suffix || '',
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
            
            // Initialize suffix type based on existing data
            if (student.suffix) {
                const predefinedSuffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
                if (predefinedSuffixes.includes(student.suffix)) {
                    setSuffixType(student.suffix)
                    setCustomSuffix('')
                } else {
                    setSuffixType('other')
                    setCustomSuffix(student.suffix)
                }
            } else {
                setSuffixType('none')
                setCustomSuffix('')
            }
            
            setIsViewModalOpen(true)
            setIsEditMode(true)
        }
    }

    const handleSaveStudent = () => {
        router.put(route('registrar.students.update', selectedStudent.id), editFormData, {
            onSuccess: () => {
                toast.success('Student updated successfully!', {
                    style: { border: '1px solid #10b981', color: '#10b981' }
                })
                setIsEditMode(false)
                setIsViewModalOpen(false)
                router.reload()
            },
            onError: (errors) => {
                const errorMessage = Object.values(errors).find(error => error) || 'An unknown error occurred'
                toast.error(`Failed to update student: ${errorMessage}`, {
                    style: { border: '1px solid #ef4444', color: '#ef4444' }
                })
                console.error('Update failed:', errors)
            }
        })
    }

    const handleCancelEdit = () => {
        setIsViewModalOpen(false)
        setSuffixType('none')
        setCustomSuffix('')
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
            <TooltipProvider>
            <Head title="Student Management" />

            <div className="space-y-6">
                {/* Search and Filters - Collapsible */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Filter className="w-5 h-5 text-purple-600" />
                                <CardTitle className="text-lg">Search & Filter Students</CardTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={route('registrar.students.create')}>
                                    <Button size="sm" className="gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Add Student
                                    </Button>
                                </Link>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsFiltersExpanded(!isFiltersExpanded)}
                                    className="gap-2"
                                >
                                    {isFiltersExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    {isFiltersExpanded ? 'Hide' : 'Show'} Filters
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {isFiltersExpanded && (
                        <CardContent className="pt-0">
                            <div className="space-y-6">
                                {/* Filter Grid */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                        <Filter className="w-4 h-4" />
                                        Advanced Filters
                                    </h4>
                                    {/* Search Input */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Search Students</label>
                                        <Input
                                            type="text"
                                            placeholder="Search by name, student number, or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="h-8"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Education Level</label>
                                            <Select value={educationLevel} onValueChange={setEducationLevel}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="All Levels" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Levels</SelectItem>
                                                    <SelectItem value="college">College</SelectItem>
                                                    <SelectItem value="shs">Senior High School</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Status</label>
                                            <Select value={status} onValueChange={setStatus}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="All Status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Status</SelectItem>
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

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Student Type</label>
                                            <Select value={studentType} onValueChange={setStudentType}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="All Types" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Types</SelectItem>
                                                    <SelectItem value="regular">Regular</SelectItem>
                                                    <SelectItem value="irregular">Irregular</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">Year Level</label>
                                            <Select value={yearLevel} onValueChange={setYearLevel}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="All Years" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All Years</SelectItem>
                                                    <SelectItem value="1">1st Year / Grade 11</SelectItem>
                                                    <SelectItem value="2">2nd Year / Grade 12</SelectItem>
                                                    <SelectItem value="3">3rd Year</SelectItem>
                                                    <SelectItem value="4">4th Year</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                                                Enrollment Status
                                            </label>
                                            <Select value={enrollmentStatus} onValueChange={setEnrollmentStatus}>
                                                <SelectTrigger className="w-full h-8">
                                                    <SelectValue placeholder="Currently Enrolled" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="enrolled">Currently Enrolled</SelectItem>
                                                    <SelectItem value="not_enrolled">Not Enrolled</SelectItem>
                                                    <SelectItem value="all">All Students</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                                    <Button onClick={handleFilterChange} className="flex-1 sm:flex-initial">
                                        <Filter className="w-4 h-4 mr-2" />
                                        Apply Filters
                                    </Button>
                                    {(educationLevel !== 'all' || status !== 'all' || yearLevel !== 'all' || studentType !== 'all' || enrollmentStatus !== 'enrolled') && (
                                        <Button variant="outline" onClick={handleResetFilters} className="flex-1 sm:flex-initial">
                                            Reset All Filters
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    )}
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
                    <CardContent className="p-0">
                        {/* Table with fixed height */}
                        <div className="max-h-96 overflow-y-auto">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr className="border-b">
                                            <th className="text-left py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Student Info</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Student Number</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Current Section</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Year Level</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Type</th>
                                            <th className="text-left py-3 px-4 text-xs font-semibold text-gray-700 uppercase">Status</th>
                                            <th className="text-right py-3 px-6 text-xs font-semibold text-gray-700 uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStudents.map((student) => (
                                            <tr key={student.id} className="border-b hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-6">
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="cursor-pointer">
                                                                        {truncateText(formatStudentName(student))}
                                                                    </span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{formatStudentName(student)}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
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
                                                    {student.archived_enrollments?.length > 0 ? (
                                                        <div>
                                                            <div className="font-medium text-blue-600">
                                                                {formatSectionName(student.current_section, student.is_currently_enrolled)}
                                                            </div>
                                                            {student.current_section && (
                                                                <div className="text-xs text-gray-500">
                                                                    {student.current_section.academic_year} - {student.current_section.semester}
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-purple-600 mt-1">
                                                                {student.archived_enrollments.length} archived grade{student.archived_enrollments.length > 1 ? 's' : ''}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div className="font-medium text-blue-600">
                                                                {formatSectionName(student.current_section, student.is_currently_enrolled)}
                                                            </div>
                                                            {student.current_section && (
                                                                <div className="text-xs text-gray-500">
                                                                    {student.current_section.academic_year} - {student.current_section.semester}
                                                                </div>
                                                            )}
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
                                                <td className="py-3 px-6">
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
                                    <div className="text-center py-12">
                                        <Users className="mx-auto h-12 w-12 text-gray-400" />
                                        <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {searchTerm ? 'Try adjusting your search criteria.' : 'Get started by adding a new student.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Pagination */}
                        {students.links && students.links.length > 3 && (
                            <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
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
                                                    <label className="text-sm font-medium text-gray-700">Suffix</label>
                                                    <Select 
                                                        value={suffixType} 
                                                        onValueChange={(value) => {
                                                            setSuffixType(value)
                                                            if (value === 'other') {
                                                                // Keep customSuffix for 'other' case
                                                            } else {
                                                                setCustomSuffix('')
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select suffix (optional)" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">None</SelectItem>
                                                            <SelectItem value="Jr.">Jr.</SelectItem>
                                                            <SelectItem value="Sr.">Sr.</SelectItem>
                                                            <SelectItem value="II">II</SelectItem>
                                                            <SelectItem value="III">III</SelectItem>
                                                            <SelectItem value="IV">IV</SelectItem>
                                                            <SelectItem value="V">V</SelectItem>
                                                            <SelectItem value="other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {suffixType === 'other' && (
                                                        <Input 
                                                            placeholder="Enter custom suffix"
                                                            value={customSuffix}
                                                            onChange={(e) => setCustomSuffix(e.target.value)}
                                                            className="mt-2"
                                                        />
                                                    )}
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
                                                        {formatStudentName(selectedStudent)}
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

                            {/* Archived Grades - Only show for students with archived enrollments */}
                            {selectedStudent.archived_enrollments?.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            <GraduationCap className="w-5 h-5" />
                                            Archived Grades ({selectedStudent.archived_enrollments.length})
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedStudent.archived_enrollments.map((enrollment, index) => (
                                                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                        <div>
                                                            <span className="font-medium text-gray-600">Academic Year:</span>
                                                            <div className="text-sm">{enrollment.academic_year}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">Semester:</span>
                                                            <div className="text-sm">{enrollment.semester}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">Section:</span>
                                                            <div className="text-sm">{enrollment.archived_section?.section_name || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">Final Grade:</span>
                                                            <div className="text-sm font-semibold">{enrollment.final_semester_grade || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">Letter Grade:</span>
                                                            <div className="text-sm">{enrollment.letter_grade || 'N/A'}</div>
                                                        </div>
                                                        <div>
                                                            <span className="font-medium text-gray-600">Status:</span>
                                                            <Badge 
                                                                variant="secondary"
                                                                className={enrollment.final_status === 'completed' 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : enrollment.final_status === 'dropped' 
                                                                    ? 'bg-yellow-100 text-yellow-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                                }
                                                            >
                                                                {enrollment.final_status}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    {enrollment.final_grades && Object.keys(enrollment.final_grades).length > 0 && (
                                                        <div className="mt-4">
                                                            <span className="font-medium text-gray-600">Subject Grades:</span>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2">
                                                                {Object.entries(enrollment.final_grades).map(([subject, grade]) => (
                                                                    <div key={subject} className="text-sm bg-white p-2 rounded border">
                                                                        <span className="font-medium">{subject}:</span> {grade}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

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
        </TooltipProvider>
        </AuthenticatedLayout>
    )
}