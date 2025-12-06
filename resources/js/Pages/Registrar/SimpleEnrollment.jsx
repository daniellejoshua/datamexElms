import { Head, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { UserCheck, UserPlus, Users, GraduationCap } from 'lucide-react'
import { useState } from 'react'

export default function SimpleEnrollment({ auth, sections, programs }) {
    const [isNewStudent, setIsNewStudent] = useState(false)
    const [studentFound, setStudentFound] = useState(null)
    
    const { data, setData, post, processing, errors, reset } = useForm({
        student_number: '',
        academic_year: '2024-2025',
        semester: '1st',
        section_id: '',
        // New student fields
        student_name: '',
        email: '',
        program_id: '',
        year_level: '',
        education_level: 'college',
    })

    const checkStudent = async () => {
        if (!data.student_number) return
        
        try {
            const response = await fetch(`/api/students/check/${data.student_number}`)
            const result = await response.json()
            
            if (result.exists) {
                setStudentFound(result.student)
                setIsNewStudent(false)
            } else {
                setStudentFound(null)
                setIsNewStudent(true)
            }
        } catch (error) {
            console.error('Error checking student:', error)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        post(route('registrar.enrollment.simple'), {
            onSuccess: () => {
                reset()
                setStudentFound(null)
                setIsNewStudent(false)
            }
        })
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-100 p-2 rounded-lg">
                        <UserCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Simple Enrollment</h2>
                        <p className="text-sm text-gray-600 mt-1">
                            Enroll existing students in new semester or create new student records
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Simple Enrollment" />

            <div className="space-y-6">
                {/* Instructions */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <GraduationCap className="w-5 h-5 mr-2" />
                            How It Works
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start space-x-3">
                                <UserCheck className="w-5 h-5 text-blue-500 mt-1" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Existing Students</h3>
                                    <p className="text-sm text-gray-600">
                                        Enter student number. If found, just select semester and section to enroll.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <UserPlus className="w-5 h-5 text-green-500 mt-1" />
                                <div>
                                    <h3 className="font-medium text-gray-900">New Students</h3>
                                    <p className="text-sm text-gray-600">
                                        Enter student number. If not found, fill in student details to create new record.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Enrollment Form */}
                <Card>
                    <CardHeader>
                        <CardTitle>Student Enrollment Form</CardTitle>
                        <CardDescription>
                            Enter student number first to check if student exists
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Step 1: Check Student */}
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Student Number *
                                    </label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={data.student_number}
                                            onChange={(e) => setData('student_number', e.target.value)}
                                            placeholder="Enter student number"
                                            className={errors.student_number ? 'border-red-500' : ''}
                                        />
                                        <Button type="button" onClick={checkStudent} variant="outline">
                                            Check
                                        </Button>
                                    </div>
                                    {errors.student_number && (
                                        <p className="text-sm text-red-500 mt-1">{errors.student_number}</p>
                                    )}
                                </div>

                                {studentFound && (
                                    <div className="bg-green-50 p-3 rounded-md">
                                        <p className="text-sm text-green-800 font-medium">
                                            ✓ Student Found: {studentFound.name}
                                        </p>
                                        <p className="text-sm text-green-600">
                                            Program: {studentFound.program?.name}
                                        </p>
                                    </div>
                                )}

                                {isNewStudent && (
                                    <div className="bg-blue-50 p-3 rounded-md">
                                        <p className="text-sm text-blue-800 font-medium">
                                            ⚠ New Student
                                        </p>
                                        <p className="text-sm text-blue-600">
                                            Please fill in student details below
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Step 2: Academic Period */}
                            <div className="grid md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Academic Year *
                                    </label>
                                    <Input
                                        value={data.academic_year}
                                        onChange={(e) => setData('academic_year', e.target.value)}
                                        placeholder="2024-2025"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Semester *
                                    </label>
                                    <select
                                        value={data.semester}
                                        onChange={(e) => setData('semester', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                    >
                                        <option value="1st">1st Semester</option>
                                        <option value="2nd">2nd Semester</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Section *
                                    </label>
                                    <select
                                        value={data.section_id}
                                        onChange={(e) => setData('section_id', e.target.value)}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        required
                                    >
                                        <option value="">Select Section</option>
                                        {sections?.map(section => (
                                            <option key={section.id} value={section.id}>
                                                {section.name} - {section.program?.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.section_id && (
                                        <p className="text-sm text-red-500 mt-1">{errors.section_id}</p>
                                    )}
                                </div>
                            </div>

                            {/* Step 3: New Student Details (if needed) */}
                            {isNewStudent && (
                                <div className="border-t pt-6">
                                    <h3 className="text-lg font-medium text-gray-900 mb-4">New Student Information</h3>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Student Name *
                                            </label>
                                            <Input
                                                value={data.student_name}
                                                onChange={(e) => setData('student_name', e.target.value)}
                                                placeholder="Full name"
                                                className={errors.student_name ? 'border-red-500' : ''}
                                            />
                                            {errors.student_name && (
                                                <p className="text-sm text-red-500 mt-1">{errors.student_name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Email *
                                            </label>
                                            <Input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                placeholder="student@email.com"
                                                className={errors.email ? 'border-red-500' : ''}
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Program *
                                            </label>
                                            <select
                                                value={data.program_id}
                                                onChange={(e) => setData('program_id', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                required
                                            >
                                                <option value="">Select Program</option>
                                                {programs?.map(program => (
                                                    <option key={program.id} value={program.id}>
                                                        {program.name}
                                                    </option>
                                                ))}
                                            </select>
                                            {errors.program_id && (
                                                <p className="text-sm text-red-500 mt-1">{errors.program_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Year Level *
                                            </label>
                                            <select
                                                value={data.year_level}
                                                onChange={(e) => setData('year_level', e.target.value)}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                required
                                            >
                                                <option value="">Select Year Level</option>
                                                {data.education_level === 'college' ? (
                                                    <>
                                                        <option value="1">1st Year</option>
                                                        <option value="2">2nd Year</option>
                                                        <option value="3">3rd Year</option>
                                                        <option value="4">4th Year</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="11">Grade 11</option>
                                                        <option value="12">Grade 12</option>
                                                    </>
                                                )}
                                            </select>
                                            {errors.year_level && (
                                                <p className="text-sm text-red-500 mt-1">{errors.year_level}</p>
                                            )}
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Education Level *
                                            </label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        value="college"
                                                        checked={data.education_level === 'college'}
                                                        onChange={(e) => setData('education_level', e.target.value)}
                                                        className="mr-2"
                                                    />
                                                    College
                                                </label>
                                                <label className="flex items-center">
                                                    <input
                                                        type="radio"
                                                        value="shs"
                                                        checked={data.education_level === 'shs'}
                                                        onChange={(e) => setData('education_level', e.target.value)}
                                                        className="mr-2"
                                                    />
                                                    Senior High School
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button */}
                            <div className="flex justify-end pt-6 border-t">
                                <Button 
                                    type="submit" 
                                    disabled={processing || !data.student_number || !data.section_id}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {processing ? 'Enrolling...' : 
                                     isNewStudent ? 'Create & Enroll Student' : 'Enroll Student'}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AuthenticatedLayout>
    )
}