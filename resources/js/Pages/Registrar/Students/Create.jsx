import { Head, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus, ArrowLeft, GraduationCap, BookOpen } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CreateStudent({ programs, auth, currentAcademicYear, currentSemester }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        // Personal Information
        first_name: '',
        last_name: '',
        middle_name: '',
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
    })

    const [selectedProgram, setSelectedProgram] = useState(null)
    const [calculatedBalance, setCalculatedBalance] = useState(0)

    // Group programs by education level
    const collegePrograms = programs.filter(p => p.education_level === 'college')
    const shsPrograms = programs.filter(p => p.education_level === 'shs')

    useEffect(() => {
        if (data.program_id) {
            const program = programs.find(p => p.id === parseInt(data.program_id))
            setSelectedProgram(program)
            setData(prev => ({
                ...prev,
                education_level: program?.education_level || '',
                track: program?.track || '',
                strand: program?.strand || '',
            }))
        }
    }, [data.program_id])

    useEffect(() => {
        const enrollmentFee = parseFloat(data.enrollment_fee) || 0
        const paymentAmount = parseFloat(data.payment_amount) || 0
        setCalculatedBalance(enrollmentFee - paymentAmount)
    }, [data.enrollment_fee, data.payment_amount])

    const handleSubmit = (e) => {
        e.preventDefault()
        
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
            onSuccess: (response) => {
                console.log('Success response:', response)
                alert('Student registered successfully!')
                router.visit(route('registrar.students'))
            },
            onError: (errors) => {
                console.error('Validation errors:', errors)
                alert('Please check the form for errors')
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
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg">
                            <UserPlus className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Register New Student</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Create student account and process enrollment fee payment
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route('registrar.students'))}
                        className="gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Students
                    </Button>
                </div>
            }
        >
            <Head title="Register New Student" />

            <form onSubmit={handleSubmit} className="space-y-6">
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                <p className="text-xs text-gray-500 mt-1">
                                    This will be used as the username. Default password: password123
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                {errors.year_level && (
                                    <p className="text-red-500 text-sm mt-1">{errors.year_level}</p>
                                )}
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
                                    <SelectItem value="irregular">⚠ Irregular Student</SelectItem>
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                />
                                {errors.enrollment_fee && (
                                    <p className="text-red-500 text-sm mt-1">{errors.enrollment_fee}</p>
                                )}
                                <p className="text-xs text-gray-500 mt-1">
                                    Total enrollment fee amount for this semester
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
                <div className="flex justify-end gap-3">
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
                        {processing ? 'Registering...' : 'Register Student'}
                    </Button>
                </div>
            </form>
        </AuthenticatedLayout>
    )
}
