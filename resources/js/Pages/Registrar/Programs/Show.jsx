import { Head, Link } from '@inertiajs/react'
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, GraduationCap, BookOpen, Users, DollarSign, Building2, Calendar, Edit, Star } from 'lucide-react'

export default function ProgramsShow({ program, enrolled_students_count, auth }) {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount)
    }

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between px-2 py-1">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="sm" className="mr-2">
                            <Link href={route('registrar.programs.index')}>
                                <ArrowLeft className="w-4 h-4 mr-1" />
                                Back To Programs
                            </Link>
                        </Button>
                        <div className="bg-blue-100 p-1.5 rounded-md">
                            <GraduationCap className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">{program.program_name}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Program Details & Fee Structure</p>
                        </div>
                    </div>
                </div>
            }
        >
            <Head title={`${program.program_name} - Program Details`} />

            <div className="space-y-6">
                {/* Program Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Program Info */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-start space-x-4">
                                    <div className="p-3 bg-blue-600 rounded-xl flex-shrink-0">
                                        <GraduationCap className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <CardTitle className="text-xl">{program.program_name}</CardTitle>
                                        <CardDescription className="text-lg font-semibold text-blue-600 mt-1">
                                            {program.program_code}
                                        </CardDescription>
                                        <div className="flex items-center gap-4 mt-3">
                                            <Badge variant={program.status === 'active' ? 'default' : 'secondary'}>
                                                {program.status}
                                            </Badge>
                                            <Badge variant="outline">
                                                {program.education_level.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                            </Badge>
                                            <Badge variant="outline">
                                                {program.total_years} Years
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {program.description && (
                                    <div className="mb-4">
                                        <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                                        <p className="text-gray-600 leading-relaxed">{program.description}</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <BookOpen className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                                        <div className="text-xs text-gray-600">Subjects</div>
                                        <div className="text-lg font-bold text-gray-900">{program.subjects?.length || 0}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                                        <div className="text-xs text-gray-600">Students</div>
                                        <div className="text-lg font-bold text-gray-900">{enrolled_students_count || 0}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <Building2 className="w-5 h-5 text-green-600 mx-auto mb-1" />
                                        <div className="text-xs text-gray-600">Sections</div>
                                        <div className="text-lg font-bold text-gray-900">{program.sections?.length || 0}</div>
                                    </div>
                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                        <Calendar className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                                        <div className="text-xs text-gray-600">Created</div>
                                        <div className="text-xs font-bold text-gray-900">
                                            {new Date(program.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Fee Structure */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    Fee Structure
                                </CardTitle>
                                <CardDescription>
                                    Semester fees for each year level (Regular Students)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {program.program_fees && program.program_fees.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {program.program_fees
                                            .filter(fee => fee.fee_type === 'regular')
                                            .sort((a, b) => a.year_level - b.year_level)
                                            .map(fee => (
                                            <div key={fee.id} className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-blue-50">
                                                <div className="text-center">
                                                    <div className="text-sm font-semibold text-gray-700 mb-1">
                                                        {fee.year_level}{fee.year_level === 1 ? 'st' : fee.year_level === 2 ? 'nd' : fee.year_level === 3 ? 'rd' : 'th'} Year
                                                    </div>
                                                    <div className="text-2xl font-bold text-green-600">
                                                        {formatCurrency(fee.semester_fee)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">per semester</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                        <p>No fee structure defined yet.</p>
                                        <p className="text-sm">Edit the program to set semester fees.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button asChild className="w-full" variant="outline">
                                    <Link href={route('registrar.programs.edit', program.id)}>
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit Program
                                    </Link>
                                </Button>
                                <Button asChild className="w-full" variant="outline">
                                    <Link href={route('registrar.programs.index')}>
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Programs
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Program Stats */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Program Statistics</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Total Subjects</span>
                                    <span className="font-semibold">{program.subjects?.length || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Active Sections</span>
                                    <span className="font-semibold">
                                        {program.sections?.filter(s => s.status === 'active').length || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Enrolled Students</span>
                                    <span className="font-semibold">{enrolled_students_count || 0}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Completion Rate</span>
                                    <span className="font-semibold">
                                        {enrolled_students_count > 0 ?
                                            Math.round((program.sections?.filter(s => s.status === 'completed').length || 0) / program.sections?.length * 100) || 0
                                            : 0}%
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    )
}