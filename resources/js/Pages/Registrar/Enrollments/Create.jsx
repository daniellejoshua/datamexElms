import { useState, useEffect } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'
import Checkbox from '@/Components/Checkbox'

export default function CreateEnrollment({ programs }) {
    const [isIrregular, setIsIrregular] = useState(false)
    const [programInfo, setProgramInfo] = useState(null)

    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        middle_name: '',
        email: '',
        password: '',
        password_confirmation: '',
        program_id: '',
        year_level: '1',
        semester: '1',
        academic_year: new Date().getFullYear().toString(),
        is_irregular: false,
        student_type: 'regular',
        date_of_birth: '',
        phone: '',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
    })

    useEffect(() => {
        if (data.program_id) {
            const program = programs.find(p => p.id === parseInt(data.program_id))
            setProgramInfo(program)
        }
    }, [data.program_id, programs])

    const submit = (e) => {
        e.preventDefault()
        const formData = { ...data, is_irregular: isIrregular }
        post(route('registrar.enrollments.store'), {
            data: formData,
            preserveState: true,
        })
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-4">
                    <SecondaryButton>
                        <Link href="/registrar/enrollments" className="text-gray-700">
                            Back to Enrollments
                        </Link>
                    </SecondaryButton>
                    <h2 className="text-xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                        New Student Enrollment
                    </h2>
                </div>
            }
        >
            <Head title="New Student Enrollment" />

            <div className="py-6">
                <div className="mx-auto max-w-4xl sm:px-6 lg:px-8">
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Student Information</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                Create a new student account and enroll them in a program
                            </p>
                            
                            <form onSubmit={submit} className="space-y-6">
                                {/* Personal Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Personal Information</h4>
                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <InputLabel htmlFor="first_name" value="First Name *" />
                                            <TextInput
                                                id="first_name"
                                                className="mt-1 block w-full"
                                                value={data.first_name}
                                                onChange={(e) => setData('first_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.first_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="last_name" value="Last Name *" />
                                            <TextInput
                                                id="last_name"
                                                className="mt-1 block w-full"
                                                value={data.last_name}
                                                onChange={(e) => setData('last_name', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.last_name} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="middle_name" value="Middle Name" />
                                            <TextInput
                                                id="middle_name"
                                                className="mt-1 block w-full"
                                                value={data.middle_name}
                                                onChange={(e) => setData('middle_name', e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="email" value="Email Address *" />
                                            <TextInput
                                                id="email"
                                                type="email"
                                                className="mt-1 block w-full"
                                                value={data.email}
                                                onChange={(e) => setData('email', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.email} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="date_of_birth" value="Birth Date *" />
                                            <TextInput
                                                id="date_of_birth"
                                                type="date"
                                                className="mt-1 block w-full"
                                                value={data.date_of_birth}
                                                onChange={(e) => setData('date_of_birth', e.target.value)}
                                            />
                                            <InputError message={errors.date_of_birth} className="mt-2" />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="address" value="Address *" />
                                        <textarea
                                            id="address"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            rows="3"
                                            value={data.address}
                                            onChange={(e) => setData('address', e.target.value)}
                                        />
                                        <InputError message={errors.address} className="mt-2" />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="phone" value="Phone Number" />
                                            <TextInput
                                                id="phone"
                                                className="mt-1 block w-full"
                                                value={data.phone}
                                                onChange={(e) => setData('phone', e.target.value)}
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="emergency_contact_name" value="Emergency Contact Name" />
                                            <TextInput
                                                id="emergency_contact_name"
                                                className="mt-1 block w-full"
                                                value={data.emergency_contact_name}
                                                onChange={(e) => setData('emergency_contact_name', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Account Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Account Information</h4>
                                    
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="password" value="Password *" />
                                            <TextInput
                                                id="password"
                                                type="password"
                                                className="mt-1 block w-full"
                                                value={data.password}
                                                onChange={(e) => setData('password', e.target.value)}
                                                required
                                                placeholder="Default: password123"
                                            />
                                            <InputError message={errors.password} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="password_confirmation" value="Confirm Password *" />
                                            <TextInput
                                                id="password_confirmation"
                                                type="password"
                                                className="mt-1 block w-full"
                                                value={data.password_confirmation}
                                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.password_confirmation} className="mt-2" />
                                        </div>
                                    </div>
                                </div>

                                {/* Academic Information */}
                                <div className="space-y-4">
                                    <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">Academic Information</h4>
                                    
                                    {/* Student Type Selection */}
                                    <div>
                                        <InputLabel htmlFor="student_type" value="Student Type *" />
                                        <select
                                            id="student_type"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={data.student_type}
                                            onChange={(e) => {
                                                setData('student_type', e.target.value)
                                                setIsIrregular(e.target.value === 'irregular')
                                            }}
                                        >
                                            <option value="regular">Regular Student</option>
                                            <option value="irregular">Irregular Student</option>
                                            <option value="transferee">Transferee</option>
                                            <option value="returnee">Returnee</option>
                                        </select>
                                        {data.student_type === 'irregular' && (
                                            <p className="text-sm text-amber-600 mt-2">
                                                ⚠️ Irregular students may require special handling for subjects and payments
                                            </p>
                                        )}
                                        {data.student_type === 'transferee' && (
                                            <p className="text-sm text-blue-600 mt-2">
                                                ℹ️ Transferee students will need credit evaluation and may have irregular schedules
                                            </p>
                                        )}
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <InputLabel htmlFor="program_id" value="Program *" />
                                            <select
                                                id="program_id"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.program_id}
                                                onChange={(e) => setData('program_id', e.target.value)}
                                                required
                                            >
                                                <option value="">Select a program</option>
                                                {programs?.map((program) => (
                                                    <option key={program.id} value={program.id.toString()}>
                                                        {program.program_code} - {program.program_name}
                                                    </option>
                                                ))}
                                            </select>
                                            <InputError message={errors.program_id} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="year_level" value="Year Level *" />
                                            <select
                                                id="year_level"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.year_level}
                                                onChange={(e) => setData('year_level', e.target.value)}
                                                required
                                            >
                                                <option value="1">1st Year</option>
                                                <option value="2">2nd Year</option>
                                                <option value="3">3rd Year</option>
                                                <option value="4">4th Year</option>
                                            </select>
                                            {data.student_type === 'irregular' && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    For irregular students, this represents their standing level, not actual year
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div>
                                            <InputLabel htmlFor="academic_year" value="Academic Year *" />
                                            <TextInput
                                                id="academic_year"
                                                className="mt-1 block w-full"
                                                value={data.academic_year}
                                                onChange={(e) => setData('academic_year', e.target.value)}
                                                placeholder="2024"
                                            />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="semester" value="Semester *" />
                                            <select
                                                id="semester"
                                                className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                                value={data.semester}
                                                onChange={(e) => setData('semester', e.target.value)}
                                                required
                                            >
                                                <option value="1">1st Semester</option>
                                                <option value="2">2nd Semester</option>
                                            </select>
                                        </div>
                                    </div>

                                    {programInfo && (
                                        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg">
                                            <h5 className="font-medium text-blue-900 dark:text-blue-100">Program Details</h5>
                                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                                <strong>Description:</strong> {programInfo.description}
                                            </p>
                                            <p className="text-sm text-blue-700 dark:text-blue-200">
                                                <strong>Duration:</strong> {programInfo.duration_years} years
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <PrimaryButton type="submit" disabled={processing}>
                                        {processing ? 'Enrolling...' : 'Enroll Student'}
                                    </PrimaryButton>
                                    <SecondaryButton type="button">
                                        <Link href="/registrar/enrollments" className="text-gray-700">
                                            Cancel
                                        </Link>
                                    </SecondaryButton>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}