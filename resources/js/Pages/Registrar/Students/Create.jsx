import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UserPlus, ArrowLeft, GraduationCap, BookOpen, AlertTriangle, DollarSign } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

export default function CreateStudent({ programs, auth, currentAcademicYear, currentSemester, course_shift_required, old }) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset } = useForm(old || {
        // Student Number (for checking existing students)
        student_number: '',
        
        // Personal Information
        first_name: '',
        last_name: '',
        middle_name: '',
        suffix: '',
        birth_date: '',
        street: '',
        barangay: '',
        city: '',
        province: '',
        zip_code: '',
        phone: '',
        email: '',
        parent_contact: '',
        
        // Academic Information
        program_id: '',
        year_level: '',
        student_type: 'regular',
        education_level: '',
        track: '',
        strand: '',
        
        // Payment Information
        enrollment_fee: '',
        payment_amount: '',

        // Course shifting confirmation
        confirm_course_shift: false,
    })

    // Helper function to format dates for HTML date inputs
    const formatDateForInput = (dateString) => {
        if (!dateString) return ''
        try {
            const date = new Date(dateString)
            return date.toISOString().split('T')[0]
        } catch {
            return dateString
        }
    }

    const [selectedProgram, setSelectedProgram] = useState(null)
    const [calculatedBalance, setCalculatedBalance] = useState(0)
    const [archivedStudent, setArchivedStudent] = useState(null)
    const [checkingArchived, setCheckingArchived] = useState(false)
    const [studentFound, setStudentFound] = useState(null)
    const [isExistingStudent, setIsExistingStudent] = useState(false)
    const [isReturningStudent, setIsReturningStudent] = useState(false)
    const [checkingStudent, setCheckingStudent] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [showCourseShiftModal, setShowCourseShiftModal] = useState(false)
    const [courseShiftData, setCourseShiftData] = useState(null)
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [showPaymentModal, setShowPaymentModal] = useState(false)
    const [paymentHistory, setPaymentHistory] = useState(null)
    const [loadingPaymentHistory, setLoadingPaymentHistory] = useState(false)
    const [suffixType, setSuffixType] = useState('none') // 'none', 'selected', 'other'
    const [customSuffix, setCustomSuffix] = useState('')
    const lastErrorRef = useRef('')

    // Group programs by education level
    const collegePrograms = programs.filter(p => p.education_level === 'college')
    const shsPrograms = programs.filter(p => p.education_level === 'shs')

    useEffect(() => {
        if (data.program_id) {
            const program = programs.find(p => p.id === parseInt(data.program_id))
            setSelectedProgram(program)
        } else {
            setSelectedProgram(null)
        }
    }, [data.program_id, programs])

    useEffect(() => {
        if (data.program_id && data.year_level && data.student_type) {
            const program = programs.find(p => p.id === parseInt(data.program_id))

            // Only auto-populate fee for regular students
            if (data.student_type === 'regular') {
                // Find the appropriate fee for this year level and student type
                const programFee = program?.program_fees?.find(fee =>
                    fee.year_level === parseInt(data.year_level) &&
                    fee.fee_type === 'regular'
                )
                setData(prev => ({
                    ...prev,
                    education_level: program?.education_level || '',
                    track: program?.track || '',
                    strand: program?.strand || '',
                    enrollment_fee: programFee?.semester_fee || '',
                }))
            } else {
                // For irregular students, don't auto-populate fee
                setData(prev => ({
                    ...prev,
                    education_level: program?.education_level || '',
                    track: program?.track || '',
                    strand: program?.strand || '',
                    // enrollment_fee remains as user input
                }))
            }
        }
    }, [data.program_id, data.year_level, data.student_type])

    useEffect(() => {
        const enrollmentFee = parseFloat(data.enrollment_fee) || 0
        const paymentAmount = parseFloat(data.payment_amount) || 0
        setCalculatedBalance(enrollmentFee - paymentAmount)
    }, [data.enrollment_fee, data.payment_amount])

    // Auto-correct student type for new first-year first-semester students
    useEffect(() => {
        if (!isExistingStudent && !isReturningStudent && data.year_level === '1' && currentSemester === 'first' && data.student_type === 'irregular') {
            setData('student_type', 'regular')
        }
    }, [data.year_level, data.student_type, isExistingStudent, isReturningStudent, currentSemester])

    // Show error modal when student error exists
    useEffect(() => {
        if (errors.student) {
            setShowErrorModal(true)
        } else {
            setShowErrorModal(false)
            lastErrorRef.current = ''
        }
    }, [errors.student])

    // Show course shift confirmation modal when course_shift_required prop exists
    useEffect(() => {
        if (course_shift_required) {
            setCourseShiftData(course_shift_required)
            setShowCourseShiftModal(true)
        } else {
            setCourseShiftData(null)
            setShowCourseShiftModal(false)
        }
    }, [course_shift_required])

    // Check for archived student when email changes
    useEffect(() => {
        if (data.email && data.email.includes('@')) {
            checkArchivedStudent()
        } else {
            setArchivedStudent(null)
        }
    }, [data.email])

    // Handle suffix changes
    useEffect(() => {
        if (suffixType === 'none') {
            setData('suffix', '')
        } else if (suffixType === 'other') {
            setData('suffix', customSuffix)
        } else {
            // Handle predefined suffixes like 'Jr.', 'Sr.', etc.
            setData('suffix', suffixType)
        }
    }, [suffixType, customSuffix, setData])

    // Initialize suffix type based on existing data
    useEffect(() => {
        if (data.suffix) {
            const predefinedSuffixes = ['Jr.', 'Sr.', 'II', 'III', 'IV', 'V']
            if (predefinedSuffixes.includes(data.suffix)) {
                setSuffixType(data.suffix)
                setCustomSuffix('')
            } else {
                setSuffixType('other')
                setCustomSuffix(data.suffix)
            }
        } else {
            setSuffixType('none')
            setCustomSuffix('')
        }
    }, [data.suffix])

    const checkArchivedStudent = async () => {
        if (!data.email) return
        
        setCheckingArchived(true)
        try {
            const response = await fetch(`/api/archived-students/check?email=${encodeURIComponent(data.email)}`)
            if (response.ok) {
                const result = await response.json()
                setArchivedStudent(result.archivedStudent)
            }
        } catch (error) {
            console.error('Error checking archived student:', error)
        } finally {
            setCheckingArchived(false)
        }
    }

    const checkStudent = async () => {
        if (!data.student_number) return
        
        setCheckingStudent(true)
        try {
            const response = await fetch(`/api/students/check/${data.student_number}`)
            const result = await response.json()
            
            if (result.exists) {
                setStudentFound(result.student)
                setIsExistingStudent(true)
                setIsReturningStudent(false)
                // Auto-fill existing student data
                const addressParts = result.student.address ? result.student.address.split(',').map(part => part.trim()) : []
                setData(prev => ({
                    ...prev,
                    first_name: result.student.first_name || '',
                    last_name: result.student.last_name || '',
                    middle_name: result.student.middle_name || '',
                    email: result.student.email || '',
                    program_id: result.student.program?.id || '',
                    year_level: result.student.year_level || '',
                    education_level: result.student.education_level || 'college',
                    student_type: result.student.student_type || 'regular',
                    birth_date: formatDateForInput(result.student.birth_date) || '',
                    phone: result.student.phone || '',
                    parent_contact: result.student.parent_contact || '',
                    street: addressParts[0] || '',
                    barangay: addressParts[1] || '',
                    city: addressParts[2] || '',
                    province: addressParts[3] || '',
                    zip_code: addressParts[4] || '',
                }))
                // Fetch progress suggestion for existing student
                try {
                    const resp = await fetch(`/api/students/${result.student.id}/progress`)
                    if (resp.ok) {
                        const prog = await resp.json()
                        // Map numeric to label based on education level
                        const edu = result.student.education_level || 'college'
                        let suggestedLabel = ''
                        if (edu === 'college') {
                            const map = ['1st Year', '2nd Year', '3rd Year', '4th Year']
                            suggestedLabel = map[Math.max(0, Math.min(map.length - 1, prog.suggested_year_numeric - 1))]
                        } else {
                            // Senior High School: map to Grade 11/12
                            const grade = 11 + Math.max(0, prog.suggested_year_numeric - 1)
                            suggestedLabel = `Grade ${grade}`
                        }

                        if (suggestedLabel) {
                            setData(prev => ({ ...prev, year_level: suggestedLabel }))
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch progress suggestion', e)
                }
            } else if (result.archived) {
                // Student exists in archived records
                setStudentFound(result.archived)
                setIsExistingStudent(false)
                setIsReturningStudent(true)
                // Auto-fill archived student data
                setData(prev => ({
                    ...prev,
                    first_name: result.archived.first_name || '',
                    last_name: result.archived.last_name || '',
                    middle_name: result.archived.middle_name || '',
                    email: result.archived.email || '',
                    program_id: result.archived.program?.id || '',
                    year_level: result.archived.year_level || '',
                    education_level: result.archived.education_level || 'college',
                    student_type: 'returning',
                    birth_date: formatDateForInput(result.archived.birth_date) || '',
                    phone: result.archived.phone || '',
                    parent_contact: result.archived.parent_contact || '',
                    street: result.archived.address?.split(',')[0]?.trim() || '',
                    barangay: result.archived.address?.split(',')[1]?.trim() || '',
                    city: result.archived.address?.split(',')[2]?.trim() || '',
                    province: result.archived.address?.split(',')[3]?.trim() || '',
                    zip_code: result.archived.address?.split(',')[4]?.trim() || '',
                }))
                // Fetch progress suggestion for returning (archived) student
                try {
                    const resp = await fetch(`/api/archived-students/${result.archived.id}/progress`)
                    if (resp.ok) {
                        const prog = await resp.json()
                        const edu = result.archived.education_level || 'college'
                        let suggestedLabel = ''
                        if (edu === 'college') {
                            const map = ['1st Year', '2nd Year', '3rd Year', '4th Year']
                            suggestedLabel = map[Math.max(0, Math.min(map.length - 1, prog.suggested_year_numeric - 1))]
                        } else {
                            const grade = 11 + Math.max(0, prog.suggested_year_numeric - 1)
                            suggestedLabel = `Grade ${grade}`
                        }

                        if (suggestedLabel) {
                            setData(prev => ({ ...prev, year_level: suggestedLabel }))
                        }
                    }
                } catch (e) {
                    console.error('Failed to fetch archived progress suggestion', e)
                }
            } else {
                setStudentFound(null)
                setIsExistingStudent(false)
                setIsReturningStudent(false)
                // Reset form for new student
                setData(prev => ({
                    ...prev,
                    first_name: '',
                    last_name: '',
                    middle_name: '',
                    email: '',
                    program_id: '',
                    year_level: '',
                    education_level: 'college',
                    student_type: 'regular',
                    birth_date: '',
                    phone: '',
                    parent_contact: '',
                    street: '',
                    barangay: '',
                    city: '',
                    province: '',
                    zip_code: '',
                }))
            }
        } catch (error) {
            console.error('Error checking student:', error)
        } finally {
            setCheckingStudent(false)
        }
    }

    const confirmCourseShift = () => {
        setData('confirm_course_shift', true)
        setShowCourseShiftModal(false)
        // Submit the form again with confirmation
        handleSubmit({ preventDefault: () => {} })
    }

    const cancelCourseShift = () => {
        setData('confirm_course_shift', false)
        setShowCourseShiftModal(false)
        setCourseShiftData(null)
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        
        // Show summary modal instead of direct submission
        setShowSummaryModal(true)
    }

    const handleConfirmRegistration = () => {
        // Reset modal state before submission
        setShowSummaryModal(false)
        setShowErrorModal(false)
        
        // Concatenate address parts
        const addressParts = [
            data.street,
            data.barangay,
            data.city,
            data.province,
            data.zip_code
        ].filter(Boolean).join(', ')
        
        // Create new data object with address
        const submitData = {
            ...data,
            address: addressParts || null
        }
        
        console.log('Form submitting with data:', submitData)
        
        // Submit using Inertia's post with the form data directly
        post(route('registrar.students.store'), {
            preserveScroll: true,
            data: submitData,
            onSuccess: (page) => {
                console.log('Success response:', page)

                // If the server re-rendered the Create page with course_shift_required,
                // show the course shift modal and restore form data instead of
                // treating it as a final success.
                if (page.props && page.props.course_shift_required) {
                    // Restore previous input if provided
                    if (page.props.old) {
                        try {
                            setData(prev => ({ ...prev, ...page.props.old }));
                        } catch (e) {
                            console.error('Failed to restore old form data', e)
                        }
                    }

                    setCourseShiftData(page.props.course_shift_required)
                    setShowCourseShiftModal(true)
                    return
                }

                // Normal successful registration
                alert('Student registered successfully!')
                router.visit(route('registrar.students'))
            },
            onError: (errors) => {
                console.error('Validation errors:', errors)
                // Show error modal if there's a student balance error
                if (errors.student) {
                    setShowErrorModal(true)
                } else {
                    alert('Please check the form for errors')
                }
            },
        })
    }

    const loadPaymentHistory = async (studentId) => {
        setLoadingPaymentHistory(true);
        try {
            const response = await fetch(`/api/students/${studentId}/payments`);
            const result = await response.json();
            setPaymentHistory(result);
            setShowPaymentModal(true);
        } catch (error) {
            console.error('Error loading payment history:', error);
            alert('Failed to load payment history');
        } finally {
            setLoadingPaymentHistory(false);
        }
    }

    const getYearLevelOptions = () => {
        if (!selectedProgram) return []
        
        if (selectedProgram.education_level === 'college') {
            return ['1st Year', '2nd Year', '3rd Year', '4th Year']
        } else {
            return ['Grade 11', 'Grade 12']
        }
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('registrar.students')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Students
                            </Link>
                        </Button>
                        <div className="h-6 w-px bg-gray-300"></div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Student Registration & Enrollment</h2>
                            <p className="text-sm text-purple-600 font-medium mt-1">Register new students or update existing student records</p>
                        </div>
                    </div>
                </div>
            }
        >
        
            <Head title="Register New Student" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Student Number Check */}
                <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <UserPlus className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Student Number Check</CardTitle>
                                <CardDescription>Enter student number to check if student exists and auto-fill data</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="student_number">Student Number *</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="student_number"
                                        value={data.student_number}
                                        onChange={e => setData('student_number', e.target.value)}
                                        placeholder="Enter student number"
                                        className="h-10"
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={checkStudent} 
                                        variant="outline"
                                        disabled={checkingStudent || !data.student_number}
                                    >
                                        {checkingStudent ? 'Checking...' : 'Check'}
                                    </Button>
                                </div>
                                {errors.student_number && (
                                    <p className="text-red-500 text-sm mt-1">{errors.student_number}</p>
                                )}
                            </div>

                            {studentFound && isExistingStudent && (
                                <div className="bg-green-50 p-4 rounded-md border border-green-200">
                                    <p className="text-sm text-green-800 font-medium flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Existing Student Found
                                    </p>
                                    <p className="text-sm text-green-600">
                                        {[studentFound.first_name, studentFound.middle_name, studentFound.last_name, studentFound.suffix].filter(Boolean).join(' ')} - {studentFound.program?.name}
                                    </p>
                                    <p className="text-xs text-green-500 mt-1">
                                        Student data has been auto-filled. You can modify if needed.
                                    </p>
                                </div>
                            )}

                            {isReturningStudent && (
                                <div className="bg-orange-50 p-4 rounded-md border border-orange-200">
                                    <p className="text-sm text-orange-800 font-medium flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        Returning Student Found
                                    </p>
                                    <p className="text-sm text-orange-600">
                                        {[studentFound.first_name, studentFound.middle_name, studentFound.last_name, studentFound.suffix].filter(Boolean).join(' ')} - Archived records restored
                                    </p>
                                    <p className="text-xs text-orange-500 mt-1">
                                        Student data has been auto-filled from archived records.
                                    </p>
                                </div>
                            )}

                            {!studentFound && data.student_number && !checkingStudent && (
                                <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
                                    <p className="text-sm text-blue-800 font-medium flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        New Student
                                    </p>
                                    <p className="text-sm text-blue-600">
                                        Student number not found. Please fill in all details below.
                                    </p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Personal Information */}
                <Card className="border-t-4 border-t-blue-500">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="bg-blue-100 p-2 rounded-lg">
                                <UserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <CardTitle>Personal Information</CardTitle>
                                <CardDescription>Enter the student's personal details</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input 
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={e => setData('first_name', e.target.value)}
                                    required
                                    className="h-10"
                                />
                                {errors.first_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.first_name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input 
                                    id="middle_name"
                                    value={data.middle_name}
                                    onChange={e => setData('middle_name', e.target.value)}
                                />
                                {errors.middle_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.middle_name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="last_name">Last Name *</Label>
                                <Input 
                                    id="last_name"
                                    value={data.last_name}
                                    onChange={e => setData('last_name', e.target.value)}
                                    required
                                />
                                {errors.last_name && (
                                    <p className="text-red-500 text-sm mt-1">{errors.last_name}</p>
                                )}
                            </div>

                             <div>
                                <Label htmlFor="suffix">Suffix</Label>
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
                                {errors.suffix && (
                                    <p className="text-red-500 text-sm mt-1">{errors.suffix}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="birth_date">Birth Date *</Label>
                                <Input 
                                    id="birth_date"
                                    type="date"
                                    value={data.birth_date}
                                    onChange={e => setData('birth_date', e.target.value)}
                                    required
                                />
                                {errors.birth_date && (
                                    <p className="text-red-500 text-sm mt-1">{errors.birth_date}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="email">Email Address *</Label>
                                <Input 
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={e => setData('email', e.target.value)}
                                    required
                                    placeholder="student@example.com"
                                />
                                {errors.email && (
                                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                                )}
                                {checkingArchived && (
                                    <p className="text-blue-500 text-sm mt-1">Checking for existing student records...</p>
                                )}
                                {archivedStudent && (
                                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-md">
                                        <p className="text-green-800 text-sm font-medium">
                                            Returning Student Found!
                                        </p>
                                        <p className="text-green-700 text-sm mt-1">
                                            Student #{archivedStudent.student_number} - {[archivedStudent.first_name, archivedStudent.middle_name, archivedStudent.last_name, archivedStudent.suffix].filter(Boolean).join(' ')}
                                        </p>
                                        <p className="text-green-600 text-xs mt-1">
                                            Last enrolled: {archivedStudent.archived_at}
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="mt-2"
                                            onClick={() => {
                                                setData({
                                                    ...data,
                                                    first_name: archivedStudent.first_name,
                                                    last_name: archivedStudent.last_name,
                                                    middle_name: archivedStudent.middle_name || '',
                                                    birth_date: archivedStudent.birth_date || '',
                                                    phone: archivedStudent.phone || '',
                                                    parent_contact: archivedStudent.parent_contact || '',
                                                    education_level: archivedStudent.education_level || '',
                                                    track: archivedStudent.track || '',
                                                    strand: archivedStudent.strand || '',
                                                })
                                            }}
                                        >
                                            Copy Student Details
                                        </Button>
                                    </div>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    This will be used as the username. Default password: password123
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input 
                                    id="phone"
                                    value={data.phone}
                                    onChange={e => setData('phone', e.target.value)}
                                    placeholder="09123456789"
                                />
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="parent_contact">Parent/Guardian Contact</Label>
                                <Input 
                                    id="parent_contact"
                                    value={data.parent_contact}
                                    onChange={e => setData('parent_contact', e.target.value)}
                                    placeholder="09123456789"
                                />
                                {errors.parent_contact && (
                                    <p className="text-red-500 text-sm mt-1">{errors.parent_contact}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label className="text-base font-semibold text-gray-900 mb-3 block">Address</Label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <Label htmlFor="street">Street/House No.</Label>
                                    <Input 
                                        id="street"
                                        value={data.street}
                                        onChange={e => setData('street', e.target.value)}
                                        placeholder="e.g. 123 Main St"
                                    />
                                    {errors.street && (
                                        <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="barangay">Barangay</Label>
                                    <Input 
                                        id="barangay"
                                        value={data.barangay}
                                        onChange={e => setData('barangay', e.target.value)}
                                        placeholder="e.g. San Antonio"
                                    />
                                    {errors.barangay && (
                                        <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="city">City/Municipality</Label>
                                    <Input 
                                        id="city"
                                        value={data.city}
                                        onChange={e => setData('city', e.target.value)}
                                        placeholder="e.g. Makati City"
                                    />
                                    {errors.city && (
                                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="province">Province</Label>
                                    <Input 
                                        id="province"
                                        value={data.province}
                                        onChange={e => setData('province', e.target.value)}
                                        placeholder="e.g. Metro Manila"
                                    />
                                    {errors.province && (
                                        <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="zip_code">Zip Code</Label>
                                    <Input 
                                        id="zip_code"
                                        value={data.zip_code}
                                        onChange={e => setData('zip_code', e.target.value)}
                                        placeholder="e.g. 1200"
                                        maxLength="4"
                                    />
                                    {errors.zip_code && (
                                        <p className="text-red-500 text-sm mt-1">{errors.zip_code}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <GraduationCap className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Academic Information</CardTitle>
                                <CardDescription>Select the student's program and year level</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="program_id" className="text-sm font-medium">Program *</Label>
                                <Select value={data.program_id.toString()} onValueChange={(value) => setData('program_id', value)}>
                                    <SelectTrigger className={`h-10 ${errors.program_id ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}`}>
                                        <SelectValue placeholder="Select program" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collegePrograms.length > 0 && (
                                            <div className="px-2 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50">
                                                COLLEGE PROGRAMS
                                            </div>
                                        )}
                                        {collegePrograms.map(program => (
                                            <SelectItem key={program.id} value={program.id.toString()}>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="font-mono text-xs">
                                                        {program.program_code}
                                                    </Badge>
                                                    <span className="text-sm">{program.program_name || program.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                        {shsPrograms.length > 0 && (
                                            <div className="px-2 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 mt-1">
                                                SENIOR HIGH SCHOOL
                                            </div>
                                        )}
                                        {shsPrograms.map(program => (
                                            <SelectItem key={program.id} value={program.id.toString()}>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium">{program.program_name || program.name}</span>
                                                    {program.track && program.strand && (
                                                        <span className="text-xs text-gray-500">{program.track} - {program.strand}</span>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.program_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.program_id}</p>
                                )}
                                {selectedProgram && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-medium text-blue-800">
                                            {selectedProgram.education_level === 'college' ? '🎓 College Program' : '📚 Senior High School'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="year_level" className="text-sm font-medium">Year Level *</Label>
                                {errors.year_level && (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                                        <p className="text-sm text-red-700">{errors.year_level}</p>
                                    </div>
                                )}

                                <Select 
                                    value={data.year_level} 
                                    onValueChange={(value) => setData('year_level', value)}
                                    disabled={!selectedProgram}
                                >
                                    <SelectTrigger className={`h-10 ${errors.year_level ? 'border-red-500' : 'border-gray-300 focus:border-green-500'} ${!selectedProgram ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
                                        <SelectValue placeholder={!selectedProgram ? 'Select Program First' : 'Select Year Level'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getYearLevelOptions().map(level => (
                                            <SelectItem key={level} value={level}>
                                                {level}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="student_type" className="text-sm font-medium">Student Type *</Label>
                            <Select value={data.student_type} onValueChange={(value) => setData('student_type', value)}>
                                <SelectTrigger className={`h-10 ${errors.student_type ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}`}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="regular">✓ Regular Student</SelectItem>
                                    <SelectItem 
                                        value="irregular" 
                                        disabled={!isExistingStudent && !isReturningStudent && data.year_level === '1' && currentSemester === 'first'}
                                    >
                                        ⚠ Irregular Student
                                        {!isExistingStudent && !isReturningStudent && data.year_level === '1' && currentSemester === 'first' && (
                                            <span className="text-xs text-gray-400 ml-2">(Not available for new 1st year 1st semester students)</span>
                                        )}
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.student_type && (
                                <p className="text-red-500 text-sm mt-1">{errors.student_type}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                Regular students follow the standard curriculum; Irregular students may have back subjects or different schedules
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Payment Information */}
                <Card className="border-t-4 border-t-orange-500">
                    <CardHeader className="bg-gradient-to-r from-orange-50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="bg-orange-100 p-2 rounded-lg">
                                <BookOpen className="w-5 h-5 text-orange-600" />
                            </div>
                                <div>
                                    <CardTitle>Enrollment Fee Payment</CardTitle>
                                    <CardDescription>
                                        Process the initial enrollment fee payment for {currentAcademicYear} - {currentSemester} Semester
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="enrollment_fee">Enrollment Fee *</Label>
                                <Input
                                    id="enrollment_fee"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.enrollment_fee}
                                    onChange={e => setData('enrollment_fee', e.target.value)}
                                    required
                                    placeholder="0.00"
                                    readOnly={data.student_type === 'regular'}
                                    className={data.student_type === 'regular' ? 'bg-gray-50' : ''}
                                />
                                {errors.enrollment_fee && (
                                    <p className="text-red-500 text-sm mt-1">{errors.enrollment_fee}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.student_type === 'regular'
                                        ? 'Automatically set based on selected program and year level'
                                        : 'Enter enrollment fee manually for irregular students'
                                    }
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="payment_amount">Initial Payment Amount *</Label>
                                <Input 
                                    id="payment_amount"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={data.payment_amount}
                                    onChange={e => setData('payment_amount', e.target.value)}
                                    required
                                    placeholder="0.00"
                                />
                                {errors.payment_amount && (
                                    <p className="text-red-500 text-sm mt-1">{errors.payment_amount}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Amount paid today towards the enrollment fee
                                </p>
                            </div>
                        </div>

                        {/* Balance Display */}
                        {data.enrollment_fee && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Enrollment Fee Balance
                                        </p>
                                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                                            ₱{calculatedBalance.toFixed(2)}
                                        </p>
                                    </div>
                                    {calculatedBalance > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500">
                                                Remaining balance to be paid
                                            </p>
                                        </div>
                                    )}
                                    {calculatedBalance === 0 && data.enrollment_fee > 0 && (
                                        <div className="text-right">
                                            <p className="text-xs text-green-600 font-medium">
                                                Fully Paid
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end gap-3 mt-8">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit(route('registrar.students'))}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={processing}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        {processing ? 'Processing...' : isExistingStudent ? 'Update Student' : 'Register Student'}
                    </Button>
                </div>
            </form>

            {/* Error Modal */}
            <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Enrollment Not Allowed
                        </DialogTitle>
                        <DialogDescription>
                            {errors.student}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-between items-center">
                        {studentFound && (
                            <Button
                                variant="outline"
                                onClick={() => loadPaymentHistory(studentFound.id)}
                                disabled={loadingPaymentHistory}
                                className="flex items-center gap-2"
                            >
                                <DollarSign className="w-4 h-4" />
                                {loadingPaymentHistory ? 'Loading...' : 'View Payment History'}
                            </Button>
                        )}
                        <Button onClick={() => setShowErrorModal(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Course Shift Confirmation Modal */}
            <Dialog open={showCourseShiftModal} onOpenChange={setShowCourseShiftModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-orange-600">
                            <GraduationCap className="w-5 h-5" />
                            Course Shifting Detected
                        </DialogTitle>
                                <DialogDescription>
                                    Student <strong>{courseShiftData?.student_name}</strong> is being registered to a different program.
                                </DialogDescription>
                    </DialogHeader>
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                            <div>
                                <h4 className="font-medium text-orange-800">Important Notice</h4>
                                <p className="text-sm text-orange-700 mt-1">
                                    Changing programs will mark this student as <strong>irregular</strong>. 
                                    This action cannot be undone. Please confirm if you want to proceed with the course shift.
                                </p>
                            </div>
                        </div>
                    </div>
                            {/* Program comparison */}
                            <div className="mb-4">
                                <div className="text-sm text-gray-600 mb-2">Program change</div>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">Current</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{courseShiftData?.current_program_code || (programs.find(p => p.program_name === courseShiftData?.current_program)?.program_code) || courseShiftData?.current_program}</Badge>
                                            <div className="text-sm font-medium">{courseShiftData?.current_program}</div>
                                        </div>
                                    </div>

                                    <div className="text-gray-400">→</div>

                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">New</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{courseShiftData?.new_program_code || (programs.find(p => p.program_name === courseShiftData?.new_program)?.program_code) || courseShiftData?.new_program}</Badge>
                                            <div className="text-sm font-medium">{courseShiftData?.new_program}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            onClick={cancelCourseShift}
                            disabled={processing}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={confirmCourseShift}
                            disabled={processing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Confirm Course Shift
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Payment History Modal */}
            <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            Payment History - {[paymentHistory?.student?.first_name, paymentHistory?.student?.middle_name, paymentHistory?.student?.last_name, paymentHistory?.student?.suffix].filter(Boolean).join(' ')}
                        </DialogTitle>
                        <DialogDescription>
                            Student ID: {paymentHistory?.student?.student_number}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        {paymentHistory?.paymentSummary ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Paid</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-600">
                                            ₱{Number(paymentHistory.paymentSummary.totalPaid || 0).toFixed(2)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Outstanding Balance</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-red-600">
                                            ₱{Number(paymentHistory.paymentSummary.balance || 0).toFixed(2)}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm">Total Fee</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-blue-600">
                                            ₱{Number(paymentHistory.paymentSummary.totalFee || 0).toFixed(2)}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : null}

                        {paymentHistory?.payments && paymentHistory.payments.length > 0 ? (
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Payment Records</h3>
                                <div className="space-y-2">
                                    {paymentHistory.payments.map((payment, index) => (
                                        <Card key={index}>
                                            <CardContent className="p-4">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="font-medium">
                                                            {payment.academic_year} - {payment.semester}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Enrollment Fee: ₱{Number(payment.enrollment_fee || 0).toFixed(2)}
                                                        </div>
                                                        <div className="text-sm text-gray-600">
                                                            Paid: ₱{Number(payment.total_paid || 0).toFixed(2)} | 
                                                            Balance: ₱{Number(payment.balance || 0).toFixed(2)}
                                                        </div>
                                                    </div>
                                                    <Badge variant={payment.balance > 0 ? "destructive" : "default"}>
                                                        {payment.balance > 0 ? "Outstanding" : "Paid"}
                                                    </Badge>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                No payment records found for this student.
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end">
                        <Button onClick={() => setShowPaymentModal(false)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Summary Modal */}
            <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-blue-600" />
                            Student Registration Summary
                        </DialogTitle>
                        <DialogDescription>
                            Please review the student details before confirming registration.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Personal Information */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Full Name</span>
                                <p className="text-sm font-semibold">{data.first_name} {data.middle_name} {data.last_name}{data.suffix ? ` ${data.suffix}` : ''}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Student Number</span>
                                <p className="text-sm font-semibold">{data.student_number || 'Auto-generated'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Birth Date</span>
                                <p className="text-sm">{data.birth_date ? new Date(data.birth_date).toLocaleDateString() : 'Not provided'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Phone</span>
                                <p className="text-sm">{data.phone || 'Not provided'}</p>
                            </div>
                        </div>

                        {/* Address */}
                        {(data.street || data.barangay || data.city) && (
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-600">Address</span>
                                <p className="text-sm">
                                    {[data.street, data.barangay, data.city, data.province, data.zip_code].filter(Boolean).join(', ')}
                                </p>
                            </div>
                        )}

                        {/* Academic Information */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-green-50 rounded-lg">
                            <div>
                                <span className="text-sm font-medium text-gray-600">Program</span>
                                <p className="text-sm font-semibold">{selectedProgram?.program_name || 'Not selected'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Year Level</span>
                                <p className="text-sm font-semibold">{data.year_level || 'Not selected'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Student Type</span>
                                <p className="text-sm font-semibold">{data.student_type === 'regular' ? 'Regular Student' : 'Irregular Student'}</p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Education Level</span>
                                <p className="text-sm">{data.education_level === 'college' ? 'College' : 'Senior High School'}</p>
                            </div>
                        </div>

                        {/* Payment Information */}
                        <div className="p-4 bg-orange-50 rounded-lg">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Enrollment Fee</span>
                                    <p className="text-sm font-semibold">₱{data.enrollment_fee || '0.00'}</p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Payment Amount</span>
                                    <p className="text-sm font-semibold">₱{data.payment_amount || '0.00'}</p>
                                </div>
                            </div>
                            {calculatedBalance !== 0 && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                    <span className="text-sm font-medium text-gray-600">Balance</span>
                                    <p className={`text-sm font-semibold ${calculatedBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        ₱{Math.abs(calculatedBalance).toFixed(2)} {calculatedBalance > 0 ? 'Due' : 'Overpayment'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowSummaryModal(false)}
                            disabled={processing}
                            className="mr-2"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmRegistration}
                            disabled={processing}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <UserPlus className="w-4 h-4 mr-2" />
                            {processing ? 'Processing...' : 'Confirm Registration'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
