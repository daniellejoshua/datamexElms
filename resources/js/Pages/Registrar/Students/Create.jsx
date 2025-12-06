import { Head, useForm, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { UserPlus, ArrowLeft } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function CreateStudent({ programs, auth, currentAcademicYear, currentSemester }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        // Personal Information
        first_name: '',
        last_name: '',
        middle_name: '',
        birth_date: '',
        address: '',
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
        console.log('Form submitting with data:', data)
        post(route('registrar.students.store'), {
            preserveScroll: true,
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
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Register New Student</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Create student account and process enrollment fee payment
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.visit(route('registrar.students'))}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Students
                    </Button>
                </div>
            }
        >
            <Head title="Register New Student" />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personal Information</CardTitle>
                        <CardDescription>Enter the student's personal details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="first_name">First Name *</Label>
                                <Input
                                    id="first_name"
                                    value={data.first_name}
                                    onChange={e => setData('first_name', e.target.value)}
                                    required
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
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                value={data.address}
                                onChange={e => setData('address', e.target.value)}
                                placeholder="Complete address"
                            />
                            {errors.address && (
                                <p className="text-red-500 text-sm mt-1">{errors.address}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Academic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Academic Information</CardTitle>
                        <CardDescription>Select the student's program and year level</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="program_id">Program *</Label>
                                <select
                                    id="program_id"
                                    value={data.program_id}
                                    onChange={e => setData('program_id', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                >
                                    <option value="">Select Program</option>
                                    {programs.map(program => (
                                        <option key={program.id} value={program.id}>
                                            {program.name} 
                                            {program.track && ` - ${program.track}`}
                                            {program.strand && ` (${program.strand})`}
                                        </option>
                                    ))}
                                </select>
                                {errors.program_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.program_id}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="year_level">Year Level *</Label>
                                <select
                                    id="year_level"
                                    value={data.year_level}
                                    onChange={e => setData('year_level', e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    required
                                    disabled={!selectedProgram}
                                >
                                    <option value="">Select Year Level</option>
                                    {getYearLevelOptions().map(level => (
                                        <option key={level} value={level}>
                                            {level}
                                        </option>
                                    ))}
                                </select>
                                {errors.year_level && (
                                    <p className="text-red-500 text-sm mt-1">{errors.year_level}</p>
                                )}
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="student_type">Student Type *</Label>
                            <select
                                id="student_type"
                                value={data.student_type}
                                onChange={e => setData('student_type', e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                required
                            >
                                <option value="regular">Regular</option>
                                <option value="irregular">Irregular</option>
                            </select>
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
                <Card>
                    <CardHeader>
                        <CardTitle>Enrollment Fee Payment</CardTitle>
                        <CardDescription>
                            Process the initial enrollment fee payment for {currentAcademicYear} - {currentSemester} Semester
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
