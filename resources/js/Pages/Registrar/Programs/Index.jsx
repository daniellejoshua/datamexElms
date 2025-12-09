import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, Eye, Edit, BookOpen, Users, DollarSign } from 'lucide-react'

export default function ProgramsIndex({ programs, auth }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <BookOpen className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Course Management</h2>
                            <p className="text-sm text-blue-600 font-medium mt-1">
                                Manage programs, set semester fees, and handle subjects
                            </p>
                        </div>
                    </div>
                    <Link href={route('registrar.programs.create')}>
                        <Button className="mt-4 sm:mt-0">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Program
                        </Button>
                    </Link>
                </div>
            }
        >
            <Head title="Course Management" />

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {programs.map((program) => (
                        <Card key={program.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{program.program_name}</CardTitle>
                                    <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                        {program.status}
                                    </Badge>
                                </div>
                                <CardDescription>
                                    {program.program_code} • {program.education_level.toUpperCase()}
                                    {program.track && ` • ${program.track}`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Semester Fee:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(program.semester_fee)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Duration:</span>
                                        <span>{program.total_years} years</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Students:</span>
                                        <span className="flex items-center">
                                            <Users className="w-4 h-4 mr-1" />
                                            {program.students_count}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-600">Subjects:</span>
                                        <span className="flex items-center">
                                            <BookOpen className="w-4 h-4 mr-1" />
                                            {program.subjects.length}
                                        </span>
                                    </div>
                                    {program.description && (
                                        <p className="text-sm text-gray-600 mt-2">
                                            {program.description}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <Link href={route('registrar.programs.show', program.id)}>
                                        <Button variant="outline" size="sm">
                                            <Eye className="w-4 h-4 mr-1" />
                                            View
                                        </Button>
                                    </Link>
                                    <Link href={route('registrar.programs.edit', program.id)}>
                                        <Button variant="outline" size="sm">
                                            <Edit className="w-4 h-4 mr-1" />
                                            Edit
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {programs.length === 0 && (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <BookOpen className="w-12 h-12 text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No Programs Found</h3>
                            <p className="text-gray-600 text-center mb-4">
                                Get started by creating your first program.
                            </p>
                            <Link href={route('registrar.programs.create')}>
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add Program
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AuthenticatedLayout>
    )
}