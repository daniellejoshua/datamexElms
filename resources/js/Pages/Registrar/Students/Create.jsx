import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { NumberInput } from '@/components/ui/number-input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UserPlus, ArrowLeft, GraduationCap, BookOpen, AlertTriangle, Info, Plus, X, CheckCircle2, Lock, Save, RotateCcw, FileText } from 'lucide-react'
import { useState, useEffect, useRef, useMemo } from 'react'
import { toast } from 'sonner'

// Currency formatting utility
const formatCurrency = (value) => {
    const numValue = parseFloat(value) || 0
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(numValue)
}


export default function CreateStudent({ programs, auth, currentAcademicYear, currentSemester, course_shift_required, old }) {
    const { flash } = usePage().props;
    
    // Normalize old data to ensure no null values
    const normalizedOld = old ? {
        student_number: old.student_number ?? '',
        first_name: old.first_name ?? '',
        last_name: old.last_name ?? '',
        middle_name: old.middle_name ?? '',
        suffix: old.suffix ?? '',
        birth_date: old.birth_date ?? '',
        street: old.street ?? '',
        barangay: old.barangay ?? '',
        city: old.city ?? '',
        province: old.province ?? '',
        zip_code: old.zip_code ?? '',
        phone: old.phone ?? '',
        email: old.email ?? '',
        parent_contact: old.parent_contact ?? '',
        program_id: old.program_id ?? '',
        year_level: old.year_level ?? '',
        enrollment_type: old.enrollment_type ?? 'returning',
        student_type: old.student_type ?? 'regular',
        education_level: old.education_level ?? '',
        track: old.track ?? '',
        strand: old.strand ?? '',
        curriculum_id: old.curriculum_id ?? '',
        enrollment_fee: old.enrollment_fee ?? '',
        payment_amount: old.payment_amount ?? '',
        confirm_course_shift: old.confirm_course_shift ?? false,
    } : {
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
        enrollment_type: 'returning', // What user selects: new, returning, transferee, shiftee
        student_type: 'regular', // System-determined: regular or irregular
        education_level: '',
        track: '',
        strand: '',
        curriculum_id: '',
        
        // Payment Information
        enrollment_fee: '',
        payment_amount: '',

        // Course shifting confirmation
        confirm_course_shift: false,
    };
    
    const { data, setData, post, processing, errors, reset } = useForm(normalizedOld)

    // Check if student qualifies as "new" (1st year + 1st semester only)
    const isQualifiedNewStudent = data.year_level === '1st Year' && currentSemester === '1st'
    const isShsNewStudent = (data.year_level === 'Grade 11' || data.year_level === '1') && currentSemester === '1st'

    // voucher eligibility: only SHS Grade 11 incoming students get government voucher
    const isShsVoucherEligible = data.education_level === 'senior_high' && (data.year_level === 'Grade 11' || data.year_level === '1');
    // Vouchers do NOT apply to transferees — treat transferees as non-eligible
    const isShsVoucherApplicable = isShsVoucherEligible && data.enrollment_type !== 'transferee'

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
    const [errorMessage, setErrorMessage] = useState('')
    const [showCourseShiftModal, setShowCourseShiftModal] = useState(false)
    const [courseShiftData, setCourseShiftData] = useState(null)
    const [courseShiftComparison, setCourseShiftComparison] = useState(null)
    const [loadingShiftComparison, setLoadingShiftComparison] = useState(false)
    const [showSummaryModal, setShowSummaryModal] = useState(false)
    const [suffixType, setSuffixType] = useState('none') // 'none', 'selected', 'other'
    const [customSuffix, setCustomSuffix] = useState('')
    const [suggestedCurriculum, setSuggestedCurriculum] = useState(null)
    const [suggestedSource, setSuggestedSource] = useState(null)
    const [createGuideChecked, setCreateGuideChecked] = useState(false)
    const lastErrorRef = useRef('')
    
    // Computed value for automatic transferee logic
    const shouldBeTransferee = !isExistingStudent && !isReturningStudent && data.program_id && data.year_level && (
        (data.education_level === 'college' && ['2nd Year', '3rd Year', '4th Year'].includes(data.year_level)) ||
        (data.education_level === 'senior_high' && ['Grade 12', '2'].includes(data.year_level))
    )

    // Computed, read-only enrollment type (used by UI). Rules:
    // - existing/returning => 'returning' (unless program changed -> 'shiftee')
    // - new (1st Year / Grade 11 in 1st sem) => 'new'
    // - higher-year non-existing students => 'transferee'
    const computedEnrollmentType = useMemo(() => {
        // Existing or returning students
        if (isExistingStudent || isReturningStudent) {
            // If existing student changes program selection, show 'shiftee'
            if (isExistingStudent && studentFound?.program?.id && data.program_id && parseInt(data.program_id, 10) !== studentFound.program.id) {
                return 'shiftee'
            }

            return 'returning'
        }

        // Not enough data yet
        if (!data.year_level || !data.education_level) {
            return ''
        }

        const isCollege = data.education_level === 'college'

        if (isCollege) {
            if (data.year_level === '1st Year' && currentSemester === '1st') return 'new'
            if (['2nd Year', '3rd Year', '4th Year', '5th Year'].includes(data.year_level)) return 'transferee'
            return 'new'
        }

        // SHS
        if ((data.year_level === 'Grade 11' || data.year_level === '1') && currentSemester === '1st') return 'new'
        if (['Grade 12', '2'].includes(data.year_level)) return 'transferee'

        return ''
    }, [isExistingStudent, isReturningStudent, studentFound, data.program_id, data.year_level, data.education_level, currentSemester])

    // Keep backend payload value in sync with the computed enrollment type
    useEffect(() => {
        if (computedEnrollmentType && data.enrollment_type !== computedEnrollmentType) {
            setData('enrollment_type', computedEnrollmentType)
        }

        setIsTransferee(computedEnrollmentType === 'transferee')
        setIsShiftee(computedEnrollmentType === 'shiftee')

        // If an existing college student somehow has an SHS program selected, clear it and warn
        const existingCollege = (isExistingStudent && studentFound?.education_level === 'college') || (isReturningStudent && archivedStudent?.education_level === 'college')
        if (existingCollege && data.program_id) {
            const selected = programs.find(p => p.id === parseInt(data.program_id, 10))
            if (selected && selected.education_level === 'senior_high') {
                setData('program_id', '')
                toast.error('Existing college students cannot be assigned to Senior High programs. Please choose a college program.')
            }
        }
    }, [computedEnrollmentType, data.program_id, isExistingStudent, studentFound, isReturningStudent, archivedStudent])

    // Form locking state - lock in 2nd semester mode unless student is checked/found
    const [formUnlocked, setFormUnlocked] = useState(currentSemester !== '2nd')
    
    // Duplicate detection states
    const [duplicateWarning, setDuplicateWarning] = useState(null)
    const [showDuplicateModal, setShowDuplicateModal] = useState(false)
    const [checkingDuplicate, setCheckingDuplicate] = useState(false)
    
    // Course shift comparison states
    const [showSubjectComparisonModal, setShowSubjectComparisonModal] = useState(false)
    const [subjectComparison, setSubjectComparison] = useState(null)
    const [loadingComparison, setLoadingComparison] = useState(false)
    
    // Phone validation states
    const [phoneErrors, setPhoneErrors] = useState({}) // Track phone validation errors
    
    // Shifting and Transferee states
    const [isShiftee, setIsShiftee] = useState(false)
    const [isTransferee, setIsTransferee] = useState(false)
    const [previousProgram, setPreviousProgram] = useState(null)
    const [previousSchool, setPreviousSchool] = useState('')
    const [creditedSubjects, setCreditedSubjects] = useState([])
    const [subjectsToCatchUp, setSubjectsToCatchUp] = useState([])
    const [showCreditModal, setShowCreditModal] = useState(false)
    const [creditModalStep, setCreditModalStep] = useState(1) // 1: School/Program, 2: Subject Grading, 3: Status Determination
    const [curriculumComparison, setCurriculumComparison] = useState(null)
    const [loadingCurriculumComparison, setLoadingCurriculumComparison] = useState(false)
    const [subjectSearchQuery, setSubjectSearchQuery] = useState('')
    const [feeAdjustments, setFeeAdjustments] = useState({ creditedPassed: [], pastSubjectsToCatchUp: [], creditedFailed: [], isIrregular: undefined })
    const [invalidGrades, setInvalidGrades] = useState({}) // Track invalid grades by subject_id

    // Auto-select Grade 11 subjects for SHS transferees when entering grading step (Step 2)
    useEffect(() => {
        if (creditModalStep !== 2 || !curriculumComparison) return

        const shsTransfereeFiltering = isTransferee && (selectedProgram?.education_level === 'senior_high' || data.education_level === 'senior_high')

        if (shsTransfereeFiltering) {
            const grade11 = curriculumComparison.new_program?.curriculum?.subjects?.filter(s => s.year_level === 11) || []
            const toAdd = grade11.filter(s => !creditedSubjects.some(cs => cs.subject_id === s.subject_id)).map(s => ({
                subject_id: s.subject_id,
                subject_code: s.subject_code,
                subject_name: s.subject_name,
                year_level: s.year_level,
                semester: s.semester,
                units: s.units,
                grade: ''
            }))

            if (toAdd.length > 0) {
                setCreditedSubjects(prev => [...prev, ...toAdd])
            }
        }
    }, [creditModalStep, curriculumComparison, isTransferee, selectedProgram, data.education_level, creditedSubjects])




    // Address dropdown states - REMOVED: Now using text inputs instead of dropdowns
    // const [provinces, setProvinces] = useState(PHILIPPINE_ADDRESSES.provinces)
    // const [cities, setCities] = useState([])
    // const [barangays, setBarangays] = useState([])

    // Group programs by education level
    const collegePrograms = programs.filter(p => p.education_level === 'college')
    const shsPrograms = programs.filter(p => p.education_level === 'senior_high')

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
            // Use year level guide to determine the appropriate curriculum for this student
            let curriculum = null

            try {
                const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)

                // Check for an explicit year-level guide first (admin-provided mapping)
                // For course shifts, we ALWAYS want to update the curriculum, even for existing students
                const isInCourseShift = !!courseShiftData
                
                if (!isExistingStudent && !isReturningStudent) {
                    const guides = selectedProgram.year_level_guides || selectedProgram.yearLevelGuides || []
                    const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                    if (guide && guide.curriculum) {
                        curriculum = guide.curriculum
                    }
                } else if (isInCourseShift && (isExistingStudent || isReturningStudent)) {
                    // During course shift, also update curriculum for existing/returning students
                    const guides = selectedProgram.year_level_guides || selectedProgram.yearLevelGuides || []
                    const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                    if (guide && guide.curriculum) {
                        curriculum = guide.curriculum
                    }
                }
                
            } catch (e) {
                // If anything goes wrong, curriculum will remain null and be fetched from API
                console.error('Error determining curriculum from guide:', e)
            }

            // Set curriculum for new students or during course shifts
            const isInCourseShift = !!courseShiftData
            if (!isExistingStudent && !isReturningStudent) {
                setSelectedCurriculum(curriculum)
            } else if (isInCourseShift) {
                // During course shift, update curriculum for all students
                setSelectedCurriculum(curriculum)
            }

            // Set the curriculum ID if we found one from the guide
            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
            if (isExistingStudent || isReturningStudent) {
                // During course shift, do update the curriculum
                if (isInCourseShift && curriculum) {
                    setData('curriculum_id', curriculum.id)
                }
            } else if (curriculum) {
                setData('curriculum_id', curriculum.id)
            }
        } else {
            // Don't clear curriculum for existing/returning students who already have one set
            if (!(isExistingStudent || isReturningStudent)) {
                setSelectedCurriculum(null)
                setData('curriculum_id', '')
            }
        }
    }, [selectedProgram, data.year_level, isExistingStudent, isReturningStudent, currentAcademicYear, courseShiftData])

    // Fetch suggested curriculum from the server when program/year level changes
    useEffect(() => {
        const fetchSuggested = async () => {
            if (!selectedProgram || !data.year_level) {
                setSuggestedCurriculum(null)
                setSuggestedSource(null)
                return
            }

            // Skip fetch for existing/returning students
            if (isExistingStudent || isReturningStudent) {
                setSuggestedCurriculum(null)
                setSuggestedSource(null)
                return
            }

            // If we already have a curriculum from the guide, use that
            if (selectedCurriculum) {
                setSuggestedCurriculum(selectedCurriculum)
                setSuggestedSource('guide')
                return
            }

            // Otherwise fetch from API
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
    }, [selectedProgram, data.year_level, isExistingStudent, isReturningStudent, currentAcademicYear, selectedCurriculum])

    useEffect(() => {
        if (data.program_id && data.year_level && data.student_type) {
            const program = programs.find(p => p.id === parseInt(data.program_id))

                // determine if this student should receive the SHS voucher
                // (only senior high Grade 11 newcomers are voucher-eligible). Vouchers don't apply to transferees.
                const isShsVoucherStudent = program?.education_level === 'senior_high' && isShsVoucherApplicable

                // Only auto-populate fee for regular students
                if (data.student_type === 'regular') {
                // Find the appropriate fee for this year level and student type
                // Map human labels to numeric year levels expected by program_fees
                const yearLevelMap = {
                    '1st Year': 1,
                    '2nd Year': 2,
                    '3rd Year': 3,
                    '4th Year': 4,
                    'Grade 11': 1,
                    'Grade 12': 2,
                }
                const numericYear = (yearLevelMap[data.year_level] ?? parseInt(data.year_level)) || getNumericYearLevel(data.year_level, program?.education_level)

                const programFee = program?.program_fees?.find(fee =>
                    fee.year_level === numericYear &&
                    fee.fee_type === 'regular'
                )
                
                    setData(prev => ({
                        ...prev,
                        education_level: program?.education_level || '',
                        track: program?.track || '',
                        strand: program?.strand || '',
                        // only voucher-applicable SHS students get free tuition
                        enrollment_fee: isShsVoucherStudent ? '0' : (programFee?.semester_fee || ''),
                        // transferees will not be set to 0 because we used isShsVoucherApplicable
                        payment_amount: isShsVoucherStudent ? '0' : prev.payment_amount,
                    }))
            } else {
                // For irregular students, don't auto-populate fee
                    setData(prev => ({
                        ...prev,
                        education_level: program?.education_level || '',
                        track: program?.track || '',
                        strand: program?.strand || '',
                        // If this is a transferee into SHS who is NOT voucher-applicable, ensure we populate the regular program fee so registrar can collect payment
                        enrollment_fee: (data.enrollment_type === 'transferee' && program?.education_level === 'senior_high' && !isShsVoucherApplicable)
                            ? (program?.program_fees?.find(fee => fee.year_level === parseInt(data.year_level) && fee.fee_type === 'regular')?.semester_fee ?? prev.enrollment_fee)
                            : (isShsVoucherStudent ? '0' : prev.enrollment_fee),
                        payment_amount: isShsVoucherStudent ? '0' : prev.payment_amount,
                    }))
            }
        }
    }, [data.program_id, data.year_level, data.student_type, data.enrollment_type, isShsVoucherApplicable])

    useEffect(() => {
        const enrollmentFee = parseFloat(data.enrollment_fee) || 0
        const paymentAmount = parseFloat(data.payment_amount) || 0
        setCalculatedBalance(enrollmentFee - paymentAmount)
    }, [data.enrollment_fee, data.payment_amount])

    // Auto-set student_type based on enrollment type
    useEffect(() => {
        if (data.enrollment_type === 'new' || data.enrollment_type === 'returning') {
            // New and returning students default to regular
            setData('student_type', 'regular')
        }
        // Transferees and shiftees will have their status determined by credit evaluation
    }, [data.enrollment_type])
    
    // Auto-switch from 'new' to 'returning' if year level/semester doesn't qualify
    useEffect(() => {
        if (data.enrollment_type === 'new' && data.year_level && data.education_level) {
            const isCollege = data.education_level === 'college'
            const isShs = data.education_level === 'senior_high'
            
            const isQualified = isCollege 
                ? (data.year_level === '1st Year' && currentSemester === '1st')
                : ((data.year_level === 'Grade 11' || data.year_level === '1') && currentSemester === '1st')
            
            if (!isQualified) {
                setData('enrollment_type', 'returning')
                toast.info('Switched to Returning Student - New Students are only allowed for 1st year students')
            }
        }
    }, [data.year_level, data.enrollment_type, data.education_level, currentSemester])

    // NOTE: enrollment_type is now computed/display-only in the UI (see computedEnrollmentType).
    // Keep `shouldBeTransferee` logic for display helpers but do not mutate `data.enrollment_type` here.
    useEffect(() => {
        // no-op: enrollment_type is controlled by computedEnrollmentType
    }, [data.program_id, data.year_level, data.education_level, isExistingStudent, isReturningStudent, data.enrollment_type])
    
    // Handle shiftee/transferee selection
    useEffect(() => {
        if (data.enrollment_type === 'shiftee') {
            setIsShiftee(true)
            setIsTransferee(false)
            setData(prev => ({ ...prev, enrollment_fee: prev.enrollment_fee })) // Keep existing fee for shiftee
        } else if (data.enrollment_type === 'transferee') {
            setIsTransferee(true)
            setIsShiftee(false)
            // For transferees, normally fee is calculated later. However,
            // if the transferee is for Senior High (Grade 12) and NOT voucher-eligible,
            // we need to show and collect the program fee immediately. Do not clear it.
            const shsTransferee = (selectedProgram?.education_level === 'senior_high' || data.education_level === 'senior_high')
            const shsVoucher = isShsVoucherApplicable

            // Transferees must always have a program fee (they are not voucher-eligible).
            // If this is a SHS transferee (e.g. Grade 12) and voucher does not apply,
            // populate the program fee from the selected program if the current fee is empty or zero.
            if (shsTransferee && !shsVoucher) {
                const yearLevelMap = {
                    '1st Year': 1,
                    '2nd Year': 2,
                    '3rd Year': 3,
                    '4th Year': 4,
                    'Grade 11': 1,
                    'Grade 12': 2,
                }
                const numericYear = (yearLevelMap[data.year_level] ?? parseInt(data.year_level)) || getNumericYearLevel(data.year_level, selectedProgram?.education_level)
                const programFee = selectedProgram?.program_fees?.find(f => f.year_level === numericYear && f.fee_type === 'regular')

                setData(prev => ({
                    ...prev,
                    enrollment_fee: (!prev.enrollment_fee || prev.enrollment_fee === '' || parseFloat(prev.enrollment_fee) === 0)
                        ? (programFee?.semester_fee ?? prev.enrollment_fee)
                        : prev.enrollment_fee
                }))
            } else {
                setData(prev => ({ ...prev, enrollment_fee: prev.enrollment_fee }))
            }
            // Removed: setShowCreditModal(true) - will be triggered from confirmation modal instead
        } else {
            setIsTransferee(false)
            // Don't reset shiftee here if it's set by course shift detection
            if (data.enrollment_type !== 'shiftee') {
                setIsShiftee(false)
            }
            setPreviousProgram(null)
            setPreviousSchool('')
            setCreditedSubjects([])
            setCurriculumComparison(null)
        }
    }, [data.enrollment_type])

    // Show error modal when student error exists. For balance/outstanding errors, show a concise message only (no redirect).
    useEffect(() => {
        if (errors.student) {
            // If it's a balance/outstanding/payment error, show a simple modal and do NOT redirect
            if (errors.student.toLowerCase().includes('outstanding') ||
                errors.student.toLowerCase().includes('balance') ||
                errors.student.toLowerCase().includes('payment')) {
                setErrorMessage('Student has balance remaining.')
                setShowErrorModal(true)
                return
            }

            setErrorMessage(errors.student)
            setShowErrorModal(true)
        } else {
            setShowErrorModal(false)
            setErrorMessage('')
        }
    }, [errors.student, studentFound])

    // Show course shift confirmation modal when course_shift_required prop exists
    useEffect(() => {
        if (course_shift_required) {
            setCourseShiftData(course_shift_required)
            setShowCourseShiftModal(true)
            
            // Set the year level from course shift data if available
            if (course_shift_required.current_year_level) {
                const yearLevelLabels = {
                    1: selectedProgram?.education_level === 'senior_high' ? 'Grade 11' : '1st Year',
                    2: selectedProgram?.education_level === 'senior_high' ? 'Grade 12' : '2nd Year',
                    3: '3rd Year',
                    4: '4th Year',
                }
                const currentLabel = yearLevelLabels[course_shift_required.current_year_level]
                if (currentLabel && (!data.year_level || data.year_level === '1st Year')) {
                    setData('year_level', currentLabel)
                }
            }
            
            // Set selected program to the new program for curriculum selection
            if (course_shift_required.new_program_id) {
                const newProgram = programs.find(p => p.id === parseInt(course_shift_required.new_program_id))
                if (newProgram) {
                    setSelectedProgram(newProgram)
                    
                    // Auto-select curriculum based on year level guide for course shift
                    if (data.year_level) {
                        const numericYear = getNumericYearLevel(data.year_level, newProgram.education_level)
                        const guides = newProgram.year_level_guides || []
                        const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                        
                        if (guide && guide.curriculum) {
                            setSelectedCurriculum(guide.curriculum)
                            setData('curriculum_id', guide.curriculum.id)
                        }
                    }
                }
            }
        } else {
            setCourseShiftData(null)
            setShowCourseShiftModal(false)
        }
    }, [course_shift_required, programs, data.year_level])

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
            setData({
                student_number: '',
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
                program_id: '',
                year_level: '',
                enrollment_type: 'returning',
                student_type: 'regular',
                education_level: '',
                track: '',
                strand: '',
                curriculum_id: '',
                enrollment_fee: '',
                payment_amount: '',
                confirm_course_shift: false,
            })
            setIsExistingStudent(false)
            setIsReturningStudent(false)
            setStudentFound(null)
        }
    }, [flash?.success])

    // REMOVED: Address dropdown management - now using text inputs
    // useEffect(() => {
    //     // Fetch cities when province changes
    //     if (!data.province) {
    //         setCities([])
    //         setBarangays([])
    //         return
    //     }

    //     const province = provinces.find(p => p.name === data.province)
    //     if (province) {
    //         const provinceCities = PHILIPPINE_ADDRESSES.cities[province.code] || []
    //         setCities(provinceCities)
    //         setBarangays([])
    //     }
    // }, [data.province, provinces])

    // useEffect(() => {
    //     // Fetch barangays when city changes
    //     if (!data.city) {
    //         setBarangays([])
    //         return
    //     }

    //     const city = cities.find(c => c.name === data.city)
    //     if (city) {
    //         const cityBarangays = PHILIPPINE_ADDRESSES.barangays[city.code] || []
    //         setBarangays(cityBarangays)
    //     }
    // }, [data.city, cities])

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

    const checkStudentByNumber = async () => {
        if (!data.student_number) return
        
        setCheckingStudent(true)
        try {
            const response = await fetch(`/api/students/check/${data.student_number}`)
            const result = await response.json()
            
            if (result.exists) {
                setStudentFound(result.student)
                setIsExistingStudent(true)
                setIsReturningStudent(false)
                // Always treat an *existing* student as a returning enrollment in the UI
                setData(prev => ({ ...prev, enrollment_type: 'returning' }))
                // Show success notification
                toast.success(`Existing student found: ${result.student.first_name} ${result.student.last_name}`)
                // Only unlock form in 2nd semester mode when student is found
                if (currentSemester === '2nd' && result.student) {
                    setFormUnlocked(true)
                }
                // Auto-fill existing student data (but don't lock fields)
                const addressParts = result.student.address ? result.student.address.split(',').map(part => part.trim()) : []
                setData(prev => ({
                    ...prev,
                    first_name: result.student.first_name || '',
                    last_name: result.student.last_name || '',
                    middle_name: result.student.middle_name || '',
                    email: result.student.email || '',
                    program_id: result.student.program?.id || '',
                    // Normalize incoming year_level (accept numeric or label)
                    year_level: (function () {
                        const y = result.student.year_level ?? result.student.current_year_level ?? ''
                        if (!y && y !== 0) return ''
                        const numeric = Number(y)
                        if (!Number.isNaN(numeric) && numeric > 0) {
                            if (result.student.education_level === 'senior_high') {
                                return numeric === 12 ? 'Grade 12' : 'Grade 11'
                            }
                            const map = {1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year'}
                            return map[numeric] ?? String(y)
                        }
                        return String(y)
                    })(),
                    education_level: result.student.education_level || 'college',
                    student_type: result.student.student_type || 'regular',
                    curriculum_id: result.student.curriculum_id || '',
                    birth_date: formatDateForInput(result.student.birth_date) || '',
                    phone: result.student.phone || '',
                    parent_contact: result.student.parent_contact || '',
                    street: addressParts[0] || '',
                    barangay: addressParts[1] || '',
                    city: addressParts[2] || '',
                    province: addressParts[3] || '',
                    zip_code: addressParts[4] || '',
                }))
                // Set the curriculum directly from API response
                if (result.student.curriculum) {
                    setSelectedCurriculum(result.student.curriculum)
                }
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
                // Show success notification for archived student
                toast.success(`Returning student found: ${result.archived.first_name} ${result.archived.last_name}`)
                // Only unlock form in 2nd semester mode when student is found
                if (currentSemester === '2nd' && result.archived) {
                    setFormUnlocked(true)
                }
                // Auto-fill archived student data
                setData(prev => ({
                    ...prev,
                    first_name: result.archived.first_name || '',
                    last_name: result.archived.last_name || '',
                    middle_name: result.archived.middle_name || '',
                    email: result.archived.email || '',
                    program_id: result.archived.program?.id || '',
                    // Normalize archived year_level (accept numeric or label)
                    year_level: (function () {
                        const y = result.archived.year_level ?? result.archived.current_year_level ?? ''
                        if (!y && y !== 0) return ''
                        const numeric = Number(y)
                        if (!Number.isNaN(numeric) && numeric > 0) {
                            if (result.archived.education_level === 'senior_high') {
                                return numeric === 12 ? 'Grade 12' : 'Grade 11'
                            }
                            const map = {1: '1st Year', 2: '2nd Year', 3: '3rd Year', 4: '4th Year', 5: '5th Year'}
                            return map[numeric] ?? String(y)
                        }
                        return String(y)
                    })(),
                    education_level: result.archived.education_level || 'college',
                    enrollment_type: 'returning',
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
                // Show info notification for new student
                toast.info('No student found.')
                // Keep form locked in 2nd semester mode for new students (no student checked)
                // setFormUnlocked(false) - already false by default
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

    // Duplicate detection with debounce
    const checkForDuplicates = async () => {
        // Only check if we have all required fields
        if (!data.email || !data.first_name || !data.last_name || !data.birth_date) {
            return
        }

        // Skip if already detected as existing or returning student via student_number
        if (isExistingStudent || isReturningStudent) {
            return
        }

        setCheckingDuplicate(true)
        try {
            const response = await axios.post('/api/students/check-duplicate', {
                email: data.email,
                first_name: data.first_name,
                last_name: data.last_name,
                birth_date: data.birth_date,
            })

            if (response.data.has_duplicates) {
                setDuplicateWarning(response.data.matches)
                setShowDuplicateModal(true)
            } else {
                setDuplicateWarning(null)
            }
        } catch (error) {
            console.error('Error checking for duplicates:', error)
        } finally {
            setCheckingDuplicate(false)
        }
    }

    // Debounced duplicate check
    useEffect(() => {
        const timer = setTimeout(() => {
            checkForDuplicates()
        }, 1500) // 1.5 second debounce to reduce API calls while typing

        return () => clearTimeout(timer)
    }, [data.email, data.first_name, data.last_name, data.birth_date])

    const loadSubjectComparison = async (studentId, newProgramId, newCurriculumId) => {
        if (!studentId) {
            toast.error('Student ID is required for subject comparison')
            return
        }
        if (!newProgramId) {
            toast.error('Please select a new program first')
            return
        }
        
        // Auto-determine curriculum from year level guide if not provided
        let curriculumId = newCurriculumId
        if (!curriculumId) {
            const newProgram = programs.find(p => p.id === parseInt(newProgramId))
            if (newProgram) {
                const numericYear = getNumericYearLevel(data.year_level || '', newProgram.education_level)
                const guides = newProgram.year_level_guides || []
                const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                
                if (guide && guide.curriculum) {
                    curriculumId = guide.curriculum.id
                    setSelectedCurriculum(guide.curriculum)
                    setData('curriculum_id', guide.curriculum.id)
                } else {
                    toast.error('No curriculum found for this year level. Please contact administrator.')
                    return
                }
            } else {
                toast.error('New program not found. Please contact administrator.')
                return
            }
        }

        setLoadingComparison(true)
        try {
            const response = await axios.get(`/api/students/${studentId}/course-shift-comparison`, {
                params: {
                    new_program_id: newProgramId,
                    new_curriculum_id: curriculumId
                }
            })
            console.log('Subject comparison response:', response.data)
            console.log('Credited subjects:', response.data.credited_subjects)
            setSubjectComparison(response.data)
            setShowSubjectComparisonModal(true)
        } catch (error) {
            console.error('Error loading subject comparison:', error)
            const errorMessage = error.response?.data?.error 
                || error.response?.data?.message 
                || error.message 
                || 'Failed to load subject comparison. Please try again.'
            toast.error(`Error: ${errorMessage}`)
        } finally {
            setLoadingComparison(false)
        }
    }

    const confirmCourseShift = async () => {
        // If comparison is still loading, wait for it
        if (loadingShiftComparison) {
            toast.info('Please wait for curriculum comparison to complete')
            return
        }
        
        // Set the data needed for course shift
        setData('confirm_course_shift', true)
        
        // Get the selected program details
        const selectedProgram = programs.find(p => p.id === parseInt(data.program_id))
        
        // Auto-select curriculum based on year level guide if not already selected
        if (!selectedCurriculum && selectedProgram) {
            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
            const guides = selectedProgram.year_level_guides || selectedProgram.yearLevelGuides || []
            const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
            
            if (guide && guide.curriculum) {
                setSelectedCurriculum(guide.curriculum)
                setData('curriculum_id', guide.curriculum.id)
            }
        }
        
        // Use the course shift comparison data we automatically loaded
        const creditedSubjectsFromComparison = courseShiftComparison?.fee_adjustments?.creditedPassed || []
        
        // Backend already filters for passing grades (>= 75)
        const creditedSubjects = creditedSubjectsFromComparison
        
        // Set course shift data with credits
        setData(prev => {
            // For irregular students, program fee will be calculated based on enrolled subjects
            // Set to 0 for now, will be calculated after section enrollment
            return {
                ...prev,
                confirm_course_shift: true,
                student_type: 'irregular', // Mark as irregular
                transfer_type: 'shiftee',
                previous_program_id: courseShiftData?.current_program_id,
                credited_subjects: creditedSubjects,
                subjects_to_catch_up: [], // Not needed for shiftees
                enrollment_fee: '0', // Will be calculated based on enrolled subjects
            }
        })
        
        // Set isShiftee to true so the credit transfer logic works
        setIsShiftee(true)
        setIsTransferee(false)
        
        setShowCourseShiftModal(false)
        setCourseShiftComparison(null)
        
        // Submit the form with the updated data
        setTimeout(() => {
            handleSubmit({ preventDefault: () => {} })
        }, 100)
    }

    const cancelCourseShift = () => {
        setData('confirm_course_shift', false)
        setShowCourseShiftModal(false)
        setCourseShiftData(null)
        setCourseShiftComparison(null)
    }
    
    const triggerCourseShiftComparison = async (shiftData) => {
        if (!shiftData || !data.year_level) return
        
        setLoadingShiftComparison(true)
        try {
            const yearLevelMap = {
                '1st Year': 1,
                '2nd Year': 2,
                '3rd Year': 3,
                '4th Year': 4,
                'Grade 11': 1,
                'Grade 12': 2,
            }
            const numericYear = yearLevelMap[data.year_level] || 1
            
            // Use the program IDs from the course shift data
            const payload = {
                previous_program_id: shiftData.current_program_id || data.program_id,
                new_program_id: shiftData.new_program_id,
                student_year_level: numericYear,
                student_id: shiftData.student_id,
            }
            
            console.log('🔄 Course Shift Comparison Request:', payload)
            
            const response = await axios.post('/registrar/credit-transfers/compare', payload)
            
            console.log('✅ Full API Response:', response.data)
            console.log('📦 Data Object:', response.data.data)
            
            if (response.data.success) {
                setCourseShiftComparison(response.data.data)
                toast.success('Subject analysis complete')
            }
        } catch (error) {
            console.error('Error comparing curricula:', error)
            toast.error('Could not load credit comparison')
        } finally {
            setLoadingShiftComparison(false)
        }
    }

    const compareCurricula = async (previousProgramId, newProgramId, yearLevel, studentId = null) => {
        setLoadingCurriculumComparison(true)
        try {
            const payload = {
                previous_program_id: previousProgramId,
                new_program_id: newProgramId,
                student_year_level: yearLevel,
                student_id: studentId,
            }

            const response = await axios.post('/registrar/credit-transfers/compare', payload)
            
            if (response.data.success) {
                setCurriculumComparison(response.data.data)
                
                toast.success('Curriculum comparison completed successfully')
            } else {
                toast.error(response.data.message || 'Failed to compare curricula')
            }
        } catch (error) {
            console.error('Error comparing curricula:', error)
            toast.error(error.response?.data?.message || 'An error occurred while comparing curricula')
        } finally {
            setLoadingCurriculumComparison(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        
        // Check if form is unlocked
        if (!formUnlocked) {
            toast.error('Please check for an existing student using their student number first, or leave it blank for new student registration.', {
                duration: 5000,
            })
            return
        }
        
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
                duration: 5000,
            })
            return
        }

        // Check for duplicates before proceeding
        if (duplicateWarning && !isExistingStudent && !isReturningStudent) {
            setShowDuplicateModal(true)
            toast.warning('Please review the duplicate warning before proceeding', {
                duration: 5000,
            })
            return
        }
        
        // Check for phone validation errors
        if (phoneErrors.phone || phoneErrors.parent_contact) {
            toast.error('Please correct the phone number validation errors before proceeding', {
                duration: 5000,
            })
            return
        }
        
        // Show summary modal for confirmation
        setShowSummaryModal(true)
    }

    const handleConfirmRegistration = () => {
        // Reset error modal state before submission
        setShowErrorModal(false)
        setErrorMessage('')
        
        // Debug state variables
        console.log('🔍 DEBUG - State at submission:')
        console.log('  enrollment_type:', data.enrollment_type)
        console.log('  isShiftee:', isShiftee)
        console.log('  isTransferee:', isTransferee)
        console.log('  previousProgram:', previousProgram)
        console.log('  previousSchool:', previousSchool)
        console.log('  creditedSubjects:', creditedSubjects)
        console.log('  creditedSubjects length:', creditedSubjects?.length)
        
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

        // Add credit transfer data for transferees and shiftees
        if (data.enrollment_type === 'transferee') {
            console.log('📚 TRANSFEREE detected - Adding credit transfer data')
            
            // Filter credited subjects: only include passing grades
            // For transferees: GPA grades (1.00-3.00 are passing, 5.00 is failing)
            // For shiftees: percentage grades (>= 75 are passing)
            const passingSubjects = (creditedSubjects || []).filter(subject => {
                const grade = parseFloat(subject.grade)
                let isPassing = false
                
                if (isTransferee) {
                    // For transferees, GPA system: 1.00-3.00 passing, 5.00 failing
                    isPassing = !isNaN(grade) && grade >= 1.00 && grade <= 3.00
                } else {
                    // For shiftees, percentage system: >= 75 passing
                    isPassing = !isNaN(grade) && grade >= 75
                }
                
                if (!isPassing && subject.grade) {
                    console.log(`❌ Excluding subject ${subject.subject_code} - Grade ${subject.grade} is not passing (${isTransferee ? 'GPA' : 'percentage'} system)`)
                }
                return isPassing
            })
            
            submitData.transfer_type = 'transferee'
            submitData.previous_program_id = previousProgram?.id || null
            submitData.previous_school = previousSchool || null
            submitData.credited_subjects = passingSubjects
            
            console.log('📤 Sending for TRANSFEREE:')
            console.log('  transfer_type:', submitData.transfer_type)
            console.log('  previous_school:', submitData.previous_school)
            console.log('  total checked subjects:', creditedSubjects?.length || 0)
            console.log('  passing subjects (>=75):', passingSubjects.length)
            console.log('  credited_subjects:', passingSubjects)
        } else if (data.enrollment_type === 'shiftee') {
            console.log('🔄 SHIFTEE detected - Adding credited subjects from curriculum comparison')

            // For shiftees, use the curriculum comparison results to credit subjects
            const creditedSubjectsFromComparison = feeAdjustments?.creditedPassed || []

            // Filter to only include passing grades (>= 75)
            const passingCreditedSubjects = creditedSubjectsFromComparison.filter(subject => {
                const grade = parseFloat(subject.grade)
                const isPassing = !isNaN(grade) && grade >= 75
                if (!isPassing && subject.grade) {
                    console.log(`❌ Excluding shiftee subject ${subject.subject_code} - Grade ${subject.grade} is below 75`)
                }
                return isPassing
            })

            submitData.transfer_type = 'shiftee'
            submitData.previous_program_id = previousProgram?.id || null
            submitData.previous_school = previousSchool || null
            submitData.credited_subjects = passingCreditedSubjects

            console.log('📤 Sending for SHIFTEE:')
            console.log('  transfer_type:', submitData.transfer_type)
            console.log('  previous_program_id:', submitData.previous_program_id)
            console.log('  total subjects from comparison:', creditedSubjectsFromComparison.length)
            console.log('  passing subjects (>=75):', passingCreditedSubjects.length)
            console.log('  credited_subjects:', passingCreditedSubjects)
            console.log('👤 Regular student - No credit transfer data')
        }
        
        // For transferees with subjects to catch up, automatically set as irregular
        if (data.enrollment_type === 'transferee' && (subjectsToCatchUp.length > 0 || feeAdjustments.isIrregular)) {
            submitData.student_type = 'irregular'
            console.log('📚 TRANSFEREE with subjects to catch up - Setting as IRREGULAR student')
        }
        
        console.log('Form submitting with data:', submitData)
        
        console.log('About to call post with route:', route('registrar.students.store'))
        console.log('Submit data:', submitData)
        
        // Submit using router.post to send custom data object
        router.post(route('registrar.students.store'), submitData, {
            preserveScroll: true,
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
                    
                    // Automatically trigger curriculum comparison for course shift
                    setTimeout(() => {
                        triggerCourseShiftComparison(page.props.course_shift_required)
                    }, 300)
                    
                    return
                }

                // Normal successful registration
                // Clear the form instead of redirecting
                setData({
                    student_number: '',
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
                    program_id: '',
                    year_level: '',
                    enrollment_type: 'returning',
                    student_type: 'regular',
                    education_level: '',
                    track: '',
                    strand: '',
                    curriculum_id: '',
                    enrollment_fee: '',
                    payment_amount: '',
                    confirm_course_shift: false,
                })
                setIsExistingStudent(false)
                setIsReturningStudent(false)
                setStudentFound(null)
                setCreateGuideChecked(false)
            },
            onError: (errors) => {
                console.error('Validation errors:', errors)
                // If there's a balance/outstanding/payment error, show a concise modal message only (no redirect)
                if (errors.student && (
                    errors.student.toLowerCase().includes('outstanding') ||
                    errors.student.toLowerCase().includes('balance') ||
                    errors.student.toLowerCase().includes('payment')
                )) {
                    setErrorMessage('Student has balance remaining.')
                    setShowErrorModal(true)
                    return
                }
                // Show other student errors in the modal
                if (errors.student) {
                    setErrorMessage(errors.student)
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
                            return 'Please enter a valid program fee amount.';
                        }
                        if (field === 'enrollment_fee' && message.includes('cannot be zero')) {
                            return 'Program fee cannot be zero. Please enter a valid amount.';
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
                <div className="flex items-center px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm">
                            <Link href={route('registrar.students')} className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                Back to Students
                            </Link>
                        </Button>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">Student Registration</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Register new students or update existing records</p>
                        </div>
                    </div>
                </div>
            }
        >
        
            <Head title="Register New Student" />

            <form onSubmit={handleSubmit} className="space-y-6 m-2">
                {/* Student Information Note */}
                <Card className="border-t-4 border-t-green-500">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-transparent">
                        <div className="flex items-center gap-2">
                            <div className="bg-green-100 p-2 rounded-lg">
                                <UserPlus className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <CardTitle>Student Registration</CardTitle>
                                <CardDescription>Check if student already exists by entering their student number</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    
                    {/* 2nd Semester Notice */}
                    {currentSemester === '2nd' && (
                        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mx-6 mb-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-amber-700">
                                        <strong>2nd Semester Mode:</strong> Only existing students who were enrolled in the 1st semester can be updated. 
                                        New enrollments, course shifting, and transferees are not allowed during the 2nd semester.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    <CardContent className="space-y-4 pt-6">
                        {/* Student Number Check */}
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <Label htmlFor="student_number">Student Number (Optional - for existing students)</Label>
                                <Input 
                                    id="student_number"
                                    value={data.student_number ?? ''}
                                    onChange={e => setData('student_number', e.target.value)}
                                    placeholder="Enter student number to check if student exists"
                                    className="h-10"
                                />
                                {errors.student_number && (
                                    <p className="text-red-500 text-sm mt-1">{errors.student_number}</p>
                                )}
                            </div>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    onClick={checkStudentByNumber}
                                    disabled={checkingStudent || !data.student_number}
                                    className="h-10"
                                >
                                    {checkingStudent ? 'Checking...' : 'Check Student'}
                                </Button>
                            </div>
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
                    <CardContent className="space-y-6 pt-6 relative">
                        {currentSemester === '2nd' && !formUnlocked && (
                            <>
                                {/* Blur overlay */}
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-lg"></div>
                                {/* Lock icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-lg border-2 border-gray-200">
                                        <Lock className="w-12 h-12 text-gray-600" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input 
                                    id="first_name"
                                    value={data.first_name ?? ''}
                                    onChange={e => setData('first_name', e.target.value)}
                                    required
                                    className="h-10"
                                    disabled={!formUnlocked || isExistingStudent}
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
                                    value={data.middle_name ?? ''}
                                    onChange={e => setData('middle_name', e.target.value)}
                                    disabled={!formUnlocked || isExistingStudent}
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
                                    value={data.last_name ?? ''}
                                    onChange={e => setData('last_name', e.target.value)}
                                    required
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={!formUnlocked || isExistingStudent}
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
                                    disabled={!formUnlocked}
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
                                    value={data.birth_date ?? ''}
                                    onChange={e => setData('birth_date', e.target.value)}
                                    required
                                    max={new Date().toISOString().split('T')[0]}
                                    className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                    disabled={!formUnlocked || isExistingStudent}
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
                                <div className="relative">
                                    <Input 
                                        id="email"
                                        type="email"
                                        value={data.email ?? ''}
                                        onChange={e => setData('email', e.target.value)}
                                        required
                                        placeholder="student@example.com"
                                        className={isExistingStudent ? 'bg-gray-100 cursor-not-allowed' : ''}
                                        disabled={!formUnlocked || isExistingStudent}
                                    />
                                    {checkingDuplicate && (
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        </div>
                                    )}
                                </div>
                                {isExistingStudent && (
                                    <p className="text-xs text-blue-600 mt-1">Locked for existing students</p>
                                )}
                                {checkingDuplicate && (
                                    <p className="text-blue-500 text-sm mt-1 flex items-center gap-1">
                                        <Info className="w-3 h-3" />
                                        Checking for duplicate records...
                                    </p>
                                )}
                                {duplicateWarning && !checkingDuplicate && (
                                    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
                                        <p className="text-amber-800 text-sm font-medium flex items-center gap-2">
                                            <AlertTriangle className="w-4 h-4" />
                                            Potential duplicate detected!
                                        </p>
                                        <p className="text-amber-700 text-xs mt-1">
                                            Found {duplicateWarning.length} matching record(s). Please review before continuing.
                                        </p>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="mt-2 text-xs"
                                            onClick={() => setShowDuplicateModal(true)}
                                        >
                                            Review Matches
                                        </Button>
                                    </div>
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
                                        value={(data.phone || '').replace('+63', '')}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setData('phone', '+63' + value);
                                                
                                                // Validate that phone number starts with 9
                                                if (value.length > 0 && !value.startsWith('9')) {
                                                    setPhoneErrors(prev => ({ ...prev, phone: true }));
                                                } else {
                                                    setPhoneErrors(prev => ({ ...prev, phone: false }));
                                                }
                                            }
                                        }}
                                        placeholder="9123456789"
                                        maxLength="10"
                                        className={`rounded-l-none ${phoneErrors.phone ? 'border-red-500 focus:border-red-500' : ''}`}
                                        disabled={!formUnlocked}
                                    />
                                </div>
                                {errors.phone && (
                                    <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                                )}
                                {phoneErrors.phone && (
                                    <p className="text-red-500 text-sm mt-1">Phone number must start with 9</p>
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
                                        value={(data.parent_contact || '').replace('+63', '')}
                                        onChange={e => {
                                            const value = e.target.value.replace(/\D/g, '');
                                            if (value.length <= 10) {
                                                setData('parent_contact', '+63' + value);
                                                
                                                // Validate that parent contact starts with 9
                                                if (value.length > 0 && !value.startsWith('9')) {
                                                    setPhoneErrors(prev => ({ ...prev, parent_contact: true }));
                                                } else {
                                                    setPhoneErrors(prev => ({ ...prev, parent_contact: false }));
                                                }
                                            }
                                        }}
                                        placeholder="9123456789"
                                        maxLength="10"
                                        className={`rounded-l-none ${phoneErrors.parent_contact ? 'border-red-500 focus:border-red-500' : ''}`}
                                        disabled={!formUnlocked}
                                    />
                                </div>
                                {errors.parent_contact && (
                                    <p className="text-red-500 text-sm mt-1">{errors.parent_contact}</p>
                                )}
                                {phoneErrors.parent_contact && (
                                    <p className="text-red-500 text-sm mt-1">Parent contact must start with 9</p>
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
                                        value={data.street ?? ''}
                                        onChange={e => setData('street', e.target.value)}
                                        placeholder="e.g. 123 Main St"
                                        disabled={!formUnlocked}
                                    />
                                    {errors.street && (
                                        <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="province">Province</Label>
                                    <Input
                                        id="province"
                                        value={data.province ?? ''}
                                        onChange={e => setData('province', e.target.value)}
                                        placeholder="e.g. Metro Manila"
                                        disabled={!formUnlocked}
                                    />
                                    {errors.province && (
                                        <p className="text-red-500 text-sm mt-1">{errors.province}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="city">City/Municipality</Label>
                                    <Input
                                        id="city"
                                        value={data.city ?? ''}
                                        onChange={e => setData('city', e.target.value)}
                                        placeholder="e.g. Quezon City"
                                        disabled={!formUnlocked}
                                    />
                                    {errors.city && (
                                        <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="barangay">Barangay</Label>
                                    <Input
                                        id="barangay"
                                        value={data.barangay ?? ''}
                                        onChange={e => setData('barangay', e.target.value)}
                                        placeholder="e.g. Barangay 1"
                                        disabled={!formUnlocked}
                                    />
                                    {errors.barangay && (
                                        <p className="text-red-500 text-sm mt-1">{errors.barangay}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="zip_code">Zip Code</Label>
                                    <Input
                                        id="zip_code"
                                        value={data.zip_code ?? ''}
                                        onChange={e => setData('zip_code', e.target.value)}
                                        placeholder="e.g. 1200"
                                        maxLength="4"
                                        disabled={!formUnlocked}
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
                    <CardContent className="space-y-6 pt-6 relative">
                        {currentSemester === '2nd' && !formUnlocked && (
                            <>
                                {/* Blur overlay */}
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-lg"></div>
                                {/* Lock icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-lg border-2 border-gray-200">
                                        <Lock className="w-12 h-12 text-gray-600" />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Show message when no program and year level are selected */}
                        {(!data.program_id || !data.year_level) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <Info className="w-5 h-5 text-blue-600" />
                                    <p className="text-sm text-blue-800 font-medium">
                                        Choose a program and year level first
                                    </p>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="relative">
                                <Label htmlFor="program_id" className="text-sm font-medium">Program *</Label>
                                <div className="flex gap-2">
                                    <Select value={data.program_id.toString()} onValueChange={(value) => setData('program_id', value)} disabled={!formUnlocked}>
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
                                            {/**
                                             * Disable SHS programs for existing college students.
                                             * An "existing college student" is either an active student found by number
                                             * or a returning (archived) student whose education_level is 'college'.
                                             */}
                                            {shsPrograms.map(program => {
                                                const existingCollegeStudent = (
                                                    (isExistingStudent && studentFound?.education_level === 'college') ||
                                                    (isReturningStudent && archivedStudent?.education_level === 'college')
                                                );

                                                return (
                                                    <SelectItem
                                                        key={program.id}
                                                        value={program.id.toString()}
                                                        disabled={existingCollegeStudent}
                                                        className={existingCollegeStudent ? 'opacity-50 cursor-not-allowed' : ''}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="secondary" className="font-mono text-xs">
                                                                {program.program_code}
                                                            </Badge>
                                                            <span className="text-sm">{program.program_name || program.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                )
                                            })}

                                            {/** Show helper text when selection is restricted */}
                                            {((isExistingStudent && studentFound?.education_level === 'college') || (isReturningStudent && archivedStudent?.education_level === 'college')) && (
                                                <p className="text-xs text-amber-600 mt-2">Existing college students cannot be assigned to Senior High programs.</p>
                                            )}
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
                                            return (
                                                <div className="mt-1">
                                                    <p className="text-xs text-blue-600">
                                                        Active Curriculum: {selectedCurriculum.curriculum_name} ({selectedCurriculum.curriculum_code})
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
                                        onValueChange={(value) => {
                                            setData('year_level', value)
                                            // Auto-set enrollment type to 'new' for 1st Year or Grade 11
                                            if (value === '1st Year' || value === 'Grade 11') {
                                                setData('enrollment_type', 'new')
                                            }
                                        }}
                                        disabled={!formUnlocked || !selectedProgram}
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
                            <Label htmlFor="enrollment_type" className="text-sm font-medium">Enrollment Type *</Label>

                            {/* Read-only, computed enrollment type */}
                            <div className="h-10 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md flex items-center text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    {computedEnrollmentType === 'new' && (
                                        <>
                                            <UserPlus className="inline w-4 h-4 text-green-600" />
                                            <span className="font-medium">New Student</span>
                                        </>
                                    )}

                                    {computedEnrollmentType === 'returning' && (
                                        <>
                                            <RotateCcw className="inline w-4 h-4 text-gray-600" />
                                            <span className="font-medium">Returning Student</span>
                                        </>
                                    )}

                                    {computedEnrollmentType === 'transferee' && (
                                        <>
                                            <BookOpen className="inline w-4 h-4 text-blue-600" />
                                            <span className="font-medium">Transferee (From Another School)</span>
                                        </>
                                    )}

                                    {computedEnrollmentType === 'shiftee' && (
                                        <>
                                            <FileText className="inline w-4 h-4 text-purple-600" />
                                            <span className="font-medium">Course Shiftee (Changing Program)</span>
                                        </>
                                    )}

                                    {!computedEnrollmentType && (
                                        <span className="text-muted-foreground">Enrollment type will be determined from the student's academic info</span>
                                    )}
                                </div>
                            </div>

                            {errors.student_type && (
                                <p className="text-red-500 text-sm mt-1">{errors.student_type}</p>
                            )}

                            {computedEnrollmentType === 'new' && (
                                <p className="text-xs text-blue-600 mt-1">Enrollment type determined as New Student for {data.year_level}</p>
                            )}

                            {computedEnrollmentType === 'returning' && (
                                <p className="text-xs text-gray-600 mt-1">Continuing student - Regular re-enrollment</p>
                            )}

                            {computedEnrollmentType === 'transferee' && (
                                <p className="text-xs text-blue-600 mt-1">After registration, use "Transferee - Subject Credit Evaluation" to add credited subjects from previous school</p>
                            )}

                            {computedEnrollmentType === 'shiftee' && (
                                <p className="text-xs text-purple-600 mt-1">Program changed — this will be processed as a Course Shiftee</p>
                            )}

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
                                    <CardTitle>Program Fee Payment</CardTitle>
                                    <CardDescription>
                                        Process the initial program fee payment for {currentAcademicYear} - {currentSemester} Semester
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                    <CardContent className="space-y-6 pt-6 relative">
                        {currentSemester === '2nd' && !formUnlocked && (
                            <>
                                {/* Blur overlay */}
                                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 rounded-lg"></div>
                                {/* Lock icon overlay */}
                                <div className="absolute inset-0 flex items-center justify-center z-20">
                                    <div className="bg-white/90 backdrop-blur-sm rounded-full p-6 shadow-lg border-2 border-gray-200">
                                        <Lock className="w-12 h-12 text-gray-600" />
                                    </div>
                                </div>
                            </>
                        )}
                        {/* SHS Voucher Status Alert - only show when voucher-applicable */}
                        {data.education_level === 'senior_high' && isShsVoucherApplicable && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 p-2 rounded-full">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-green-800 mb-1">
                                            SHS Voucher Program Active
                                        </h4>
                                        <p className="text-sm text-green-700">
                                            This student is enrolled under the Senior High School voucher program.
                                            Tuition fees are covered by the government voucher and set to ₱0.00.
                                        </p>
                                        {data.student_number && (
                                            <div className="mt-2 p-2 bg-green-100 rounded border border-green-300">
                                                <p className="text-xs text-green-800 font-medium">
                                                    Voucher ID: <span className="font-mono">shsvoucher({data.student_number})</span>
                                                </p>
                                            </div>
                                        )}
                                        <p className="text-xs text-green-600 mt-2 font-medium">
                                            Note: If student is dropped or fails, voucher will be invalidated and regular fees will apply.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Error Messages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {data.student_type !== 'irregular' && (
                                <div>
                                    {errors.enrollment_fee && (
                                        <p className="text-red-500 text-sm">{errors.enrollment_fee}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1">
                                        {(isTransferee || isShiftee) && feeAdjustments && feeAdjustments.isIrregular !== undefined
                                            ? 'Program fee will be calculated based on subjects enrolled in first term'
                                            : (data.education_level === 'senior_high' && isShsVoucherApplicable)
                                            ? '₱0.00 - Covered by SHS voucher program'
                                            : data.student_type === 'regular'
                                            ? 'Automatically set based on selected program and year level'
                                            : 'Enter program fee manually for irregular students'
                                        }
                                    </p>
                                </div>
                            )}

                            <div>
                                {errors.payment_amount && (
                                    <p className="text-red-500 text-sm">{errors.payment_amount}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {(data.education_level === 'senior_high' && isShsVoucherApplicable)
                                        ? 'No payment required - covered by voucher'
                                        : 'Amount paid today towards the program fee'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Program Fee and Payment Inputs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="enrollment_fee" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                                    <span className="text-lg font-bold">₱</span>
                                    Program Fee
                                </Label>
                                {/*
                                    Previously we hid the program fee for *all* transferees.
                                    Change: If a transferee has been *determined as regular* by
                                    the credit-evaluation flow (data.student_type === 'regular'),
                                    show the regular program-fee input so the registrar can
                                    collect/set the enrollment fee just like other regulars.
                                */}
                                {/* Show program fee input for SHS transferees so registrar can collect payment */}
                                {data.enrollment_type === 'transferee' && (selectedProgram?.education_level === 'senior_high' || data.education_level === 'senior_high') ? (
                                    <NumberInput
                                        id="enrollment_fee"
                                        placeholder="0.00"
                                        value={data.enrollment_fee ?? ''}
                                        onChange={(e) => setData('enrollment_fee', e.target.value)}
                                        disabled={true}
                                        className="text-lg font-semibold"
                                    />
                                ) : data.enrollment_type === 'transferee' && data.student_type !== 'regular' ? (
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                        <p className="text-sm text-blue-800 font-medium">
                                            To be calculated
                                        </p>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Transferee program fee will be calculated after determining the catch-up subjects they need to take before prelim payment.
                                        </p>
                                    </div>
                                ) : (data.student_type === 'irregular' || data.enrollment_type === 'shiftee') ? (
                                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-md">
                                        <p className="text-sm text-gray-600">
                                            Irregular students' program fee will be calculated after determining the catch-up subjects they need to take before prelim payment.
                                        </p>
                                        <NumberInput
                                            id="enrollment_fee"
                                            placeholder="0.00"
                                            value={data.enrollment_fee ?? ''}
                                            onChange={(e) => setData('enrollment_fee', e.target.value)}
                                            disabled={true}
                                            className="text-lg font-semibold mt-2"
                                        />
                                    </div>
                                ) : (
                                    <NumberInput
                                        id="enrollment_fee"
                                        placeholder="0.00"
                                        value={data.enrollment_fee ?? ''}
                                        onChange={(e) => setData('enrollment_fee', e.target.value)}
                                        disabled={true}
                                        className="text-lg font-semibold"
                                    />
                                )}
                            </div>

                            <div>
                                <Label htmlFor="payment_amount" className="text-gray-700 font-medium mb-2 flex items-center gap-2">
                                    <span className="text-lg font-bold">₱</span>
                                    Payment Amount
                                </Label>
                                <NumberInput
                                    id="payment_amount"
                                    placeholder="0.00"
                                    value={data.payment_amount ?? ''}
                                    onChange={(e) => {
                                        const raw = e.target.value
                                        // allow empty
                                        if (raw === '') {
                                            setData('payment_amount', '')
                                            return
                                        }

                                        const numeric = parseFloat(raw)
                                        const fee = parseFloat(data.enrollment_fee) || 0

                                        if (!isNaN(numeric) && fee > 0 && numeric > fee) {
                                            // Prevent entering amount greater than program fee
                                            toast.error('Payment cannot exceed the program fee')
                                            setData('payment_amount', String(fee))
                                            return
                                        }

                                        setData('payment_amount', raw)
                                    }}
                                    disabled={!formUnlocked || isShsVoucherApplicable}
                                    className="text-lg font-semibold"
                                />
                            </div>
                        </div>

                        {/* Balance Display - hide for SHS voucher-applicable students */}
                        {!isShsVoucherApplicable && ((isTransferee || isShiftee) && feeAdjustments && feeAdjustments.isIrregular !== undefined ? (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Program Fee Balance
                                        </p>
                                        <p className="text-lg font-semibold text-gray-600 italic">
                                            To be calculated
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">
                                            Based on first term enrollment
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : data.enrollment_fee && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Program Fee Balance
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
                        ))}
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

                    {/* Credit Subjects Button for Transferees */}
                    {data.enrollment_type === 'transferee' && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreditModal(true)}
                            disabled={processing}
                            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                        >
                            <BookOpen className="w-4 h-4 mr-2" />
                            Credit Subjects
                            {creditedSubjects && creditedSubjects.length > 0 && (
                                <span className="ml-2 bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full text-xs">
                                    {creditedSubjects.length}
                                </span>
                            )}
                        </Button>
                    )}

                    {/* Warning for incomplete credit subjects */}
                    {data.enrollment_type === 'transferee' && (!previousSchool || !feeAdjustments) && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <AlertTriangle className="w-4 h-4" />
                            {!previousSchool ? 'Enter previous school information' : 'Complete credit evaluation and determine student status first'}
                        </div>
                    )}

                    <Button
                        type="submit"
                        disabled={
                            processing ||
                            !formUnlocked ||
                            (data.enrollment_type === 'transferee' && (!feeAdjustments || feeAdjustments.isIrregular === undefined))
                        }
                    >
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
                                const message = errorMessage || '';

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
                    <div className="flex justify-end">
                        <Button onClick={() => {
                            setShowErrorModal(false)
                            setErrorMessage('')
                        }}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Duplicate Student Warning Modal */}
            <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="w-6 h-6" />
                            Potential Duplicate Student Detected
                        </DialogTitle>
                        <DialogDescription>
                            We found existing records that match the information you entered. Please review carefully.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                        {duplicateWarning?.map((match, index) => (
                            <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        match.type === 'active' 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-blue-100 text-blue-700'
                                    }`}>
                                        {match.type === 'active' ? 'Currently Enrolled' : 'Archived/Returning'}
                                    </div>
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        match.confidence === 'high' 
                                            ? 'bg-red-100 text-red-700' 
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                        {match.confidence === 'high' ? 'High Match' : 'Possible Match'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Existing Record */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Existing Record</h4>
                                        <div className="space-y-1.5 text-sm">
                                            <div>
                                                <span className="text-gray-500">Student Number:</span>
                                                <span className="ml-2 font-medium">{match.student.student_number}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Name:</span>
                                                <span className="ml-2 font-medium">
                                                    {match.student.first_name} {match.student.middle_name} {match.student.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Email:</span>
                                                <span className="ml-2 font-medium">{match.student.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Birthdate:</span>
                                                <span className="ml-2 font-medium">{match.student.birth_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Program:</span>
                                                <span className="ml-2 font-medium">{match.student.program || 'N/A'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Year Level:</span>
                                                <span className="ml-2 font-medium">{match.student.year_level || 'N/A'}</span>
                                            </div>
                                            {match.student.archived_at && (
                                                <div>
                                                    <span className="text-gray-500">Archived:</span>
                                                    <span className="ml-2 font-medium text-blue-600">{match.student.archived_at}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Current Input */}
                                    <div>
                                        <h4 className="font-medium text-gray-900 mb-2">Your Input</h4>
                                        <div className="space-y-1.5 text-sm">
                                            <div>
                                                <span className="text-gray-500">Student Number:</span>
                                                <span className="ml-2 font-medium">{data.student_number || 'New'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Name:</span>
                                                <span className="ml-2 font-medium">
                                                    {data.first_name} {data.middle_name} {data.last_name}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Email:</span>
                                                <span className="ml-2 font-medium">{data.email}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Birthdate:</span>
                                                <span className="ml-2 font-medium">{data.birth_date}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Program:</span>
                                                <span className="ml-2 font-medium">
                                                    {programs.find(p => p.id === parseInt(data.program_id))?.program_name || 'Not selected'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Year Level:</span>
                                                <span className="ml-2 font-medium">{data.year_level || 'Not selected'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {match.reason && (
                                    <div className="mt-3 text-sm text-amber-700 bg-amber-100 p-2 rounded">
                                        <strong>Note:</strong> {match.reason}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="flex flex-col gap-2 pt-3 border-t">
                        <div className="text-center">
                            <h3 className="text-base font-semibold text-gray-900">
                                Confirm Student Identity
                            </h3>
                            <p className="text-sm text-gray-600">
                                Is this the same person you're trying to register?
                            </p>
                        </div>
                        <div className="flex gap-3 mt-2">
                            <Button
                                onClick={() => {
                                    // User confirms it's the same person - auto-fill from existing record
                                    const match = duplicateWarning[0]
                                    if (match.student.student_number) {
                                        setData('student_number', match.student.student_number)
                                        checkStudent()
                                    }
                                    setShowDuplicateModal(false)
                                }}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                            >
                                <UserPlus className="w-4 h-4 mr-2" />
                                Yes, Same Person - Auto-fill Data
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowDuplicateModal(false)
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Course Shift Confirmation Modal */}
            <Dialog open={showCourseShiftModal} onOpenChange={setShowCourseShiftModal}>
                <DialogContent className="max-w-screen-xl max-h-[90vh] overflow-y-auto">
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
                                        <div className="text-xs text-gray-500">Current Program</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{courseShiftData?.current_program_code || (programs.find(p => p.program_name === courseShiftData?.current_program)?.program_code) || courseShiftData?.current_program}</Badge>
                                            <div className="text-sm font-medium">{courseShiftData?.current_program}</div>
                                        </div>
                                        {courseShiftData?.current_curriculum && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Curriculum: {courseShiftData.current_curriculum}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-gray-400">→</div>

                                    <div className="flex-1">
                                        <div className="text-xs text-gray-500">New Program</div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="outline">{courseShiftData?.new_program_code || (programs.find(p => p.program_name === courseShiftData?.new_program)?.program_code) || courseShiftData?.new_program}</Badge>
                                            <div className="text-sm font-medium">{courseShiftData?.new_program}</div>
                                        </div>
                                        {selectedCurriculum ? (
                                            <div className="text-xs text-gray-500 mt-1">
                                                Curriculum: {selectedCurriculum.curriculum_name}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                No curriculum selected - please select one above
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                    
                    {/* Auto-loaded Credit Information */}
                    {loadingShiftComparison && (
                        <div className="border rounded-lg p-4 bg-blue-50">
                            <div className="flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-sm text-blue-900">Analyzing subjects for credit transfer...</p>
                            </div>
                        </div>
                    )}

                    {!loadingShiftComparison && courseShiftComparison && (
                        <div className="space-y-4">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                                    <div className="flex items-center gap-2 mb-1">
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                        <h4 className="font-semibold text-green-900">Won't Retake</h4>
                                    </div>
                                    <p className="text-2xl font-bold text-green-700">
                                        {courseShiftComparison.credited_subjects?.length || 0}
                                    </p>
                                    <p className="text-xs text-green-600 mt-1">subjects already completed</p>
                                </div>
                                
                            </div>

                            {/* Details in Columns */}
                            <div className="grid grid-cols-1 gap-4">
                                {/* Transferred Subjects */}
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="bg-green-100 px-4 py-2 border-b border-green-200">
                                        <h5 className="font-semibold text-green-900 text-sm">✓ Already Completed</h5>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto bg-white">
                                        {courseShiftComparison.credited_subjects?.length > 0 ? (
                                            <div className="divide-y">
                                                {courseShiftComparison.credited_subjects.map((subject, idx) => {
                                                    const rowKey = `${subject.subject_id}-${subject.old_subject_code || ''}-${idx}`;
                                                    return (
                                                        <div key={rowKey} className="p-3 hover:bg-green-50">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-sm text-gray-900">{subject.subject_code}</span>
                                                            {subject.old_subject_code &&
                                                                /* only show "was" if codes differ after removing
                                                                   non-alphanumeric characters (ignore spaces/hyphens) */
                                                                subject.old_subject_code.replace(/[^A-Za-z0-9]/g, '').toLowerCase() !==
                                                                    subject.subject_code.replace(/[^A-Za-z0-9]/g, '').toLowerCase() && (
                                                                    <span className="text-xs text-gray-400">(was {subject.old_subject_code.trim()})</span>
                                                                )}
                                                        </div>
                                                        <div className="text-xs text-gray-600 line-clamp-1">
                                                            {subject.subject_name}
                                                            {subject.old_subject_code &&
                                                                subject.old_subject_code.replace(/[^A-Za-z0-9]/g, '').toLowerCase() !==
                                                                    subject.subject_code.replace(/[^A-Za-z0-9]/g, '').toLowerCase() &&
                                                                subject.old_subject_name && (
                                                                <span className="text-xs text-gray-400"> (was {subject.old_subject_name.trim()})</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs text-gray-500">{subject.units} units</span>
                                                            <span className="text-xs text-green-600 font-medium">Grade: {subject.grade}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        ) : (
                                            <div className="p-6 text-center text-gray-500 text-sm">
                                                No matching subjects
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* View Subject Comparison Button - Keep for backward compatibility */}
                    {courseShiftData?.student_id && !loadingShiftComparison && !courseShiftComparison && (
                        <div className="mb-4">
                            <Button
                                onClick={() => {
                                    const newProgram = programs.find(p => p.program_name === courseShiftData?.new_program)
                                    loadSubjectComparison(courseShiftData.student_id, newProgram?.id, selectedCurriculum?.id)
                                }}
                                disabled={loadingComparison}
                                variant="outline"
                                className="w-full"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                {loadingComparison ? 'Loading...' : 'Compare Subjects & Credits'}
                            </Button>
                        </div>
                    )}
                    
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
                            disabled={processing || loadingShiftComparison}
                            className="bg-orange-600 hover:bg-orange-700 disabled:opacity-50"
                        >
                            {loadingShiftComparison ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                    Loading Credits...
                                </>
                            ) : (
                                'Confirm & Register'
                            )}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Subject Comparison Modal */}
            <Dialog open={showSubjectComparisonModal} onOpenChange={setShowSubjectComparisonModal}>
                <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <BookOpen className="w-5 h-5" />
                            Course Shift Subject Comparison
                        </DialogTitle>
                        <DialogDescription>
                            Comparing completed subjects from {subjectComparison?.old_program} with requirements for {subjectComparison?.new_program}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                        {/* Summary Cards */}
                        {subjectComparison && (
                            <>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-xl font-bold text-blue-600">
                                                {subjectComparison.completed_subjects?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">Completed Subjects</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-xl font-bold text-green-600">
                                                {subjectComparison.credited_subjects?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">Will Transfer</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-xl font-bold text-yellow-600">
                                                {subjectComparison.similar_subjects?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">Needs Review</div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="pt-4">
                                            <div className="text-xl font-bold text-purple-600">
                                                {subjectComparison.new_subjects?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600 mt-1">New Subjects</div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}

                        {/* Important Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <strong>How Credits Work:</strong> Subjects with exact or similar code matches from the student's previous program will automatically transfer as credits. These credits are based on already-completed and passed subjects.
                                </div>
                            </div>
                        </div>

                        {/* Two Column Comparison Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: All Completed Subjects from Previous Program */}
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        All Completed Subjects from {subjectComparison?.old_program}
                                    </h3>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {subjectComparison?.completed_subjects?.length > 0 ? (
                                            subjectComparison.completed_subjects.map((subject, idx) => (
                                                <div key={idx} className="p-3 bg-white border border-blue-300 rounded shadow-sm">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-sm text-blue-700">{subject.subject_code}</div>
                                                            <div className="text-xs text-gray-600">{subject.subject_name}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs bg-blue-100">
                                                            Grade: {subject.grade}
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-blue-600 mt-2">
                                                        Source: {subject.source || 'Grade'}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="text-sm font-medium mb-1">No Completed Subjects</div>
                                                <div className="text-xs">Student has no completed subjects on record</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        Credited Subjects (Will Transfer to {subjectComparison?.new_program})
                                    </h3>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {subjectComparison?.credited_subjects?.length > 0 ? (
                                            subjectComparison.credited_subjects.map((match, idx) => (
                                                <div key={idx} className="p-3 bg-white border border-green-300 rounded shadow-sm">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex-1">
                                                            <div className="font-semibold text-sm text-green-700">{match.old_subject.subject_code}</div>
                                                            <div className="text-xs text-gray-600">{match.old_subject.subject_name}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs bg-green-100">
                                                            Grade: {match.grade}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-green-600 mt-2 pt-2 border-t border-green-200">
                                                        <span>→ Transfers to:</span>
                                                        <span className="font-medium">{match.new_subject.subject_code}</span>
                                                        <Badge variant="secondary" className="text-xs ml-auto">
                                                            {match.match_reason}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-500">
                                                <div className="text-sm font-medium mb-1">No Credited Subjects</div>
                                                <div className="text-xs">No matching subjects found between programs</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: All New Program Curriculum Subjects */}
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                        New Program Curriculum: {subjectComparison?.new_program}
                                    </h3>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {subjectComparison?.all_new_subjects?.length > 0 ? (
                                            subjectComparison.all_new_subjects.map((subject, idx) => {
                                                const isCredited = subjectComparison.credited_subjects?.some(
                                                    match => match.new_subject.subject_code === subject.subject_code
                                                )
                                                return (
                                                    <div 
                                                        key={idx} 
                                                        className={`flex items-center gap-3 p-2 border rounded ${
                                                            isCredited 
                                                                ? 'bg-green-100 border-green-300' 
                                                                : 'bg-white border-gray-200'
                                                        }`}
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm flex items-center gap-2">
                                                                {subject.subject_code}
                                                                {isCredited && <span className="text-green-600 text-xs">✓</span>}
                                                            </div>
                                                            <div className="text-xs text-gray-600">{subject.subject_name}</div>
                                                        </div>
                                                        <Badge variant="outline" className="text-xs">
                                                            Y{subject.year_level} • {subject.semester}
                                                        </Badge>
                                                    </div>
                                                )
                                            })
                                        ) : (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                No curriculum subjects found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* No comparison data */}
                        {!subjectComparison && (
                            <div className="text-center py-8 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p>No subject comparison data available</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setShowSubjectComparisonModal(false)}
                        >
                            Close
                        </Button>
                        <Button
                            onClick={confirmCourseShift}
                            disabled={processing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Proceed with Course Shift
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
                            Enrollment Summary
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
                                <p className="text-sm font-semibold">
                                    {isExistingStudent && studentFound?.student_number 
                                        ? studentFound.student_number 
                                        : isReturningStudent && studentFound?.student_number
                                        ? studentFound.student_number
                                        : 'Auto-generated (USERID + Date)'}
                                </p>
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
                                <span className="text-sm font-medium text-gray-600">Enrollment Type</span>
                                <p className="text-sm font-semibold">
                                    {data.enrollment_type === 'new' && 'New Student'}
                                    {data.enrollment_type === 'returning' && 'Returning Student'}
                                    {data.enrollment_type === 'shiftee' && 'Course Shiftee'}
                                    {data.enrollment_type === 'transferee' && 'Transferee'}
                                </p>
                            </div>
                            <div>
                                <span className="text-sm font-medium text-gray-600">Status</span>
                                <p className="text-sm font-semibold">
                                    {data.enrollment_type === 'transferee' && (subjectsToCatchUp.length > 0 || feeAdjustments.isIrregular)
                                        ? '⚠ Irregular (Has subjects to catch up)'
                                        : data.student_type === 'regular' 
                                        ? '✓ Regular' 
                                        : '⚠ Irregular'}
                                </p>
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
                                    <span className="text-sm font-medium text-gray-600">Program Fee</span>
                                    <p className="text-sm font-semibold">
                                        {data.enrollment_type === 'transferee' && (subjectsToCatchUp.length > 0 || feeAdjustments.isIrregular) || data.student_type !== 'regular'
                                            ? 'To be calculated'
                                            : `₱${data.enrollment_fee || '0.00'}`}
                                    </p>
                                </div>
                                <div>
                                    <span className="text-sm font-medium text-gray-600">Payment Amount</span>
                                    <p className="text-sm font-semibold">₱{data.payment_amount || '0.00'}</p>
                                </div>
                            </div>
                            {calculatedBalance !== 0 && (
                                <div className="mt-2 pt-2 border-t border-orange-200">
                                    <span className="text-sm font-medium text-gray-600">Balance</span>
                                    <p className={`text-sm font-semibold ${data.enrollment_type === 'transferee' && (subjectsToCatchUp.length > 0 || feeAdjustments.isIrregular) || data.student_type !== 'regular' ? '' : (calculatedBalance > 0 ? 'text-red-600' : 'text-green-600')}`}>
                                        {data.enrollment_type === 'transferee' && (subjectsToCatchUp.length > 0 || feeAdjustments.isIrregular) || data.student_type !== 'regular'
                                            ? 'To be calculated'
                                            : `₱${Math.abs(calculatedBalance).toFixed(2)} ${calculatedBalance > 0 ? 'Due' : 'Overpayment'}`}
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

            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader className="flex-shrink-0 pb-3 border-b">
                        <DialogTitle className="flex items-center gap-2 text-lg">
                            <div className="p-1.5 bg-blue-100 rounded-md">
                                {isShiftee ? '🔄' : '📚'}
                            </div>
                            <div>
                                <div className="font-semibold">{isShiftee ? 'Course Shifting' : 'Transferee'} - Credit Evaluation</div>
                                <div className="text-xs font-normal text-gray-600">
                                    Step {creditModalStep} of 3: {
                                        creditModalStep === 1 ? (isShiftee ? 'Select Program' : 'Enter School Information') :
                                        creditModalStep === 2 ? 'Grade Subjects' :
                                        'Determine Status'
                                    }
                                </div>
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto py-4">
                        {/* Step Content */}
                        {creditModalStep === 1 && (
                            <div className="space-y-6">
                                {/* Step 1: Previous Program/School Selection */}
                                {isShiftee && (
                                    <div className="bg-white border border-blue-200 rounded-lg p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-blue-100 rounded-md">
                                                <BookOpen className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 text-base">Select Program to Shift To</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">Program to Shift To *</Label>
                                                <Select
                                                    value={previousProgram?.id?.toString() || ''}
                                                    onValueChange={(value) => {
                                                        const program = collegePrograms.find(p => p.id === parseInt(value))
                                                        setPreviousProgram(program)
                                                    }}
                                                >
                                                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500">
                                                        <SelectValue placeholder="Select program to shift to" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {collegePrograms
                                                            .filter(p => p.id !== parseInt(data.program_id))
                                                            .map(program => (
                                                                <SelectItem key={program.id} value={program.id.toString()}>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{program.program_code}</span>
                                                                        <span className="text-xs text-gray-500">{program.program_name}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-gray-500">Select the program you're shifting to</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">Current Year Level</Label>
                                                <Input
                                                    type="text"
                                                    value={data.year_level}
                                                    readOnly
                                                    className="h-12 bg-gray-50 border-2 border-gray-200"
                                                />
                                                <p className="text-xs text-gray-500">Your current year level in the new program</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {isTransferee && (
                                    <div className="bg-white border border-blue-200 rounded-lg p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="p-1.5 bg-blue-100 rounded-md">
                                                <BookOpen className="w-4 h-4 text-blue-600" />
                                            </div>
                                            <h3 className="font-semibold text-gray-900 text-base">Previous School Information</h3>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">Previous School Name *</Label>
                                                <Input
                                                    type="text"
                                                    value={previousSchool}
                                                    onChange={(e) => setPreviousSchool(e.target.value)}
                                                    placeholder="e.g., University of the Philippines"
                                                    className="h-12 border-2 border-gray-200 focus:border-blue-500"
                                                />
                                                <p className="text-xs text-gray-500">Full name of your previous school/university</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-sm font-semibold text-gray-700">Current Year Level</Label>
                                                <Input
                                                    type="text"
                                                    value={data.year_level}
                                                    readOnly
                                                    className="h-12 bg-gray-50 border-2 border-gray-200"
                                                />
                                                <p className="text-xs text-gray-500">Your current year level in this school</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {creditModalStep === 2 && curriculumComparison && (
                            <div className="space-y-6">
                                {/* Step 2: Subject Grading */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 text-base">Grade Subjects</h3>
                                            <p className="text-xs text-gray-600">
                                                {curriculumComparison.new_program?.name} • {data.year_level} • {curriculumComparison.new_program?.curriculum?.subjects?.length || 0} subjects
                                            </p>
                                        </div>
                                        <Badge variant="outline" className={`px-2 py-1 text-xs ${
                                            creditedSubjects.some(cs => !cs.grade || cs.grade === '')
                                                ? 'bg-red-100 text-red-700 border-red-300'
                                                : 'bg-blue-100 text-blue-700 border-blue-300'
                                        }`}>
                                            {creditedSubjects.length} selected{creditedSubjects.some(cs => !cs.grade || cs.grade === '') ? ' (grades needed)' : ''}
                                        </Badge>
                                    </div>
                                </div>

                                {/* Subject List */}
                                <div className="bg-white border border-gray-200 rounded-lg p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="font-semibold text-gray-900">Available Subjects</h4>
                                        <div className="flex gap-2">
                                            <Input
                                                type="text"
                                                placeholder="Search subjects..."
                                                value={subjectSearchQuery}
                                                onChange={(e) => setSubjectSearchQuery(e.target.value)}
                                                className="w-48 h-8 text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                                        {curriculumComparison.new_program?.curriculum?.subjects
                                            ?.filter(subject => {
                                                const matchesSearch = subject.subject_name.toLowerCase().includes(subjectSearchQuery.toLowerCase()) ||
                                                    subject.subject_code.toLowerCase().includes(subjectSearchQuery.toLowerCase())

                                                // If this is a transferee being registered into Senior High,
                                                // only show Grade 11 subjects (do not show Grade 12 subjects).
                                                const shsTransfereeFiltering = isTransferee && (selectedProgram?.education_level === 'senior_high' || data.education_level === 'senior_high')

                                                if (shsTransfereeFiltering) {
                                                    return matchesSearch && subject.year_level === 11
                                                }

                                                return matchesSearch
                                            })
                                            .map((subject, index) => {
                                                const isSelected = creditedSubjects.some(cs => cs.subject_id === subject.subject_id)
                                                const selectedSubject = creditedSubjects.find(cs => cs.subject_id === subject.subject_id)

                                                // Determine if this subject should be auto-checked and immutable
                                                const isAutoChecked = isTransferee && (selectedProgram?.education_level === 'senior_high' || data.education_level === 'senior_high') && subject.year_level === 11

                                                return (
                                                    <div
                                                        key={index}
                                                        onClick={(e) => {
                                                            // Don't toggle if clicking on the input field
                                                            if (e.target.tagName === 'INPUT' && e.target.type === 'number') return

                                                            // If auto-checked for SHS transferees, do not allow unchecking.
                                                            if (isAutoChecked) {
                                                                // Ensure it's present (defensive) but never remove it on click
                                                                if (!isSelected) {
                                                                    setCreditedSubjects(prev => [...prev, {
                                                                        subject_id: subject.subject_id,
                                                                        subject_code: subject.subject_code,
                                                                        subject_name: subject.subject_name,
                                                                        year_level: subject.year_level,
                                                                        semester: subject.semester,
                                                                        units: subject.units,
                                                                        grade: ''
                                                                    }])
                                                                }
                                                                return
                                                            }

                                                            if (isSelected) {
                                                                setCreditedSubjects(prev => prev.filter(cs => cs.subject_id !== subject.subject_id))
                                                                // Clear invalid grade state when deselecting
                                                                setInvalidGrades(prev => {
                                                                    const newState = { ...prev }
                                                                    delete newState[subject.subject_id]
                                                                    return newState
                                                                })
                                                            } else {
                                                                setCreditedSubjects(prev => [...prev, {
                                                                    subject_id: subject.subject_id,
                                                                    subject_code: subject.subject_code,
                                                                    subject_name: subject.subject_name,
                                                                    year_level: subject.year_level,
                                                                    semester: subject.semester,
                                                                    units: subject.units,
                                                                    grade: ''
                                                                }])
                                                            }
                                                        }}
                                                        className={`relative rounded-lg p-4 border-2 cursor-pointer transition-all duration-200 ${
                                                            isSelected
                                                                ? (!selectedSubject?.grade || selectedSubject.grade === '')
                                                                    ? 'bg-red-50 border-red-400 shadow-md hover:bg-red-100'
                                                                    : 'bg-blue-50 border-blue-400 shadow-md hover:bg-blue-100'
                                                                : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                                                        }`}
                                                    >
                                                        {/* Selection indicator */}
                                                        <div className={`absolute top-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                            isSelected
                                                                ? (!selectedSubject?.grade || selectedSubject.grade === '')
                                                                    ? 'bg-red-500 border-red-500'
                                                                    : 'bg-blue-500 border-blue-500'
                                                                : 'border-gray-300'
                                                        }`}>
                                                            {isSelected && <CheckCircle2 className="w-3 h-3 text-white" />}
                                                        </div>

                                                        <div className="pr-8">
                                                            <div className="font-semibold text-gray-900 text-sm mb-1">{subject.subject_code}</div>
                                                            <div className="text-gray-600 text-sm mb-2 line-clamp-2">{subject.subject_name}</div>

                                                            <div className="flex flex-wrap gap-1 mb-3">
                                                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                                                    Y{subject.year_level}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                                                                    {subject.semester}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                                                                    {subject.units} units
                                                                </Badge>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="pt-2 border-t border-blue-200">
                                                                    {(!selectedSubject?.grade || selectedSubject.grade === '') && (
                                                                        <div className="flex items-center gap-1 mb-2 text-red-600">
                                                                            <AlertTriangle className="w-3 h-3" />
                                                                            <span className="text-xs font-medium">Grade required</span>
                                                                        </div>
                                                                    )}
                                                                    {isTransferee ? (
                                                                        <div className="space-y-2">
                                                                            <div className="text-xs text-gray-600 font-medium">Select GPA:</div>
                                                                            <div className="flex flex-wrap gap-1">
                                                                                {['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '5.00'].map((gpa) => (
                                                                                    <button
                                                                                        key={gpa}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation() // Prevent card click from triggering
                                                                                            // Update credited subjects
                                                                                            setCreditedSubjects(prev =>
                                                                                                prev.map(cs =>
                                                                                                    cs.subject_id === subject.subject_id
                                                                                                        ? { ...cs, grade: gpa }
                                                                                                        : cs
                                                                                                )
                                                                                            )
                                                                                            // Clear any invalid grade state
                                                                                            setInvalidGrades(prev => {
                                                                                                const newState = { ...prev }
                                                                                                delete newState[subject.subject_id]
                                                                                                return newState
                                                                                            })
                                                                                        }}
                                                                                        className={`px-2 py-1 text-xs font-medium rounded border transition-colors ${
                                                                                            selectedSubject.grade === gpa
                                                                                                ? parseFloat(gpa) <= 3.00
                                                                                                    ? 'bg-blue-500 text-white border-blue-500'
                                                                                                    : 'bg-red-500 text-white border-red-500'
                                                                                                : parseFloat(gpa) <= 3.00
                                                                                                ? 'bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300'
                                                                                                : 'bg-red-100 text-red-700 border-red-300 hover:bg-red-200'
                                                                                        }`}
                                                                                    >
                                                                                        {gpa}
                                                                                    </button>
                                                                                ))}
                                                                            </div>
                                                                            {selectedSubject.grade && (
                                                                                <div className="text-xs text-blue-600 font-medium">
                                                                                    Selected: {selectedSubject.grade} GPA
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="flex items-center gap-2">
                                                                            <Input
                                                                                type="number"
                                                                                placeholder="Grade"
                                                                                value={selectedSubject.grade || ''}
                                                                                onChange={(e) => {
                                                                                    const grade = e.target.value
                                                                                    const numericGrade = parseFloat(grade)
                                                                                    
                                                                                    // Validate grade range (1-100)
                                                                                    const isValid = grade === '' || (!isNaN(numericGrade) && numericGrade >= 1 && numericGrade <= 100)
                                                                                    
                                                                                    // Update invalid grades state
                                                                                    setInvalidGrades(prev => ({
                                                                                        ...prev,
                                                                                        [subject.subject_id]: !isValid
                                                                                    }))
                                                                                    
                                                                                    // Show toast error for invalid grades
                                                                                    if (!isValid && grade !== '') {
                                                                                        toast.error('Grade must be between 1 and 100')
                                                                                    }
                                                                                    
                                                                                    // Update credited subjects
                                                                                    setCreditedSubjects(prev =>
                                                                                        prev.map(cs =>
                                                                                            cs.subject_id === subject.subject_id
                                                                                                ? { ...cs, grade }
                                                                                                : cs
                                                                                        )
                                                                                    )
                                                                                }}
                                                                                className={`flex-1 h-8 text-sm ${
                                                                                    invalidGrades[subject.subject_id]
                                                                                        ? 'border-red-500 focus:border-red-500 bg-red-50'
                                                                                        : 'border-blue-300 focus:border-blue-500'
                                                                                }`}
                                                                                min="1"
                                                                                max="100"
                                                                            />
                                                                            <span className="text-xs text-gray-500 font-medium">%</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {creditModalStep === 3 && feeAdjustments && (
                            <div className="space-y-6">
                                {/* Step 3: Status Determination Results */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="p-3 bg-blue-100 rounded-xl">
                                            <CheckCircle2 className="w-6 h-6 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 text-lg">Credit Evaluation Results</h3>
                                            <p className="text-sm text-gray-600">
                                                Review the credit evaluation results and student status determination
                                            </p>
                                        </div>
                                        <div className={`px-4 py-2 rounded-lg font-bold text-sm ${
                                            feeAdjustments.isIrregular 
                                                ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300' 
                                                : 'bg-green-100 text-green-800 border-2 border-green-300'
                                        }`}>
                                            {feeAdjustments.isIrregular ? 'Irregular Student' : 'Regular Student'}
                                        </div>
                                    </div>
                                </div>

                                {/* Results Grid - 2 columns for better space usage */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Credited Subjects (Passed) */}
                                    {feeAdjustments.creditedPassed?.length > 0 && (
                                        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-green-100 rounded-lg">
                                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                    </div>
                                                    <h4 className="font-bold text-green-900">Credited Subjects ({isTransferee ? 'GPA ≤ 3.00' : 'Grade ≥ 75'})</h4>
                                                </div>
                                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 px-3 py-1">
                                                    {feeAdjustments.creditedPassed.length} subject{feeAdjustments.creditedPassed.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {feeAdjustments.creditedPassed.map((subj, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-green-200 shadow-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-green-900 text-sm truncate">{subj.subject_code}</div>
                                                            <div className="text-gray-600 text-xs truncate">{subj.subject_name}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <div className="flex gap-1">
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    Y{subj.year_level}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    {subj.semester}
                                                                </Badge>
                                                            </div>
                                                            <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 font-semibold text-xs">
                                                                {subj.grade}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Past Subjects to Catch Up */}
                                    {feeAdjustments.pastSubjectsToCatchUp?.length > 0 && (
                                        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-orange-100 rounded-lg">
                                                        <AlertTriangle className="w-5 h-5 text-orange-600" />
                                                    </div>
                                                    <h4 className="font-bold text-orange-900">Past Subjects to Catch Up</h4>
                                                </div>
                                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 px-3 py-1">
                                                    {feeAdjustments.pastSubjectsToCatchUp.length} subject{feeAdjustments.pastSubjectsToCatchUp.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 mb-4 border border-orange-200">
                                                <p className="text-sm text-orange-800">
                                                    These subjects were completed in previous years/semesters but were not passed or credited.
                                                </p>
                                            </div>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {feeAdjustments.pastSubjectsToCatchUp.map((subj, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-200 shadow-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-orange-900 text-sm truncate">{subj.subject_code}</div>
                                                            <div className="text-gray-600 text-xs truncate">{subj.subject_name}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <div className="flex gap-1">
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    Y{subj.year_level}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    {subj.semester}
                                                                </Badge>
                                                            </div>
                                                            <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 text-xs">
                                                                {subj.units} unit{subj.units !== 1 ? 's' : ''}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Failed Subjects */}
                                    {feeAdjustments.creditedFailed?.length > 0 && (
                                        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-100 rounded-lg">
                                                        <AlertTriangle className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <h4 className="font-bold text-red-900">Failed Subjects ({isTransferee ? 'GPA > 3.00' : 'Grade < 75'})</h4>
                                                </div>
                                                <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 px-3 py-1">
                                                    {feeAdjustments.creditedFailed.length} subject{feeAdjustments.creditedFailed.length !== 1 ? 's' : ''}
                                                </Badge>
                                            </div>
                                            <div className="bg-white rounded-lg p-3 mb-4 border border-red-200">
                                                <p className="text-sm text-red-800">
                                                    These subjects were attempted but not passed ({isTransferee ? 'GPA above 3.00' : 'grade below 75'}).
                                                </p>
                                            </div>
                                            <div className="space-y-3 max-h-64 overflow-y-auto">
                                                {feeAdjustments.creditedFailed.map((subj, idx) => (
                                                    <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-red-200 shadow-sm">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-semibold text-red-900 text-sm truncate">{subj.subject_code}</div>
                                                            <div className="text-gray-600 text-xs truncate">{subj.subject_name}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2 ml-2">
                                                            <div className="flex gap-1">
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    Y{subj.year_level}
                                                                </Badge>
                                                                <Badge variant="secondary" className="text-xs px-1 py-0">
                                                                    {subj.semester}
                                                                </Badge>
                                                            </div>
                                                            <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300 font-semibold text-xs">
                                                                Failed: {subj.grade}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Student Status */}
                                <div className={`border-2 rounded-xl p-6 shadow-sm ${feeAdjustments.isIrregular ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-300'}`}>
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${feeAdjustments.isIrregular ? 'bg-yellow-200' : 'bg-green-200'}`}>
                                            <GraduationCap className={`w-8 h-8 ${feeAdjustments.isIrregular ? 'text-yellow-700' : 'text-green-700'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`font-bold text-lg ${feeAdjustments.isIrregular ? 'text-yellow-900' : 'text-green-900'}`}>
                                                Student Status: {feeAdjustments.isIrregular ? 'Irregular' : 'Regular'}
                                            </h4>
                                            <p className={`text-sm mt-1 ${feeAdjustments.isIrregular ? 'text-yellow-700' : 'text-green-700'}`}>
                                                {feeAdjustments.isIrregular
                                                    ? `Student has ${feeAdjustments.pastSubjectsToCatchUp?.length || 0} subject(s) to catch up${feeAdjustments.creditedFailed?.length > 0 ? ` and ${feeAdjustments.creditedFailed.length} failed subject(s)` : ''}. Program fee will be calculated after subject scheduling.`
                                                    : 'Student meets all requirements for regular enrollment. No additional subjects needed.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-4 pt-6 border-t border-gray-200">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreditModal(false)
                                setData('student_type', 'regular')
                            }}
                            className="px-6 py-3 text-base font-medium rounded-xl border-2 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </Button>

                        {/* Step Navigation */}
                        <div className="flex gap-2">
                            {creditModalStep > 1 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setCreditModalStep(prev => prev - 1)}
                                    className="px-4 py-3 text-sm font-medium rounded-xl border-2 hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </Button>
                            )}

                            {creditModalStep < 3 && (
                                <Button
                                    onClick={() => {
                                        // Step 1 validation
                                        if (creditModalStep === 1) {
                                            if (isShiftee && !previousProgram) {
                                                toast.error('Please select a program to shift to')
                                                return
                                            }
                                            if (isTransferee && !previousSchool.trim()) {
                                                toast.error('Please enter the previous school name')
                                                return
                                            }
                                            // Auto-load curriculum for step 2
                                            if (isShiftee && previousProgram && data.program_id && data.year_level) {
                                                const yearLevelMap = {
                                                    '1st Year': 1,
                                                    '2nd Year': 2,
                                                    '3rd Year': 3,
                                                    '4th Year': 4,
                                                    'Grade 11': 1,
                                                    'Grade 12': 2,
                                                }
                                                const numericYear = yearLevelMap[data.year_level] || 1
                                                compareCurricula(parseInt(data.program_id), previousProgram.id, numericYear, courseShiftData?.student_id)
                                            } else if (isTransferee && data.program_id && data.year_level) {
                                                const yearLevelMap = {
                                                    '1st Year': 1,
                                                    '2nd Year': 2,
                                                    '3rd Year': 3,
                                                    '4th Year': 4,
                                                    'Grade 11': 1,
                                                    'Grade 12': 2,
                                                }
                                                const numericYear = yearLevelMap[data.year_level] || 1
                                                compareCurricula(null, parseInt(data.program_id), numericYear, [])
                                            }
                                        }
                                        
                                        // Step 2 validation
                                        if (creditModalStep === 2) {
                                            // when first arriving to grading step, pre-check all grade 11
                                            // subjects so registrar only needs to enter grades
                                            if (creditedSubjects.length === 0 && curriculumComparison) {
                                                const grade11 = curriculumComparison.new_program?.curriculum?.subjects?.filter(s => s.year_level === 11) || [];
                                                const initial = grade11.map(s => ({
                                                    subject_id: s.subject_id,
                                                    subject_code: s.subject_code,
                                                    subject_name: s.subject_name,
                                                    year_level: s.year_level,
                                                    semester: s.semester,
                                                    units: s.units,
                                                    grade: ''
                                                }));
                                                setCreditedSubjects(initial);
                                            }

                                            if (creditedSubjects.length === 0) {
                                                toast.error('Please select at least one subject')
                                                return
                                            }
                                            if (creditedSubjects.some(cs => !cs.grade || cs.grade === '')) {
                                                const missingCount = creditedSubjects.filter(cs => !cs.grade || cs.grade === '').length
                                                toast.error(`Please enter grades for all selected subjects (${missingCount} missing)`)
                                                return
                                            }
                                            // Only validate invalid grades for non-transferees (transferees use buttons with valid values only)
                                            if (!isTransferee && Object.values(invalidGrades).some(isInvalid => isInvalid)) {
                                                toast.error('Please fix invalid grades (must be between 1 and 100)')
                                                return
                                            }
                                            // Auto-calculate status for step 3
                                            const yearLevelMap = {
                                                '1st Year': 1,
                                                '2nd Year': 2,
                                                '3rd Year': 3,
                                                '4th Year': 4,
                                                'Grade 11': 1,
                                                'Grade 12': 2,
                                            }
                                            const numericYear = yearLevelMap[data.year_level] || 1
                                            const allSubjects = curriculumComparison.new_program?.curriculum?.subjects || []
                                            
                                            const creditedPassed = []
                                            const creditedFailed = []
                                            
                                            creditedSubjects.forEach(cs => {
                                                const grade = parseFloat(cs.grade)
                                                if (!isNaN(grade)) {
                                                    // For transferees, GPA <= 3.0 is passing (3.0 = 75%, below 3.0 = higher %); for others, percentage >= 75 is passing
                                                    const isPassing = isTransferee ? (grade <= 3.0) : (grade >= 75)
                                                    if (isPassing) {
                                                        creditedPassed.push(cs)
                                                    } else {
                                                        creditedFailed.push(cs)
                                                    }
                                                }
                                            })
                                            
                                            const passedIds = creditedPassed.map(cs => cs.subject_id)
                                            
                                            const isPastSubject = (s) => {
                                                if (s.year_level < numericYear) return true
                                                if (s.year_level === numericYear) {
                                                    if (currentSemester === '2nd' && s.semester === 'first') return true
                                                }
                                                return false
                                            }
                                            
                                            const pastSubjectsToCatchUp = allSubjects.filter(s => 
                                                isPastSubject(s) && !passedIds.includes(s.subject_id)
                                            )
                                            
                                            const isIrregular = pastSubjectsToCatchUp.length > 0 || creditedFailed.length > 0
                                            
                                            setFeeAdjustments({
                                                creditedPassed,
                                                creditedFailed,
                                                pastSubjectsToCatchUp,
                                                isIrregular
                                            })

                                            setData(prev => {
                                                // If student becomes REGULAR and there is no existing enrollment_fee,
                                                // populate it from the selected program's regular semester fee (if available).
                                                let resolvedEnrollmentFee = prev.enrollment_fee

                                                if (!isIrregular) {
                                                    if (!resolvedEnrollmentFee || resolvedEnrollmentFee === '') {
                                                        const program = programs.find(p => p.id === parseInt(prev.program_id))
                                                        const yearLevelMap = {
                                                            '1st Year': 1,
                                                            '2nd Year': 2,
                                                            '3rd Year': 3,
                                                            '4th Year': 4,
                                                            'Grade 11': 1,
                                                            'Grade 12': 2,
                                                        }
                                                        const numericYear = (yearLevelMap[prev.year_level] ?? parseInt(prev.year_level)) || getNumericYearLevel(prev.year_level, program?.education_level)
                                                        const programFee = program?.program_fees?.find(fee => fee.year_level === numericYear && fee.fee_type === 'regular')
                                                        const isShsStudent = program?.education_level === 'senior_high'
                                                        // Only set fee to 0 for SHS when voucher-applicable (Grade 11 newcomers who are not transferees).
                                                        resolvedEnrollmentFee = (isShsStudent && isShsVoucherApplicable) ? '0' : (programFee?.semester_fee ?? '')
                                                    }
                                                }

                                                return {
                                                    ...prev,
                                                    student_type: isIrregular ? 'irregular' : 'regular',
                                                    enrollment_fee: isIrregular ? '0' : resolvedEnrollmentFee,
                                                    payment_amount: isIrregular ? '0' : prev.payment_amount
                                                }
                                            })
                                        }
                                        
                                        setCreditModalStep(prev => prev + 1)
                                    }}
                                    className="px-6 py-3 text-sm font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    {creditModalStep === 2 ? 'Determine Status' : 'Next'}
                                </Button>
                            )}

                            {creditModalStep === 3 && (
                                <Button
                                    onClick={() => {
                                        setShowCreditModal(false)
                                        toast.success('Credit evaluation completed successfully!')
                                    }}
                                    className="px-8 py-3 text-base font-semibold rounded-xl bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                                >
                                    <Save className="w-5 h-5 mr-2" />
                                    Complete & Save
                                </Button>
                            )}
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
