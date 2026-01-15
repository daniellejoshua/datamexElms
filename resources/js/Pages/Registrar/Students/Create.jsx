import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { UserPlus, ArrowLeft, GraduationCap, BookOpen, AlertTriangle, DollarSign, Info } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'

// Philippine Address Data
const PHILIPPINE_ADDRESSES = {
    provinces: [
        { code: 'ABR', name: 'Abra' },
        { code: 'AGN', name: 'Agusan del Norte' },
        { code: 'AGS', name: 'Agusan del Sur' },
        { code: 'AKL', name: 'Aklan' },
        { code: 'ALB', name: 'Albay' },
        { code: 'ANT', name: 'Antique' },
        { code: 'APA', name: 'Apayao' },
        { code: 'AUR', name: 'Aurora' },
        { code: 'BAS', name: 'Basilan' },
        { code: 'BAN', name: 'Bataan' },
        { code: 'BTN', name: 'Batanes' },
        { code: 'BTG', name: 'Batangas' },
        { code: 'BEN', name: 'Benguet' },
        { code: 'BIL', name: 'Biliran' },
        { code: 'BOH', name: 'Bohol' },
        { code: 'BUK', name: 'Bukidnon' },
        { code: 'BUL', name: 'Bulacan' },
        { code: 'CAG', name: 'Cagayan' },
        { code: 'CAN', name: 'Camarines Norte' },
        { code: 'CAS', name: 'Camarines Sur' },
        { code: 'CAM', name: 'Camiguin' },
        { code: 'CAP', name: 'Capiz' },
        { code: 'CAT', name: 'Catanduanes' },
        { code: 'CAV', name: 'Cavite' },
        { code: 'CEB', name: 'Cebu' },
        { code: 'COM', name: 'Compostela Valley' },
        { code: 'DAN', name: 'Davao del Norte' },
        { code: 'DAS', name: 'Davao del Sur' },
        { code: 'DAV', name: 'Davao Occidental' },
        { code: 'DAO', name: 'Davao Oriental' },
        { code: 'DIN', name: 'Dinagat Islands' },
        { code: 'EAS', name: 'Eastern Samar' },
        { code: 'GUI', name: 'Guimaras' },
        { code: 'IFU', name: 'Ifugao' },
        { code: 'ILN', name: 'Ilocos Norte' },
        { code: 'ILS', name: 'Ilocos Sur' },
        { code: 'ILI', name: 'Iloilo' },
        { code: 'ISA', name: 'Isabela' },
        { code: 'KAL', name: 'Kalinga' },
        { code: 'LUN', name: 'La Union' },
        { code: 'LAG', name: 'Laguna' },
        { code: 'LAN', name: 'Lanao del Norte' },
        { code: 'LAS', name: 'Lanao del Sur' },
        { code: 'LEY', name: 'Leyte' },
        { code: 'MAG', name: 'Maguindanao' },
        { code: 'MAD', name: 'Marinduque' },
        { code: 'MAS', name: 'Masbate' },
        { code: 'MSC', name: 'Misamis Occidental' },
        { code: 'MSR', name: 'Misamis Oriental' },
        { code: 'MOU', name: 'Mountain Province' },
        { code: 'NEC', name: 'Negros Occidental' },
        { code: 'NER', name: 'Negros Oriental' },
        { code: 'NSA', name: 'Northern Samar' },
        { code: 'NUE', name: 'Nueva Ecija' },
        { code: 'NUV', name: 'Nueva Vizcaya' },
        { code: 'MDC', name: 'Occidental Mindoro' },
        { code: 'MDR', name: 'Oriental Mindoro' },
        { code: 'PLW', name: 'Palawan' },
        { code: 'PAM', name: 'Pampanga' },
        { code: 'PAN', name: 'Pangasinan' },
        { code: 'QUE', name: 'Quezon' },
        { code: 'QUI', name: 'Quirino' },
        { code: 'RIZ', name: 'Rizal' },
        { code: 'ROM', name: 'Romblon' },
        { code: 'WSA', name: 'Samar' },
        { code: 'SAR', name: 'Sarangani' },
        { code: 'SIQ', name: 'Siquijor' },
        { code: 'SOR', name: 'Sorsogon' },
        { code: 'SCO', name: 'South Cotabato' },
        { code: 'SLE', name: 'Southern Leyte' },
        { code: 'SUK', name: 'Sultan Kudarat' },
        { code: 'SLU', name: 'Sulu' },
        { code: 'SUN', name: 'Surigao del Norte' },
        { code: 'SUR', name: 'Surigao del Sur' },
        { code: 'TAR', name: 'Tarlac' },
        { code: 'TAW', name: 'Tawi-Tawi' },
        { code: 'ZMB', name: 'Zambales' },
        { code: 'ZAN', name: 'Zamboanga del Norte' },
        { code: 'ZAS', name: 'Zamboanga del Sur' },
        { code: 'ZSI', name: 'Zamboanga Sibugay' },
        { code: 'NCR', name: 'National Capital Region' },
    ],
    cities: {
        'ABR': [
            { code: 'ABR-001', name: 'Bangued' },
            { code: 'ABR-002', name: 'Boliney' },
            { code: 'ABR-003', name: 'Bucay' },
            { code: 'ABR-004', name: 'Bucloc' },
            { code: 'ABR-005', name: 'Daguioman' },
            { code: 'ABR-006', name: 'Danglas' },
            { code: 'ABR-007', name: 'Dolores' },
            { code: 'ABR-008', name: 'La Paz' },
            { code: 'ABR-009', name: 'Lacub' },
            { code: 'ABR-010', name: 'Lagangilang' },
            { code: 'ABR-011', name: 'Lagayan' },
            { code: 'ABR-012', name: 'Langiden' },
            { code: 'ABR-013', name: 'Licuan-Baay' },
            { code: 'ABR-014', name: 'Luba' },
            { code: 'ABR-015', name: 'Malibcong' },
            { code: 'ABR-016', name: 'Manabo' },
            { code: 'ABR-017', name: 'Peñarrubia' },
            { code: 'ABR-018', name: 'Pidigan' },
            { code: 'ABR-019', name: 'Pilar' },
            { code: 'ABR-020', name: 'Sallapadan' },
            { code: 'ABR-021', name: 'San Isidro' },
            { code: 'ABR-022', name: 'San Juan' },
            { code: 'ABR-023', name: 'San Quintin' },
            { code: 'ABR-024', name: 'Tayum' },
            { code: 'ABR-025', name: 'Tineg' },
            { code: 'ABR-026', name: 'Tubo' },
            { code: 'ABR-027', name: 'Villaviciosa' },
        ],
        'BTG': [
            { code: 'BTG-001', name: 'Agoncillo' },
            { code: 'BTG-002', name: 'Alitagtag' },
            { code: 'BTG-003', name: 'Balayan' },
            { code: 'BTG-004', name: 'Balete' },
            { code: 'BTG-005', name: 'Batangas City' },
            { code: 'BTG-006', name: 'Bauan' },
            { code: 'BTG-007', name: 'Calaca' },
            { code: 'BTG-008', name: 'Calatagan' },
            { code: 'BTG-009', name: 'Cuenca' },
            { code: 'BTG-010', name: 'Ibaan' },
            { code: 'BTG-011', name: 'Laurel' },
            { code: 'BTG-012', name: 'Lemery' },
            { code: 'BTG-013', name: 'Lian' },
            { code: 'BTG-014', name: 'Lipa' },
            { code: 'BTG-015', name: 'Loboc' },
            { code: 'BTG-016', name: 'Mabini' },
            { code: 'BTG-017', name: 'Malvar' },
            { code: 'BTG-018', name: 'Mataas na Kahoy' },
            { code: 'BTG-019', name: 'Nasugbu' },
            { code: 'BTG-020', name: 'Padre Garcia' },
            { code: 'BTG-021', name: 'Rosario' },
            { code: 'BTG-022', name: 'San Jose' },
            { code: 'BTG-023', name: 'San Juan' },
            { code: 'BTG-024', name: 'San Luis' },
            { code: 'BTG-025', name: 'San Nicolas' },
            { code: 'BTG-026', name: 'San Pascual' },
            { code: 'BTG-027', name: 'Santa Teresita' },
            { code: 'BTG-028', name: 'Santo Tomas' },
            { code: 'BTG-029', name: 'Taal' },
            { code: 'BTG-030', name: 'Talisa' },
            { code: 'BTG-031', name: 'Tanauan' },
            { code: 'BTG-032', name: 'Taysan' },
            { code: 'BTG-033', name: 'Tingloy' },
            { code: 'BTG-034', name: 'Tuy' },
        ],
        'CAV': [
            { code: 'CAV-001', name: 'Alfonso' },
            { code: 'CAV-002', name: 'Amadeo' },
            { code: 'CAV-003', name: 'Bacoor' },
            { code: 'CAV-004', name: 'Carmona' },
            { code: 'CAV-005', name: 'Cavite City' },
            { code: 'CAV-006', name: 'Dasmariñas' },
            { code: 'CAV-007', name: 'General Emilio Aguinaldo' },
            { code: 'CAV-008', name: 'General Mariano Alvarez' },
            { code: 'CAV-009', name: 'General Trias' },
            { code: 'CAV-010', name: 'Imus' },
            { code: 'CAV-011', name: 'Indang' },
            { code: 'CAV-012', name: 'Kawit' },
            { code: 'CAV-013', name: 'Magallanes' },
            { code: 'CAV-014', name: 'Maragondon' },
            { code: 'CAV-015', name: 'Mendez' },
            { code: 'CAV-016', name: 'Naic' },
            { code: 'CAV-017', name: 'Noveleta' },
            { code: 'CAV-018', name: 'Rosario' },
            { code: 'CAV-019', name: 'Silang' },
            { code: 'CAV-020', name: 'Tagaytay' },
            { code: 'CAV-021', name: 'Tanza' },
            { code: 'CAV-022', name: 'Trece Martires' },
            { code: 'CAV-023', name: 'Trece Martires City' },
        ],
        'LAG': [
            { code: 'LAG-001', name: 'Alaminos' },
            { code: 'LAG-002', name: 'Bay' },
            { code: 'LAG-003', name: 'Biñan' },
            { code: 'LAG-004', name: 'Cabuyao' },
            { code: 'LAG-005', name: 'Calamba' },
            { code: 'LAG-006', name: 'Calauan' },
            { code: 'LAG-007', name: 'Cavinti' },
            { code: 'LAG-008', name: 'Famy' },
            { code: 'LAG-009', name: 'Kalayaan' },
            { code: 'LAG-010', name: 'Liliw' },
            { code: 'LAG-011', name: 'Los Baños' },
            { code: 'LAG-012', name: 'Luisiana' },
            { code: 'LAG-013', name: 'Lumban' },
            { code: 'LAG-014', name: 'Mabitac' },
            { code: 'LAG-015', name: 'Magdalena' },
            { code: 'LAG-016', name: 'Majayjay' },
            { code: 'LAG-017', name: 'Nagcarlan' },
            { code: 'LAG-018', name: 'Paete' },
            { code: 'LAG-019', name: 'Pagsanjan' },
            { code: 'LAG-020', name: 'Pakil' },
            { code: 'LAG-021', name: 'Pangil' },
            { code: 'LAG-022', name: 'Pila' },
            { code: 'LAG-023', name: 'Rizal' },
            { code: 'LAG-024', name: 'San Pablo' },
            { code: 'LAG-025', name: 'San Pedro' },
            { code: 'LAG-026', name: 'Santa Cruz' },
            { code: 'LAG-027', name: 'Santa Maria' },
            { code: 'LAG-028', name: 'Santa Rosa' },
            { code: 'LAG-029', name: 'Siniloan' },
            { code: 'LAG-030', name: 'Victoria' },
        ],
        'NCR': [
            { code: 'NCR-001', name: 'Caloocan' },
            { code: 'NCR-002', name: 'Las Piñas' },
            { code: 'NCR-003', name: 'Makati' },
            { code: 'NCR-004', name: 'Malabon' },
            { code: 'NCR-005', name: 'Mandaluyong' },
            { code: 'NCR-006', name: 'Manila' },
            { code: 'NCR-007', name: 'Marikina' },
            { code: 'NCR-008', name: 'Muntinlupa' },
            { code: 'NCR-009', name: 'Navotas' },
            { code: 'NCR-010', name: 'Parañaque' },
            { code: 'NCR-011', name: 'Pasay' },
            { code: 'NCR-012', name: 'Pasig' },
            { code: 'NCR-013', name: 'Pateros' },
            { code: 'NCR-014', name: 'Quezon City' },
            { code: 'NCR-015', name: 'San Juan' },
            { code: 'NCR-016', name: 'Taguig' },
            { code: 'NCR-017', name: 'Valenzuela' },
        ],
        // Add more provinces as needed...
    },
    barangays: {
        'CAV-003': [ // Bacoor
            { code: 'CAV-003-001', name: 'Alima' },
            { code: 'CAV-003-002', name: 'Aniban' },
            { code: 'CAV-003-003', name: 'Banalo' },
            { code: 'CAV-003-004', name: 'Bayanan' },
            { code: 'CAV-003-005', name: 'Campo Santo' },
            { code: 'CAV-003-006', name: 'Daang Bukid' },
            { code: 'CAV-003-007', name: 'Digman' },
            { code: 'CAV-003-008', name: 'Habay' },
            { code: 'CAV-003-009', name: 'Kaingin' },
            { code: 'CAV-003-010', name: 'Ligas' },
            { code: 'CAV-003-011', name: 'Mabolo' },
            { code: 'CAV-003-012', name: 'Maliksi' },
            { code: 'CAV-003-013', name: 'Mambog' },
            { code: 'CAV-003-014', name: 'Molino' },
            { code: 'CAV-003-015', name: 'Niog' },
            { code: 'CAV-003-016', name: 'Poblacion' },
            { code: 'CAV-003-017', name: 'Real' },
            { code: 'CAV-003-018', name: 'Salinas' },
            { code: 'CAV-003-019', name: 'San Nicolas' },
            { code: 'CAV-003-020', name: 'Sineguelasan' },
            { code: 'CAV-003-021', name: 'Tabing Dagat' },
            { code: 'CAV-003-022', name: 'Talaba' },
            { code: 'CAV-003-023', name: 'Tamsui' },
            { code: 'CAV-003-024', name: 'Zapote' },
        ],
        'NCR-003': [ // Makati
            { code: 'NCR-003-001', name: 'Bangkal' },
            { code: 'NCR-003-002', name: 'Bel-Air' },
            { code: 'NCR-003-003', name: 'Carmona' },
            { code: 'NCR-003-004', name: 'Cembo' },
            { code: 'NCR-003-005', name: 'Comembo' },
            { code: 'NCR-003-006', name: 'Dasmariñas' },
            { code: 'NCR-003-007', name: 'East Rembo' },
            { code: 'NCR-003-008', name: 'Forbes Park' },
            { code: 'NCR-003-009', name: 'Guadalupe Nuevo' },
            { code: 'NCR-003-010', name: 'Guadalupe Viejo' },
            { code: 'NCR-003-011', name: 'Kasilawan' },
            { code: 'NCR-003-012', name: 'La Paz' },
            { code: 'NCR-003-013', name: 'Magallanes' },
            { code: 'NCR-003-014', name: 'Olympia' },
            { code: 'NCR-003-015', name: 'Palanan' },
            { code: 'NCR-003-016', name: 'Pembo' },
            { code: 'NCR-003-017', name: 'Pinagkaisahan' },
            { code: 'NCR-003-018', name: 'Pio del Pilar' },
            { code: 'NCR-003-019', name: 'Pitogo' },
            { code: 'NCR-003-020', name: 'Poblacion' },
            { code: 'NCR-003-021', name: 'Post Proper Northside' },
            { code: 'NCR-003-022', name: 'Post Proper Southside' },
            { code: 'NCR-003-023', name: 'Rizal' },
            { code: 'NCR-003-024', name: 'San Antonio' },
            { code: 'NCR-003-025', name: 'San Isidro' },
            { code: 'NCR-003-026', name: 'San Lorenzo' },
            { code: 'NCR-003-027', name: 'Santa Cruz' },
            { code: 'NCR-003-028', name: 'Singkamas' },
            { code: 'NCR-003-029', name: 'South Cembo' },
            { code: 'NCR-003-030', name: 'Tejeros' },
            { code: 'NCR-003-031', name: 'Urdaneta' },
            { code: 'NCR-003-032', name: 'Valenzuela' },
            { code: 'NCR-003-033', name: 'West Rembo' },
        ],
        'LAG-028': [ // Santa Rosa
            { code: 'LAG-028-001', name: 'Aplaya' },
            { code: 'LAG-028-002', name: 'Balibago' },
            { code: 'LAG-028-003', name: 'Caingin' },
            { code: 'LAG-028-004', name: 'Dila' },
            { code: 'LAG-028-005', name: 'Dita' },
            { code: 'LAG-028-006', name: 'Don Jose' },
            { code: 'LAG-028-007', name: 'Ibaba' },
            { code: 'LAG-028-008', name: 'Kanluran' },
            { code: 'LAG-028-009', name: 'Labas' },
            { code: 'LAG-028-010', name: 'Macabling' },
            { code: 'LAG-028-011', name: 'Malitlit' },
            { code: 'LAG-028-012', name: 'Malusak' },
            { code: 'LAG-028-013', name: 'Market Area' },
            { code: 'LAG-028-014', name: 'Pooc' },
            { code: 'LAG-028-015', name: 'Pulong Santa Cruz' },
            { code: 'LAG-028-016', name: 'Santo Domingo' },
            { code: 'LAG-028-017', name: 'Sinalhan' },
            { code: 'LAG-028-018', name: 'Tagapo' },
        ],
        // Add more cities as needed...
    }
}

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
    
    // Duplicate detection states
    const [duplicateWarning, setDuplicateWarning] = useState(null)
    const [duplicateOverride, setDuplicateOverride] = useState(false)
    const [showDuplicateModal, setShowDuplicateModal] = useState(false)
    const [checkingDuplicate, setCheckingDuplicate] = useState(false)
    
    // Course shift comparison states
    const [showSubjectComparisonModal, setShowSubjectComparisonModal] = useState(false)
    const [subjectComparison, setSubjectComparison] = useState(null)
    const [loadingComparison, setLoadingComparison] = useState(false)
    
    // Shifting and Transferee states
    const [isShiftee, setIsShiftee] = useState(false)
    const [isTransferee, setIsTransferee] = useState(false)
    const [previousProgram, setPreviousProgram] = useState(null)
    const [previousSchool, setPreviousSchool] = useState('')
    const [creditedSubjects, setCreditedSubjects] = useState([])
    const [showCreditModal, setShowCreditModal] = useState(false)
    const [curriculumComparison, setCurriculumComparison] = useState(null)
    const [feeAdjustments, setFeeAdjustments] = useState({ credits: 0, catchup: 0, total: 0 })
    const [subjectsToCatchUp, setSubjectsToCatchUp] = useState([])
    const [loadingCurriculumComparison, setLoadingCurriculumComparison] = useState(false)

    // Address dropdown states
    const [provinces, setProvinces] = useState(PHILIPPINE_ADDRESSES.provinces)
    const [cities, setCities] = useState([])
    const [barangays, setBarangays] = useState([])

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
                if (!isExistingStudent && !isReturningStudent) {
                    const guides = selectedProgram.yearLevelGuides || []
                    const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
                    if (guide && guide.curriculum) {
                        curriculum = guide.curriculum
                    }
                }
            } catch (e) {
                // If anything goes wrong, curriculum will remain null and be fetched from API
                console.error('Error determining curriculum from guide:', e)
            }

            setSelectedCurriculum(curriculum)

            // Set the curriculum ID if we found one from the guide
            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
            if (isExistingStudent || isReturningStudent) {
                // Do not override existing/returning student data
            } else if (curriculum) {
                setData('curriculum_id', curriculum.id)
            }
        } else {
            setSelectedCurriculum(null)
            setData('curriculum_id', '')
        }
    }, [selectedProgram, data.year_level, isExistingStudent, isReturningStudent, currentAcademicYear])

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

            // Check if this is a SHS student (voucher program)
            const isShsStudent = program?.education_level === 'senior_high'

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
                    // SHS students with voucher get free tuition
                    enrollment_fee: isShsStudent ? '0' : (programFee?.semester_fee || ''),
                    // SHS students don't need to pay
                    payment_amount: isShsStudent ? '0' : prev.payment_amount,
                }))
            } else {
                // For irregular students, don't auto-populate fee
                setData(prev => ({
                    ...prev,
                    education_level: program?.education_level || '',
                    track: program?.track || '',
                    strand: program?.strand || '',
                    // SHS students with voucher get free tuition
                    enrollment_fee: isShsStudent ? '0' : prev.enrollment_fee,
                    // SHS students don't need to pay
                    payment_amount: isShsStudent ? '0' : prev.payment_amount,
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
    
    // Handle shiftee/transferee selection
    useEffect(() => {
        if (data.student_type === 'shiftee') {
            setIsShiftee(true)
            setIsTransferee(false)
            setShowCreditModal(true)
        } else if (data.student_type === 'transferee') {
            setIsTransferee(true)
            setIsShiftee(false)
            setShowCreditModal(true)
        } else {
            setIsShiftee(false)
            setIsTransferee(false)
            setPreviousProgram(null)
            setPreviousSchool('')
            setCreditedSubjects([])
            setCurriculumComparison(null)
            setFeeAdjustments({ credits: 0, catchup: 0, total: 0 })
            setSubjectsToCatchUp([])
        }
    }, [data.student_type])

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

    // Fetch cities when province changes
    useEffect(() => {
        if (!data.province) {
            setCities([])
            setBarangays([])
            return
        }

        const province = provinces.find(p => p.name === data.province)
        if (province) {
            const provinceCities = PHILIPPINE_ADDRESSES.cities[province.code] || []
            setCities(provinceCities)
            setBarangays([])
        }
    }, [data.province, provinces])

    // Fetch barangays when city changes
    useEffect(() => {
        if (!data.city) {
            setBarangays([])
            return
        }

        const city = cities.find(c => c.name === data.city)
        if (city) {
            const cityBarangays = PHILIPPINE_ADDRESSES.barangays[city.code] || []
            setBarangays(cityBarangays)
        }
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
        }, 800) // 800ms debounce

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
                const guides = newProgram.yearLevelGuides || []
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

    const confirmCourseShift = () => {
        // Auto-select curriculum based on year level guide if not already selected
        if (!selectedCurriculum && selectedProgram) {
            const numericYear = getNumericYearLevel(data.year_level || '', selectedProgram.education_level)
            const guides = selectedProgram.yearLevelGuides || []
            const guide = guides.find(g => g.year_level === numericYear && g.curriculum)
            
            if (guide && guide.curriculum) {
                setSelectedCurriculum(guide.curriculum)
                setData('curriculum_id', guide.curriculum.id)
            }
        }
        
        setData('confirm_course_shift', true)
        setShowCourseShiftModal(false)
        setShowSubjectComparisonModal(false)
        // Submit the form again with confirmation
        handleSubmit({ preventDefault: () => {} })
    }

    const cancelCourseShift = () => {
        setData('confirm_course_shift', false)
        setShowCourseShiftModal(false)
        setCourseShiftData(null)
    }

    const compareCurricula = async (previousProgramId, newProgramId, yearLevel, externalCredits = null) => {
        setLoadingCurriculumComparison(true)
        try {
            const payload = {
                previous_program_id: previousProgramId,
                new_program_id: newProgramId,
                student_year_level: yearLevel,
            }

            if (externalCredits && externalCredits.length > 0) {
                payload.credited_subjects = externalCredits
            }

            const response = await axios.post('/registrar/credit-transfers/compare', payload)
            
            if (response.data.success) {
                setCurriculumComparison(response.data.data)
                setFeeAdjustments(response.data.data.fee_adjustments)
                setSubjectsToCatchUp(response.data.data.subjects_to_catch_up)
                
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
        if (duplicateWarning && !duplicateOverride && !isExistingStudent && !isReturningStudent) {
            setShowDuplicateModal(true)
            toast.warning('Please review the duplicate warning before proceeding', {
                duration: 5000,
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
            duplicate_override: duplicateOverride,
        }

        // Add credit transfer data if student is shiftee or transferee
        if ((isShiftee || isTransferee) && curriculumComparison) {
            submitData.transfer_type = isShiftee ? 'shiftee' : 'transferee'
            submitData.previous_program_id = previousProgram?.id || null
            submitData.previous_school = previousSchool || null
            submitData.credited_subjects = curriculumComparison.credited_subjects || []
            submitData.subjects_to_catch_up = curriculumComparison.subjects_to_catch_up || []
            submitData.fee_adjustments = feeAdjustments
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
                                <div className="relative">
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
                                {duplicateWarning && !checkingDuplicate && !duplicateOverride && (
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
                                        value={(data.parent_contact || '').replace('+63', '')}
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
                                        disabled={false}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Province" />
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
                                        disabled={!data.province}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select City/Municipality" />
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
                                        disabled={!data.city}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Barangay" />
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
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="font-mono text-xs">
                                                            {program.program_code}
                                                        </Badge>
                                                        <span className="text-sm">{program.program_name || program.name}</span>
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
                                            const guides = selectedProgram.yearLevelGuides || []
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
                                    {data.education_level === 'college' && (
                                        <>
                                            <SelectItem value="shiftee">🔄 Course Shiftee</SelectItem>
                                            <SelectItem value="transferee">📚 Transferee</SelectItem>
                                        </>
                                    )}
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
                        {/* SHS Voucher Status Alert */}
                        {data.education_level === 'senior_high' && (
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                <Label className="text-sm font-medium w-24 flex-shrink-0">
                                    Enrollment Fee:
                                </Label>
                                <div className="relative flex-1 max-w-32">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
                                        ₱
                                    </span>
                                    <Input
                                        id="enrollment_fee"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.enrollment_fee}
                                        onChange={e => setData('enrollment_fee', e.target.value)}
                                        required
                                        placeholder="0.00"
                                        readOnly={data.student_type === 'regular' || data.education_level === 'senior_high'}
                                        className={`pl-6 h-8 text-sm ${(data.student_type === 'regular' || data.education_level === 'senior_high') ? 'bg-gray-50' : ''}`}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">total fee</span>
                            </div>

                            <div className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                                <Label className="text-sm font-medium w-24 flex-shrink-0">
                                    Initial Payment:
                                </Label>
                                <div className="relative flex-1 max-w-32">
                                    <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-500 text-xs z-10">
                                        ₱
                                    </span>
                                    <Input
                                        id="payment_amount"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={data.payment_amount}
                                        onChange={e => setData('payment_amount', e.target.value)}
                                        required={data.education_level !== 'senior_high'}
                                        placeholder="0.00"
                                        readOnly={data.education_level === 'senior_high'}
                                        className={`pl-6 h-8 text-sm ${data.education_level === 'senior_high' ? 'bg-gray-50' : ''}`}
                                    />
                                </div>
                                <span className="text-xs text-gray-500">paid today</span>
                            </div>
                        </div>

                        {/* Error Messages */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                {errors.enrollment_fee && (
                                    <p className="text-red-500 text-sm">{errors.enrollment_fee}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.education_level === 'senior_high'
                                        ? '₱0.00 - Covered by SHS voucher program'
                                        : data.student_type === 'regular'
                                        ? 'Automatically set based on selected program and year level'
                                        : 'Enter enrollment fee manually for irregular students'
                                    }
                                </p>
                            </div>

                            <div>
                                {errors.payment_amount && (
                                    <p className="text-red-500 text-sm">{errors.payment_amount}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.education_level === 'senior_high'
                                        ? 'No payment required - covered by voucher'
                                        : 'Amount paid today towards the enrollment fee'
                                    }
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

                    <div className="flex flex-col gap-3 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                            Is this the same person you're trying to register?
                        </div>
                        <div className="flex gap-3">
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
                                    // User confirms it's a different person - allow override
                                    setDuplicateOverride(true)
                                    setShowDuplicateModal(false)
                                    toast.info('Override confirmed. You can proceed with registration.', {
                                        duration: 4000,
                                    })
                                }}
                                variant="outline"
                                className="flex-1"
                            >
                                No, Different Person - Continue
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowDuplicateModal(false)
                                }}
                                variant="outline"
                            >
                                Cancel
                            </Button>
                        </div>
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
                    
                    {/* View Subject Comparison Button */}
                    {courseShiftData?.student_id && (
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
                            disabled={processing}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            Confirm Course Shift
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
                        )}

                        {/* Important Notice */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                <div className="text-sm text-blue-800">
                                    <strong>Important:</strong> Subject credits are determined by teachers when they enter grades for this student.
                                    The registrar cannot manually credit subjects - credits are granted automatically when grades are recorded.
                                </div>
                            </div>
                        </div>

                        {/* Two Column Comparison Tables */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left Column: Previous Program Subjects */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                        Previous Program: {subjectComparison?.old_program}
                                    </h3>

                                    <div className="space-y-2 max-h-96 overflow-y-auto">
                                        {subjectComparison?.completed_subjects?.map((subject, idx) => (
                                            <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded">
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{subject.subject_code}</div>
                                                    <div className="text-xs text-gray-600">{subject.subject_name}</div>
                                                </div>
                                                <Badge variant="outline" className="text-xs">
                                                    Grade: {subject.grade}
                                                </Badge>
                                            </div>
                                        )) || (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                No completed subjects found
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: New Program Subjects */}
                            <div className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                        New Program: {subjectComparison?.new_program}
                                    </h3>

                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {/* Credited Subjects */}
                                        {subjectComparison?.credited_subjects?.length > 0 && (
                                            <div>
                                                <div className="text-sm font-medium text-green-700 mb-2">✓ Will Transfer</div>
                                                <div className="space-y-2">
                                                    {subjectComparison.credited_subjects.map((match, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 bg-green-100 border border-green-300 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{match.new_subject.subject_code}</div>
                                                                <div className="text-xs text-gray-600">{match.new_subject.subject_name}</div>
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {match.match_reason}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Similar Subjects */}
                                        {subjectComparison?.similar_subjects?.length > 0 && (
                                            <div>
                                                <div className="text-sm font-medium text-yellow-700 mb-2">? Needs Review</div>
                                                <div className="space-y-2">
                                                    {subjectComparison.similar_subjects.map((match, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 bg-yellow-100 border border-yellow-300 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{match.new_subject.subject_code}</div>
                                                                <div className="text-xs text-gray-600">{match.new_subject.subject_name}</div>
                                                            </div>
                                                            <Badge variant="secondary" className="text-xs">
                                                                {match.similarity_score}%
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* New Subjects */}
                                        {subjectComparison?.new_subjects?.length > 0 && (
                                            <div>
                                                <div className="text-sm font-medium text-purple-700 mb-2">+ New Subjects</div>
                                                <div className="space-y-2">
                                                    {subjectComparison.new_subjects.map((subject, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 bg-purple-100 border border-purple-300 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{subject.subject_code}</div>
                                                                <div className="text-xs text-gray-600">{subject.subject_name}</div>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">
                                                                Y{subject.year_level} • {subject.semester}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(!subjectComparison?.credited_subjects?.length && !subjectComparison?.similar_subjects?.length && !subjectComparison?.new_subjects?.length) && (
                                            <div className="text-center py-4 text-gray-500 text-sm">
                                                No subjects required for this program
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

            {/* Course Shifting / Transferee Credit Modal */}
            <Dialog open={showCreditModal} onOpenChange={setShowCreditModal}>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {isShiftee ? '🔄 Course Shifting' : '📚 Transferee'} - Subject Credit Evaluation
                        </DialogTitle>
                        <DialogDescription>
                            {isShiftee 
                                ? 'Compare curriculum between programs and identify subjects that need to be caught up or can be credited.'
                                : 'Enter subjects completed at previous school to determine credits and subjects to catch up.'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {/* Previous Program/School Selection */}
                        {isShiftee && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Program to Shift To *</Label>
                                    <Select
                                        value={previousProgram?.id?.toString() || ''}
                                        onValueChange={(value) => {
                                            const program = collegePrograms.find(p => p.id === parseInt(value))
                                            setPreviousProgram(program)
                                        }}
                                    >
                                        <SelectTrigger className="h-10">
                                            <SelectValue placeholder="Select program to shift to" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {collegePrograms
                                                .filter(p => p.id !== parseInt(data.program_id))
                                                .map(program => (
                                                    <SelectItem key={program.id} value={program.id.toString()}>
                                                        {program.program_code} - {program.program_name}
                                                    </SelectItem>
                                                ))}
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-500 mt-1">Select the program you're shifting to</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Current Year Level *</Label>
                                    <Input
                                        type="text"
                                        value={data.year_level}
                                        readOnly
                                        className="bg-gray-50 h-10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Your current year level in the new program</p>
                                </div>
                            </div>
                        )}

                        {isTransferee && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-sm font-medium">Previous School *</Label>
                                    <Input
                                        type="text"
                                        value={previousSchool}
                                        onChange={(e) => setPreviousSchool(e.target.value)}
                                        placeholder="Enter previous school name"
                                        className="h-10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Name of your previous school/university</p>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium">Current Year Level *</Label>
                                    <Input
                                        type="text"
                                        value={data.year_level}
                                        readOnly
                                        className="bg-gray-50 h-10"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Your current year level in this school</p>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        {((isShiftee && previousProgram && data.program_id) || (isTransferee && previousSchool)) && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={async () => {
                                        if (isShiftee && previousProgram && data.program_id && data.year_level) {
                                            // Get numeric year level
                                            const yearLevelMap = {
                                                '1st Year': 1,
                                                '2nd Year': 2,
                                                '3rd Year': 3,
                                                '4th Year': 4,
                                                'Grade 11': 1,
                                                'Grade 12': 2,
                                            }
                                            const numericYear = yearLevelMap[data.year_level] || 1
                                            
                                            await compareCurricula(parseInt(data.program_id), previousProgram.id, numericYear)
                                        } else if (isTransferee && data.program_id && data.year_level) {
                                            // For transferees, we'd need to show a form to collect external subjects first
                                            // For now, just compare with empty credited subjects
                                            const yearLevelMap = {
                                                '1st Year': 1,
                                                '2nd Year': 2,
                                                '3rd Year': 3,
                                                '4th Year': 4,
                                                'Grade 11': 1,
                                                'Grade 12': 2,
                                            }
                                            const numericYear = yearLevelMap[data.year_level] || 1
                                            
                                            // TODO: Implement external subject collection UI
                                            await compareCurricula(null, parseInt(data.program_id), numericYear, creditedSubjects)
                                        }
                                    }}
                                    disabled={loadingCurriculumComparison}
                                    variant="outline"
                                >
                                    {loadingCurriculumComparison ? 'Loading...' : 'Compare Curricula'}
                                </Button>
                            </div>
                        )}

                        {/* Curriculum Comparison Modal */}
                        {curriculumComparison && (
                            <div className="space-y-6">
                                {/* Header */}
                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <h3 className="font-semibold text-blue-900 mb-2">Curriculum Comparison</h3>
                                    <p className="text-sm text-blue-700">
                                        Compare subjects between {curriculumComparison.previous_program?.name} and {curriculumComparison.new_program?.name}
                                    </p>
                                </div>

                                {/* Important Notice */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-800">
                                            <strong>Important:</strong> Check all subjects the student has already completed. Subject credits are determined by teachers when they enter grades for this student.
                                            The registrar cannot manually credit subjects - credits are granted automatically when grades are recorded.
                                        </div>
                                    </div>
                                </div>

                                {/* Two Column Comparison */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column: Previous Curriculum Subjects */}
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                                <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                                Current Program: {curriculumComparison.previous_program?.name}
                                            </h4>

                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {curriculumComparison.previousCurriculum?.subjects?.length > 0 ? (
                                                    curriculumComparison.previousCurriculum.subjects.map((subject, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{subject.subject_code}</div>
                                                                <div className="text-xs text-gray-600">{subject.subject_name}</div>
                                                            </div>
                                                            <Badge variant="outline" className="text-xs">
                                                                Y{subject.year_level} • {subject.semester}
                                                            </Badge>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-4 text-gray-500 text-sm">
                                                        No subjects found in previous curriculum
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: New Curriculum Subjects */}
                                    <div className="space-y-4">
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <h4 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                                Program to Shift To: {curriculumComparison.new_program?.name}
                                            </h4>

                                            <div className="space-y-2 max-h-96 overflow-y-auto">
                                                {curriculumComparison.newCurriculum?.subjects?.length > 0 ? (
                                                    curriculumComparison.newCurriculum.subjects.map((subject) => {
                                                        const isChecked = creditedSubjects.includes(subject.id)

                                                        return (
                                                            <div key={subject.id} className="flex items-center gap-3 p-2 bg-white border border-gray-200 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onChange={(e) => {
                                                                        if (e.target.checked) {
                                                                            setCreditedSubjects([...creditedSubjects, subject.id])
                                                                        } else {
                                                                            setCreditedSubjects(creditedSubjects.filter(id => id !== subject.id))
                                                                        }
                                                                    }}
                                                                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                                />
                                                                <div className="flex-1">
                                                                    <div className="font-medium text-sm">{subject.subject_code}</div>
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
                                                        No subjects found in new curriculum
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary */}
                                <div className="p-4 bg-gray-50 rounded-lg border">
                                    <h4 className="font-semibold text-gray-900 mb-2">Credit Summary</h4>
                                    <p className="text-sm text-gray-600">
                                        {creditedSubjects.length} out of {curriculumComparison.newCurriculum?.subjects?.length || 0} subjects marked as completed
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowCreditModal(false)
                                setData('student_type', 'regular')
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                // Just save the credited subjects - no fee adjustments
                                setShowCreditModal(false)
                                toast.success(`Marked ${creditedSubjects.length} subjects as completed`)
                            }}
                            disabled={!curriculumComparison || (isShiftee && !previousProgram) || (isTransferee && !previousSchool)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Save Credits & Continue
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AuthenticatedLayout>
    )
}
