import { useState } from 'react'
import { Head, Link, useForm } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import PrimaryButton from '@/Components/PrimaryButton'
import SecondaryButton from '@/Components/SecondaryButton'
import TextInput from '@/Components/TextInput'
import InputLabel from '@/Components/InputLabel'
import InputError from '@/Components/InputError'

export default function StudentSearch({ students, search: searchTerm }) {
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [showEnrollDialog, setShowEnrollDialog] = useState(false)

    const { get } = useForm()
    const { data: enrollData, setData: setEnrollData, post, processing, errors, reset } = useForm({
        academic_year: new Date().getFullYear().toString(),
        semester: '1',
        year_level: '1',
        student_id: '',
        student_type: 'regular'
    })

    const handleSearch = (e) => {
        e.preventDefault()
        const searchQuery = e.target.search.value
        get(`/registrar/students/search?search=${encodeURIComponent(searchQuery)}`)
    }

    const enrollStudent = (student) => {
        setSelectedStudent(student)
        setEnrollData('student_id', student.id)
        setShowEnrollDialog(true)
    }

    const submitEnrollment = (e) => {
        e.preventDefault()
        post('/registrar/enrollments', {
            onSuccess: () => {
                setShowEnrollDialog(false)
                reset()
                setSelectedStudent(null)
            }
        })
    }

    const getStatusBadge = (status) => {
        const variants = {
            enrolled: 'bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs',
            graduated: 'bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs',
            dropped: 'bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs',
            inactive: 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs'
        }
        return variants[status] || 'bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs'
    }

    const isIrregularStudent = (student) => {
        // Check if student has been previously enrolled or has specific circumstances
        const previousEnrollments = student.enrollments?.length > 0
        const hasDroppedCourses = student.enrollments?.some(e => e.status === 'dropped')
        const isTransferee = student.student_type === 'transferee'
        const isReturnee = student.student_type === 'returnee'
        
        return previousEnrollments || hasDroppedCourses || isTransferee || isReturnee
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
                        Search Students for Enrollment
                    </h2>
                </div>
            }
        >
            <Head title="Search Students" />

            <div className="py-6">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Search Form */}
                    <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg mb-6">
                        <div className="p-6">
                            <h3 className="text-lg font-medium mb-4">Search for Existing Students</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Find existing students to enroll them in a new academic period
                            </p>
                            
                            <form onSubmit={handleSearch} className="flex gap-4">
                                <div className="flex-1">
                                    <TextInput
                                        name="search"
                                        placeholder="Search by name, student number, or email..."
                                        defaultValue={searchTerm}
                                        className="w-full"
                                    />
                                </div>
                                <PrimaryButton type="submit">
                                    Search Students
                                </PrimaryButton>
                            </form>
                        </div>
                    </div>

                    {/* Search Results */}
                    {students && students.length > 0 ? (
                        <div className="space-y-4">
                            {students.map((student) => {
                                const irregular = isIrregularStudent(student)
                                return (
                                    <div key={student.id} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-lg font-semibold">
                                                            {student.first_name} {student.last_name}
                                                        </h3>
                                                        <span className={getStatusBadge(student.status || 'inactive')}>
                                                            {student.status || 'Not Enrolled'}
                                                        </span>
                                                        {irregular && (
                                                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs">
                                                                Irregular/Special Case
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                                        <p><strong>Student #:</strong> {student.student_number}</p>
                                                        <p><strong>Email:</strong> {student.user?.email}</p>
                                                        <p><strong>Program:</strong> {student.program?.program_code} - {student.program?.program_name}</p>
                                                        {student.enrollments?.length > 0 && (
                                                            <div>
                                                                <strong>Previous Enrollments:</strong>
                                                                <div className="ml-2">
                                                                    {student.enrollments.slice(-2).map((enrollment, index) => (
                                                                        <p key={index} className="text-xs">
                                                                            {enrollment.academic_year} - Semester {enrollment.semester} (Year {enrollment.year_level})
                                                                        </p>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {irregular && (
                                                        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                                <strong>Special Handling Required:</strong> This student may need 
                                                                irregular scheduling, credit evaluation, or special payment arrangements.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                <div className="flex gap-2">
                                                    <PrimaryButton onClick={() => enrollStudent(student)}>
                                                        Enroll Student
                                                    </PrimaryButton>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : searchTerm ? (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="p-8 text-center">
                                <p className="text-gray-500">No students found matching "{searchTerm}"</p>
                                <PrimaryButton className="mt-4">
                                    <Link href="/registrar/enrollments/create" className="text-white">
                                        Create New Student
                                    </Link>
                                </PrimaryButton>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
                            <div className="p-8 text-center">
                                <p className="text-gray-500">Enter a search term to find students</p>
                                <p className="text-sm text-gray-400 mt-2">
                                    Search by student name, student number, or email address
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Enrollment Dialog */}
                    {showEnrollDialog && selectedStudent && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                                <h3 className="text-lg font-medium mb-4">
                                    Enroll {selectedStudent.first_name} {selectedStudent.last_name}
                                </h3>
                                
                                <form onSubmit={submitEnrollment} className="space-y-4">
                                    <div>
                                        <InputLabel htmlFor="academic_year" value="Academic Year" />
                                        <TextInput
                                            id="academic_year"
                                            className="mt-1 block w-full"
                                            value={enrollData.academic_year}
                                            onChange={(e) => setEnrollData('academic_year', e.target.value)}
                                            placeholder="2024"
                                            required
                                        />
                                        <InputError message={errors.academic_year} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="semester" value="Semester" />
                                        <select
                                            id="semester"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={enrollData.semester}
                                            onChange={(e) => setEnrollData('semester', e.target.value)}
                                            required
                                        >
                                            <option value="1">1st Semester</option>
                                            <option value="2">2nd Semester</option>
                                            <option value="summer">Summer</option>
                                        </select>
                                        <InputError message={errors.semester} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="year_level" value="Year Level" />
                                        <select
                                            id="year_level"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={enrollData.year_level}
                                            onChange={(e) => setEnrollData('year_level', e.target.value)}
                                            required
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                            <option value="5">5th Year</option>
                                        </select>
                                        <InputError message={errors.year_level} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="student_type" value="Student Type" />
                                        <select
                                            id="student_type"
                                            className="mt-1 block w-full border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 focus:border-indigo-500 dark:focus:border-indigo-600 focus:ring-indigo-500 dark:focus:ring-indigo-600 rounded-md shadow-sm"
                                            value={enrollData.student_type}
                                            onChange={(e) => setEnrollData('student_type', e.target.value)}
                                            required
                                        >
                                            <option value="regular">Regular</option>
                                            <option value="irregular">Irregular</option>
                                            <option value="returnee">Returnee</option>
                                        </select>
                                        <InputError message={errors.student_type} className="mt-2" />
                                    </div>

                                    {isIrregularStudent(selectedStudent) && (
                                        <div className="bg-yellow-50 dark:bg-yellow-900 p-3 rounded-lg">
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                <strong>Note:</strong> This student has been flagged for irregular handling. 
                                                Please review their academic history and payment requirements.
                                            </p>
                                        </div>
                                    )}

                                    <div className="flex gap-4 pt-4">
                                        <PrimaryButton type="submit" disabled={processing}>
                                            {processing ? 'Enrolling...' : 'Confirm Enrollment'}
                                        </PrimaryButton>
                                        <SecondaryButton 
                                            type="button" 
                                            onClick={() => {
                                                setShowEnrollDialog(false)
                                                setSelectedStudent(null)
                                                reset()
                                            }}
                                        >
                                            Cancel
                                        </SecondaryButton>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    )
}