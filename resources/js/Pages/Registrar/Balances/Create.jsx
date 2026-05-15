import { Head, router } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Calculator, Users, DollarSign, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export default function CreateBalance({ students, auth }) {
    const [form, setForm] = useState({
        student_id: '',
        education_level: '',
        payment_type: 'tuition',
        amount: '',
        description: '',
        academic_year: '',
        semester: '1st Semester'
    })

    const [processing, setProcessing] = useState(false)
    const [errors, setErrors] = useState({})

    const currentYear = new Date().getFullYear()
    const academicYears = [
        `${currentYear-1}-${currentYear}`,
        `${currentYear}-${currentYear+1}`,
        `${currentYear+1}-${currentYear+2}`
    ]

    const handleSubmit = (e) => {
        e.preventDefault()
        setProcessing(true)
        
        router.post(route('registrar.balances.store'), form, {
            onFinish: () => setProcessing(false),
            onError: (errors) => setErrors(errors),
            onSuccess: () => {
                // Form will redirect on success
            }
        })
    }

    const handleStudentChange = (studentId) => {
        const student = students.find(s => s.id === parseInt(studentId))
        setForm(prev => ({
            ...prev,
            student_id: studentId,
            education_level: student ? (student.year_level <= 12 ? 'senior_high' : 'college') : '',
            academic_year: academicYears[1] // Default to current academic year
        }))
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', { 
            style: 'currency', 
            currency: 'PHP' 
        }).format(amount)
    }

    const selectedStudent = students.find(s => s.id === parseInt(form.student_id))

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.visit(route('registrar.balances.index'))}
                        className="mr-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Set Student Balance</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Set exact balance amount for a specific student
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Set Student Balance" />

            <div className="space-y-6 max-w-4xl">
                {/* Instructions */}
                <Card className="bg-blue-50 border-blue-200">
                    <CardHeader>
                        <CardTitle className="text-blue-800 flex items-center">
                            <Calculator className="w-5 h-5 mr-2" />
                            How to Set Student Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-blue-700">
                            <div className="text-center">
                                <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <h4 className="font-medium mb-1">1. Select Student</h4>
                                <p className="text-sm">Choose the student from the dropdown list</p>
                            </div>
                            <div className="text-center">
                                <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <h4 className="font-medium mb-1">2. Set Amount</h4>
                                <p className="text-sm">Enter the exact balance amount due</p>
                            </div>
                            <div className="text-center">
                                <Calculator className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                                <h4 className="font-medium mb-1">3. Add Details</h4>
                                <p className="text-sm">Specify payment type and description</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Main Form */}
                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Student Balance Information</CardTitle>
                            <CardDescription>
                                Fill in the details to set an exact balance amount for the student
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Student Selection */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Select Student *
                                    </label>
                                    <select
                                        value={form.student_id}
                                        onChange={(e) => handleStudentChange(e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="">Choose a student...</option>
                                        {students.map(student => (
                                            <option key={student.id} value={student.id}>
                                                {student.user.name} - {student.student_number}
                                                {student.year_level <= 12 ? ' (SHS)' : ' (College)'}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.student_id && (
                                        <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Education Level
                                    </label>
                                    <Input
                                        value={form.education_level ? form.education_level.toUpperCase() : ''}
                                        disabled
                                        placeholder="Auto-detected based on student"
                                        className="bg-gray-100"
                                    />
                                </div>
                            </div>

                            {/* Student Info Display */}
                            {selectedStudent && (
                                <Card className="bg-gray-50">
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <h4 className="font-medium text-gray-900">Student Information</h4>
                                                <p className="text-sm text-gray-600">{selectedStudent.user.name}</p>
                                                <p className="text-sm text-gray-600">{selectedStudent.student_number}</p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Academic Level</h4>
                                                <p className="text-sm text-gray-600">
                                                    {selectedStudent.year_level <= 12 ? 
                                                        `Grade ${selectedStudent.year_level} - ${selectedStudent.track}` :
                                                        `${selectedStudent.year_level} Year - ${selectedStudent.program?.name}`
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">Current Status</h4>
                                                <p className="text-sm text-gray-600 capitalize">{selectedStudent.status}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Payment Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Payment Type *
                                    </label>
                                    <select
                                        value={form.payment_type}
                                        onChange={(e) => setForm(prev => ({ ...prev, payment_type: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="tuition">Tuition Fee</option>
                                        <option value="miscellaneous">Miscellaneous Fee</option>
                                        <option value="laboratory">Laboratory Fee</option>
                                        <option value="graduation">Graduation Fee</option>
                                        <option value="library">Library Fee</option>
                                        <option value="athletic">Athletic Fee</option>
                                        <option value="student_activity">Student Activity Fee</option>
                                        <option value="other">Other</option>
                                    </select>
                                    {errors.payment_type && (
                                        <p className="text-red-500 text-sm mt-1">{errors.payment_type}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Balance Amount *
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={form.amount}
                                        onChange={(e) => setForm(prev => ({ ...prev, amount: e.target.value }))}
                                        placeholder="Enter amount (e.g., 5000.00)"
                                        required
                                    />
                                    {errors.amount && (
                                        <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
                                    )}
                                    {form.amount && (
                                        <p className="text-sm text-gray-600 mt-1">
                                            Preview: {formatCurrency(parseFloat(form.amount) || 0)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Academic Period */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Academic Year *
                                    </label>
                                    <select
                                        value={form.academic_year}
                                        onChange={(e) => setForm(prev => ({ ...prev, academic_year: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="">Select academic year...</option>
                                        {academicYears.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    {errors.academic_year && (
                                        <p className="text-red-500 text-sm mt-1">{errors.academic_year}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semester *
                                    </label>
                                    <select
                                        value={form.semester}
                                        onChange={(e) => setForm(prev => ({ ...prev, semester: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="1st Semester">1st Semester</option>
                                        <option value="2nd Semester">2nd Semester</option>
                                        <option value="Summer">Summer</option>
                                    </select>
                                    {errors.semester && (
                                        <p className="text-red-500 text-sm mt-1">{errors.semester}</p>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description (Optional)
                                </label>
                                <Textarea
                                    value={form.description}
                                    onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Add any additional notes or description about this balance..."
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                                )}
                            </div>

                            {/* Summary */}
                            {form.student_id && form.amount && (
                                <Card className="bg-green-50 border-green-200">
                                    <CardContent className="pt-6">
                                        <h4 className="font-medium text-green-800 mb-3">Balance Summary</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <p className="text-green-700">
                                                    <strong>Student:</strong> {selectedStudent?.user.name}
                                                </p>
                                                <p className="text-green-700">
                                                    <strong>Payment Type:</strong> {form.payment_type.replace('_', ' ').charAt(0).toUpperCase() + form.payment_type.replace('_', ' ').slice(1)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-green-700">
                                                    <strong>Amount:</strong> {formatCurrency(parseFloat(form.amount) || 0)}
                                                </p>
                                                <p className="text-green-700">
                                                    <strong>Period:</strong> {form.academic_year} - {form.semester}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <Card className="mt-6">
                        <CardContent className="pt-6">
                            <div className="flex justify-end gap-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.visit(route('registrar.balances.index'))}
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing || !form.student_id || !form.amount}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? 'Setting Balance...' : 'Set Balance'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AuthenticatedLayout>
    )
}