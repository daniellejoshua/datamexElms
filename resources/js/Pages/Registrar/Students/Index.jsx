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
import { Users, Search, Eye, Edit, Filter, UserPlus, Mail, Phone, MapPin, Calendar, GraduationCap, User, CreditCard, BookOpen } from 'lucide-react'
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
    const [isApplyingFilters, setIsApplyingFilters] = useState(false)
    const [isSavingEdit, setIsSavingEdit] = useState(false)
    const [isLoadingModal, setIsLoadingModal] = useState(false)

    const handleFilterChange = () => {
        setIsApplyingFilters(true)
        router.get(route('registrar.students'), {
            education_level: educationLevel,
            status: status,
            year_level: yearLevel,
            student_type: studentType,
            enrollment_status: enrollmentStatus,
        }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setIsApplyingFilters(false),
        })
    }

    const handleResetFilters = () => {
        setEducationLevel('all')
        setStatus('all')
        setYearLevel('all')
        setStudentType('all')
        setEnrollmentStatus('enrolled')
        setIsApplyingFilters(true)
        router.get(route('registrar.students'), {}, {
            onFinish: () => setIsApplyingFilters(false),
        })
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

    // Auto-apply filters when they change
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleFilterChange()
        }, 300) // Debounce for 300ms to avoid too many requests

        return () => clearTimeout(timeoutId)
    }, [educationLevel, status, yearLevel, studentType, enrollmentStatus])

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
        setIsSavingEdit(true)
        router.put(route('registrar.students.update', selectedStudent.id), editFormData, {
            onSuccess: () => {
                setIsEditMode(false)
                setIsViewModalOpen(false)
                // Delay the reload to allow the toast to be visible
                setTimeout(() => {
                    router.reload()
                }, 2000) // 2 second delay
            },
            onError: (errors) => {
                // Rate limit errors are handled globally in app.jsx
                // Other validation errors will be handled by the form
                console.log('Save error:', errors)
            },
            onFinish: () => setIsSavingEdit(false),
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

            <div className="p-2 sm:p-3 lg:p-4">
                {/* Search and Filters - Collapsible */}
                <Card className="mb-4">
                    <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <Filter className="w-4 h-4" />
                                <span className="text-sm font-medium">Filter Students</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={route('registrar.students.create')}>
                                    <Button size="sm" className="gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Add Student
                                    </Button>
                                </Link>
                                {(educationLevel !== 'all' || status !== 'all' || yearLevel !== 'all' || studentType !== 'all' || enrollmentStatus !== 'enrolled') && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleResetFilters}
                                        disabled={isApplyingFilters}
                                        className="gap-2"
                                    >
                                        {isApplyingFilters ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                                                Resetting...
                                            </>
                                        ) : (
                                            'Reset Filters'
                                        )}
                                    </Button>
                                )}
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
                    </CardContent>
                    {isFiltersExpanded && (
                        <CardContent className="pt-0">
                            <div className="space-y-6">
                                {/* Filter Grid */}
                                <div className="space-y-4">
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
                            </div>
                        </CardContent>
                    )}
                </Card>

                {/* Students List */}
                <Card className="mb-4">
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
                    <CardContent className="p-0 relative">
                        {/* Loading overlay */}
                        {isApplyingFilters && (
                            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-20">
                                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg border">
                                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-sm font-medium text-gray-700">Applying filters...</span>
                                </div>
                            </div>
                        )}
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
                                                            : student.year_level.startsWith('Grade ') 
                                                                ? student.year_level 
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
                                    {students.links.map((link, index) => {
                                        if (!link.url) {
                                            return (
                                                <span
                                                    key={index}
                                                    className="px-3 py-1 text-sm text-gray-400 border border-gray-300 rounded"
                                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                                />
                                            )
                                        }
                                        
                                        // Parse URL and add filter parameters
                                        const url = new URL(link.url, window.location.origin)
                                        url.searchParams.set('education_level', educationLevel)
                                        url.searchParams.set('status', status)
                                        url.searchParams.set('year_level', yearLevel)
                                        url.searchParams.set('student_type', studentType)
                                        url.searchParams.set('enrollment_status', enrollmentStatus)
                                        
                                        return (
                                            <Link
                                                key={index}
                                                href={url.pathname + url.search}
                                                className={`px-3 py-1 text-sm border rounded ${
                                                    link.active 
                                                        ? 'bg-blue-500 text-white border-blue-500' 
                                                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                                }`}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                                preserveState
                                                preserveScroll
                                            />
                                        )
                                    })}
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
                <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
                    <DialogHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {/* Student Avatar */}
                                <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                    {selectedStudent ? formatStudentName(selectedStudent).split(' ').map(n => n[0]).join('').toUpperCase() : 'S'}
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-bold text-gray-900">
                                        {isEditMode ? 'Edit Student' : 'Student Profile'}
                                    </DialogTitle>
                                    <DialogDescription className="text-gray-600 mt-1">
                                        {isEditMode ? 'Update student information and settings' : 'Complete student information and academic records'}
                                    </DialogDescription>
                                    {selectedStudent && (
                                        <div className="flex items-center gap-4 mt-2">
                                            <Badge variant="outline" className="font-mono text-sm">
                                                {selectedStudent.student_number}
                                            </Badge>
                                            <Badge className={`${getStatusColor(selectedStudent.status)} font-medium`}>
                                                {getStatusText(selectedStudent.status)}
                                            </Badge>
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
                                    )}
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {selectedStudent && (
                        <div className="space-y-6">
                            {/* Quick Stats Bar */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {selectedStudent.education_level === 'college'
                                            ? `${selectedStudent.current_year_level || selectedStudent.year_level}Y`
                                            : selectedStudent.year_level.startsWith('Grade ')
                                                ? selectedStudent.year_level
                                                : `Grade ${selectedStudent.year_level}`
                                        }
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">Year Level</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {selectedStudent.program?.program_code || 'N/A'}
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">Program</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600">
                                        {selectedStudent.is_currently_enrolled ? '✓' : '✗'}
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">Enrolled</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-orange-600">
                                        {selectedStudent.archived_enrollments?.length || 0}
                                    </div>
                                    <div className="text-xs text-gray-600 uppercase tracking-wide">Past Semesters</div>
                                </div>
                            </div>

                            {/* Main Information Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Personal Information Card */}
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 text-blue-700">
                                            <User className="w-5 h-5" />
                                            Personal Information
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditMode ? (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-1 block">First Name</label>
                                                        <Input
                                                            value={editFormData.first_name}
                                                            onChange={(e) => setEditFormData({...editFormData, first_name: e.target.value})}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Last Name</label>
                                                        <Input
                                                            value={editFormData.last_name}
                                                            onChange={(e) => setEditFormData({...editFormData, last_name: e.target.value})}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Middle Name</label>
                                                    <Input
                                                        value={editFormData.middle_name}
                                                        onChange={(e) => setEditFormData({...editFormData, middle_name: e.target.value})}
                                                        className="h-9"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Suffix</label>
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
                                                        <SelectTrigger className="h-9">
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
                                                            className="mt-2 h-9"
                                                        />
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Birth Date</label>
                                                        <Input
                                                            type="date"
                                                            value={editFormData.birth_date}
                                                            onChange={(e) => setEditFormData({...editFormData, birth_date: e.target.value})}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
                                                        <Input
                                                            value={editFormData.phone}
                                                            onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                                                            className="h-9"
                                                        />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={editFormData.email}
                                                        disabled
                                                        className="h-9 bg-gray-50 cursor-not-allowed"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-1 block">Parent Contact</label>
                                                    <Input
                                                        value={editFormData.parent_contact}
                                                        onChange={(e) => setEditFormData({...editFormData, parent_contact: e.target.value})}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <User className="w-5 h-5 text-blue-600" />
                                                        <span className="text-sm font-medium text-gray-700">Full Name</span>
                                                    </div>
                                                    <span className="font-semibold text-gray-900">
                                                        {formatStudentName(selectedStudent)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                    <div className="flex items-center gap-3">
                                                        <Mail className="w-5 h-5 text-green-600" />
                                                        <span className="text-sm font-medium text-gray-700">Email</span>
                                                    </div>
                                                    <span className="text-sm text-gray-900">{selectedStudent.user?.email}</span>
                                                </div>

                                                {selectedStudent.birth_date && (
                                                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Calendar className="w-5 h-5 text-purple-600" />
                                                            <span className="text-sm font-medium text-gray-700">Birth Date</span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">
                                                            {new Date(selectedStudent.birth_date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </span>
                                                    </div>
                                                )}

                                                {selectedStudent.phone && (
                                                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-5 h-5 text-orange-600" />
                                                            <span className="text-sm font-medium text-gray-700">Phone</span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">{selectedStudent.phone}</span>
                                                    </div>
                                                )}

                                                {selectedStudent.parent_contact && (
                                                    <div className="flex items-center justify-between p-3 bg-pink-50 rounded-lg">
                                                        <div className="flex items-center gap-3">
                                                            <Phone className="w-5 h-5 text-pink-600" />
                                                            <span className="text-sm font-medium text-gray-700">Parent Contact</span>
                                                        </div>
                                                        <span className="text-sm text-gray-900">{selectedStudent.parent_contact}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Academic Information Card */}
                                <Card className="border-l-4 border-l-green-500">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
                                            <GraduationCap className="w-5 h-5" />
                                            Academic Information
                                        </CardTitle>
                                        {isEditMode && (
                                            <p className="text-sm text-amber-600 mt-2 bg-amber-50 p-2 rounded">
                                                ⚠️ Academic information cannot be edited for security reasons.
                                            </p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {isEditMode ? (
                                            <div className="space-y-4">
                                                <div className="p-4 bg-gray-50 rounded-lg">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-600">Program Code</span>
                                                            <div className="font-semibold text-gray-900">
                                                                {selectedStudent.program?.program_code || 'N/A'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-600">Education Level</span>
                                                            <div className="font-semibold text-gray-900 capitalize">
                                                                {selectedStudent.education_level}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-600">Year Level</span>
                                                            <div className="font-semibold text-gray-900">
                                                                {selectedStudent.education_level === 'college'
                                                                    ? `${selectedStudent.current_year_level || selectedStudent.year_level} Year`
                                                                    : selectedStudent.year_level.startsWith('Grade ') 
                                                                        ? selectedStudent.year_level 
                                                                        : `Grade ${selectedStudent.year_level}`
                                                                }
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-gray-600">Student Type</span>
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
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 mb-2 block">Status</label>
                                                    <Select
                                                        value={editFormData.status}
                                                        onValueChange={(value) => setEditFormData({...editFormData, status: value})}
                                                    >
                                                        <SelectTrigger className="h-9">
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
                                                    <div className="p-3 bg-blue-50 rounded-lg">
                                                        <span className="text-sm font-medium text-blue-700">Enrolled Date</span>
                                                        <div className="text-sm text-blue-900 font-medium">
                                                            {new Date(selectedStudent.enrolled_date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-green-700 uppercase tracking-wide">
                                                                Program
                                                            </span>
                                                        </div>
                                                        <div className="font-semibold text-green-900">
                                                            {selectedStudent.program?.program_code || 'N/A'}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-blue-700 uppercase tracking-wide">Level</span>
                                                        </div>
                                                        <div className="font-semibold text-blue-900 capitalize">
                                                            {selectedStudent.education_level}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-purple-700 uppercase tracking-wide">Year</span>
                                                        </div>
                                                        <div className="font-semibold text-purple-900">
                                                            {selectedStudent.education_level === 'college'
                                                                ? `${selectedStudent.current_year_level || selectedStudent.year_level} Year`
                                                                : selectedStudent.year_level.startsWith('Grade ') 
                                                                    ? selectedStudent.year_level 
                                                                    : `Grade ${selectedStudent.year_level}`
                                                            }
                                                        </div>
                                                    </div>

                                                    <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-orange-700 uppercase tracking-wide">Type</span>
                                                        </div>
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
                                                </div>

                                                {selectedStudent.strand && (
                                                    <div className="p-3 bg-gradient-to-r from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                                                            <span className="text-xs font-medium text-pink-700 uppercase tracking-wide">Strand</span>
                                                        </div>
                                                        <div className="font-semibold text-pink-900">{selectedStudent.strand}</div>
                                                    </div>
                                                )}

                                                <div className="p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                selectedStudent.status === 'active' ? 'bg-green-500' :
                                                                selectedStudent.status === 'inactive' ? 'bg-red-500' :
                                                                selectedStudent.status === 'graduated' ? 'bg-blue-500' :
                                                                'bg-yellow-500'
                                                            }`}></div>
                                                            <span className="text-sm font-medium text-gray-700">Status</span>
                                                        </div>
                                                        <Badge className={`${getStatusColor(selectedStudent.status)} font-medium`}>
                                                            {getStatusText(selectedStudent.status)}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {selectedStudent.enrolled_date && (
                                                    <div className="p-3 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Calendar className="w-4 h-4 text-indigo-600" />
                                                            <span className="text-xs font-medium text-indigo-700 uppercase tracking-wide">Enrolled Date</span>
                                                        </div>
                                                        <div className="text-sm text-indigo-900 font-medium">
                                                            {new Date(selectedStudent.enrolled_date).toLocaleDateString('en-US', {
                                                                year: 'numeric',
                                                                month: 'long',
                                                                day: 'numeric'
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Voucher Information - Only show for SHS students */}
                                                {selectedStudent.education_level === 'senior_high' && (
                                                    <div className="p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <div className={`w-3 h-3 rounded-full ${
                                                                selectedStudent.has_voucher && selectedStudent.voucher_status === 'active'
                                                                    ? 'bg-green-500'
                                                                    : selectedStudent.has_voucher && selectedStudent.voucher_status === 'invalid'
                                                                    ? 'bg-red-500'
                                                                    : 'bg-gray-400'
                                                            }`}></div>
                                                            <span className="text-sm font-medium text-yellow-800 uppercase tracking-wide">SHS Voucher</span>
                                                        </div>
                                                        <div className="space-y-1">
                                                            {selectedStudent.has_voucher ? (
                                                                <div className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <span className="text-sm text-yellow-900">Status:</span>
                                                                        <Badge
                                                                            variant="secondary"
                                                                            className={
                                                                                selectedStudent.voucher_status === 'active'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : 'bg-red-100 text-red-800'
                                                                            }
                                                                        >
                                                                            {selectedStudent.voucher_status === 'active' ? 'Active' : 'Invalid'}
                                                                        </Badge>
                                                                    </div>
                                                                    {selectedStudent.voucher_id && (
                                                                        <div className="p-2 bg-yellow-100 rounded border border-yellow-300">
                                                                            <span className="text-xs text-yellow-800 font-medium">
                                                                                Voucher ID: <span className="font-mono">{selectedStudent.voucher_id}</span>
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="text-sm text-yellow-900">
                                                                    <span className="font-medium">No voucher assigned</span>
                                                                </div>
                                                            )}
                                                            <div className="text-xs text-yellow-700 mt-1">
                                                                SHS students are eligible for tuition fee vouchers through the program.
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Academic History - Show for all students */}
                            <Card className="border-l-4 border-l-purple-500">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-purple-700">
                                        <GraduationCap className="w-5 h-5" />
                                        Academic History
                                        {selectedStudent.archived_enrollments?.length > 0 && (
                                            <Badge variant="secondary" className="ml-2">
                                                {selectedStudent.archived_enrollments.length} Semester{selectedStudent.archived_enrollments.length !== 1 ? 's' : ''}
                                            </Badge>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600">
                                        {selectedStudent.archived_enrollments?.length > 0
                                            ? 'View complete academic history with curriculum progress'
                                            : 'View academic history and enrollment timeline'
                                        }
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center justify-between p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                                                <BookOpen className="w-6 h-6 text-purple-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-purple-900 mb-1">
                                                    {selectedStudent.archived_enrollments?.length > 0
                                                        ? 'Complete Academic History'
                                                        : 'Academic History'
                                                    }
                                                </h4>
                                                <p className="text-sm text-purple-700">
                                                    {selectedStudent.archived_enrollments?.length > 0
                                                        ? 'View curriculum progress, completed subjects, and enrollment timeline'
                                                        : 'View enrollment timeline and academic information'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <Link
                                            href={route('registrar.students.academic-history', selectedStudent.id)}
                                            className="inline-block"
                                        >
                                            <Button className="bg-purple-600 hover:bg-purple-700">
                                                View History
                                                <GraduationCap className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Current Enrollment Information */}
                            <Card className="border-l-4 border-l-emerald-500">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2 text-emerald-700">
                                        <User className="w-5 h-5" />
                                        Current Enrollment Status
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className={`w-3 h-3 rounded-full ${
                                                    selectedStudent.is_currently_enrolled ? 'bg-green-500' : 'bg-gray-400'
                                                }`}></div>
                                                <span className="text-sm font-medium text-emerald-700 uppercase tracking-wide">Enrollment Status</span>
                                            </div>
                                            <div className="text-lg font-bold text-emerald-900 mb-1">
                                                {selectedStudent.is_currently_enrolled ? 'Currently Enrolled' : 'Not Enrolled'}
                                            </div>
                                            {selectedStudent.is_currently_enrolled && selectedStudent.current_section && (
                                                <div className="text-sm text-emerald-700">
                                                    {selectedStudent.current_section.academic_year} - {selectedStudent.current_section.semester}
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-blue-700 uppercase tracking-wide">Current Section</span>
                                            </div>
                                            <div className="text-lg font-bold text-blue-900 mb-1">
                                                {formatSectionName(selectedStudent.current_section, selectedStudent.is_currently_enrolled)}
                                            </div>
                                            {selectedStudent.current_section && (
                                                <div className="text-sm text-blue-700">
                                                    {selectedStudent.current_section.academic_year} - {selectedStudent.current_section.semester}
                                                </div>
                                            )}
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
                            <Button onClick={handleSaveStudent} disabled={isSavingEdit} className="bg-green-600 hover:bg-green-700">
                                {isSavingEdit ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </TooltipProvider>
        </AuthenticatedLayout>
    )
}