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
import { toast } from 'sonner'

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
        curriculum_id: '',
        
        // Payment Information
        enrollment_fee: '',
        payment_amount: '',

        // Course shifting confirmation
        confirm_course_shift: false,
    })

    // Helper function to extract numeric year level
    const getNumericYearLevel = (yearLevel, educationLevel) => {
        const match = yearLevel.match(/(\d+)/)
        return match ? parseInt(match[1]) : 1
    }

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
    const [selectedCurriculum, setSelectedCurriculum] = useState(null)
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
    const [suggestedCurriculum, setSuggestedCurriculum] = useState(null)
    const [suggestedSource, setSuggestedSource] = useState(null)
    const [createGuideChecked, setCreateGuideChecked] = useState(false)
    const lastErrorRef = useRef('')

    // Address dropdown states
    const [provinces, setProvinces] = useState([])
    const [cities, setCities] = useState([])
    const [barangays, setBarangays] = useState([])
    const [loadingProvinces, setLoadingProvinces] = useState(false)
    const [loadingCities, setLoadingCities] = useState(false)
    const [loadingBarangays, setLoadingBarangays] = useState(false)

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
        if (selectedProgram) {
            // Prefer a curriculum that matches the student's batch for transfer
            // students who are entering above 1st year. This ensures a transferee
            // joins the same curriculum their cohort is using (older curriculum)
            // instead of being auto-assigned to the newest/current curriculum.
            let curriculum = selectedProgram.current_curriculum

            try {
                const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)

                // Check for an explicit year-level guide first (admin-provided mapping)
                if (!isExistingStudent && !isReturningStudent && numericYear > 1) {
                    const guides = selectedProgram.year_level_guides || []
                    const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                    if (guide && guide.curriculum) {
                        curriculum = guide.curriculum
                    } else {
                        // Parse start year from currentAcademicYear (e.g., '2025' from '2025-2026')
                        const match = (currentAcademicYear || '').match(/(\d{4})/)
                        if (match) {
                            const startYear = parseInt(match[1], 10)
                            const batchStart = startYear - (numericYear - 1)
                            // Look up program-specific curriculum mappings which include academic_year
                            const foundMapping = (selectedProgram.program_curricula || []).find(mapping => {
                                const ay = mapping.academic_year || ''
                                // Try to extract a 4-digit start year, otherwise fall back to substring match
                                const m = ay.match(/(\d{4})/)
                                if (m) {
                                    return parseInt(m[1], 10) === batchStart
                                }
                                return ay.includes(String(batchStart))
                            })

                            if (foundMapping && foundMapping.curriculum) {
                                curriculum = foundMapping.curriculum
                            }
                        }
                    }
                }
            } catch (e) {
                // Fall back to current curriculum if anything goes wrong
                curriculum = selectedProgram.current_curriculum
            }

            setSelectedCurriculum(curriculum)

            // If it's a first-year (or numericYear <= 1) or not a transferee, ensure the form's curriculum_id is set to the program's current curriculum
            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
            if (isExistingStudent || isReturningStudent) {
                // Do not override existing/returning student data
            } else if (numericYear <= 1) {
                setData('curriculum_id', curriculum?.id || '')
            }
        } else {
            setSelectedCurriculum(null)
            setData('curriculum_id', '')
        }
    }, [selectedProgram, data.year_level, isExistingStudent, isReturningStudent, currentAcademicYear])

    // Fetch suggested curriculum from the server when program/year level changes for new transferees
    useEffect(() => {
        const fetchSuggested = async () => {
            if (!selectedProgram || !data.year_level) {
                setSuggestedCurriculum(null)
                setSuggestedSource(null)
                return
            }

            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)

            // Only fetch for prospective transferees (not existing/returning) entering above 1st year
            if (isExistingStudent || isReturningStudent || numericYear <= 1) {
                setSuggestedCurriculum(null)
                setSuggestedSource(null)

                // For first year or existing students, ensure curriculum_id reflects current curriculum
                const current = selectedProgram?.current_curriculum || null
                setSelectedCurriculum(current)
                setData('curriculum_id', current?.id || '')

                return
            }

            try {
                const params = new URLSearchParams({
                    year_level: data.year_level,
                    academic_year: currentAcademicYear,
                    education_level: selectedProgram.education_level,
                })
                const res = await fetch(`/api/programs/${selectedProgram.id}/suggested-curriculum?${params.toString()}`)
                if (!res.ok) {
                    setSuggestedCurriculum(null)
                    setSuggestedSource(null)
                    return
                }
                const json = await res.json()
                setSuggestedCurriculum(json.curriculum || null)
                setSuggestedSource(json.source || null)

                // Automatically assign the suggested curriculum into the form and UI
                if (json.curriculum && (json.source === 'guide' || json.source === 'program_curriculum' || json.source === 'cohort_majority' || json.source === 'current')) {
                    setSelectedCurriculum(json.curriculum)
                    setData('curriculum_id', json.curriculum.id)
                }
            } catch (e) {
                console.error('Failed to fetch suggested curriculum', e)
                setSuggestedCurriculum(null)
                setSuggestedSource(null)
            }
        }

        fetchSuggested()
    }, [selectedProgram, data.year_level, isExistingStudent, isReturningStudent, currentAcademicYear])

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

    // Handle success flash message from server redirect
    useEffect(() => {
        if (flash?.success) {
            // Clear the form after successful registration (toast is handled by AuthenticatedLayout)
            reset()
        }
    }, [flash?.success, reset])

    // Fetch provinces on component mount
    useEffect(() => {
        const fetchProvinces = async () => {
            setLoadingProvinces(true)
            try {
                const response = await fetch('/api/addresses/provinces')
                if (response.ok) {
                    const data = await response.json()
                    setProvinces(data)
                }
            } catch (error) {
                console.error('Error fetching provinces:', error)
            } finally {
                setLoadingProvinces(false)
            }
        }
        fetchProvinces()
    }, [])

    // Fetch cities when province changes
    useEffect(() => {
        if (!data.province) {
            setCities([])
            setBarangays([])
            return
        }

        const fetchCities = async () => {
            setLoadingCities(true)
            try {
                const province = provinces.find(p => p.name === data.province)
                if (province) {
                    const response = await fetch(`/api/addresses/cities/${province.code}`)
                    if (response.ok) {
                        const data = await response.json()
                        setCities(data)
                    }
                }
            } catch (error) {
                console.error('Error fetching cities:', error)
            } finally {
                setLoadingCities(false)
            }
        }
        fetchCities()
    }, [data.province, provinces])

    // Fetch barangays when city changes
    useEffect(() => {
        if (!data.city) {
            setBarangays([])
            return
        }

        const fetchBarangays = async () => {
            setLoadingBarangays(true)
            try {
                const city = cities.find(c => c.name === data.city)
                if (city) {
                    const response = await fetch(`/api/addresses/barangays/${city.code}`)
                    if (response.ok) {
                        const data = await response.json()
                        setBarangays(data)
                    }
                }
            } catch (error) {
                console.error('Error fetching barangays:', error)
            } finally {
                setLoadingBarangays(false)
            }
        }
        fetchBarangays()
    }, [data.city, cities])

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
        
        // Client-side validation for required fields
        const requiredFields = ['first_name', 'last_name', 'email', 'program_id', 'year_level']
        const missingFields = requiredFields.filter(field => !data[field] || data[field].toString().trim() === '')
        
        if (missingFields.length > 0) {
            const fieldNames = {
                first_name: 'First Name',
                last_name: 'Last Name',
                email: 'Email',
                program_id: 'Program',
                year_level: 'Year Level'
            }
            const missingFieldNames = missingFields.map(field => fieldNames[field]).join(', ')
            toast.error(`Please fill in the required fields: ${missingFieldNames}`, {
                style: { border: '1px solid #ef4444', color: '#ef4444' }
            })
            return
        }
        
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
            address: addressParts || null,
            create_year_level_guide: createGuideChecked,
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
                // Clear the form instead of redirecting
                reset()
                setCreateGuideChecked(false)
            },
            onError: (errors) => {
                console.error('Validation errors:', errors)
                // Show error modal if there's a student balance error
                if (errors.student) {
                    setShowErrorModal(true)
                } else {
                    // Make validation errors more user-friendly
                    const friendlyErrors = Object.entries(errors).map(([field, message]) => {
                        // Field-specific friendly messages
                        if (field === 'first_name' && message.includes('required')) {
                            return 'First name is required to register the student.';
                        }
                        if (field === 'last_name' && message.includes('required')) {
                            return 'Last name is required to register the student.';
                        }
                        if (field === 'email' && message.includes('required')) {
                            return 'Email address is required for student registration.';
                        }
                        if (field === 'email' && message.includes('unique')) {
                            return 'This email address is already registered. Please use a different email.';
                        }
                        if (field === 'program_id' && message.includes('required')) {
                            return 'Please select a program for the student.';
                        }
                        if (field === 'year_level' && message.includes('required')) {
                            return 'Please select a year level for the student.';
                        }
                        if (field === 'enrollment_fee' && message.includes('valid positive number')) {
                            return 'Please enter a valid enrollment fee amount.';
                        }
                        if (field === 'enrollment_fee' && message.includes('cannot be zero')) {
                            return 'Enrollment fee cannot be zero. Please enter a valid amount.';
                        }
                        if (field === 'payment_amount' && message.includes('valid positive number')) {
                            return 'Please enter a valid payment amount.';
                        }

                        // Default: return the original message but make it more readable
                        return message.charAt(0).toUpperCase() + message.slice(1);
                    });

                    const errorMessage = friendlyErrors.length === 1
                        ? friendlyErrors[0]
                        : `Please correct the following issues:\n• ${friendlyErrors.join('\n• ')}`;

                    toast.error(errorMessage, {
                        style: { border: '1px solid #ef4444', color: '#ef4444' },
                        duration: 6000, // Show longer for multiple errors
                    })
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
            toast.error('Failed to load payment history', {
                style: { border: '1px solid #ef4444', color: '#ef4444' }
            })
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
                                        className={`h-10 ${isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={isExistingStudent}
                                    />
                                    <Button 
                                        type="button" 
                                        onClick={checkStudent} 
                                        variant="outline"
                                        disabled={checkingStudent || !data.student_number || isExistingStudent}
                                    >
                                        {checkingStudent ? 'Checking...' : 'Check'}
                                    </Button>
                                </div>
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Student number is locked for existing students</p>
                                )}
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
                                    className={`h-10 ${isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                    disabled={isExistingStudent}
                                />
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
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
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={isExistingStudent}
                                />
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
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
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={isExistingStudent}
                                />
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
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
                                    disabled={isExistingStudent}
                                >
                                    <SelectTrigger className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}>
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
                                        className={`mt-2 ${isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                        disabled={isExistingStudent}
                                    />
                                )}
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
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
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={isExistingStudent}
                                />
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
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
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={isExistingStudent}
                                />
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
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
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                                        +63
                                    </span>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        value={data.phone.replace('+63', '')}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setData('phone', '+63' + value);
                                            }
                                        }}
                                        placeholder="9123456789"
                                        maxLength="10"
                                        className="rounded-l-none"
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="parent_contact">Parent/Guardian Contact</Label>
                                <div className="flex">
                                    <span className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-200 border border-r-0 border-gray-300 rounded-l-md">
                                        +63
                                    </span>
                                    <Input
                                        id="parent_contact"
                                        type="tel"
                                        value={data.parent_contact.replace('+63', '')}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setData('parent_contact', '+63' + value);
                                            }
                                        }}
                                        placeholder="9123456789"
                                        maxLength="10"
                                        className="rounded-l-none"
                                    />
                                </div>
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
                                    <Label htmlFor="province">Province</Label>
                                    <Select
                                        value={data.province}
                                        onValueChange={(value) => {
                                            setData('province', value)
                                            setData('city', '') // Reset city when province changes
                                            setData('barangay', '') // Reset barangay when province changes
                                        }}
                                        disabled={loadingProvinces}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingProvinces ? "Loading provinces..." : "Select Province"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((province) => (
                                                <SelectItem key={province.code} value={province.name}>
                                                    {province.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.province && (
                                        <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="city">City/Municipality</Label>
                                    <Select
                                        value={data.city}
                                        onValueChange={(value) => {
                                            setData('city', value)
                                            setData('barangay', '') // Reset barangay when city changes
                                        }}
                                        disabled={!data.province || loadingCities}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingCities ? "Loading cities..." : "Select City/Municipality"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {cities.map((city) => (
                                                <SelectItem key={city.code} value={city.name}>
                                                    {city.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.city && (
                                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="barangay">Barangay</Label>
                                    <Select
                                        value={data.barangay}
                                        onValueChange={(value) => setData('barangay', value)}
                                        disabled={!data.city || loadingBarangays}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={loadingBarangays ? "Loading barangays..." : "Select Barangay"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {barangays.map((barangay) => (
                                                <SelectItem key={barangay.code} value={barangay.name}>
                                                    {barangay.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.barangay && (
                                        <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
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
                            <div className="relative">
                                <Label htmlFor="program_id" className="text-sm font-medium">Program *</Label>
                                <div className="flex gap-2">
                                    <Select value={data.program_id.toString()} onValueChange={(value) => setData('program_id', value)}>
                                        <SelectTrigger className={`h-10 flex-1 ${errors.program_id ? 'border-red-500' : 'border-gray-300 focus:border-green-500'}`}>
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
                                        <div className="flex items-center gap-1 text-red-600">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-sm whitespace-nowrap">Required</span>
                                        </div>
                                    )}
                                </div>
                                {selectedProgram && (
                                    <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                                        <p className="text-xs font-medium text-blue-800">
                                            {selectedProgram.education_level === 'college' ? '🎓 College Program' : '📚 Senior High School'}
                                        </p>
                                        {selectedCurriculum && (() => {
                                            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
                                            const isNewTransferee = !isExistingStudent && !isReturningStudent && numericYear > 1

                                            if (isNewTransferee) {
                                                const sourceLabel = suggestedSource === 'guide' ? 'Guide' : (suggestedSource === 'program_curriculum' ? 'Program mapping' : (suggestedSource === 'cohort_majority' ? 'Cohort majority' : 'Current'))
                                                return (
                                                    <div className="mt-1 p-2 bg-green-50 rounded-md border border-green-200">
                                                        <p className="text-xs font-medium text-green-800">📌 Assigned Curriculum for transferees</p>
                                                        <p className="text-xs text-green-700 mt-1"><strong>{selectedCurriculum.curriculum_name} ({selectedCurriculum.curriculum_code})</strong></p>
                                                        <p className="text-xs text-green-600 mt-1">Source: {sourceLabel}. This curriculum will be automatically assigned when registering transferees entering {data.year_level}.</p>

                                                {suggestedSource === 'current' && (
                                                    <div className="mt-2 flex items-center gap-2">
                                                        <input id="create_guide" type="checkbox" className="h-4 w-4" checked={createGuideChecked} onChange={(e) => setCreateGuideChecked(e.target.checked)} />
                                                        <label htmlFor="create_guide" className="text-xs text-gray-700">Save this assignment as a Year-Level Curriculum Guide for future transferees</label>
                                                    </div>
                                                )}

                                                    </div>
                                                )
                                            }

                                            return (
                                                <div className="mt-1">
                                                    <p className="text-xs text-blue-600">
                                                        📖 Active Curriculum: {selectedCurriculum.curriculum_name} ({selectedCurriculum.curriculum_code})
                                                    </p>
                                                    <p className="text-xs text-blue-500">All new students will be assigned to this curriculum</p>
                                                </div>
                                            )
                                        })()}

                                        {/* Year-level curriculum guide suggestion (for transferees) */}
                                        {selectedProgram && data.year_level && (() => {
                                            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
                                            const guides = selectedProgram.year_level_guides || []
                                            const guide = guides.find(g => g.year_level === numericYear)
                                            if (guide && guide.curriculum) {
                                                return (
                                                    <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                                                        <p className="text-xs font-medium text-yellow-800">🔎 Year-level Curriculum Guide</p>
                                                        <p className="text-xs text-yellow-700 mt-1">Suggested for this year ({data.year_level}): <strong>{guide.curriculum.curriculum_name} ({guide.curriculum.curriculum_code})</strong></p>
                                                        <p className="text-xs text-yellow-600 mt-1">This is an administrative guide and will be used to select a curriculum for transferees entering this year level.</p>
                                                    </div>
                                                )
                                            }

                                            // If no explicit guide, show the server-suggested curriculum (cohort match / mapping)
                                            if (suggestedCurriculum) {
                                                const sourceLabel = suggestedSource === 'guide' ? 'Guide' : (suggestedSource === 'program_curriculum' ? 'Program mapping' : (suggestedSource === 'cohort_majority' ? 'Cohort majority' : 'Current'))
                                                return (
                                                    <div className="mt-2 p-2 bg-yellow-50 rounded-md border border-yellow-200">
                                                        <p className="text-xs font-medium text-yellow-800">🔎 Suggested Curriculum for Transferees</p>
                                                        <p className="text-xs text-yellow-700 mt-1">Expected curriculum for transferees entering {data.year_level}: <strong>{suggestedCurriculum.curriculum_name} ({suggestedCurriculum.curriculum_code})</strong></p>
                                                        <p className="text-xs text-yellow-600 mt-1">Source: {sourceLabel} — this will be used when registering transferees above 1st year.</p>
                                                    </div>
                                                )
                                            }

                                            return null
                                        })()}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <Label htmlFor="year_level" className="text-sm font-medium">Year Level *</Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={data.year_level}
                                        onValueChange={(value) => setData('year_level', value)}
                                        disabled={!selectedProgram}
                                    >
                                        <SelectTrigger className={`h-10 flex-1 ${errors.year_level ? 'border-red-500' : 'border-gray-300 focus:border-green-500'} ${!selectedProgram ? 'bg-gray-100 cursor-not-allowed' : ''}`}>
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
                                    {errors.year_level && (
                                        <div className="flex items-center gap-1 text-red-600">
                                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                            <span className="text-sm whitespace-nowrap">
                                                {(() => {
                                                    const errorMessage = errors.year_level;
                                                    if (errorMessage.includes('Invalid year level')) {
                                                        return 'Invalid level';
                                                    }
                                                    if (errorMessage.includes('Requested year level not allowed')) {
                                                        return 'Level not allowed';
                                                    }
                                                    if (errorMessage.includes('Cannot decrease')) {
                                                        return 'Cannot decrease';
                                                    }
                                                    return 'Invalid';
                                                })()}
                                            </span>
                                        </div>
                                    )}
                                </div>
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
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                            Unable to Register Student
                        </DialogTitle>
                        <DialogDescription className="text-sm text-gray-700">
                            {(() => {
                                const errorMessage = errors.student || '';

                                // Make error messages more user-friendly
                                if (errorMessage.includes('Outstanding balance')) {
                                    const balanceMatch = errorMessage.match(/₱([\d,]+\.\d{2})/);
                                    const balance = balanceMatch ? balanceMatch[1] : 'an outstanding';
                                    return (
                                        <div className="space-y-2">
                                            <p>This student has an outstanding balance that must be settled before enrollment.</p>
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                                <p className="font-medium text-red-800">Outstanding Balance: ₱{balance}</p>
                                                <p className="text-xs text-red-600 mt-1">Please contact the finance office or settle this balance first.</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (errorMessage.includes('already enrolled')) {
                                    return (
                                        <div className="space-y-2">
                                            <p>This student is already enrolled in the current semester.</p>
                                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                <p className="text-sm text-blue-800">The student cannot be enrolled twice in the same semester.</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (errorMessage.includes('Invalid year level')) {
                                    return (
                                        <div className="space-y-2">
                                            <p>The selected year level is not valid for this student.</p>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <p className="text-sm text-yellow-800">Please check the student's academic records and select an appropriate year level.</p>
                                            </div>
                                        </div>
                                    );
                                }

                                if (errorMessage.includes('Requested year level not allowed')) {
                                    const match = errorMessage.match(/may only be up to '(\d+)'/);
                                    const allowedLevel = match ? match[1] : '';
                                    return (
                                        <div className="space-y-2">
                                            <p>This student hasn't completed enough academic work to advance to this year level.</p>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                                <p className="text-sm text-yellow-800">
                                                    Based on completed semesters, this student can only be enrolled up to year level {allowedLevel}.
                                                    Please select an appropriate level or contact an administrator if this seems incorrect.
                                                </p>
                                            </div>
                                        </div>
                                    );
                                }

                                // Default fallback for any other errors
                                return (
                                    <div className="space-y-2">
                                        <p>We encountered an issue while registering this student.</p>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                            <p className="text-sm text-gray-800">{errorMessage}</p>
                                        </div>
                                    </div>
                                );
                            })()}
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
                                <span className="text-sm font-medium text-gray-600">Curriculum</span>
                                <p className="text-sm font-semibold">
                                    {selectedCurriculum ? 
                                        `${selectedCurriculum.curriculum_name} (${selectedCurriculum.curriculum_code}) - Active` : 
                                        'No curriculum assigned'
                                    }
                                </p>
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
