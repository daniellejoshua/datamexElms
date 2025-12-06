import { useEffect } from 'react'
import GuestLayout from '@/Layouts/GuestLayout'
import InputError from '@/Components/InputError'
import InputLabel from '@/Components/InputLabel'
import PrimaryButton from '@/Components/PrimaryButton'
import TextInput from '@/Components/TextInput'
import { Head, Link, useForm } from '@inertiajs/react'

export default function RegistrarRegister() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        employee_number: '',
        first_name: '',
        last_name: '',
        middle_name: '',
        department: '',
        position: 'Registrar',
        hire_date: '',
    })

    useEffect(() => {
        return () => {
            reset('password', 'password_confirmation')
        }
    }, [])

    const submit = (e) => {
        e.preventDefault()
        post(route('registrar.register'))
    }

    return (
        <GuestLayout>
            <Head title="Registrar Registration" />

            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Registrar Registration</h1>
                <p className="text-sm text-gray-600">Create a new registrar account</p>
            </div>

            <form onSubmit={submit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* User Information */}
                    <div className="col-span-full">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                    </div>

                    <div>
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput
                            id="name"
                            name="name"
                            value={data.name}
                            className="mt-1 block w-full"
                            autoComplete="name"
                            onChange={(e) => setData('name', e.target.value)}
                            required
                        />
                        <InputError message={errors.name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email" />
                        <TextInput
                            id="email"
                            type="email"
                            name="email"
                            value={data.email}
                            className="mt-1 block w-full"
                            autoComplete="username"
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError message={errors.email} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password" value="Password" />
                        <TextInput
                            id="password"
                            type="password"
                            name="password"
                            value={data.password}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password', e.target.value)}
                            required
                        />
                        <InputError message={errors.password} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="password_confirmation" value="Confirm Password" />
                        <TextInput
                            id="password_confirmation"
                            type="password"
                            name="password_confirmation"
                            value={data.password_confirmation}
                            className="mt-1 block w-full"
                            autoComplete="new-password"
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            required
                        />
                        <InputError message={errors.password_confirmation} className="mt-2" />
                    </div>

                    {/* Registrar Information */}
                    <div className="col-span-full mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Registrar Information</h3>
                    </div>

                    <div>
                        <InputLabel htmlFor="employee_number" value="Employee Number" />
                        <TextInput
                            id="employee_number"
                            name="employee_number"
                            value={data.employee_number}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('employee_number', e.target.value)}
                            placeholder="REG-0001"
                            required
                        />
                        <InputError message={errors.employee_number} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="department" value="Department" />
                        <select
                            id="department"
                            name="department"
                            value={data.department}
                            className="mt-1 block w-full border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 rounded-md shadow-sm"
                            onChange={(e) => setData('department', e.target.value)}
                            required
                        >
                            <option value="">Select Department</option>
                            <option value="Academic Affairs">Academic Affairs</option>
                            <option value="Student Services">Student Services</option>
                            <option value="Records and Registration">Records and Registration</option>
                            <option value="Admissions Office">Admissions Office</option>
                        </select>
                        <InputError message={errors.department} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="first_name" value="First Name" />
                        <TextInput
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('first_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.first_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="last_name" value="Last Name" />
                        <TextInput
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('last_name', e.target.value)}
                            required
                        />
                        <InputError message={errors.last_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="middle_name" value="Middle Name (Optional)" />
                        <TextInput
                            id="middle_name"
                            name="middle_name"
                            value={data.middle_name}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('middle_name', e.target.value)}
                        />
                        <InputError message={errors.middle_name} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="position" value="Position" />
                        <TextInput
                            id="position"
                            name="position"
                            value={data.position}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('position', e.target.value)}
                            required
                        />
                        <InputError message={errors.position} className="mt-2" />
                    </div>

                    <div>
                        <InputLabel htmlFor="hire_date" value="Hire Date" />
                        <TextInput
                            id="hire_date"
                            type="date"
                            name="hire_date"
                            value={data.hire_date}
                            className="mt-1 block w-full"
                            onChange={(e) => setData('hire_date', e.target.value)}
                            required
                        />
                        <InputError message={errors.hire_date} className="mt-2" />
                    </div>
                </div>

                <div className="flex items-center justify-end mt-6">
                    <Link
                        href={route('login')}
                        className="underline text-sm text-gray-600 hover:text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Already registered?
                    </Link>

                    <PrimaryButton className="ms-4" disabled={processing}>
                        Register
                    </PrimaryButton>
                </div>
            </form>
        </GuestLayout>
    )
}